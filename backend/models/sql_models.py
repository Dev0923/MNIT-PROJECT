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
    is_admin = Column(Boolean, default=False, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="user", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    accommodation_bookings = relationship("AccommodationBooking", back_populates="user", cascade="all, delete-orphan")
    sos_alerts = relationship("SOSAlert", back_populates="user", cascade="all, delete-orphan")


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
    status = Column(String(50), default="Confirmed", nullable=False, server_default="Confirmed")
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
    status = Column(String(50), default="open", nullable=False, server_default="open")
    admin_reply = Column(Text, nullable=True)
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


class BhandaraSpot(Base):
    __tablename__ = "khatu_bhandara_spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    capacity = Column(Integer, default=5000)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)

    bookings = relationship("BhandaraBooking", back_populates="spot", cascade="all, delete-orphan")


class BhandaraBooking(Base):
    __tablename__ = "khatu_bhandara_bookings"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("khatu_bhandara_spots.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    org_name = Column(String(255), nullable=False)
    org_address = Column(Text, nullable=False)
    organiser_type = Column(String(50), nullable=False)
    expected_meals = Column(Integer, nullable=False)
    location_description = Column(Text, nullable=True)
    purpose = Column(Text, nullable=False)
    noc_filename = Column(String(255), nullable=True)
    id_proof_filename = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending")
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    spot = relationship("BhandaraSpot", back_populates="bookings")
    user = relationship("User")


class LostItem(Base):
    __tablename__ = "khatu_lost_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    date_lost = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    photo_url = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Lost")  # Lost, Found, Claimed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class FoundItem(Base):
    __tablename__ = "khatu_found_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    date_found = Column(DateTime(timezone=True), nullable=False)
    location_found = Column(String(255), nullable=False)
    storage_location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    status = Column(String(50), default="In Storage")  # In Storage, Claimed
    claim_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class LostPerson(Base):
    __tablename__ = "khatu_lost_persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    clothes_description = Column(Text, nullable=True)
    last_seen_location = Column(String(255), nullable=False)
    last_seen_time = Column(DateTime(timezone=True), nullable=False)
    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    photo_url = Column(Text, nullable=True)
    status = Column(String(50), default="Missing")  # Missing, Found
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class GeneralPermission(Base):
    __tablename__ = "khatu_general_permissions"

    id = Column(Integer, primary_key=True, index=True)
    permission_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # "Bandhara", "Medical", "Other"
    subtype = Column(String(50), nullable=False)
    purpose = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")  # "pending", "approved", "rejected"
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
class SOSAlert(Base):
    __tablename__ = "khatu_sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="Activated")  # "Activated", "Cancelled"
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sos_alerts")


class Announcement(Base):
    """Admin-managed announcements shown on the devotee Home page."""
    __tablename__ = "khatu_announcements"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AccommodationProperty(Base):
    __tablename__ = "khatu_accommodation_properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # "Dharamshala", "Hotel", "Guest House"
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance = Column(Float, nullable=False)  # distance from temple in km
    price_start = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    amenities = Column(JSONB, nullable=True)  # List of strings e.g. ["AC", "Wifi", "Restaurant"]
    image_url = Column(Text, nullable=True)
    policies = Column(JSONB, nullable=True)  # List of strings e.g. ["Check-in: 12 PM", "No alcohol"]
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rooms = relationship("AccommodationRoom", back_populates="property", cascade="all, delete-orphan")
    bookings = relationship("AccommodationBooking", back_populates="property", cascade="all, delete-orphan")


class AccommodationRoom(Base):
    __tablename__ = "khatu_accommodation_rooms"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("khatu_accommodation_properties.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # "Single Room", "Double Room", "Dormitory"
    category = Column(String(50), nullable=False)  # "AC", "Non-AC"
    base_price = Column(Float, nullable=False)
    total_rooms = Column(Integer, default=10)
    available_rooms = Column(Integer, default=10)

    property = relationship("AccommodationProperty", back_populates="rooms")


class AccommodationBooking(Base):
    __tablename__ = "khatu_accommodation_bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("khatu_users.id", ondelete="SET NULL"), nullable=True)
    property_id = Column(Integer, ForeignKey("khatu_accommodation_properties.id", ondelete="CASCADE"), nullable=False)
    room_type = Column(String(50), nullable=False)
    check_in = Column(DateTime(timezone=True), nullable=False)
    check_out = Column(DateTime(timezone=True), nullable=False)
    adults = Column(Integer, nullable=False, default=1)
    children = Column(Integer, nullable=False, default=0)
    seniors = Column(Integer, nullable=False, default=0)
    guest_details = Column(JSONB, nullable=True)  # JSON for personal info: name, email, phone, id_type, id_number
    pilgrimage_details = Column(JSONB, nullable=True)  # JSON for darshan_date, count, mode of transport
    emergency_contact = Column(JSONB, nullable=True)  # JSON for name, relation, phone
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="Confirmed")  # "Pending", "Confirmed", "Cancelled"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="accommodation_bookings")
    property = relationship("AccommodationProperty", back_populates="bookings")
