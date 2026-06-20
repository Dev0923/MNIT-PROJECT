"""
Authentication API routes — OTP-based login.
"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
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
async def send_otp(request: SendOTPRequest):
    """
    Send OTP to the given phone number or email.
    In mock mode, OTP is always '123456' and printed in server console.
    """
    try:
        otp_code = await generate_and_store_otp(request.identifier)
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
async def verify_otp_endpoint(request: VerifyOTPRequest):
    """
    Verify OTP and return JWT token.
    Only allows logging in existing registered users.
    """
    is_valid = await verify_otp(request.identifier, request.otp)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP. Please request a new one.",
        )

    db = get_db()
    id_type = get_identifier_type(request.identifier)
    now = datetime.now(timezone.utc)

    # Find existing user
    query = {id_type: request.identifier}
    user = await db.users.find_one(query)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This phone or email is not registered. Please sign up first.",
        )

    # Returning user — update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": now}},
    )
    user["last_login"] = now
    print(f"👤 User logged in via OTP: {request.identifier}")

    # Generate JWT token
    token = create_access_token(str(user["_id"]))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user["_id"]),
            phone=user.get("phone"),
            email=user.get("email"),
            name=user.get("name"),
            created_at=user["created_at"],
            last_login=user.get("last_login"),
        ),
    )


@router.post("/register", response_model=TokenResponse)
async def register_devotee(request: RegisterRequest):
    """
    Self-register a new devotee. Verifies the OTP sent to their phone first.
    """
    # 1. Verify OTP first
    is_valid = await verify_otp(request.phone, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired registration OTP. Please request a new one."
        )

    db = get_db()
    now = datetime.now(timezone.utc)

    # 2. Check if phone is already registered
    existing_phone = await db.users.find_one({"phone": request.phone})
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A devotee with this phone number is already registered."
        )

    # 3. Check if email is already registered (if provided)
    if request.email:
        existing_email = await db.users.find_one({"email": request.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A devotee with this email address is already registered."
            )

    # 4. Hash the password
    hashed_pwd = hash_password(request.password)

    # 5. Insert new user
    user_doc = {
        "name": request.name,
        "phone": request.phone,
        "email": request.email if request.email else None,
        "password_hash": hashed_pwd,
        "receive_updates": request.receive_updates,
        "created_at": now,
        "last_login": now,
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # 6. Generate access token
    token = create_access_token(str(user_doc["_id"]))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user_doc["_id"]),
            phone=user_doc["phone"],
            email=user_doc.get("email"),
            name=user_doc.get("name"),
            created_at=user_doc["created_at"],
            last_login=user_doc["last_login"],
        )
    )


@router.post("/login-password", response_model=TokenResponse)
async def login_password(request: LoginPasswordRequest):
    """
    Log in a devotee using their registered phone number or email, and password.
    """
    db = get_db()
    id_type = get_identifier_type(request.identifier)
    
    # Find user by phone or email
    user = await db.users.find_one({id_type: request.identifier})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone/email or password."
        )

    # Check if user has a password set (some older users might have only checked via OTP)
    if "password_hash" not in user or not user["password_hash"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account doesn't have a password set. Please log in with OTP instead."
        )

    # Verify password hash
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone/email or password."
        )

    # Update last login
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": now}}
    )
    user["last_login"] = now

    token = create_access_token(str(user["_id"]))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=str(user["_id"]),
            phone=user.get("phone"),
            email=user.get("email"),
            name=user.get("name"),
            created_at=user["created_at"],
            last_login=user["last_login"],
        )
    )



@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    Requires valid JWT in Authorization header.
    """
    return UserResponse(
        id=str(current_user["_id"]),
        phone=current_user.get("phone"),
        email=current_user.get("email"),
        name=current_user.get("name"),
        created_at=current_user["created_at"],
        last_login=current_user.get("last_login"),
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
