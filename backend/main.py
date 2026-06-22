from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.exceptions import register_exception_handlers
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.permissions import router as permissions_router
from app.api.v1.gates import router as gates_router
from app.api.v1.scan import router as scan_router

from .database import init_db
from .routes.bookings import router as bookings_router
from .routes.donations import router as donations_router
from .routes.support import router as support_router
from .routes.crowd import router as crowd_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create PostgreSQL tables on startup if they don't exist
    await init_db()
    yield


app = FastAPI(
    title="Khatu Shyam Ji API",
    version="1.0.0",
    debug=True,
    description="Backend API for Khatu Shyam Ji Temple Crowd Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(vehicles_router, prefix="/api/v1")
app.include_router(permissions_router, prefix="/api/v1")
app.include_router(gates_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")

# Register routers from incoming branch
app.include_router(bookings_router)
app.include_router(donations_router)
app.include_router(support_router)
app.include_router(crowd_router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/api/stack")
def stack() -> dict[str, list[str]]:
    return {
        "frontend": [
            "React",
            "Vite",
            "Tailwind CSS",
            "Leaflet",
            "React Leaflet",
            "Recharts",
            "Framer Motion",
            "Pannellum",
        ],
        "backend": ["FastAPI", "Uvicorn", "PostgreSQL", "SQLAlchemy", "asyncpg"],
    }
