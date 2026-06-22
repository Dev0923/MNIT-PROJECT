from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from app.api.dependencies import get_current_user, get_gate_service
from app.schemas.vehicle_permission import GateRes
from app.services.gate_service import GateService
from app.models.user import User

router = APIRouter(prefix="/gates", tags=["Gates"])

from fastapi import APIRouter, Depends, HTTPException, Query

@router.get("/", response_model=List[GateRes])
async def list_gates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    gate_service: GateService = Depends(get_gate_service)
):
    """List all available gates."""
    return await gate_service.list_gates(skip, limit)

@router.get("/{gate_id}", response_model=GateRes)
async def get_gate(
    gate_id: UUID,
    current_user: User = Depends(get_current_user),
    gate_service: GateService = Depends(get_gate_service)
):
    """Get details of a specific gate."""
    return await gate_service.get_gate(gate_id)
