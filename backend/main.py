from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Khatu Shyam Ji API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
