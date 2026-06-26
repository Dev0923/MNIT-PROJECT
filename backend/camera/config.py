import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from .models import CameraConfig

# Explicitly load backend/.env so os.getenv() can read CAMERA_* variables.
# pydantic-settings handles this automatically for the main Settings object,
# but camera/config.py uses os.getenv() directly and needs this call.
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=False)


def _bool_env(var: str, default: bool = False) -> bool:
    """Read a boolean environment variable. Accepts 'true', '1', 'yes' (case-insensitive)."""
    val = os.getenv(var, "").strip().lower()
    if val in ("true", "1", "yes"):
        return True
    if val in ("false", "0", "no"):
        return False
    return default

DEFAULT_CAMERAS: List[CameraConfig] = [
    CameraConfig(
        id="C1",
        label="Main Entrance (Singhdwar)",
        location="Gate 1",
        rtsp_url=os.getenv("CAMERA_C1_URL", "rtsp://localhost:8554/live1"),
        fallback_video_path=os.getenv("CAMERA_C1_FALLBACK", "") or None,
        use_simulator=_bool_env("CAMERA_C1_SIMULATOR", default=False),
    ),
    CameraConfig(
        id="C2",
        label="Garbhagriha Queue",
        location="Inner",
        rtsp_url=os.getenv("CAMERA_C2_URL", "rtsp://localhost:8554/live2"),
        fallback_video_path=os.getenv("CAMERA_C2_FALLBACK", "") or None,
        use_simulator=_bool_env("CAMERA_C2_SIMULATOR", default=False),
    ),
    CameraConfig(
        id="C3",
        label="Parikrama Path",
        location="Outer",
        rtsp_url=os.getenv("CAMERA_C3_URL", "rtsp://localhost:8554/live3"),
        fallback_video_path=os.getenv("CAMERA_C3_FALLBACK", "") or None,
        use_simulator=_bool_env("CAMERA_C3_SIMULATOR", default=False),
    ),
    CameraConfig(
        id="C4",
        label="Parking Area — Sector 4",
        location="Parking",
        rtsp_url=os.getenv("CAMERA_C4_URL", "rtsp://localhost:8554/live4"),
        fallback_video_path=os.getenv("CAMERA_C4_FALLBACK", "") or None,
        use_simulator=_bool_env("CAMERA_C4_SIMULATOR", default=False),
    ),
    CameraConfig(
        id="C5",
        label="Prasad Hall (Bhandara)",
        location="Hall",
        rtsp_url=os.getenv("CAMERA_C5_URL", "rtsp://localhost:8554/live5"),
        fallback_video_path=os.getenv("CAMERA_C5_FALLBACK", "") or None,
        use_simulator=_bool_env("CAMERA_C5_SIMULATOR", default=False),
    ),
    CameraConfig(
        id="C6",
        label="Temple Garden",
        location="Garden",
        rtsp_url=os.getenv("CAMERA_C6_URL", "rtsp://localhost:8554/live6"),
        fallback_video_path=os.getenv("CAMERA_C6_FALLBACK", "") or None,
        use_simulator=_bool_env("CAMERA_C6_SIMULATOR", default=False),
    ),
]
