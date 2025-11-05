import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import datetime
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


def safe_get_attr(obj, attr, default=None):
    """Safely get attribute from SQLAlchemy model, handling missing columns."""
    try:
        value = getattr(obj, attr, default)
        # If attribute exists but is None and we have a default, check if column exists
        if value is None and default is not None and hasattr(obj.__class__, attr):
            # Check if it's a column that might not exist in DB yet
            return default
        return value if value is not None else default
    except (AttributeError, KeyError):
        return default


@router.get("/{program_id}")
async def get_program_by_id(program_id: int, db: Session = Depends(get_db)):
    """Get a single program with all details."""
    try:
        # Fetch program
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            return create_api_response(error="Program not found")
        
        # Load related data - handle missing columns gracefully
        schedule_items = []
        try:
            schedule_items = db.query(ScheduleItem).filter(ScheduleItem.program_id == program_id).order_by(ScheduleItem.order_index).all()
        except (AttributeError, Exception) as e:
            logger.warning("Error ordering schedule_items by order_index - column may not exist", exc_info=True, extra={"program_id": program_id})
            try:
                schedule_items = db.query(ScheduleItem).filter(ScheduleItem.program_id == program_id).order_by(ScheduleItem.id).all()
            except Exception as e2:
                logger.error("Error fetching schedule_items", exc_info=True, extra={"program_id": program_id, "error": str(e2)})
                schedule_items = []
        
        special_guests = []
        try:
            special_guests = db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).order_by(SpecialGuest.display_order).all()
        except (AttributeError, Exception) as e:
            logger.warning("Error ordering special_guests by display_order - column may not exist", exc_info=True, extra={"program_id": program_id})
            try:
                special_guests = db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).order_by(SpecialGuest.id).all()
            except Exception as e2:
                logger.error("Error fetching special_guests", exc_info=True, extra={"program_id": program_id, "error": str(e2)})
                special_guests = []
        
        # Build response - provide defaults for missing columns
        schedule_items_data = []
        for si in schedule_items:
            try:
                item_dict = {
                    "id": si.id,
                    "program_id": si.program_id,
                    "title": safe_get_attr(si, 'title', ''),
                    "description": safe_get_attr(si, 'description', None),
                    "start_time": safe_get_attr(si, 'start_time', None),
                    "duration_minutes": safe_get_attr(si, 'duration_minutes', None),
                    "order_index": safe_get_attr(si, 'order_index', 0),
                    "type": safe_get_attr(si, 'type', 'worship'),
                    "created_at": safe_get_attr(si, 'created_at', None) or datetime.now()
                }
                schedule_items_data.append(ScheduleItemResponse.model_validate(item_dict))
            except Exception as e:
                logger.warning("Error validating schedule item", exc_info=True, extra={"item_id": getattr(si, 'id', None), "error": str(e)})
                continue
        
        special_guests_data = []
        for sg in special_guests:
            try:
                guest_dict = {
                    "id": sg.id,
                    "program_id": sg.program_id,
                    "name": safe_get_attr(sg, 'name', ''),
                    "role": safe_get_attr(sg, 'role', None),
                    "description": safe_get_attr(sg, 'description', None),
                    "bio": safe_get_attr(sg, 'bio', None),
                    "photo_url": safe_get_attr(sg, 'photo_url', None),
                    "display_order": safe_get_attr(sg, 'display_order', 0),
                    "created_at": safe_get_attr(sg, 'created_at', None) or datetime.now()
                }
                special_guests_data.append(SpecialGuestResponse.model_validate(guest_dict))
            except Exception as e:
                logger.warning("Error validating special guest", exc_info=True, extra={"guest_id": getattr(sg, 'id', None), "error": str(e)})
                continue
        
        # Build program response
        program_dict = {
            "id": program.id,
            "church_id": safe_get_attr(program, 'church_id', None),
            "title": safe_get_attr(program, 'title', ''),
            "date": safe_get_attr(program, 'date', None),
            "theme": safe_get_attr(program, 'theme', None),
            "created_at": safe_get_attr(program, 'created_at', None) or datetime.now(),
            "schedule_items": schedule_items_data,
            "special_guests": special_guests_data
        }
        
        return create_api_response(data=program_dict)
    
    except Exception as e:
        logger.error("Error fetching program by ID", exc_info=True, extra={"program_id": program_id, "error": str(e), "error_type": type(e).__name__})
        return create_api_response(error=f"Failed to fetch program details: {str(e)}")


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
    try:
        # Verify program exists
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            return create_api_response(error="Program not found")
        
        # Check which columns exist in the database
        from sqlalchemy import inspect, text
        from app.database.connection import engine
        
        # Use engine directly for inspection (more reliable than db.bind)
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('schedule_items')]
        
        # Fallback: if inspection fails, query information_schema directly
        if not columns:
            try:
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'schedule_items'
                """))
                columns = [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning("Could not inspect columns, using minimal set", exc_info=True)
                columns = ['id', 'program_id', 'title']  # Minimal safe set
        
        # Log received data for debugging
        logger.info("Adding schedule item", extra={
            "program_id": program_id,
            "title": item_data.title,
            "has_start_time": item_data.start_time is not None,
            "has_description": item_data.description is not None,
            "order_index": item_data.order_index,
            "type": item_data.type,
            "existing_columns": columns
        })
        
        # Use raw SQL INSERT with parameterized queries to only insert columns that exist
        # This avoids SQLAlchemy trying to insert columns defined in model but missing in DB
        from sqlalchemy import text
        
        insert_cols = ['program_id', 'title']
        params = {'program_id': program_id, 'title': item_data.title}
        placeholders = [':program_id', ':title']
        
        if 'description' in columns:
            insert_cols.append('description')
            placeholders.append(':description')
            params['description'] = item_data.description
        
        if 'start_time' in columns and item_data.start_time:
            insert_cols.append('start_time')
            placeholders.append(':start_time')
            params['start_time'] = item_data.start_time
        
        if 'duration_minutes' in columns and item_data.duration_minutes is not None:
            insert_cols.append('duration_minutes')
            placeholders.append(':duration_minutes')
            params['duration_minutes'] = item_data.duration_minutes
        
        if 'order_index' in columns:
            insert_cols.append('order_index')
            placeholders.append(':order_index')
            params['order_index'] = item_data.order_index if item_data.order_index is not None else 0
        
        if 'type' in columns:
            insert_cols.append('type')
            placeholders.append(':type')
            params['type'] = item_data.type if item_data.type else 'worship'
        
        # Build and execute parameterized SQL
        try:
            sql = f"INSERT INTO schedule_items ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)}) RETURNING id"
            logger.info("Executing SQL INSERT", extra={
                "sql": sql,
                "params": params,
                "columns_to_insert": insert_cols,
                "existing_columns": columns
            })
            result = db.execute(text(sql), params)
            item_id = result.scalar()
            db.commit()
            logger.info("Schedule item created successfully", extra={"item_id": item_id})
            
            # Fetch the created item
            schedule_item = db.query(ScheduleItem).filter(ScheduleItem.id == item_id).first()
            db.refresh(schedule_item)
        except SQLAlchemyError as commit_error:
            db.rollback()
            # Capture the actual database error message
            error_msg = str(commit_error.orig) if hasattr(commit_error, 'orig') else str(commit_error)
            logger.error("Database error during commit", exc_info=True, extra={
                "program_id": program_id,
                "error": error_msg,
                "error_type": type(commit_error).__name__
            })
            return create_api_response(error=f"Database error: {error_msg}")
        
        # Build response safely
        try:
            schedule_item_response = ScheduleItemResponse.model_validate(schedule_item)
            return create_api_response(data=schedule_item_response)
        except Exception as validation_error:
            logger.warning("Error validating schedule item response", exc_info=True, extra={
                "program_id": program_id,
                "item_id": schedule_item.id
            })
            # Return basic success even if validation fails
            return create_api_response(data={
                "id": schedule_item.id,
                "program_id": schedule_item.program_id,
                "title": schedule_item.title
            })
    
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error("Database error adding schedule item", exc_info=True, extra={
            "program_id": program_id,
            "error": error_msg,
            "error_type": type(e).__name__
        })
        return create_api_response(error=f"Database error: {error_msg}")
    except Exception as e:
        if db:
            db.rollback()
        logger.error("Error adding schedule item", exc_info=True, extra={
            "program_id": program_id,
            "error": str(e),
            "error_type": type(e).__name__
        })
        return create_api_response(error=f"Failed to add schedule item: {str(e)}")


@router.post("/{program_id}/guests")
async def add_special_guest(
    program_id: int,
    guest_data: SpecialGuestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a special guest to a program."""
    try:
        # Verify program exists
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            return create_api_response(error="Program not found")
        
        # Check which columns exist in the database
        from sqlalchemy import inspect, text
        from app.database.connection import engine
        
        # Use engine directly for inspection (more reliable than db.bind)
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('special_guests')]
        
        # Fallback: if inspection fails, query information_schema directly
        if not columns:
            try:
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'special_guests'
                """))
                columns = [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning("Could not inspect columns, using minimal set", exc_info=True)
                columns = ['id', 'program_id', 'name']  # Minimal safe set
        
        # Log received data for debugging
        logger.info("Adding special guest", extra={
            "program_id": program_id,
            "name": guest_data.name,
            "has_role": guest_data.role is not None,
            "has_bio": guest_data.bio is not None,
            "has_photo_url": guest_data.photo_url is not None,
            "display_order": guest_data.display_order,
            "existing_columns": columns
        })
        
        # Use raw SQL INSERT with parameterized queries to only insert columns that exist
        # This avoids SQLAlchemy trying to insert columns defined in model but missing in DB
        insert_cols = ['program_id', 'name']
        params = {'program_id': program_id, 'name': guest_data.name}
        placeholders = [':program_id', ':name']
        
        if 'role' in columns:
            insert_cols.append('role')
            placeholders.append(':role')
            params['role'] = guest_data.role
        
        if 'description' in columns:
            insert_cols.append('description')
            placeholders.append(':description')
            params['description'] = guest_data.description
        
        if 'bio' in columns:
            insert_cols.append('bio')
            placeholders.append(':bio')
            params['bio'] = guest_data.bio
        
        if 'photo_url' in columns:
            insert_cols.append('photo_url')
            placeholders.append(':photo_url')
            params['photo_url'] = guest_data.photo_url
        
        if 'display_order' in columns:
            insert_cols.append('display_order')
            placeholders.append(':display_order')
            params['display_order'] = guest_data.display_order if guest_data.display_order is not None else 0
        
        # Build and execute parameterized SQL
        try:
            sql = f"INSERT INTO special_guests ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)}) RETURNING id"
            logger.info("Executing SQL INSERT", extra={
                "sql": sql,
                "params": params,
                "columns_to_insert": insert_cols,
                "existing_columns": columns
            })
            result = db.execute(text(sql), params)
            guest_id = result.scalar()
            db.commit()
            logger.info("Special guest created successfully", extra={"guest_id": guest_id})
            
            # Fetch the created guest
            special_guest = db.query(SpecialGuest).filter(SpecialGuest.id == guest_id).first()
            db.refresh(special_guest)
        except SQLAlchemyError as commit_error:
            db.rollback()
            # Capture the actual database error message
            error_msg = str(commit_error.orig) if hasattr(commit_error, 'orig') else str(commit_error)
            logger.error("Database error during commit", exc_info=True, extra={
                "program_id": program_id,
                "error": error_msg,
                "error_type": type(commit_error).__name__
            })
            return create_api_response(error=f"Database error: {error_msg}")
        
        # Build response safely
        try:
            special_guest_response = SpecialGuestResponse.model_validate(special_guest)
            return create_api_response(data=special_guest_response)
        except Exception as validation_error:
            logger.warning("Error validating special guest response", exc_info=True, extra={
                "program_id": program_id,
                "guest_id": special_guest.id
            })
            # Return basic success even if validation fails
            return create_api_response(data={
                "id": special_guest.id,
                "program_id": special_guest.program_id,
                "name": special_guest.name
            })
    
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error("Database error adding special guest", exc_info=True, extra={
            "program_id": program_id,
            "error": error_msg,
            "error_type": type(e).__name__
        })
        return create_api_response(error=f"Database error: {error_msg}")
    except Exception as e:
        if db:
            db.rollback()
        logger.error("Error adding special guest", exc_info=True, extra={
            "program_id": program_id,
            "error": str(e),
            "error_type": type(e).__name__
        })
        return create_api_response(error=f"Failed to add special guest: {str(e)}")


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
        try:
            schedule_item.order_index = item_data.order_index
        except AttributeError:
            logger.warning("Cannot set order_index - column may not exist")
            pass
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
                try:
                    schedule_item.order_index = order_index
                except AttributeError:
                    # Column doesn't exist yet - skip setting order_index
                    logger.warning("Cannot set order_index - column may not exist", extra={"item_id": item_id})
                    pass
        
        db.commit()
        
        # Return updated schedule items - handle missing order_index column gracefully
        try:
            schedule_items = db.query(ScheduleItem).filter(
                ScheduleItem.program_id == program_id
            ).order_by(ScheduleItem.order_index).all()
        except Exception as e:
            logger.warning("Error ordering schedule_items by order_index - column may not exist", exc_info=True, extra={"program_id": program_id})
            # Fallback: order by id
            schedule_items = db.query(ScheduleItem).filter(
                ScheduleItem.program_id == program_id
            ).order_by(ScheduleItem.id).all()
        
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
        try:
            special_guest.display_order = guest_data.display_order
        except AttributeError:
            logger.warning("Cannot set display_order - column may not exist")
            pass
    
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
                try:
                    special_guest.display_order = display_order
                except AttributeError:
                    # Column doesn't exist yet - skip setting display_order
                    logger.warning("Cannot set display_order - column may not exist", extra={"guest_id": guest_id})
                    pass
        
        db.commit()
        
        # Return updated guests - handle missing display_order column gracefully
        try:
            special_guests = db.query(SpecialGuest).filter(
                SpecialGuest.program_id == program_id
            ).order_by(SpecialGuest.display_order).all()
        except Exception as e:
            logger.warning("Error ordering special_guests by display_order - column may not exist", exc_info=True, extra={"program_id": program_id})
            # Fallback: order by id
            special_guests = db.query(SpecialGuest).filter(
                SpecialGuest.program_id == program_id
            ).order_by(SpecialGuest.id).all()
        
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
    try:
        # Get or create church for user
        church = db.query(Church).filter(Church.id == current_user.church_id).first()
        if not church:
            return create_api_response(error="User has no associated church")
        
        # Create program
        program = Program(
            church_id=church.id,
            title=program_data.get("title", "Untitled Program"),
            date=program_data.get("date"),
            theme=program_data.get("theme"),
            is_active=program_data.get("is_active", True),
            created_by=current_user.id
        )
        db.add(program)
        db.commit()
        db.refresh(program)
        
        # Add schedule items - check which columns exist first (same logic as add_schedule_item)
        from sqlalchemy import inspect, text
        from app.database.connection import engine
        
        inspector = inspect(engine)
        schedule_columns = [col['name'] for col in inspector.get_columns('schedule_items')]
        
        if not schedule_columns:
            try:
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'schedule_items'
                """))
                schedule_columns = [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning("Could not inspect schedule_items columns, using minimal set", exc_info=True)
                schedule_columns = ['id', 'program_id', 'title']  # Minimal safe set
        
        schedule_items = program_data.get("schedule_items", [])
        for item in schedule_items:
            # Build INSERT with only existing columns (same approach as add_schedule_item endpoint)
            insert_cols = ['program_id', 'title']
            params = {'program_id': program.id, 'title': item.get("title")}
            placeholders = [':program_id', ':title']
            
            if 'description' in schedule_columns and item.get("description"):
                insert_cols.append('description')
                placeholders.append(':description')
                params['description'] = item.get("description")
            
            if 'start_time' in schedule_columns and item.get("start_time"):
                insert_cols.append('start_time')
                placeholders.append(':start_time')
                params['start_time'] = item.get("start_time")
            
            # Only include duration_minutes if column exists
            if 'duration_minutes' in schedule_columns and item.get("duration_minutes") is not None:
                insert_cols.append('duration_minutes')
                placeholders.append(':duration_minutes')
                params['duration_minutes'] = item.get("duration_minutes")
            
            if 'order_index' in schedule_columns:
                insert_cols.append('order_index')
                placeholders.append(':order_index')
                params['order_index'] = item.get("order_index", 0)
            
            if 'type' in schedule_columns:
                insert_cols.append('type')
                placeholders.append(':type')
                params['type'] = item.get("type", "worship")
            
            # Execute parameterized SQL INSERT
            try:
                sql = f"INSERT INTO schedule_items ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)}) RETURNING id"
                result = db.execute(text(sql), params)
                # Item is automatically committed when we commit later
            except Exception as e:
                logger.error("Error adding schedule item in bulk import", exc_info=True, extra={
                    "program_id": program.id,
                    "error": str(e)
                })
                # Continue with other items even if one fails
                continue
        
        # Add special guests - check which columns exist first (same approach as schedule items)
        guest_columns = [col['name'] for col in inspector.get_columns('special_guests')]
        
        if not guest_columns:
            try:
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'special_guests'
                """))
                guest_columns = [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning("Could not inspect special_guests columns, using minimal set", exc_info=True)
                guest_columns = ['id', 'program_id', 'name']  # Minimal safe set
        
        special_guests = program_data.get("special_guests", [])
        for guest in special_guests:
            # Build INSERT with only existing columns
            insert_cols = ['program_id', 'name']
            params = {'program_id': program.id, 'name': guest.get("name")}
            placeholders = [':program_id', ':name']
            
            if 'role' in guest_columns and guest.get("role"):
                insert_cols.append('role')
                placeholders.append(':role')
                params['role'] = guest.get("role")
            
            if 'description' in guest_columns and guest.get("description"):
                insert_cols.append('description')
                placeholders.append(':description')
                params['description'] = guest.get("description")
            
            if 'bio' in guest_columns and guest.get("bio"):
                insert_cols.append('bio')
                placeholders.append(':bio')
                params['bio'] = guest.get("bio")
            
            if 'photo_url' in guest_columns and guest.get("photo_url"):
                insert_cols.append('photo_url')
                placeholders.append(':photo_url')
                params['photo_url'] = guest.get("photo_url")
            
            if 'display_order' in guest_columns:
                insert_cols.append('display_order')
                placeholders.append(':display_order')
                params['display_order'] = guest.get("display_order", 0)
            
            # Execute parameterized SQL INSERT
            try:
                sql = f"INSERT INTO special_guests ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)}) RETURNING id"
                db.execute(text(sql), params)
            except Exception as e:
                logger.error("Error adding special guest in bulk import", exc_info=True, extra={
                    "program_id": program.id,
                    "error": str(e)
                })
                # Continue with other guests even if one fails
                continue
        
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
            "is_active": program.is_active,
            "created_at": program.created_at,
            "schedule_items": [ScheduleItemResponse.model_validate(si) for si in schedule_items_db],
            "special_guests": [SpecialGuestResponse.model_validate(sg) for sg in guests_db]
        }
        
        return create_api_response(data=program_dict)
        
    except Exception as e:
        db.rollback()
        logger.error("Error in bulk import", exc_info=True, extra={
            "user_id": current_user.id,
            "error": str(e)
        })
        return create_api_response(error=f"Failed to bulk import program: {str(e)}")


@router.put("/{program_id}/bulk-update")
async def bulk_update_program(
    program_id: int,
    program_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a program with schedule items and guests in one atomic operation.
    This replaces all existing schedule items and guests with the new ones.
    """
    logger.info("Bulk update program request received", extra={
        "program_id": program_id,
        "user_id": current_user.id,
        "title": program_data.get("title"),
        "has_schedule_items": len(program_data.get("schedule_items", [])),
        "has_special_guests": len(program_data.get("special_guests", []))
    })
    
    # Verify program exists and user has permission
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        logger.warning("Program not found for bulk update", extra={"program_id": program_id})
        return create_api_response(error="Program not found")
    
    # Verify user's church matches program's church
    if program.church_id != current_user.church_id:
        logger.warning("Unauthorized bulk update attempt", extra={
            "program_id": program_id,
            "user_id": current_user.id,
            "program_church_id": program.church_id,
            "user_church_id": current_user.church_id
        })
        return create_api_response(error="Unauthorized")
    
    try:
        # Update program details
        if "title" in program_data:
            program.title = program_data["title"]
        if "date" in program_data:
            program.date = program_data["date"]
        if "theme" in program_data:
            program.theme = program_data.get("theme")
        if "is_active" in program_data:
            program.is_active = program_data["is_active"]
        
        # Delete all existing schedule items and guests
        db.query(ScheduleItem).filter(ScheduleItem.program_id == program_id).delete()
        db.query(SpecialGuest).filter(SpecialGuest.program_id == program_id).delete()
        
        # Add new schedule items - check which columns exist first (same logic as bulk_import_program)
        from sqlalchemy import inspect, text
        from app.database.connection import engine
        
        inspector = inspect(engine)
        schedule_columns = [col['name'] for col in inspector.get_columns('schedule_items')]
        
        if not schedule_columns:
            try:
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'schedule_items'
                """))
                schedule_columns = [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning("Could not inspect schedule_items columns, using minimal set", exc_info=True)
                schedule_columns = ['id', 'program_id', 'title']  # Minimal safe set
        
        schedule_items = program_data.get("schedule_items", [])
        for item in schedule_items:
            # Build INSERT with only existing columns (same approach as add_schedule_item endpoint)
            insert_cols = ['program_id', 'title']
            params = {'program_id': program.id, 'title': item.get("title")}
            placeholders = [':program_id', ':title']
            
            if 'description' in schedule_columns and item.get("description"):
                insert_cols.append('description')
                placeholders.append(':description')
                params['description'] = item.get("description")
            
            if 'start_time' in schedule_columns and item.get("start_time"):
                insert_cols.append('start_time')
                placeholders.append(':start_time')
                params['start_time'] = item.get("start_time")
            
            # Only include duration_minutes if column exists
            if 'duration_minutes' in schedule_columns and item.get("duration_minutes") is not None:
                insert_cols.append('duration_minutes')
                placeholders.append(':duration_minutes')
                params['duration_minutes'] = item.get("duration_minutes")
            
            if 'order_index' in schedule_columns:
                insert_cols.append('order_index')
                placeholders.append(':order_index')
                params['order_index'] = item.get("order_index", 0)
            
            if 'type' in schedule_columns:
                insert_cols.append('type')
                placeholders.append(':type')
                params['type'] = item.get("type", "worship")
            
            # Execute parameterized SQL INSERT
            try:
                sql = f"INSERT INTO schedule_items ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)}) RETURNING id"
                logger.debug("Executing schedule item INSERT", extra={
                    "program_id": program.id,
                    "sql": sql,
                    "columns_to_insert": insert_cols,
                    "existing_columns": schedule_columns
                })
                db.execute(text(sql), params)
            except Exception as e:
                logger.error("Error adding schedule item in bulk update", exc_info=True, extra={
                    "program_id": program.id,
                    "item_title": item.get("title"),
                    "columns_to_insert": insert_cols,
                    "error": str(e)
                })
                # Continue with other items even if one fails
                continue
        
        # Add new special guests - check which columns exist first
        guest_columns = [col['name'] for col in inspector.get_columns('special_guests')]
        
        if not guest_columns:
            try:
                result = db.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'special_guests'
                """))
                guest_columns = [row[0] for row in result.fetchall()]
            except Exception as e:
                logger.warning("Could not inspect special_guests columns, using minimal set", exc_info=True)
                guest_columns = ['id', 'program_id', 'name']
        
        logger.info("Special guests columns detected", extra={
            "program_id": program_id,
            "existing_columns": guest_columns
        })
        
        special_guests = program_data.get("special_guests", [])
        logger.info("Processing special guests", extra={
            "program_id": program_id,
            "guest_count": len(special_guests)
        })
        for guest in special_guests:
            # Build INSERT with only existing columns
            insert_cols = ['program_id', 'name']
            params = {'program_id': program.id, 'name': guest.get("name")}
            placeholders = [':program_id', ':name']
            
            if 'role' in guest_columns and guest.get("role"):
                insert_cols.append('role')
                placeholders.append(':role')
                params['role'] = guest.get("role")
            
            if 'description' in guest_columns and guest.get("description"):
                insert_cols.append('description')
                placeholders.append(':description')
                params['description'] = guest.get("description")
            
            if 'bio' in guest_columns and guest.get("bio"):
                insert_cols.append('bio')
                placeholders.append(':bio')
                params['bio'] = guest.get("bio")
            
            if 'photo_url' in guest_columns and guest.get("photo_url"):
                insert_cols.append('photo_url')
                placeholders.append(':photo_url')
                params['photo_url'] = guest.get("photo_url")
            
            if 'display_order' in guest_columns:
                insert_cols.append('display_order')
                placeholders.append(':display_order')
                params['display_order'] = guest.get("display_order", 0)
            
            # Execute parameterized SQL INSERT
            try:
                sql = f"INSERT INTO special_guests ({', '.join(insert_cols)}) VALUES ({', '.join(placeholders)}) RETURNING id"
                logger.debug("Executing special guest INSERT", extra={
                    "program_id": program.id,
                    "sql": sql,
                    "columns_to_insert": insert_cols,
                    "existing_columns": guest_columns
                })
                db.execute(text(sql), params)
            except Exception as e:
                logger.error("Error adding special guest in bulk update", exc_info=True, extra={
                    "program_id": program.id,
                    "guest_name": guest.get("name"),
                    "columns_to_insert": insert_cols,
                    "error": str(e)
                })
                # Continue with other guests even if one fails
                continue
        
        # Commit everything in one transaction
        logger.info("Committing bulk update transaction", extra={"program_id": program_id})
        db.commit()
        db.refresh(program)
        
        logger.info("Bulk update completed successfully", extra={
            "program_id": program_id,
            "schedule_items_count": len(schedule_items),
            "special_guests_count": len(special_guests)
        })
        
        # Fetch and return complete updated program
        schedule_items_db = db.query(ScheduleItem).filter(ScheduleItem.program_id == program.id).all()
        guests_db = db.query(SpecialGuest).filter(SpecialGuest.program_id == program.id).all()
        
        program_dict = {
            "id": program.id,
            "church_id": program.church_id,
            "title": program.title,
            "date": program.date,
            "theme": program.theme,
            "is_active": program.is_active,
            "created_at": program.created_at,
            "schedule_items": [ScheduleItemResponse.model_validate(si) for si in schedule_items_db],
            "special_guests": [SpecialGuestResponse.model_validate(sg) for sg in guests_db]
        }
        
        return create_api_response(data=program_dict)
        
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        logger.error("Error in bulk update", exc_info=True, extra={
            "program_id": program_id,
            "user_id": current_user.id,
            "error": error_msg,
            "error_type": type(e).__name__
        })
        return create_api_response(error=f"Failed to bulk update program: {error_msg}")

