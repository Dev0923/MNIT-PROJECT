from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from uuid import UUID
from app.api.dependencies import get_vehicle_service, get_current_user, require_admin, get_db_session
from app.services.vehicle_service import VehicleService
from app.schemas.vehicle_permission import VehicleCreateReq, VehicleRes, VehicleBlacklistReq, BlacklistedVehicleRes
from app.models.user import User

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.post("/", response_model=VehicleRes, status_code=status.HTTP_201_CREATED)
async def register_vehicle(
    req: VehicleCreateReq,
    current_user: User = Depends(get_current_user),
    vehicle_service: VehicleService = Depends(get_vehicle_service)
):
    """Register a new vehicle for the current user."""
    return await vehicle_service.register_vehicle(current_user.id, req)

from fastapi import APIRouter, Depends, status, Query

@router.get("/", response_model=List[VehicleRes])
async def list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    vehicle_service: VehicleService = Depends(get_vehicle_service)
):
    """List all vehicles owned by the current user."""
    return await vehicle_service.list_vehicles(current_user.id, skip, limit)

@router.post("/blacklist", response_model=BlacklistedVehicleRes, dependencies=[Depends(require_admin)])
async def blacklist_vehicle(
    req: VehicleBlacklistReq,
    current_user: User = Depends(get_current_user),
    vehicle_service: VehicleService = Depends(get_vehicle_service)
):
    """Blacklist a vehicle from future permissions (Admin only)."""
    return await vehicle_service.add_to_blacklist(current_user.id, req)

@router.delete("/blacklist/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def remove_blacklist(
    vehicle_id: UUID,
    current_user: User = Depends(get_current_user),
    vehicle_service: VehicleService = Depends(get_vehicle_service)
):
    """Remove a vehicle from the blacklist (Admin only)."""
    await vehicle_service.remove_blacklist(current_user.id, vehicle_id)
    return None
