from typing import Dict, List, Optional
from .models import CameraConfig
from .worker import CameraWorker
from .config import DEFAULT_CAMERAS

class CameraManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(CameraManager, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.workers: Dict[str, CameraWorker] = {}
        self._initialized = True

    def initialize(self, configs: Optional[List[CameraConfig]] = None):
        """Initialize and start all camera workers from config."""
        camera_configs = configs if configs is not None else DEFAULT_CAMERAS
        for config in camera_configs:
            try:
                self.add_camera(config)
            except Exception as e:
                print(f"[CameraManager] FAILED to initialize camera {config.id}: {e}")

    def add_camera(self, config: CameraConfig):
        """Add and start a new camera worker."""
        if config.id in self.workers:
            self.remove_camera(config.id)
            
        worker = CameraWorker(config)
        self.workers[config.id] = worker
        worker.start()
        print(f"[CameraManager] Registered and started camera: {config.id}")

    def remove_camera(self, camera_id: str):
        """Stop and remove a camera worker."""
        if camera_id in self.workers:
            worker = self.workers.pop(camera_id)
            worker.stop()
            print(f"[CameraManager] Stopped and removed camera: {camera_id}")

    def get_cameras(self) -> List[dict]:
        """Get the configuration metrics for all registered cameras."""
        return [
            {
                "id": w.config.id,
                "label": w.config.label,
                "location": w.config.location,
                "status": w.get_state()["status"]
            }
            for w in self.workers.values()
        ]

    def get_camera_state(self, camera_id: str) -> Optional[dict]:
        """Get the live status metrics of a specific camera worker."""
        worker = self.workers.get(camera_id)
        if worker:
            return worker.get_state()
        return None

    def get_latest_frame(self, camera_id: str):
        """Retrieve the latest raw decoded frame (numpy array) of a camera."""
        worker = self.workers.get(camera_id)
        if worker:
            return worker.get_latest_frame()
        return None

    def shutdown(self):
        """Stop all running camera threads."""
        for camera_id in list(self.workers.keys()):
            self.remove_camera(camera_id)
        print("[CameraManager] Camera subsystem successfully shut down.")
