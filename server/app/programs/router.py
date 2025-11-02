import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app.database.connection import get_db
from app.models.database import Program, ScheduleItem, SpecialGuest, Church
from app.models.schemas import (
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramWithDetailsResponse,
    ScheduleItemCreate, ScheduleItemUpdate, ScheduleItemResponse,
    SpecialGuestCreate, SpecialGuestUpdate, SpecialGuestResponse,
    ReorderItemsRequest, ReorderGuestsRequest,
    SuccessResponse, create_api_response
)
from app.auth.middleware import get_current_user
from app.models.database import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_programs(
    church_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all programs with optional filters."""
    query = db.query(Program)
    
    if church_id:
        query = query.filter(Program.church_id == church_id)
    
    if is_active is not None:
        query = query.filter(Program.is_active == is_active)
    
    programs = query.order_by(Program.date.desc()).all()
    programs_data = [ProgramResponse.model_validate(p) for p in programs]
    return create_api_response(data=programs_data)


@router.get("/{program_id}")
async def get_program_by_id(program_id: int, db: Session = Depends(get_db)):
    """Get a single program with all details."""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Load related data
    schedule_items = db.query(ScheduleItem).filter(ScheduleItem.program_id == program_id).order_by(ScheduleItem.order_index).all()
    special_guests = db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).order_by(SpecialGuest.display_order).all()
    
    # Build response
    program_dict = {
        "id": program.id,
        "church_id": program.church_id,
        "title": program.title,
        "date": program.date,
        "theme": program.theme,
        "created_at": program.created_at,
        "schedule_items": [ScheduleItemResponse.model_validate(si) for si in schedule_items],
        "special_guests": [SpecialGuestResponse.model_validate(sg) for sg in special_guests]
    }
    
    return create_api_response(data=program_dict)


@router.post("/")
async def create_program(
    program_data: ProgramCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new program."""
    try:
        logger.info("Creating program", extra={
            "user_id": current_user.id,
            "title": program_data.title,
            "church_id_provided": program_data.church_id is not None
        })
        
        # Use user's church_id if not provided
        church_id = program_data.church_id
        if not church_id:
            if not current_user.church_id:
                logger.warning("User has no associated church", extra={"user_id": current_user.id})
                return create_api_response(error="User has no associated church")
            church_id = current_user.church_id
            logger.info("Using user's church_id", extra={"church_id": church_id, "user_id": current_user.id})
        
        # Verify church exists
        church = db.query(Church).filter(Church.id == church_id).first()
        if not church:
            logger.warning("Church not found", extra={"church_id": church_id})
            return create_api_response(error="Church not found")
        
        # Create program
        program = Program(
            church_id=church_id,
            title=program_data.title,
            date=program_data.date,
            theme=program_data.theme,
            is_active=program_data.is_active if program_data.is_active is not None else True,
            created_by=current_user.id  # Set creator to current authenticated user
        )
        db.add(program)
        db.commit()
        db.refresh(program)
        
        logger.info("Program created successfully", extra={
            "program_id": program.id,
            "title": program.title,
            "church_id": church_id
        })
        
        program_response = ProgramResponse.model_validate(program)
        return create_api_response(data=program_response)
    
    except SQLAlchemyError as e:
        # Capture user_id BEFORE rollback to avoid lazy-loading issues
        user_id = current_user.id if current_user else None
        db.rollback()
        logger.error("Database error during program creation", exc_info=True, extra={"user_id": user_id})
        return create_api_response(error="Database error occurred while creating program")
    except Exception as e:
        # Capture user_id BEFORE any potential rollback
        user_id = current_user.id if current_user else None
        if db:
            db.rollback()
        logger.error("Unexpected error during program creation", exc_info=True, extra={"user_id": user_id})
        return create_api_response(error="Failed to create program")


@router.put("/{program_id}")
async def update_program(
    program_id: int,
    program_data: ProgramUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing program."""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Update fields
    if program_data.title is not None:
        program.title = program_data.title
    if program_data.date is not None:
        program.date = program_data.date
    if program_data.theme is not None:
        program.theme = program_data.theme
    if program_data.is_active is not None:
        program.is_active = program_data.is_active
    
    db.commit()
    db.refresh(program)
    
    program_response = ProgramResponse.model_validate(program)
    return create_api_response(data=program_response)


@router.delete("/{program_id}")
async def delete_program(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a program and all related data."""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Delete related data first
    db.query(ScheduleItem).filter(ScheduleItem.program_id == program_id).delete()
    db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).delete()
    
    # Delete program
    db.delete(program)
    db.commit()
    
    return create_api_response(message="Program deleted successfully")


@router.post("/{program_id}/schedule")
async def add_schedule_item(
    program_id: int,
    item_data: ScheduleItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a schedule item to a program."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    schedule_item = ScheduleItem(
        program_id=program_id,
        title=item_data.title,
        description=item_data.description,
        start_time=item_data.start_time,
        duration_minutes=item_data.duration_minutes,
        order_index=item_data.order_index if item_data.order_index is not None else 0,
        type=item_data.type if item_data.type else "worship"
    )
    db.add(schedule_item)
    db.commit()
    db.refresh(schedule_item)
    
    schedule_item_response = ScheduleItemResponse.model_validate(schedule_item)
    return create_api_response(data=schedule_item_response)


@router.post("/{program_id}/guests")
async def add_special_guest(
    program_id: int,
    guest_data: SpecialGuestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a special guest to a program."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    special_guest = SpecialGuest(
        program_id=program_id,
        name=guest_data.name,
        role=guest_data.role,
        description=guest_data.description,
        bio=guest_data.bio,
        photo_url=guest_data.photo_url,
        display_order=guest_data.display_order if guest_data.display_order is not None else 0
    )
    db.add(special_guest)
    db.commit()
    db.refresh(special_guest)
    
    special_guest_response = SpecialGuestResponse.model_validate(special_guest)
    return create_api_response(data=special_guest_response)


@router.delete("/{program_id}/schedule/{item_id}")
async def delete_schedule_item(
    program_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a schedule item from a program."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Verify schedule item exists and belongs to program
    schedule_item = db.query(ScheduleItem).filter(
        ScheduleItem.id == item_id,
        ScheduleItem.program_id == program_id
    ).first()
    
    if not schedule_item:
        return create_api_response(error="Schedule item not found")
    
    db.delete(schedule_item)
    db.commit()
    
    return create_api_response(message="Schedule item deleted successfully")


@router.put("/{program_id}/schedule/{item_id}")
async def update_schedule_item(
    program_id: int,
    item_id: int,
    item_data: ScheduleItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a schedule item."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Verify schedule item exists and belongs to program
    schedule_item = db.query(ScheduleItem).filter(
        ScheduleItem.id == item_id,
        ScheduleItem.program_id == program_id
    ).first()
    
    if not schedule_item:
        return create_api_response(error="Schedule item not found")
    
    # Update fields
    if item_data.title is not None:
        schedule_item.title = item_data.title
    if item_data.description is not None:
        schedule_item.description = item_data.description
    if item_data.start_time is not None:
        schedule_item.start_time = item_data.start_time
    if item_data.duration_minutes is not None:
        schedule_item.duration_minutes = item_data.duration_minutes
    if item_data.order_index is not None:
        schedule_item.order_index = item_data.order_index
    if item_data.type is not None:
        schedule_item.type = item_data.type
    
    db.commit()
    db.refresh(schedule_item)
    
    schedule_item_response = ScheduleItemResponse.model_validate(schedule_item)
    return create_api_response(data=schedule_item_response)


@router.put("/{program_id}/schedule/reorder")
async def reorder_schedule_items(
    program_id: int,
    reorder_data: ReorderItemsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder schedule items for a program."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    try:
        # Update order_index for each item
        for item in reorder_data.items:
            item_id = item.get("id")
            order_index = item.get("order_index")
            
            if item_id is None or order_index is None:
                continue
            
            schedule_item = db.query(ScheduleItem).filter(
                ScheduleItem.id == item_id,
                ScheduleItem.program_id == program_id
            ).first()
            
            if schedule_item:
                schedule_item.order_index = order_index
        
        db.commit()
        
        # Return updated schedule items
        schedule_items = db.query(ScheduleItem).filter(
            ScheduleItem.program_id == program_id
        ).order_by(ScheduleItem.order_index).all()
        
        items_data = [ScheduleItemResponse.model_validate(si) for si in schedule_items]
        return create_api_response(data=items_data)
    
    except Exception as e:
        db.rollback()
        logger.error("Error reordering schedule items", exc_info=True, extra={"program_id": program_id})
        return create_api_response(error="Failed to reorder schedule items")


@router.delete("/{program_id}/guests/{guest_id}")
async def delete_special_guest(
    program_id: int,
    guest_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a special guest from a program."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Verify guest exists and belongs to program
    special_guest = db.query(SpecialGuest).filter(
        SpecialGuest.id == guest_id,
        SpecialGuest.program_id == program_id
    ).first()
    
    if not special_guest:
        return create_api_response(error="Special guest not found")
    
    db.delete(special_guest)
    db.commit()
    
    return create_api_response(message="Special guest deleted successfully")


@router.put("/{program_id}/guests/{guest_id}")
async def update_special_guest(
    program_id: int,
    guest_id: int,
    guest_data: SpecialGuestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a special guest."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    # Verify guest exists and belongs to program
    special_guest = db.query(SpecialGuest).filter(
        SpecialGuest.id == guest_id,
        SpecialGuest.program_id == program_id
    ).first()
    
    if not special_guest:
        return create_api_response(error="Special guest not found")
    
    # Update fields
    if guest_data.name is not None:
        special_guest.name = guest_data.name
    if guest_data.role is not None:
        special_guest.role = guest_data.role
    if guest_data.description is not None:
        special_guest.description = guest_data.description
    if guest_data.bio is not None:
        special_guest.bio = guest_data.bio
    if guest_data.photo_url is not None:
        special_guest.photo_url = guest_data.photo_url
    if guest_data.display_order is not None:
        special_guest.display_order = guest_data.display_order
    
    db.commit()
    db.refresh(special_guest)
    
    special_guest_response = SpecialGuestResponse.model_validate(special_guest)
    return create_api_response(data=special_guest_response)


@router.put("/{program_id}/guests/reorder")
async def reorder_special_guests(
    program_id: int,
    reorder_data: ReorderGuestsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reorder special guests for a program."""
    # Verify program exists
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        return create_api_response(error="Program not found")
    
    try:
        # Update display_order for each guest
        for guest in reorder_data.guests:
            guest_id = guest.get("id")
            display_order = guest.get("display_order")
            
            if guest_id is None or display_order is None:
                continue
            
            special_guest = db.query(SpecialGuest).filter(
                SpecialGuest.id == guest_id,
                SpecialGuest.program_id == program_id
            ).first()
            
            if special_guest:
                special_guest.display_order = display_order
        
        db.commit()
        
        # Return updated guests
        special_guests = db.query(SpecialGuest).filter(
            SpecialGuest.program_id == program_id
        ).order_by(SpecialGuest.display_order).all()
        
        guests_data = [SpecialGuestResponse.model_validate(sg) for sg in special_guests]
        return create_api_response(data=guests_data)
    
    except Exception as e:
        db.rollback()
        logger.error("Error reordering special guests", exc_info=True, extra={"program_id": program_id})
        return create_api_response(error="Failed to reorder special guests")


@router.post("/bulk-import")
async def bulk_import_program(
    program_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk import a complete program with schedule items and guests.
    """
    # Get or create church for user
    church = db.query(Church).filter(Church.id == current_user.church_id).first()
    if not church:
        return create_api_response(error="User has no associated church")
    
    # Create program
    program = Program(
        church_id=church.id,
        title=program_data.get("title", "Untitled Program"),
        date=program_data.get("date"),
        theme=program_data.get("theme")
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    
    # Add schedule items
    schedule_items = program_data.get("schedule_items", [])
    for item in schedule_items:
        schedule_item = ScheduleItem(
            program_id=program.id,
            title=item.get("title"),
            description=item.get("description"),
            start_time=item.get("start_time"),
            duration_minutes=item.get("duration_minutes"),
            order_index=item.get("order_index")
        )
        db.add(schedule_item)
    
    # Add special guests
    special_guests = program_data.get("special_guests", [])
    for guest in special_guests:
        special_guest = SpecialGuest(
            program_id=program.id,
            name=guest.get("name"),
            role=guest.get("role"),
            description=guest.get("description"),
            bio=guest.get("bio"),
            photo_url=guest.get("photo_url"),
            display_order=guest.get("display_order", 0)
        )
        db.add(special_guest)
    
    db.commit()
    
    # Return complete program
    schedule_items_db = db.query(ScheduleItem).filter(ScheduleItem.program_id == program.id).all()
    guests_db = db.query(SpecialGuest).filter(SpecialGuest.program_id == program.id).all()
    
    program_dict = {
        "id": program.id,
        "church_id": program.church_id,
        "title": program.title,
        "date": program.date,
        "theme": program.theme,
        "created_at": program.created_at,
        "schedule_items": [ScheduleItemResponse.model_validate(si) for si in schedule_items_db],
        "special_guests": [SpecialGuestResponse.model_validate(sg) for sg in guests_db]
    }
    
    return create_api_response(data=program_dict)

