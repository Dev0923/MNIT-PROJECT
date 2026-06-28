"""
AI Vehicle Detection Service for Parking Lots.
Uses YOLOv8 (ultralytics) to count vehicles in an image or video frame.
Falls back to a realistic simulation if the model is unavailable.
"""

import logging
import random
import time
from pathlib import Path
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

# ── YOLO model (loaded once at startup) ──────────────────────────────────────
_yolo_model = None
_model_load_attempted = False

VEHICLE_CLASSES = {
    "car", "truck", "bus", "motorcycle", "bicycle",
    "motorbike", "van", "vehicle"
}

# YOLO class IDs that correspond to vehicles in COCO dataset
YOLO_VEHICLE_CLASS_IDS = {2, 3, 5, 7}  # car=2, motorcycle=3, bus=5, truck=7


def _load_yolo_model():
    """Attempt to load the YOLOv8n model once."""
    global _yolo_model, _model_load_attempted
    if _model_load_attempted:
        return _yolo_model
    _model_load_attempted = True
    try:
        from ultralytics import YOLO  # type: ignore
        model_path = Path(__file__).parent.parent / "yolov8n.pt"
        if not model_path.exists():
            logger.info("Downloading YOLOv8n weights (~6 MB)…")
        _yolo_model = YOLO(str(model_path) if model_path.exists() else "yolov8n.pt")
        # Warm up
        logger.info("YOLOv8n model loaded successfully.")
    except Exception as exc:
        logger.warning(f"Could not load YOLO model: {exc}. Will use simulation fallback.")
        _yolo_model = None
    return _yolo_model


def _simulate_detection(total_slots: int, lot_id: int) -> dict:
    """
    Simulate realistic parking detection when the YOLO model is unavailable.
    Uses time-of-day patterns: more vehicles during peak pilgrimage hours.
    """
    import datetime
    hour = datetime.datetime.now().hour
    # Peak hours: 6–9 AM and 4–8 PM
    if 6 <= hour <= 9 or 16 <= hour <= 20:
        occupancy_ratio = random.uniform(0.65, 0.95)
    elif 10 <= hour <= 15:
        occupancy_ratio = random.uniform(0.40, 0.70)
    else:
        occupancy_ratio = random.uniform(0.10, 0.35)

    occupied = int(total_slots * occupancy_ratio)
    available = total_slots - occupied
    confidence = round(random.uniform(0.78, 0.96), 3)

    # Generate mock bounding boxes
    boxes = [
        {
            "x1": random.randint(0, 800),
            "y1": random.randint(0, 600),
            "x2": random.randint(50, 900),
            "y2": random.randint(50, 650),
            "confidence": round(random.uniform(0.6, 0.99), 3),
            "class": "car",
        }
        for _ in range(occupied)
    ]
    return {
        "occupied_slots": occupied,
        "available_slots": available,
        "confidence_score": confidence,
        "vehicle_boxes": boxes,
        "source": "simulation",
    }


async def fetch_frame_from_youtube(youtube_url: str) -> Optional[bytes]:
    """
    Fetch a thumbnail from YouTube to use as a proxy frame for analysis.
    Extracts video ID and uses YouTube's thumbnail API.
    """
    try:
        import re
        match = re.search(r"(?:v=|youtu\.be/|embed/|v/|shorts/)([A-Za-z0-9_-]{11})", youtube_url)
        if not match:
            return None
        video_id = match.group(1)
        thumb_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(thumb_url)
            if resp.status_code == 200:
                return resp.content
        return None
    except Exception as exc:
        logger.warning(f"Could not fetch YouTube thumbnail: {exc}")
        return None


async def detect_vehicles_in_frame(
    image_bytes: bytes,
    total_slots: int,
    lot_id: int,
) -> dict:
    """
    Run YOLOv8 vehicle detection on raw image bytes.
    Returns detection dict with occupied_slots, available_slots, confidence_score, vehicle_boxes.
    """
    model = _load_yolo_model()
    if model is None:
        return _simulate_detection(total_slots, lot_id)

    try:
        import numpy as np
        import cv2  # type: ignore

        # Decode image bytes → OpenCV frame
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return _simulate_detection(total_slots, lot_id)

        results = model(frame, verbose=False)[0]
        boxes = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id in YOLO_VEHICLE_CLASS_IDS:
                conf = float(box.conf[0])
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                boxes.append({
                    "x1": round(x1), "y1": round(y1),
                    "x2": round(x2), "y2": round(y2),
                    "confidence": round(conf, 3),
                    "class": results.names[cls_id],
                })

        occupied = min(len(boxes), total_slots)
        available = max(0, total_slots - occupied)
        avg_conf = (
            round(sum(b["confidence"] for b in boxes) / len(boxes), 3)
            if boxes else 0.0
        )

        return {
            "occupied_slots": occupied,
            "available_slots": available,
            "confidence_score": avg_conf,
            "vehicle_boxes": boxes,
            "source": "yolo",
        }
    except Exception as exc:
        logger.error(f"YOLO detection failed: {exc}. Using simulation.")
        return _simulate_detection(total_slots, lot_id)


async def analyze_parking_lot(
    camera_url: Optional[str],
    total_slots: int,
    lot_id: int,
) -> dict:
    """
    Main entry point: fetch a frame from the camera and run vehicle detection.
    Supports YouTube URLs, HTTP image URLs, and falls back to simulation.
    """
    image_bytes: Optional[bytes] = None

    if camera_url:
        if "youtube.com" in camera_url or "youtu.be" in camera_url:
            image_bytes = await fetch_frame_from_youtube(camera_url)
        else:
            # Try direct HTTP image/frame fetch
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(camera_url)
                    if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                        image_bytes = resp.content
            except Exception as exc:
                logger.warning(f"Could not fetch camera frame from {camera_url}: {exc}")

    if image_bytes:
        return await detect_vehicles_in_frame(image_bytes, total_slots, lot_id)
    else:
        # No live frame available — use simulation
        return _simulate_detection(total_slots, lot_id)
