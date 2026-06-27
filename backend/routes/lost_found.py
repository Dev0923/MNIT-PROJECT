from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.sql_models import LostItem, FoundItem, LostPerson, User
from utils.jwt_handler import get_optional_current_user
from utils.activity_logger import log_user_activity
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/lost-found", tags=["Lost & Found"])

# Pydantic models for incoming data
class LostItemCreate(BaseModel):
    category: str
    date_lost: datetime
    location: str
    description: Optional[str] = None
    contact_name: str
    contact_phone: str
    photo_url: Optional[str] = None
    user_id: Optional[int] = None

class FoundItemCreate(BaseModel):
    category: str
    date_found: datetime
    location_found: str
    storage_location: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None

class LostPersonCreate(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    clothes_description: Optional[str] = None
    last_seen_location: str
    last_seen_time: datetime
    contact_name: str
    contact_phone: str
    photo_url: Optional[str] = None
    user_id: Optional[int] = None

@router.post("/lost-item", status_code=status.HTTP_201_CREATED)
async def create_lost_item(
    item: LostItemCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = item.dict()
    if current_user and not data.get("user_id"):
        data["user_id"] = current_user.id
    db_item = LostItem(**data)
    db.add(db_item)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Lost Item",
            title="Reported a Lost Item",
            description=f"{data['category']} at {data['location']}"
        )
        
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.post("/found-item", status_code=status.HTTP_201_CREATED)
async def create_found_item(item: FoundItemCreate, db: Session = Depends(get_db)):
    # In a real app, verify admin here
    db_item = FoundItem(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/lost-person", status_code=status.HTTP_201_CREATED)
async def create_lost_person(
    person: LostPersonCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    data = person.dict()
    if current_user and not data.get("user_id"):
        data["user_id"] = current_user.id
    db_person = LostPerson(**data)
    db.add(db_person)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Lost Person",
            title="Reported a Missing Person",
            description=f"Name: {data['name']}"
        )
        
    await db.commit()
    await db.refresh(db_person)
    return db_person

@router.get("/found-items")
async def get_found_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FoundItem).where(FoundItem.status == "In Storage"))
    return result.scalars().all()

@router.put("/claim/{id}")
async def claim_found_item(id: int, claim_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FoundItem).where(FoundItem.id == id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.status = "Claimed"
    item.claim_id = claim_id
    await db.commit()
    return {"message": "Item claimed successfully"}

@router.get("/lost-items")
async def get_lost_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LostItem).order_by(LostItem.created_at.desc()))
    return result.scalars().all()

@router.get("/admin/items")
async def get_all_items(db: AsyncSession = Depends(get_db)):
    lost_items = (await db.execute(select(LostItem))).scalars().all()
    found_items = (await db.execute(select(FoundItem))).scalars().all()
    lost_persons = (await db.execute(select(LostPerson))).scalars().all()
    return {
        "lost_items": lost_items,
        "found_items": found_items,
        "lost_persons": lost_persons
    }

@router.post("/notify/{lost_item_id}")
async def notify_user(lost_item_id: int, db: Session = Depends(get_db)):
    item = db.query(LostItem).filter(LostItem.id == lost_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Lost item not found")
    
    # Stub notification logic
    # In reality, we'd use Twilio/Gupshup etc to send SMS/WhatsApp to item.contact_phone
    print(f"Simulating notification sent to {item.contact_phone} for item {item.category}")
    
    item.status = "Found"
    db.commit()
    
    return {"message": f"Notification sent to {item.contact_phone}"}
