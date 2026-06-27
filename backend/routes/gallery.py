from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.sql_models import GalleryItem, User
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import anyio
from datetime import datetime

from utils.jwt_handler import get_admin_user

router = APIRouter(prefix="/api/gallery", tags=["Gallery"])

# Use an absolute path so the directory is always correct regardless of CWD
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "gallery")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class GalleryItemResponse(BaseModel):
    id: int
    url: str
    title: str
    description: Optional[str] = None
    type: str
    category: Optional[str] = None
    photographer: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Public endpoint — list all gallery items
@router.get("", response_model=List[GalleryItemResponse])
async def get_gallery_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GalleryItem).order_by(GalleryItem.created_at.desc()))
    items = result.scalars().all()
    return items


# Admin endpoint — upload new gallery item
@router.post("", response_model=GalleryItemResponse, status_code=status.HTTP_201_CREATED)
async def upload_gallery_item(
    title: str = Form(...),
    type: str = Form(...),          # "photo" or "video"
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    photographer: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    if type not in ["photo", "video"]:
        raise HTTPException(status_code=400, detail="Type must be photo or video")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Read file content asynchronously, then write it
    contents = await file.read()
    async with await anyio.open_file(file_path, "wb") as buffer:
        await buffer.write(contents)

    item_url = f"/uploads/gallery/{unique_filename}"

    db_item = GalleryItem(
        title=title,
        type=type,
        description=description,
        category=category,
        photographer=photographer,
        url=item_url,
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


# Admin endpoint — edit an existing gallery item (title, description, optionally replace image)
@router.put("/{item_id}", response_model=GalleryItemResponse)
async def update_gallery_item(
    item_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    photographer: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    result = await db.execute(select(GalleryItem).filter(GalleryItem.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if title is not None:
        item.title = title

    # Allow description to be set to empty string (clear it) or a new value
    if description is not None:
        item.description = description if description.strip() else None

    if category is not None:
        item.category = category if category.strip() else None

    if photographer is not None:
        item.photographer = photographer if photographer.strip() else None

    # Replace file if a new one was provided
    if file and file.filename:
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        new_file_path = os.path.join(UPLOAD_DIR, new_filename)

        contents = await file.read()
        async with await anyio.open_file(new_file_path, "wb") as buffer:
            await buffer.write(contents)

        # Delete old file
        if item.url.startswith("/uploads/gallery/"):
            old_filename = item.url.split("/uploads/gallery/")[-1]
            old_file_path = os.path.join(UPLOAD_DIR, old_filename)
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        item.url = f"/uploads/gallery/{new_filename}"

    await db.commit()
    await db.refresh(item)
    return item


# Admin endpoint — delete a gallery item
@router.delete("/{item_id}")
async def delete_gallery_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
):
    result = await db.execute(select(GalleryItem).filter(GalleryItem.id == item_id))
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Try deleting the file using the absolute UPLOAD_DIR
    if item.url.startswith("/uploads/gallery/"):
        filename = item.url.split("/uploads/gallery/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    await db.delete(item)
    await db.commit()
    return {"message": "Item deleted successfully"}
