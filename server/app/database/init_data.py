import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database.connection import SessionLocal
from app.models.database import User, Church
from app.auth.password import hash_password

logger = logging.getLogger(__name__)


def ensure_admin_user():
    """
    Ensure that an admin user exists with known credentials.
    Creates default church if none exists, and admin user if missing.
    Does not crash on errors - logs warnings and continues.
    """
    db: Session = None
    try:
        db = SessionLocal()
        
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            logger.info("Admin user already exists", extra={"username": "admin", "user_id": admin_user.id})
            return
        
        logger.info("Admin user not found, initializing...")
        
        # Ensure a church exists (create default if none)
        church = db.query(Church).first()
        if not church:
            logger.info("No church found, creating default church...")
            church = Church(name="Grace Community Church")
            db.add(church)
            db.commit()
            db.refresh(church)
            logger.info("Default church created", extra={"church_id": church.id, "name": church.name})
        
        # Create admin user
        hashed_password_str = hash_password("password")
        admin_user = User(
            username="admin",
            email=None,
            password_hash=hashed_password_str,
            role="admin",
            church_id=church.id
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        logger.info(
            "Admin user created successfully",
            extra={
                "username": "admin",
                "user_id": admin_user.id,
                "church_id": church.id,
                "default_password": "password"
            }
        )
        
    except SQLAlchemyError as e:
        logger.error("Database error during admin user initialization", exc_info=True)
        if db:
            db.rollback()
    except Exception as e:
        logger.error("Unexpected error during admin user initialization", exc_info=True)
        if db:
            db.rollback()
    finally:
        if db:
            db.close()

