from uuid import UUID
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.vehicle_permission import Gate
from app.core.exceptions import ResourceNotFound

class GateService:
    """Service handling gate reads and operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_gates(self, skip: int = 0, limit: int = 100) -> List[Gate]:
        """List active gates with pagination."""
        stmt = select(Gate).where(Gate.is_active == True).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_gate(self, gate_id: UUID) -> Gate:
        """Get details of a specific gate."""
        stmt = select(Gate).where(Gate.id == gate_id)
        result = await self.session.execute(stmt)
        gate = result.scalar_one_or_none()
        if not gate:
            raise ResourceNotFound("Gate not found.")
        return gate
