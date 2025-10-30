from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings


is_postgres = settings.DATABASE_URL.startswith("postgres://") or settings.DATABASE_URL.startswith("postgresql://")
connect_args = {"sslmode": "require"} if is_postgres else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

