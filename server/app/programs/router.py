from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.database import Program, ScheduleItem, SpecialGuest, Church
from app.models.schemas import (
    ProgramCreate, ProgramUpdate, ProgramResponse, ProgramWithDetailsResponse,
    ScheduleItemCreate, ScheduleItemResponse,
    SpecialGuestCreate, SpecialGuestResponse,
    SuccessResponse
)
from app.auth.middleware import get_current_user
from app.models.database import User

router = APIRouter()


@router.get("/", response_model=List[ProgramResponse])
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
    return programs


@router.get("/{program_id}", response_model=ProgramWithDetailsResponse)
async def get_program_by_id(program_id: int, db: Session = Depends(get_db)):
    """Get a single program with all details."""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
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
        "schedule_items": schedule_items,
        "special_guests": special_guests
    }
    
    return program_dict


@router.post("/", response_model=ProgramResponse)
async def create_program(
    program_data: ProgramCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new program."""
    # Verify church exists
    church = db.query(Church).filter(Church.id == program_data.church_id).first()
    if not church:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Church not found"
        )
    
    # Create program
    program = Program(
        church_id=program_data.church_id,
        title=program_data.title,
        date=program_data.date,
        theme=program_data.theme
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    
    return program


@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int,
    program_data: ProgramUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing program."""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    # Update fields
    if program_data.title is not None:
        program.title = program_data.title
    if program_data.date is not None:
        program.date = program_data.date
    if program_data.theme is not None:
        program.theme = program_data.theme
    
    db.commit()
    db.refresh(program)
    
    return program


@router.delete("/{program_id}", response_model=SuccessResponse)
async def delete_program(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a program and all related data."""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    # Delete related data first
    db.query(ScheduleItem).filter(ScheduleItem.program_id == program_id).delete()
    db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).delete()
    
    # Delete program
    db.delete(program)
    db.commit()
    
    return SuccessResponse(success=True, message="Program deleted successfully")


@router.post("/{program_id}/schedule", response_model=ScheduleItemResponse)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
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
    
    return schedule_item


@router.post("/{program_id}/guests", response_model=SpecialGuestResponse)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )
    
    special_guest = SpecialGuest(
        program_id=program_id,
        name=guest_data.name,
        role=guest_data.role,
        description=guest_data.description
    )
    db.add(special_guest)
    db.commit()
    db.refresh(special_guest)
    
    return special_guest


@router.post("/bulk-import", response_model=ProgramWithDetailsResponse)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no associated church"
        )
    
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
    
    return {
        "id": program.id,
        "church_id": program.church_id,
        "title": program.title,
        "date": program.date,
        "theme": program.theme,
        "created_at": program.created_at,
        "schedule_items": schedule_items_db,
        "special_guests": guests_db
    }

