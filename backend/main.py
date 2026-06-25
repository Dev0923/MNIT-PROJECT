from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes.bookings import router as bookings_router
from routes.donations import router as donations_router
from routes.support import router as support_router
from routes.crowd import router as crowd_router
from routes.bandhara import router as bandhara_router
from routes.alerts import router as alerts_router
from routes.vehicles import router as vehicles_router
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.lost_found import router as lost_found_router
from routes.general_permissions import router as general_permissions_router


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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ────────────────────────────────
app.include_router(auth_router)
app.include_router(bookings_router)
app.include_router(donations_router)
app.include_router(support_router)
app.include_router(crowd_router)
app.include_router(bandhara_router)
app.include_router(alerts_router)
app.include_router(vehicles_router)
app.include_router(admin_router)
app.include_router(lost_found_router)
app.include_router(general_permissions_router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

from fastapi import WebSocket
@app.websocket("/wstest")
async def wstest(ws: WebSocket):
    await ws.accept()
    await ws.send_text("Hello")

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

