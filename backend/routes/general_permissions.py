from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.sql_models import GeneralPermission, User
from utils.jwt_handler import get_current_user, get_optional_current_user
from utils.activity_logger import log_user_activity
from pydantic import BaseModel
from typing import List, Optional
import random
import os

router = APIRouter(prefix="/api/general-permissions", tags=["General Permissions"])

UPLOAD_DIR = "uploads/general_permissions"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class GeneralPermissionCreate(BaseModel):
    name: str
    type: str
    subtype: str
    purpose: str
    date: str

@router.post("/apply", status_code=status.HTTP_201_CREATED)
async def apply_general_permission(
    name: str = Form(...),
    type: str = Form(...),
    subtype: str = Form(...),
    purpose: str = Form(...),
    date: str = Form(...),
    registration_file: Optional[UploadFile] = File(None),
    doctor_id_file: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Handle files
    if registration_file:
        reg_filename = f"reg_{random.randint(1000, 9999)}_{registration_file.filename}"
        reg_path = os.path.join(UPLOAD_DIR, reg_filename)
        with open(reg_path, "wb") as f:
            f.write(await registration_file.read())
            
    if doctor_id_file:
        doc_filename = f"doc_{random.randint(1000, 9999)}_{doctor_id_file.filename}"
        doc_path = os.path.join(UPLOAD_DIR, doc_filename)
        with open(doc_path, "wb") as f:
            f.write(await doctor_id_file.read())

    # Generate a code
    prefix = "MED" if type.lower() == "medical" else "BAN" if type.lower() == "bandhara" else "OTH"
    permission_code = f"{prefix}{random.randint(100000, 999999)}"

    db_perm = GeneralPermission(
        permission_code=permission_code,
        name=name,
        type=type,
        subtype=subtype,
        purpose=purpose,
        date=date,
        status="pending",
        user_id=current_user.id if current_user else None
    )
    db.add(db_perm)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Permission",
            title=f"Applied for {type} Permission",
            description=f"Permission for {subtype} on {date}"
        )
        
    await db.commit()
    await db.refresh(db_perm)
    return db_perm

@router.get("/my-applications")
async def get_my_applications(
    type: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GeneralPermission)
    # If a regular devotee is requesting, only return their own permissions
    if current_user and not current_user.is_admin:
        stmt = stmt.where(GeneralPermission.user_id == current_user.id)
        
    if type:
        stmt = stmt.where(GeneralPermission.type == type)
    
    result = await db.execute(stmt)
    perms = result.scalars().all()
    return perms


@router.post("/applications/{permission_code}/cancel")
async def cancel_general_permission(
    permission_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel an applied general permission request (Bhandara camp, Medical camp, etc.).
    """
    result = await db.execute(
        select(GeneralPermission).where(GeneralPermission.permission_code == permission_code)
    )
    perm = result.scalar_one_or_none()
    if not perm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission request {permission_code} not found."
        )
    if perm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this application request."
        )
        
    perm.status = "cancelled"
    await db.commit()
    await db.refresh(perm)
    return {
        "success": True,
        "permission_code": perm.permission_code,
        "status": perm.status,
        "message": "Application request cancelled successfully."
    }
