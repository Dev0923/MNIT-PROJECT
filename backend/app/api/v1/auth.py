from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from app.api.dependencies import get_auth_service, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import TokenRes, RefreshTokenReq
from app.core.security import decode_token
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenRes)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Authenticate user and return access & refresh tokens."""
    access_token, refresh_token = await auth_service.authenticate_user(
        email=form_data.username,
        password=form_data.password
    )
    return TokenRes(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=TokenRes)
async def refresh(
    req: RefreshTokenReq,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh an access token using a valid refresh token."""
    access_token, new_refresh_token = await auth_service.refresh_tokens(req.refresh_token)
    return TokenRes(access_token=access_token, refresh_token=new_refresh_token)

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
    # In a real scenario, we'd extract the token from the Request object or via a Depends(oauth2_scheme)
    # For now, we assume the client provides the refresh token to revoke it.
    req: RefreshTokenReq = None
):
    """Logout by revoking the refresh token."""
    if req:
        payload = decode_token(req.refresh_token, expected_type="refresh")
        jti = payload.get("jti")
        exp = payload.get("exp")
        await auth_service.revoke_token(jti, exp)
    return None
