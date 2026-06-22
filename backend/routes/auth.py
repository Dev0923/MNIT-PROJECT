"""
Authentication API routes — OTP-based login using PostgreSQL.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..database import get_db
from ..models.sql_models import User
from ..models.user import (
    SendOTPRequest,
    VerifyOTPRequest,
    RegisterRequest,
    LoginPasswordRequest,
    MessageResponse,
    TokenResponse,
    UserResponse,
    get_identifier_type,
)
from ..services.otp_service import generate_and_store_otp, verify_otp
from ..utils.jwt_handler import create_access_token, get_current_user
from ..utils.password_handler import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(request: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Send OTP to the given phone number or email.
    In mock mode, OTP is always '123456' and printed in server console.
    """
    try:
        otp_code = await generate_and_store_otp(db, request.identifier)
        id_type = get_identifier_type(request.identifier)

        return MessageResponse(
            success=True,
            message=f"OTP sent to your {id_type}. Please check and enter the 6-digit code.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
            if "Too many" in str(e)
            else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify OTP and return JWT token.
    Only allows logging in existing registered users.
    """
    is_valid = await verify_otp(db, request.identifier, request.otp)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Please request a new one.",
        )

    id_type = get_identifier_type(request.identifier)
    now = datetime.now(timezone.utc)

    # Find existing user
    if id_type == "email":
        result = await db.execute(select(User).where(User.email == request.identifier))
    else:
        result = await db.execute(select(User).where(User.phone == request.identifier))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This phone or email is not registered. Please sign up first.",
        )

    # Returning user — update last login
    user.last_login = now
    await db.commit()
    await db.refresh(user)
    print(f"[AUTH] User logged in via OTP: {request.identifier}")

    # Generate JWT token
    token = create_access_token(str(user.id))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            phone=user.phone,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
            last_login=user.last_login,
        ),
    )


@router.post("/register", response_model=TokenResponse)
async def register_devotee(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Self-register a new devotee. Verifies the OTP sent to their phone first.
    """
    # 1. Verify OTP first
    is_valid = await verify_otp(db, request.phone, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired registration OTP. Please request a new one."
        )

    now = datetime.now(timezone.utc)

    # 2. Check if phone is already registered
    result_phone = await db.execute(select(User).where(User.phone == request.phone))
    existing_phone = result_phone.scalar_one_or_none()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A devotee with this phone number is already registered."
        )

    # 3. Check if email is already registered (if provided)
    if request.email:
        result_email = await db.execute(select(User).where(User.email == request.email))
        existing_email = result_email.scalar_one_or_none()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A devotee with this email address is already registered."
            )

    # 4. Hash the password
    hashed_pwd = hash_password(request.password)

    # 5. Insert new user
    user_doc = User(
        name=request.name,
        phone=request.phone,
        email=request.email if request.email else None,
        password_hash=hashed_pwd,
        receive_updates=request.receive_updates,
        created_at=now,
        last_login=now,
    )
    db.add(user_doc)
    await db.commit()
    await db.refresh(user_doc)

    # 6. Generate access token
    token = create_access_token(str(user_doc.id))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user_doc.id),
            phone=user_doc.phone,
            email=user_doc.email,
            name=user_doc.name,
            created_at=user_doc.created_at,
            last_login=user_doc.last_login,
        )
    )


@router.post("/login-password", response_model=TokenResponse)
async def login_password(request: LoginPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Log in a devotee using their registered phone number or email, and password.
    """
    id_type = get_identifier_type(request.identifier)
    
    # Find user by phone or email
    if id_type == "email":
        result = await db.execute(select(User).where(User.email == request.identifier))
    else:
        result = await db.execute(select(User).where(User.phone == request.identifier))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone/email or password."
        )

    # Check if user has a password set
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account doesn't have a password set. Please log in with OTP instead."
        )

    # Verify password hash
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone/email or password."
        )

    # Update last login
    now = datetime.now(timezone.utc)
    user.last_login = now
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user.id),
            phone=user.phone,
            email=user.email,
            name=user.name,
            created_at=user.created_at,
            last_login=user.last_login,
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    Requires valid JWT in Authorization header.
    """
    return UserResponse(
        id=str(current_user.id),
        phone=current_user.phone,
        email=current_user.email,
        name=current_user.name,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Logout endpoint. Since we use stateless JWT, the client simply
    discards the token. This endpoint confirms the action.
    """
    return MessageResponse(
        success=True,
        message="Logged out successfully. Please discard your token.",
    )
