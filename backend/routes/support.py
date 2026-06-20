"""
Routes for Help & Support Query submissions.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..models.support import SupportQueryRequest, SupportQueryResponse

router = APIRouter(prefix="/api/support", tags=["Support & Help"])


def format_support_doc(doc: dict) -> dict:
    """Helper to convert MongoDB fields to API response structure."""
    doc["_id"] = str(doc["_id"])
    return doc


@router.post("/query", response_model=SupportQueryResponse)
async def submit_support_query(request: SupportQueryRequest):
    """
    Submit a help/support contact form inquiry.
    """
    db = get_db()

    query_doc = {
        "name": request.name,
        "email": request.email,
        "subject": request.subject,
        "message": request.message,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.support_queries.insert_one(query_doc)
    query_doc["_id"] = result.inserted_id

    return SupportQueryResponse(**format_support_doc(query_doc))
