import enum

class VehicleType(str, enum.Enum):
    """Types of physical vehicles."""
    CAR = "CAR"
    BUS = "BUS"
    TRUCK = "TRUCK"
    AMBULANCE = "AMBULANCE"
    MOTORCYCLE = "MOTORCYCLE"
    OTHER = "OTHER"

class VehicleCategory(str, enum.Enum):
    """Functional categories for permission logic."""
    VIP = "VIP"
    EMERGENCY = "EMERGENCY"
    STAFF = "STAFF"
    VENDOR = "VENDOR"
    GENERAL = "GENERAL"

class PurposeCategory(str, enum.Enum):
    """Categorized purposes for vehicle entry permissions."""
    VIP = "VIP"
    EMERGENCY = "EMERGENCY"
    STAFF = "STAFF"
    VENDOR = "VENDOR"
    GENERAL = "GENERAL"
    GOVERNMENT = "GOVERNMENT"
    MEDIA = "MEDIA"
    OTHER = "OTHER"

class PermissionStatus(str, enum.Enum):
    """Lifecycle states of a permission request."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"

class ScanDirection(str, enum.Enum):
    """Direction of traffic flow during scan."""
    IN = "IN"
    OUT = "OUT"

class LogStatus(str, enum.Enum):
    """Status recorded upon a physical gate scan attempt."""
    SUCCESS = "SUCCESS"
    DENIED_EXPIRED = "DENIED_EXPIRED"
    DENIED_INVALID_GATE = "DENIED_INVALID_GATE"
    DENIED_REVOKED = "DENIED_REVOKED"
    DUPLICATE_SCAN = "DUPLICATE_SCAN"
    BLACKLISTED = "BLACKLISTED"
    OVERRIDE_GRANTED = "OVERRIDE_GRANTED"
