from pydantic import BaseModel

class TokenRes(BaseModel):
    """Response payload for authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenReq(BaseModel):
    """Request payload to refresh an access token."""
    refresh_token: str
