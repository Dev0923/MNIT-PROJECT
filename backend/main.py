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
from routes.accommodation import router as accommodation_router
from routes.parking import router as parking_router
from routes.cameras import router as cameras_router
from camera.manager import CameraManager
from ai.service import AIService
from routes.inference import router as inference_router
from routes.video_analysis import router as video_analysis_router
from routes.gallery import router as gallery_router
from routes.gate import router as gate_router
from fastapi.staticfiles import StaticFiles
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create PostgreSQL tables on startup if they don't exist
    await init_db()
    
    # Initialize camera worker threads
    CameraManager().initialize()
    
    # Initialize AI density estimation service (loads LWCC Bay model once)
    AIService().initialize()
    
    yield
    
    # Shutdown AI sampling thread before stopping cameras
    AIService().shutdown()
    
    # Shutdown camera worker threads
    CameraManager().shutdown()



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
app.include_router(accommodation_router)

app.include_router(cameras_router)
app.include_router(inference_router)
app.include_router(video_analysis_router)
app.include_router(gallery_router)
app.include_router(gate_router)

# Mount general uploads directory (main branch)
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_UPLOADS_DIR = os.path.join(_BASE_DIR, "uploads")
os.makedirs(_UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_UPLOADS_DIR), name="uploads")

# Mount video analysis directory to serve processed static files (our branch)
os.makedirs(os.path.join("backend", "uploads", "video_analysis"), exist_ok=True)
app.mount(
    "/api/v1/video-analysis/static",
    StaticFiles(directory=os.path.join("backend", "uploads", "video_analysis")),
    name="video_analysis_static"
)

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

