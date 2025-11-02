from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.database import Program, ScheduleItem, SpecialGuest, Church
from app.models.schemas import (
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramWithDetailsResponse,
    ScheduleItemCreate, ScheduleItemResponse,
    SpecialGuestCreate, SpecialGuestResponse,
    SuccessResponse, create_api_response
)
from app.auth.middleware import get_current_user
from app.models.database import User

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
    
    # Note: is_active is not a database field yet, might need migration
    # For now, we'll just return all programs
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
    special_guests = db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).all()
    
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
    # Use user's church_id if not provided
    church_id = program_data.church_id
    if not church_id:
        if not current_user.church_id:
            return create_api_response(error="User has no associated church")
        church_id = current_user.church_id
    
    # Verify church exists
    church = db.query(Church).filter(Church.id == church_id).first()
    if not church:
        return create_api_response(error="Church not found")
    
    # Create program
    program = Program(
        church_id=church_id,
        title=program_data.title,
        date=program_data.date,
        theme=program_data.theme
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    
    program_response = ProgramResponse.model_validate(program)
    return create_api_response(data=program_response)


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
        order_index=item_data.order_index
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
        description=guest_data.description
    )
    db.add(special_guest)
    db.commit()
    db.refresh(special_guest)
    
    special_guest_response = SpecialGuestResponse.model_validate(special_guest)
    return create_api_response(data=special_guest_response)


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
            description=guest.get("description")
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

