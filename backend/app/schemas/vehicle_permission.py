from pydantic import BaseModel, ConfigDict, Field, model_validator
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from app.models.enums import VehicleType, VehicleCategory, PermissionStatus, ScanDirection, LogStatus, PurposeCategory
from datetime import date, time

# --- Base Models ---

class VehicleBase(BaseModel):
    """Base fields for Vehicle."""
    license_plate: str = Field(..., max_length=20)
    vehicle_type: VehicleType
    vehicle_category: VehicleCategory
    owner_name: str = Field(..., max_length=255)
    contact_number: str = Field(..., max_length=15)

class PermissionBase(BaseModel):
    """Base fields for Permission."""
    vehicle_id: UUID
    purpose: str
    valid_from: datetime
    valid_until: datetime
    driver_name: Optional[str] = None
    driver_mobile_number: Optional[str] = None
    driver_license_number: Optional[str] = None
    license_valid_until: Optional[date] = None
    time_from: Optional[time] = None
    time_to: Optional[time] = None
    start_point: Optional[str] = None
    end_point: Optional[str] = None
    route_details: Optional[str] = None
    purpose_category: Optional[PurposeCategory] = None
    expected_occupants: Optional[int] = None
    organization_name: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_valid_until: Optional[date] = None
    admin_remarks: Optional[str] = None
    rc_url: Optional[str] = None
    dl_url: Optional[str] = None
    vehicle_photo_url: Optional[str] = None

class GateBase(BaseModel):
    """Base fields for Gate."""
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    max_vehicles_per_hour: int = Field(default=100, ge=1)

# --- Request Models ---

class VehicleCreateReq(VehicleBase):
    """Request payload to register a new vehicle."""
    pass

class VehicleBlacklistReq(BaseModel):
    """Request payload to blacklist a vehicle."""
    vehicle_id: UUID
    reason: str

class GateCreateReq(GateBase):
    """Request payload to create a new gate."""
    pass

class PermissionCreateReq(PermissionBase):
    """Request payload to submit a permission request."""
    allowed_gate_ids: List[UUID] = Field(..., min_length=1)
    
    @model_validator(mode='after')
    def check_dates(self) -> 'PermissionCreateReq':
        if self.valid_until <= self.valid_from:
            raise ValueError('valid_until must be strictly after valid_from')
        return self

class PermissionStatusUpdateReq(BaseModel):
    """Request payload to approve/reject a permission."""
    status: PermissionStatus
    remarks: Optional[str] = None

class ScanVerifyReq(BaseModel):
    """Request payload for a guard scanning a QR code."""
    qr_token: str
    gate_id: UUID
    direction: ScanDirection

class ScanOverrideReq(BaseModel):
    """Request payload for an admin/guard overriding a scan denial."""
    permission_id: UUID
    gate_id: UUID
    direction: ScanDirection
    override_reason: str

# --- Response Models ---

class GateRes(GateBase):
    """Response payload for a Gate."""
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class VehicleRes(VehicleBase):
    """Response payload for a Vehicle."""
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BlacklistedVehicleRes(BaseModel):
    """Response payload for a Blacklisted Vehicle."""
    id: UUID
    vehicle_id: UUID
    reason: str
    created_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PermissionRes(PermissionBase):
    """Response payload for a Permission."""
    id: UUID
    permission_code: str
    requester_id: UUID
    approved_by: Optional[UUID] = None
    status: PermissionStatus
    qr_token: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    vehicle: VehicleRes
    allowed_gates: List[GateRes]

    model_config = ConfigDict(from_attributes=True)

class ScanVerifyRes(BaseModel):
    """Response payload for a Scan Verification."""
    is_allowed: bool
    status: LogStatus
    vehicle_info: Optional[VehicleRes] = None
    message: str

class EntryLogRes(BaseModel):
    """Response payload for an Entry Log."""
    id: UUID
    permission_id: Optional[UUID] = None
    gate_id: UUID
    scanned_by: UUID
    scan_time: datetime
    direction: ScanDirection
    status: LogStatus
    remarks: Optional[str] = None
    override_by: Optional[UUID] = None
    override_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
