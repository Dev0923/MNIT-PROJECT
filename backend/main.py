from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import connect_to_mongo, disconnect_from_mongo
from .routes.auth import router as auth_router
from .routes.bookings import router as bookings_router
from .routes.donations import router as donations_router
from .routes.support import router as support_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    await connect_to_mongo()
    yield
    await disconnect_from_mongo()


app = FastAPI(
    title="Khatu Shyam Ji API",
    version="1.0.0",
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

# Register routers
app.include_router(auth_router)
app.include_router(bookings_router)
app.include_router(donations_router)
app.include_router(support_router)



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
        "backend": ["FastAPI", "Uvicorn", "MongoDB", "Motor"],
    }
