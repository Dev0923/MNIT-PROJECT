"""
Routes for Help & Support Query submissions using PostgreSQL.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.sql_models import SupportQuery
from models.support import SupportQueryRequest, SupportQueryResponse

router = APIRouter(prefix="/api/support", tags=["Support & Help"])


def format_support_doc(s: SupportQuery) -> dict:
    """Helper to convert SQL fields to API response structure."""
    return {
        "_id": str(s.id),
        "name": s.name,
        "email": s.email,
        "subject": s.subject,
        "message": s.message,
        "created_at": s.created_at,
    }


@router.post("/query", response_model=SupportQueryResponse)
async def submit_support_query(
    request: SupportQueryRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a help/support contact form inquiry.
    """
    query_doc = SupportQuery(
        name=request.name,
        email=request.email,
        subject=request.subject,
        message=request.message,
        created_at=datetime.now(timezone.utc)
    )

    db.add(query_doc)
    await db.commit()
    await db.refresh(query_doc)

    return SupportQueryResponse(**format_support_doc(query_doc))
