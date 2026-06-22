from app.db.base import Base
from app.models.enums import (
    VehicleType,
    VehicleCategory,
    PermissionStatus,
    ScanDirection,
    LogStatus
)
from app.models.user import User, UserRole
from app.models.vehicle_permission import (
    Vehicle,
    BlacklistedVehicle,
    Gate,
    Permission,
    permission_gates,
    EntryLog,
    AuditLog
)

# This __init__.py ensures that all models are imported before Alembic or SQLAlchemy
# attempts to read Base.metadata. Without this, tables will be silently ignored.
