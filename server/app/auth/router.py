import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
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

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        logger.info("Login attempt", extra={"username": credentials.username})
        
        # Query user from database
        user = db.query(User).filter(User.username == credentials.username).first()
        
        # Check if user exists and password is valid
        if not user:
            logger.warning("Login failed: user not found", extra={"username": credentials.username})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password
        password_valid = verify_password(credentials.password, user.password_hash)
        if not password_valid:
            logger.warning("Login failed: invalid password", extra={"username": credentials.username})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Generate tokens
        access_token = create_access_token({"sub": user.username, "user_id": user.id})
        refresh_token = create_refresh_token({"sub": user.username, "user_id": user.id})

        # Set refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="strict",
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )

        user_data = UserResponse.model_validate(user)
        logger.info("Login successful", extra={"username": user.username, "user_id": user.id})
        return LoginResponse(success=True, data={"user": user_data.model_dump()}, accessToken=access_token)
    
    except HTTPException:
        # Re-raise HTTP exceptions (401 for invalid credentials)
        raise
    except SQLAlchemyError as e:
        # Database connection/query errors
        logger.error("Database error during login", exc_info=True, extra={"username": credentials.username})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )
    except Exception as e:
        # Unexpected errors
        logger.error("Unexpected error during login", exc_info=True, extra={"username": credentials.username})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


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
    try:
        existing_user = db.query(User).filter(User.username == credentials.username).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

        church = db.query(Church).first()
        if not church:
            church = Church(name="Default Church")
            db.add(church)
            db.commit()
            db.refresh(church)
        
        # Ensure church has an ID
        if not church or not church.id:
            raise ValueError(f"Failed to create or retrieve church. Church: {church}")

        hashed_password = hash_password(credentials.password)
        user = User(
            username=credentials.username,
            email=None,  # Email is optional
            password_hash=hashed_password, 
            role="admin", 
            church_id=church.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return SuccessResponse(success=True, message="User registered successfully")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Register error: {e}")
        print(f"📋 Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

