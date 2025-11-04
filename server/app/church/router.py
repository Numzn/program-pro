from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database.connection import get_db
from app.models.database import Church, User
from app.models.schemas import ChurchUpdate, ChurchResponse, create_api_response
from app.auth.middleware import get_current_user

router = APIRouter()


@router.get("/info")
async def get_church_info(church_id: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Get public church information.
    No authentication required.
    """
    if church_id:
        church = db.query(Church).filter(Church.id == church_id).first()
    else:
        # Get first church as default
        church = db.query(Church).first()
    
    if not church:
        # Return a default church if none exists
        default_church = {
            "id": 0,
            "name": "Numz",
            "address": None,
            "created_at": None
        }
        return create_api_response(data=default_church)
    
    church_response = ChurchResponse.model_validate(church)
    return create_api_response(data=church_response)


@router.get("/settings")
async def get_church_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get church settings (requires authentication)."""
    if not current_user.church_id:
        return create_api_response(error="User has no associated church")
    
    church = db.query(Church).filter(Church.id == current_user.church_id).first()
    if not church:
        return create_api_response(error="Church not found")
    
    church_response = ChurchResponse.model_validate(church)
    return create_api_response(data=church_response)


@router.put("/settings")
async def update_church_settings(
    settings: ChurchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update church settings (requires authentication)."""
    if not current_user.church_id:
        return create_api_response(error="User has no associated church")
    
    church = db.query(Church).filter(Church.id == current_user.church_id).first()
    if not church:
        return create_api_response(error="Church not found")
    
    # Update fields
    if settings.name is not None:
        church.name = settings.name
    if settings.address is not None:
        church.address = settings.address
    
    db.commit()
    db.refresh(church)
    
    church_response = ChurchResponse.model_validate(church)
    return create_api_response(data=church_response)

