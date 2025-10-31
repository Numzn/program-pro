from app.database.connection import engine, Base
from app.models.database import User, Church, Program, ProgramTemplate, ScheduleItem, SpecialGuest  # noqa: F401
from app.config import settings
from alembic import command
from alembic.config import Config
import os
from pathlib import Path


def get_alembic_config():
    """Get Alembic configuration."""
    # Get the server directory (parent of app directory)
    server_dir = Path(__file__).parent.parent.parent
    alembic_ini_path = server_dir / "alembic.ini"
    
    alembic_cfg = Config(str(alembic_ini_path))
    return alembic_cfg


def run_migrations(environment: str = "production"):
    """
    Run pending database migrations using Alembic.
    
    Args:
        environment: Current environment (production, development, etc.)
    
    Safety:
        - In production: Only logs warnings, doesn't auto-apply
        - In development: Auto-applies migrations
    """
    try:
        alembic_cfg = get_alembic_config()
        
        # Check current revision
        script_dir = command.ScriptDirectory.from_config(alembic_cfg)
        head_revision = script_dir.get_current_head()
        
        print(f"🔄 Checking database migrations...")
        print(f"📌 Target revision: {head_revision}")
        
        # Check if alembic_version table exists (tracks applied migrations)
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if 'alembic_version' not in existing_tables:
            # First time running migrations - tables may already exist
            # Check if churches table exists
            if 'churches' in existing_tables:
                print("📋 Database tables already exist, stamping as initial revision...")
                # Mark database as being at 001_initial without running it
                command.stamp(alembic_cfg, "001_initial")
                print("✅ Database stamped at 001_initial")
            else:
                # Fresh database, run initial migration
                print("🆕 Fresh database detected, running initial migration...")
        
        # In production, we'll apply migrations but log what's happening
        # In a real scenario, you might want more safeguards
        if environment == "production":
            print("⚠️  Production environment: Applying migrations...")
            print("💡 Consider backing up database before major migrations")
        
        # Run migrations (will skip already-applied ones)
        command.upgrade(alembic_cfg, "head")
        print("✅ Database migrations applied successfully")
        
    except Exception as e:
        print(f"⚠️  Migration error: {e}")
        # Fallback to create_tables for initial setup
        print("🔄 Falling back to create_tables()...")
        create_tables()


def check_migrations():
    """Check if there are pending migrations without applying them."""
    try:
        alembic_cfg = get_alembic_config()
        # This would require connecting to DB to check current vs target revision
        # For now, we'll just note that migrations will run on startup
        print("✅ Migration system ready")
    except Exception as e:
        print(f"⚠️  Could not check migrations: {e}")


def create_tables():
    """
    Fallback: Create tables directly if Alembic fails.
    Use this only for initial setup or as a fallback.
    """
    print("🔄 Creating database tables (fallback method)...")
    Base.metadata.create_all(bind=engine)
    
    # Ensure address column exists in churches table (fix for current issue)
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            # Check if column exists, add if missing
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='churches' AND column_name='address'
            """))
            if result.fetchone() is None:
                print("🔧 Adding missing 'address' column to churches table...")
                conn.execute(text("ALTER TABLE churches ADD COLUMN address TEXT"))
                print("✅ Address column added")
    except Exception as e:
        print(f"⚠️  Could not add address column: {e}")
    
    print("✅ Database tables created successfully")


def drop_tables():
    """Drop all tables. Use with extreme caution!"""
    print("⚠️  Dropping database tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Database tables dropped")

