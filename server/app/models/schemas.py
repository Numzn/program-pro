from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
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


# Program schemas
class ProgramBase(BaseModel):
    title: str
    date: Optional[datetime] = None
    theme: Optional[str] = None


class ProgramCreate(ProgramBase):
    church_id: int


class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    theme: Optional[str] = None


class ScheduleItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    order_index: Optional[int] = None


class ScheduleItemCreate(ScheduleItemBase):
    pass


class SpecialGuestBase(BaseModel):
    name: str
    role: Optional[str] = None
    description: Optional[str] = None


class SpecialGuestCreate(SpecialGuestBase):
    pass


class ScheduleItemResponse(ScheduleItemBase):
    id: int
    program_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SpecialGuestResponse(SpecialGuestBase):
    id: int
    program_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProgramResponse(ProgramBase):
    id: int
    church_id: int
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

