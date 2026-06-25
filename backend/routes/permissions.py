"""
Routes for Permissions (Bandhara, Medical, etc.) using PostgreSQL.
"""

from datetime import datetime, timezone
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.sql_models import GeneralPermission, User
from utils.jwt_handler import get_optional_current_user

router = APIRouter(prefix="/api/permissions", tags=["Permissions"])

class BandharaRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    subtype: str = Field(..., description="'Community' or 'Family'")
    purpose: str = Field(..., max_length=255)
    date: str = Field(..., description="Date string e.g. '21 Jun 2026'")

def generate_permission_code() -> str:
    ts = str(int(time.time() * 1000))[-6:]
    return f"BAN{ts}"

@router.post("/bandhara")
async def create_bandhara_permission(
    request: BandharaRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    code = None
    for _ in range(5):
        temp_id = generate_permission_code()
        result_exist = await db.execute(select(GeneralPermission).where(GeneralPermission.permission_code == temp_id))
        if not result_exist.scalar_one_or_none():
            code = temp_id
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique permission code."
        )

    perm = GeneralPermission(
        permission_code=code,
        name=request.name,
        type="Bandhara",
        subtype=request.subtype,
        purpose=request.purpose,
        date=request.date,
        status="pending",
        created_at=datetime.now(timezone.utc)
    )

    db.add(perm)
    await db.commit()
    await db.refresh(perm)

    return {
        "message": "Bandhara permission request submitted successfully",
        "permission_code": perm.permission_code
    }
