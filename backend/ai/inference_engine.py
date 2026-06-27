import threading
from typing import Optional
import numpy as np

from ai.density_estimator import DensityEstimator, DensityResult

class InferenceEngine:
    """
    Thread-safe singleton inference engine that encapsulates model loading
    and serializes calls to the underlying DensityEstimator.
    """
    _instance: Optional["InferenceEngine"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "InferenceEngine":
        with cls._lock:
            if cls._instance is None:
                instance = super().__new__(cls)
                instance._estimator = DensityEstimator()
                instance._inference_lock = threading.Lock()
                cls._instance = instance
        return cls._instance

    def estimate(self, frame: np.ndarray) -> DensityResult:
        """
        Run Stage 1 density estimation on a single BGR frame in a thread-safe manner.
        
        Args:
            frame: np.ndarray BGR image.
            
        Returns:
            DensityResult containing the density map and count.
        """
        with self._inference_lock:
            return self._estimator.estimate(frame)
