from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base


class Church(Base):
    __tablename__ = "churches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user")
    church_id = Column(Integer, ForeignKey("churches.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    church_id = Column(Integer, ForeignKey("churches.id"), nullable=False)
    title = Column(String(255), nullable=False)
    date = Column(DateTime(timezone=True))
    theme = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    start_time = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)
    order_index = Column(Integer)
    type = Column(String(50), default="worship")  # worship, sermon, announcement, special
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SpecialGuest(Base):
    __tablename__ = "special_guests"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(255))
    description = Column(Text)
    bio = Column(Text)
    photo_url = Column(String(500))
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgramTemplate(Base):
    __tablename__ = "program_templates"

    id = Column(Integer, primary_key=True, index=True)
    church_id = Column(Integer, ForeignKey("churches.id"))
    name = Column(String(255), nullable=False)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

