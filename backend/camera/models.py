from pydantic import BaseModel
from typing import Optional

class CameraConfig(BaseModel):
    id: str
    label: str
    location: str
    rtsp_url: str
    fallback_video_path: Optional[str] = None
    # When True, skips RTSP entirely and runs the synthetic test generator.
    # Set this explicitly via env var (CAMERA_C1_SIMULATOR=true) during development.
    # Default is False — always attempt RTSP in production.
    use_simulator: bool = False
    source: Optional[str] = None

class CameraState(BaseModel):
    id: str
    status: str  # "connecting", "online", "offline", "error"
    fps: float
    frame_count: int
    last_update: float
