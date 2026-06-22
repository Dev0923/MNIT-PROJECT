import logging
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.vehicle_permission import Vehicle, BlacklistedVehicle
from app.schemas.vehicle_permission import VehicleCreateReq, VehicleBlacklistReq
from app.core.exceptions import DuplicateResource, ResourceNotFound
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class VehicleService:
    """Service handling vehicle registration and blacklisting."""

    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.session = session
        self.audit_service = audit_service

    async def register_vehicle(self, user_id: UUID, req: VehicleCreateReq) -> Vehicle:
        """Register a new vehicle."""
        vehicle = Vehicle(
            user_id=user_id,
            license_plate=req.license_plate.upper().replace(" ", ""),
            vehicle_type=req.vehicle_type,
            vehicle_category=req.vehicle_category,
            owner_name=req.owner_name,
            contact_number=req.contact_number
        )
        self.session.add(vehicle)
        try:
            await self.session.commit()
            await self.session.refresh(vehicle)
            logger.info(f"Vehicle registered: {vehicle.license_plate} by {user_id}")
            return vehicle
        except IntegrityError:
            await self.session.rollback()
            raise DuplicateResource(f"Vehicle with license plate {req.license_plate} already exists.")

    async def get_vehicle(self, vehicle_id: UUID) -> Vehicle:
        stmt = select(Vehicle).where(Vehicle.id == vehicle_id)
        result = await self.session.execute(stmt)
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise ResourceNotFound("Vehicle not found.")
        return vehicle

    async def list_vehicles(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Vehicle]:
        """List vehicles owned by a specific user with pagination."""
        stmt = select(Vehicle).where(Vehicle.user_id == user_id).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def add_to_blacklist(self, admin_id: UUID, req: VehicleBlacklistReq) -> BlacklistedVehicle:
        """Blacklist a vehicle, preventing future permissions."""
        vehicle = await self.get_vehicle(req.vehicle_id)
        
        bl_entry = BlacklistedVehicle(
            vehicle_id=vehicle.id,
            reason=req.reason,
            created_by=admin_id
        )
        self.session.add(bl_entry)
        
        try:
            await self.session.flush()
            await self.audit_service.record_action(
                user_id=admin_id,
                action="BLACKLIST_VEHICLE",
                entity_type="Vehicle",
                entity_id=vehicle.id,
                new_state={"reason": req.reason}
            )
            await self.session.commit()
            return bl_entry
        except IntegrityError:
            await self.session.rollback()
            raise DuplicateResource("Vehicle is already blacklisted.")

    async def is_blacklisted(self, vehicle_id: UUID) -> bool:
        stmt = select(BlacklistedVehicle).where(BlacklistedVehicle.vehicle_id == vehicle_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def remove_blacklist(self, admin_id: UUID, vehicle_id: UUID):
        """Remove a vehicle from the blacklist."""
        stmt = select(BlacklistedVehicle).where(BlacklistedVehicle.vehicle_id == vehicle_id)
        result = await self.session.execute(stmt)
        bl_entry = result.scalar_one_or_none()
        if not bl_entry:
            raise ResourceNotFound("Vehicle is not blacklisted.")
        
        await self.session.delete(bl_entry)
        await self.audit_service.record_action(
            user_id=admin_id,
            action="REMOVE_BLACKLIST",
            entity_type="Vehicle",
            entity_id=vehicle_id
        )
        await self.session.commit()
