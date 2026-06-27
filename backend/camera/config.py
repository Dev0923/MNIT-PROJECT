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


def _get_camera_config(camera_id: str, label: str, location: str) -> CameraConfig:
    source = os.getenv(f"CAMERA_{camera_id}_SOURCE")
    if source is not None:
        source = source.strip()
    return CameraConfig(
        id=camera_id,
        label=label,
        location=location,
        rtsp_url=os.getenv(f"CAMERA_{camera_id}_URL", ""),
        fallback_video_path=os.getenv(f"CAMERA_{camera_id}_FALLBACK", "") or None,
        use_simulator=_bool_env(f"CAMERA_{camera_id}_SIMULATOR", default=False),
        source=source,
    )


DEFAULT_CAMERAS: List[CameraConfig] = [
    _get_camera_config("C1", "Main Entrance (Singhdwar)", "Gate 1"),
    _get_camera_config("C2", "Garbhagriha Queue", "Inner"),
    _get_camera_config("C3", "Parikrama Path", "Outer"),
    _get_camera_config("C4", "Parking Area — Sector 4", "Parking"),
    _get_camera_config("C5", "Prasad Hall (Bhandara)", "Hall"),
    _get_camera_config("C6", "Temple Garden", "Garden"),
]
