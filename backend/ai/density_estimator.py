"""
Stage 1 density estimation using LWCC (Lightweight Crowd Counting).

Wraps the LWCC library to:
  1. Accept a raw NumPy frame (H×W×3, BGR uint8 from OpenCV).
  2. Pre-downscale wide frames for latency reduction (does not change mass).
  3. Save the frame to a temp JPEG on disk (LWCC accepts file paths only — API constraint).
  4. Run LWCC.get_count() to obtain a raw density map + scalar count.
  5. Squeeze the density map to 2D.
  6. Apply a mass-preserving resize to (TARGET_HEIGHT × TARGET_WIDTH).
  7. Return a structured DensityResult.

This is the ONLY file in the backend that imports or calls LWCC.

Key audit references:
  - Phase 3: estimate_density.py lines 36–97 (Stage 1 inference logic)
  - Phase 4: input requirements — file path string, BGR/RGB, any resolution
  - Phase 5: output — (count: float, density_map: np.ndarray shape 90×160)
  - Phase 9: mass-preserving downsampling must be replicated exactly
"""

import io
import cv2
import numpy as np
import torch
from torchvision import transforms
from PIL import Image
from dataclasses import dataclass
from lwcc import LWCC  # type: ignore[import]  # installed via: pip install lwcc

# ── Mandatory spatial dimensions ───────────────────────────────────────────────────
# These match the ConvLSTM training data shape (Phase 3 forward-compatibility).
# Do NOT change without retraining the ConvLSTM model (Phase 3 concern).
TARGET_WIDTH: int = 160    # cv2.resize uses (width, height) order
TARGET_HEIGHT: int = 90

# ── Latency optimisation: downscale before LWCC if frame is wider than this ────────
# Source: resolution_experiment.py findings — accuracy preserved, speed improved.
MAX_FRAME_WIDTH: int = 1280


@dataclass
class DensityResult:
    """
    Structured output from a single DensityEstimator.estimate() call.

    Attributes:
        density_map:  np.ndarray shape (90, 160), float64.
                      Mass-preserving: np.sum(density_map) ≈ crowd_count.
        crowd_count:  Scalar float. Estimated number of people in the frame.
    """
    density_map: np.ndarray
    crowd_count: float


class DensityEstimator:
    """
    LWCC Stage 1 wrapper — load once, call estimate() per frame.

    Thread safety: NOT guaranteed internally. Callers (AIService) must
    serialize concurrent calls via an external threading.Lock.
    """

    def __init__(self) -> None:
        print("[DensityEstimator] Loading LWCC Bay model — this may take a moment...")
        self._model = LWCC.load_model("Bay")
        print("[DensityEstimator] LWCC Bay model loaded. Running in-memory JPEG pipeline.")

    def estimate(self, frame: np.ndarray) -> DensityResult:
        """
        Run Stage 1 density estimation on a single BGR frame using an in-memory JPEG pipeline.

        Args:
            frame: np.ndarray shape (H, W, 3), dtype uint8, BGR (OpenCV native).
                   Caller must pass frame.copy() if the source buffer is shared.

        Returns:
            DensityResult with density_map shape (90, 160) and crowd_count float.
        """
        # Step 1 — Optional pre-resize for latency (preserves visual content; mass
        # is irrelevant here because LWCC re-estimates from the image pixels).
        frame = _maybe_downscale(frame, MAX_FRAME_WIDTH)

        # Step 2 — Encode to JPEG in memory to replicate cv2.imwrite compression exactly.
        ret, buf = cv2.imencode(".jpg", frame)
        if not ret:
            raise RuntimeError("Failed to encode frame as JPEG in memory")
            
        bytes_io = io.BytesIO(buf.tobytes())
        img = Image.open(bytes_io).convert('RGB')

        # Step 3 — Resize image (identical to LWCC resize/preprocessing logic)
        long_dim = max(img.size[0], img.size[1])
        factor = 1000.0 / long_dim
        img = img.resize((int(img.size[0] * factor), int(img.size[1] * factor)),
                         Image.Resampling.BILINEAR if hasattr(Image, "Resampling") else Image.BILINEAR)

        # Step 4 — Transform and normalize (identical to LWCC load_image)
        trans = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        img_tensor = trans(img).unsqueeze(0)

        # Step 5 — Direct PyTorch model inference
        with torch.no_grad():
            outputs = self._model(img_tensor)

        count = float(torch.sum(outputs, (1, 2, 3)).numpy()[0])
        density_map_raw = outputs[0, 0, :, :].numpy()

        # Step 6 — Squeeze singleton dimensions
        density_map_2d: np.ndarray = np.squeeze(density_map_raw)

        # Step 7 — Mass-preserving resize to (TARGET_HEIGHT, TARGET_WIDTH).
        density_map = _mass_preserving_resize(
            density_map_2d, TARGET_WIDTH, TARGET_HEIGHT
        )

        return DensityResult(
            density_map=density_map,
            crowd_count=count,
        )


# ── Module-private helpers ─────────────────────────────────────────────────────────

def _maybe_downscale(frame: np.ndarray, max_width: int) -> np.ndarray:
    """Downscale frame width to max_width, preserving aspect ratio. No-op if smaller."""
    h, w = frame.shape[:2]
    if w <= max_width:
        return frame
    scale = max_width / w
    new_h = int(h * scale)
    return cv2.resize(frame, (max_width, new_h), interpolation=cv2.INTER_AREA)


def _mass_preserving_resize(
    density_map: np.ndarray,
    target_w: int,
    target_h: int,
) -> np.ndarray:
    """
    Resize a density map while preserving its total mass (crowd count).

    A standard cv2.resize changes pixel values and thus changes np.sum().
    This function restores the sum to its original value after resizing,
    satisfying the crowd counting invariant: sum(density_map) == crowd_count.

    Source: estimate_density.py lines 82–93 in CrowdCongestionForecasting.
    """
    original_sum = float(density_map.sum())
    resized = cv2.resize(density_map, (target_w, target_h), interpolation=cv2.INTER_AREA)
    resized_sum = float(resized.sum())
    if resized_sum > 0.0:
        resized = resized * (original_sum / resized_sum)
    return resized
