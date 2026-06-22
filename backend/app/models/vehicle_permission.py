import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Date, Time, Text, ForeignKey, Integer, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID, JSON as JSONB
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.enums import VehicleType, VehicleCategory, PermissionStatus, ScanDirection, LogStatus, PurposeCategory
from datetime import date, time

# Association table for permission <-> gates
# Note: The composite primary key (permission_id, gate_id) automatically
# enforces uniqueness. It is impossible to insert duplicate gate assignments
# for the same permission.
permission_gates = Table(
    "permission_gates",
    Base.metadata,
    Column("permission_id", UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    Column("gate_id", UUID(as_uuid=True), ForeignKey("gates.id", ondelete="CASCADE"), primary_key=True),
)

class Vehicle(Base):
    """Represents a registered vehicle in the system."""
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    license_plate: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    vehicle_type: Mapped[VehicleType]
    vehicle_category: Mapped[VehicleCategory]
    owner_name: Mapped[str] = mapped_column(String(255))
    contact_number: Mapped[str] = mapped_column(String(15))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # onupdate=func.now() triggers SQLAlchemy to emit the timestamp during Python UPDATE calls.
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (lazy="selectin" prevents async lazy loading errors during serialization)
    permissions: Mapped[list["Permission"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan", lazy="selectin")
    blacklist_entry: Mapped["BlacklistedVehicle"] = relationship(back_populates="vehicle", uselist=False, cascade="all, delete-orphan", lazy="selectin")


class BlacklistedVehicle(Base):
    """Tracks vehicles that are blacklisted from entry."""
    __tablename__ = "blacklisted_vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), unique=True)
    reason: Mapped[str] = mapped_column(Text)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship(back_populates="blacklist_entry")


class Gate(Base):
    """Represents physical gates at the temple."""
    __tablename__ = "gates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    max_vehicles_per_hour: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Permission(Base):
    """Represents a vehicle entry permission request and grant."""
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    permission_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    requester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status: Mapped[PermissionStatus] = mapped_column(default=PermissionStatus.PENDING, index=True)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    qr_token: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    purpose: Mapped[str] = mapped_column(Text)
    
    # Driver Information
    driver_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    driver_mobile_number: Mapped[str | None] = mapped_column(String(15), nullable=True)
    driver_license_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    license_valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Permission Duration Ext.
    time_from: Mapped[time | None] = mapped_column(Time, nullable=True)
    time_to: Mapped[time | None] = mapped_column(Time, nullable=True)

    # Route Information
    start_point: Mapped[str | None] = mapped_column(String(255), nullable=True)
    end_point: Mapped[str | None] = mapped_column(String(255), nullable=True)
    route_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Purpose Enhancements
    purpose_category: Mapped[PurposeCategory | None] = mapped_column(nullable=True)

    # Operational Information
    expected_occupants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    organization_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_number: Mapped[str | None] = mapped_column(String(15), nullable=True)

    # Insurance Information
    insurance_policy_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insurance_valid_until: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Admin Info
    admin_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Document Uploads (S3/Local URLs)
    rc_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    dl_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    vehicle_photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (lazy="selectin" to avoid MissingGreenletError)
    vehicle: Mapped["Vehicle"] = relationship(back_populates="permissions", lazy="selectin")
    allowed_gates: Mapped[list["Gate"]] = relationship(secondary=permission_gates, lazy="selectin")
    entry_logs: Mapped[list["EntryLog"]] = relationship(back_populates="permission")


class EntryLog(Base):
    """Tracks physical gate scans and overrides."""
    __tablename__ = "entry_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    permission_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="SET NULL"), index=True, nullable=True)
    gate_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("gates.id", ondelete="CASCADE"), index=True)
    scanned_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    scan_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    direction: Mapped[ScanDirection]
    status: Mapped[LogStatus]
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    override_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    override_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    permission: Mapped["Permission"] = relationship(back_populates="entry_logs")


class AuditLog(Base):
    """Tracks state changes and sensitive actions for auditing."""
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    entity_type: Mapped[str] = mapped_column(String(100), index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    old_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
