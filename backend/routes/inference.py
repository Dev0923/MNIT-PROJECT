"""
Phase 2A inference endpoints.

Exposes the latest Stage 1 density estimation results produced by AIService.

Routes:
    GET /api/v1/inference              — all cameras
    GET /api/v1/inference/{camera_id}  — single camera

Explicitly not present in this phase:
    - Density map / heatmap image endpoints (Phase 3)
    - Forecast / predicted count endpoints (Phase 3)
    - Database writes (not triggered from routes)
    - WebSocket broadcasts (not triggered from routes)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai.service import AIService

router = APIRouter(prefix="/api/v1/inference", tags=["inference"])


# ── Response schema ────────────────────────────────────────────────────────────────

class InferenceResponse(BaseModel):
    """
    JSON-serializable slice of InferenceResult.

    density_map is intentionally excluded: a 90×160 float64 array serialized
    as JSON is ~115 KB per response. Heatmap endpoints belong in Phase 3.
    """
    camera_id: str
    crowd_count: float
    timestamp: float
    status: str  # "ok" always for successful results


# ── Endpoints ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[InferenceResponse])
def get_all_inference_results():
    """
    Return the latest density estimation result for every camera that has
    produced at least one successful inference.

    Returns an empty list if the AI service is not yet initialized or no
    cameras have connected yet.
    """
    service = AIService()
    if not service.is_ready:
        return []

    results = service.get_all_results()
    return [
        InferenceResponse(
            camera_id=camera_id,
            crowd_count=r.crowd_count,
            timestamp=r.timestamp,
            status="ok",
        )
        for camera_id, r in results.items()
    ]


@router.get("/{camera_id}", response_model=InferenceResponse)
def get_camera_inference_result(camera_id: str):
    """
    Return the latest density estimation result for a specific camera.

    404 is returned if no result exists yet (camera disconnected or not yet sampled).
    503 is returned if the AI service has not been initialized.
    """
    service = AIService()

    if not service.is_ready:
        raise HTTPException(
            status_code=503,
            detail="AI inference service is not initialized.",
        )

    result = service.get_result(camera_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No inference result available for camera '{camera_id}'. "
                "Camera may be disconnected or not yet sampled."
            ),
        )

    return InferenceResponse(
        camera_id=result.camera_id,
        crowd_count=result.crowd_count,
        timestamp=result.timestamp,
        status="ok",
    )
