from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.database import ProgramTemplate, User
from app.models.schemas import TemplateCreate, TemplateUpdate, TemplateResponse, SuccessResponse
from app.auth.middleware import get_current_user

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
async def get_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all templates for the user's church."""
    if not current_user.church_id:
        return []
    
    templates = db.query(ProgramTemplate).filter(ProgramTemplate.church_id == current_user.church_id).order_by(ProgramTemplate.created_at.desc()).all()
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template_by_id(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific template."""
    template = db.query(ProgramTemplate).filter(ProgramTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return template


@router.post("/", response_model=TemplateResponse)
async def create_template(
    template_data: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new template."""
    if not current_user.church_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has no associated church"
        )
    
    template = ProgramTemplate(
        church_id=current_user.church_id,
        name=template_data.name,
        content=template_data.content
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_data: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing template."""
    template = db.query(ProgramTemplate).filter(ProgramTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    if template_data.name is not None:
        template.name = template_data.name
    if template_data.content is not None:
        template.content = template_data.content
    
    db.commit()
    db.refresh(template)
    
    return template


@router.delete("/{template_id}", response_model=SuccessResponse)
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a template."""
    template = db.query(ProgramTemplate).filter(ProgramTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    db.delete(template)
    db.commit()
    
    return SuccessResponse(success=True, message="Template deleted successfully")

