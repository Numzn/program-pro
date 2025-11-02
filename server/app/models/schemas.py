from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, description="Password (any length supported via bcrypt_sha256)")


class UserBase(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr] = None
    role: str


class UserResponse(UserBase):
    church_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    success: bool
    data: dict
    accessToken: str


class RefreshResponse(BaseModel):
    success: bool
    accessToken: str


class LogoutResponse(BaseModel):
    success: bool
    message: str


class SuccessResponse(BaseModel):
    success: bool
    message: str


# Generic API Response schema
class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None


def create_api_response(data: Any = None, error: str = None, message: str = None) -> dict:
    """Helper function to create standardized API responses."""
    return {
        "success": error is None,
        "data": data,
        "error": error,
        "message": message
    }


# Program schemas
class ProgramBase(BaseModel):
    title: str
    date: Optional[datetime] = None
    theme: Optional[str] = None
    is_active: Optional[bool] = True


class ProgramCreate(ProgramBase):
    church_id: Optional[int] = None  # Optional, will use user's church_id if not provided


class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    theme: Optional[str] = None
    is_active: Optional[bool] = None


class ScheduleItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    order_index: Optional[int] = None
    type: Optional[str] = "worship"  # worship, sermon, announcement, special


class ScheduleItemCreate(ScheduleItemBase):
    pass


class ScheduleItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    order_index: Optional[int] = None
    type: Optional[str] = None


class ReorderItemsRequest(BaseModel):
    items: List[dict]  # List of {id: int, order_index: int}


class SpecialGuestBase(BaseModel):
    name: str
    role: Optional[str] = None
    description: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    display_order: Optional[int] = 0


class SpecialGuestCreate(SpecialGuestBase):
    pass


class SpecialGuestUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    display_order: Optional[int] = None


class ReorderGuestsRequest(BaseModel):
    guests: List[dict]  # List of {id: int, display_order: int}


class ScheduleItemResponse(ScheduleItemBase):
    id: int
    program_id: int
    type: str  # Override to make it required (database always has value)
    created_at: datetime

    class Config:
        from_attributes = True


class SpecialGuestResponse(SpecialGuestBase):
    id: int
    program_id: int
    display_order: int  # Override to make it required (database always has value)
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramResponse(ProgramBase):
    id: int
    church_id: int
    is_active: bool  # Override base class to make it required (database always has value)
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramWithDetailsResponse(ProgramResponse):
    schedule_items: List[ScheduleItemResponse] = []
    special_guests: List[SpecialGuestResponse] = []

    class Config:
        from_attributes = True


# Template schemas
class TemplateBase(BaseModel):
    name: str
    content: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(TemplateBase):
    pass


class TemplateResponse(TemplateBase):
    id: int
    church_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Church schemas
class ChurchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None


class ChurchResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

