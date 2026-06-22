from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.exceptions import register_exception_handlers
from app.api.v1.auth import router as auth_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.permissions import router as permissions_router
from app.api.v1.gates import router as gates_router
from app.api.v1.scan import router as scan_router

app = FastAPI(
    title="Khatu Shyam Ji API",
    version="1.0.0",
    debug=True
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
        "backend": ["FastAPI", "Uvicorn"],
    }
