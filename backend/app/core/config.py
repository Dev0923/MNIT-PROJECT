import os
from dotenv import load_dotenv

# Explicitly load .env file so os.getenv can see it
load_dotenv()

class Settings:
    # In production, use pydantic_settings, but standard os.getenv is fine for the service layer logic.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-secret-do-not-use-in-prod")
    ALGORITHM: str = "HS256"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ksj_db")
    DB_CONNECT_ARGS: dict = {}

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # JWT Settings
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "ksj-auth-service")
    JWT_AUDIENCE: str = os.getenv("JWT_AUDIENCE", "ksj-api-clients")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    def __init__(self):
        from urllib.parse import urlparse, parse_qs, urlunparse
        url = self.DATABASE_URL
        if "sslmode" in url or "ssl" in url:
            parsed = urlparse(url)
            query_params = parse_qs(parsed.query)
            
            has_ssl = False
            if "sslmode" in query_params:
                if query_params["sslmode"][0] in ("require", "verify-ca", "verify-full", "prefer"):
                    has_ssl = True
            elif "ssl" in query_params:
                if query_params["ssl"][0] in ("require", "true", "verify-ca", "verify-full", "prefer"):
                    has_ssl = True
                    
            if has_ssl:
                self.DB_CONNECT_ARGS = {"ssl": True}
                
            # Rebuild URL without the parameters that asyncpg doesn't support
            clean_params = {
                k: v[0] for k, v in query_params.items()
                if k not in ("sslmode", "channel_binding", "ssl")
            }
            clean_query = "&".join(f"{k}={v}" for k, v in clean_params.items())
            
            new_parts = parsed._replace(query=clean_query)
            self.DATABASE_URL = urlunparse(new_parts)

settings = Settings()

def print_database_diagnostic():
    url = settings.DATABASE_URL
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        # Mask the password
        if parsed.password:
            port_str = f":{parsed.port}" if parsed.port is not None else ""
            masked_netloc = f"{parsed.username}:******@{parsed.hostname}{port_str}"
            masked_url = parsed._replace(netloc=masked_netloc).geturl()
        else:
            masked_url = url
        print(f"\n--- DIAGNOSTIC: Effective DATABASE_URL ---")
        print(f"{masked_url}")
        print(f"------------------------------------------\n")
    except Exception as e:
        print(f"\n--- DIAGNOSTIC ERROR ---")
        print(f"Failed to parse URL. Ensure there are no unescaped special characters like '@' or '#' in your password.")
        print(f"Error: {e}\n")

# Run diagnostic on startup/import
print_database_diagnostic()
