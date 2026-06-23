"""
SQLAlchemy models for PostgreSQL.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "khatu_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    receive_updates = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="user", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")


class OTP(Base):
    __tablename__ = "khatu_otps"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(255), index=True)
    otp_code = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified = Column(Boolean, default=False)


class Booking(Base):
    __tablename__ = "khatu_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    booking_type = Column(String(20), nullable=False)  # "individual" or "group"
    date = Column(DateTime(timezone=True), nullable=False)  # Visit date/time
    phone = Column(String(20), nullable=False)
    city = Column(String(255), nullable=False)
    individual_details = Column(JSONB, nullable=True)  # Name, age, wheelchair
    group_details = Column(JSONB, nullable=True)  # Count, names, wheelchairs
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="bookings")


class Donation(Base):
    __tablename__ = "khatu_donations"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    fullName = Column(String(255), nullable=False)
    mobile = Column(String(20), nullable=False)
    purpose = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    want80G = Column(Boolean, default=False)
    panCard = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="donations")


class SupportQuery(Base):
    __tablename__ = "khatu_support_queries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Vehicle(Base):
    __tablename__ = "khatu_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="CASCADE"), nullable=True)
    plate_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False)  # "Car", "Two-wheeler", etc.
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    permissions = relationship("VehiclePermission", back_populates="vehicle", cascade="all, delete-orphan")


class VehiclePermission(Base):
    __tablename__ = "khatu_vehicle_permissions"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("khatu_vehicles.id", ondelete="CASCADE"), nullable=False)
    permit_type = Column(String(50), nullable=False)  # "VIP", "Staff", "Visitor"
    status = Column(String(50), default="Pending")  # "Pending", "Approved", "Denied"
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_to = Column(DateTime(timezone=True), nullable=False)
    allowed_zones = Column(JSONB, nullable=False)  # JSON Array of strings e.g. ["Zone A", "Zone B"]
    approved_by = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    vehicle = relationship("Vehicle", back_populates="permissions")


class DarshanSlot(Base):
    __tablename__ = "khatu_darshan_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_time = Column(DateTime(timezone=True), unique=True, index=True, nullable=False)
    capacity = Column(Integer, default=1000)
    booked_count = Column(Integer, default=0)


class CrowdDensityLog(Base):
    __tablename__ = "khatu_crowd_density_logs"

    id = Column(Integer, primary_key=True, index=True)
    zone_name = Column(String(100), index=True, nullable=False)  # e.g., "Inner Sanctum", "Waiting Hall A"
    current_count = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)  # "Normal", "Moderate", "Dense", "Critical"
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
