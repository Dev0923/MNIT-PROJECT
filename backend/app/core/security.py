import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from app.core.config import settings
from app.core.exceptions import AppError

class AuthenticationError(AppError):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, code="AUTH_ERROR")

# A pre-computed valid bcrypt hash used to prevent user enumeration timing attacks
DUMMY_PASSWORD_HASH = "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except ValueError:
        return False

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a password."""
    # bcrypt requires bytes, and returns bytes. We decode to store as a string.
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: str, jti: str, additional_claims: Dict[str, Any] = None) -> str:
    """Create a short-lived access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "type": "access",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    if additional_claims:
        to_encode.update(additional_claims)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: str, jti: str) -> str:
    """Create a long-lived refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "type": "refresh",
        "jti": jti,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str, expected_type: str = "access") -> Dict[str, Any]:
    """
    Decode and validate a JWT. 
    Verifies signature, expiration, issuer, audience, and exact token type.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE
        )
        if payload.get("type") != expected_type:
            raise AuthenticationError("Invalid token type.")
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired.")
    except jwt.InvalidIssuerError:
        raise AuthenticationError("Invalid token issuer.")
    except jwt.InvalidAudienceError:
        raise AuthenticationError("Invalid token audience.")
    except jwt.PyJWTError:
        raise AuthenticationError("Could not validate credentials.")
