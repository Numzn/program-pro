from app.database.connection import engine, Base
from app.models.database import User, Church, Program, ProgramTemplate, ScheduleItem, SpecialGuest  # noqa: F401


def create_tables():
    print("🔄 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def drop_tables():
    print("🔄 Dropping database tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Database tables dropped")


