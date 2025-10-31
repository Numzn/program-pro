from pydantic import BaseModel, EmailStr, Field
from typing import Optional
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

