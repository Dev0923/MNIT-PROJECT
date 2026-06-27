import logging
from sqlalchemy.ext.asyncio import AsyncSession
from models.sql_models import UserActivity

logger = logging.getLogger(__name__)

async def log_user_activity(
    db: AsyncSession,
    user_id: int,
    activity_type: str,
    title: str,
    description: str = None
) -> None:
    """
    Log a user activity (e.g. Darshan Booking, Donation, SOS) to the database.
    Does nothing if user_id is None.
    """
    if not user_id:
        return
        
    try:
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=description
        )
        db.add(activity)
        # Note: the caller should typically commit this transaction,
        # but if we want this to be robust even on failures, 
        # we might commit it separately or flush. 
        # Since it's usually called inside a route, the route's db.commit() handles it.
    except Exception as e:
        logger.error(f"Failed to log user activity: {e}")
