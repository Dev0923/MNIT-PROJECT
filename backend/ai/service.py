"""
AIService — Phase 2A singleton orchestrator for live density estimation.

Responsibilities:
  - Hold one DensityEstimator instance (loaded once at startup, kept resident).
  - Run a single background sampling thread that reads frames from CameraManager,
    runs Stage 1 inference, and stores the latest result per camera.
  - Expose get_result() / get_all_results() to the routes layer.

Threading model:
  - One daemon thread owns all LWCC calls — serialization by design, not by locking
    every call site. A threading.Lock is still held around each estimate() call to
    guard against future changes that add a second caller.
  - threading.Event is used for the inter-cycle sleep so shutdown() wakes the thread
    immediately without waiting for the full interval to expire.
  - Camera frames are read via CameraManager.get_latest_frame(), which already
    uses its own internal lock in CameraWorker — no additional synchronization needed
    on the read side.

What is NOT in this file:
  - ConvLSTM / ForecastingModel (Phase 3)
  - Rolling frame buffers (Phase 3)
  - Predicted crowd counts (Phase 3)
  - Automatic database writes
  - Automatic WebSocket alerts
"""

import os
import threading
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np

from camera.manager import CameraManager
from ai.density_estimator import DensityResult
from ai.inference_engine import InferenceEngine

# ── Configuration helpers ──────────────────────────────────────────────────────────

_DEFAULT_INTERVAL: float = 2.0


def _read_interval() -> float:
    try:
        return float(os.getenv("AI_SAMPLE_INTERVAL_SECONDS", str(_DEFAULT_INTERVAL)))
    except ValueError:
        return _DEFAULT_INTERVAL


def _read_enabled() -> bool:
    return os.getenv("AI_ENABLED", "true").strip().lower() in ("true", "1", "yes")


# ── Result dataclass ───────────────────────────────────────────────────────────────

@dataclass
class InferenceResult:
    """
    Latest Stage 1 inference output for one camera.

    Stored in AIService._results keyed by camera_id.
    density_map is kept in memory but excluded from JSON API responses
    (90×160 float array is not suitable for inline JSON serialization).
    """
    camera_id: str
    crowd_count: float          # scalar float from DensityEstimator
    density_map: np.ndarray     # shape (90, 160) — in-memory only
    timestamp: float            # time.time() at inference completion


# ── Service singleton ──────────────────────────────────────────────────────────────

class AIService:
    """
    Phase 2A inference service — Stage 1 (density estimation) only.

    Singleton pattern mirrors CameraManager in this codebase.

    Lifecycle:
        AIService().initialize()   — called in FastAPI lifespan startup
        AIService().shutdown()     — called in FastAPI lifespan shutdown

    Query:
        AIService().get_result("C1")        → InferenceResult | None
        AIService().get_all_results()       → dict[str, InferenceResult]
        AIService().is_ready                → bool
    """

    _instance: Optional["AIService"] = None

    def __new__(cls) -> "AIService":
        if cls._instance is None:
            instance = super().__new__(cls)
            instance._ready = False
            cls._instance = instance
        return cls._instance

    # ── Lifecycle ──────────────────────────────────────────────────────────────

    def initialize(self) -> None:
        """Load LWCC model and start the sampling thread. Idempotent."""
        if self._ready:
            return

        if not _read_enabled():
            print("[AIService] AI_ENABLED=false — inference service will not start.")
            return

        self._interval: float = _read_interval()
        self._results: dict[str, InferenceResult] = {}
        self._stop_event = threading.Event()

        self._thread = threading.Thread(
            target=self._sampling_loop,
            name="AIService-SamplingThread",
            daemon=True,
        )
        self._thread.start()
        self._ready = True

        print(
            f"[AIService] Sampling thread started "
            f"(interval={self._interval}s, thread={self._thread.name})"
        )

    def shutdown(self) -> None:
        """Signal the sampling thread to stop and wait for it to exit."""
        if not self._ready:
            return
        print("[AIService] Shutting down sampling thread...")
        self._stop_event.set()
        self._thread.join(timeout=5)
        self._ready = False
        print("[AIService] Sampling thread stopped.")

    # ── Public query API ───────────────────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        """True if initialize() has completed and the sampling thread is running."""
        return self._ready

    def get_result(self, camera_id: str) -> Optional[InferenceResult]:
        """Return the latest inference result for a specific camera, or None."""
        return self._results.get(camera_id)

    def get_all_results(self) -> dict[str, InferenceResult]:
        """Return a snapshot of all latest inference results keyed by camera_id."""
        return dict(self._results)

    # ── Background sampling loop ───────────────────────────────────────────────

    def _sampling_loop(self) -> None:
        """
        Daemon thread body.

        Each iteration:
          1. Snapshot the current list of registered camera IDs.
          2. For each camera: retrieve the latest decoded frame from CameraManager.
             (CameraManager.get_latest_frame() is already thread-safe via CameraWorker._lock.)
          3. If a frame is available: run Stage 1 inference under self._lock.
          4. Store the result in self._results[camera_id].
          5. Non-busy sleep via threading.Event.wait(timeout=interval) —
             returns immediately if _stop_event is set during the sleep.
        """
        manager = CameraManager()

        while not self._stop_event.is_set():
            # Snapshot camera IDs so we don't hold a reference while sleeping.
            camera_ids = list(manager.workers.keys())

            for camera_id in camera_ids:
                # Bail early if shutdown was requested mid-loop
                if self._stop_event.is_set():
                    break

                frame = manager.get_latest_frame(camera_id)
                if frame is None:
                    # Camera not yet connected or in error/not_configured state.
                    # Skip silently — result dict simply has no entry for this ID.
                    continue

                try:
                    # Call standard shared InferenceEngine provider
                    result: DensityResult = InferenceEngine().estimate(
                        frame.copy()  # copy() prevents race on the worker's buffer
                    )

                    self._results[camera_id] = InferenceResult(
                        camera_id=camera_id,
                        crowd_count=result.crowd_count,
                        density_map=result.density_map,
                        timestamp=time.time(),
                    )

                    print(
                        f"[AIService] {camera_id}: "
                        f"count={result.crowd_count:.2f}  "
                        f"map_sum={result.density_map.sum():.2f}"
                    )

                except Exception as exc:
                    # Never let an inference error crash the sampling thread.
                    print(f"[AIService] {camera_id}: inference error — {exc!r}")

            # Non-busy wait: sleeps for self._interval but wakes immediately
            # if shutdown() sets the stop event.
            self._stop_event.wait(timeout=self._interval)
