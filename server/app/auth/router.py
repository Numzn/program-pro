from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.database import User, Church
from app.models.schemas import (
    LoginRequest, LoginResponse, UserResponse,
    RefreshResponse, LogoutResponse, SuccessResponse
)
from app.auth.password import verify_password, hash_password
from app.auth.jwt_handler import (
    create_access_token, create_refresh_token,
    verify_access_token, verify_refresh_token
)
from app.config import settings


router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.username, "user_id": user.id})
    refresh_token = create_refresh_token({"sub": user.username, "user_id": user.id})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    user_data = UserResponse.model_validate(user)
    return LoginResponse(success=True, data={"user": user_data.model_dump()}, accessToken=access_token)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    username = payload.get("sub")
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access_token = create_access_token({"sub": username, "user_id": user_id})
    return RefreshResponse(success=True, accessToken=new_access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication")

    token = auth_header.replace("Bearer ", "")
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return UserResponse.model_validate(user)


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return LogoutResponse(success=True, message="Logged out successfully")


@router.post("/register", response_model=SuccessResponse)
async def register(credentials: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == credentials.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    church = db.query(Church).first()
    if not church:
        church = Church(name="Default Church")
        db.add(church)
        db.commit()
        db.refresh(church)

    hashed_password = hash_password(credentials.password)
    user = User(username=credentials.username, password_hash=hashed_password, role="admin", church_id=church.id)
    db.add(user)
    db.commit()
    return SuccessResponse(success=True, message="User registered successfully")

