import threading
import time
import cv2
import numpy as np
from typing import Optional
from .models import CameraConfig

class CameraWorker:
    def __init__(self, config: CameraConfig):
        self.config = config
        self.id = config.id
        self.rtsp_url = config.rtsp_url
        self.fallback_path = config.fallback_video_path
        
        # Determine active source (support legacy variables if source not set)
        raw_source = config.source
        if raw_source is not None:
            raw_source = raw_source.strip()
        
        if not raw_source:
            if config.use_simulator:
                raw_source = "simulator"
            elif config.rtsp_url:
                raw_source = config.rtsp_url
            else:
                raw_source = ""
                
        self.source = raw_source
        self.source_type = self._determine_source_type(self.source)
        
        self.status = "connecting"
        self.latest_frame: Optional[np.ndarray] = None
        self.frame_count = 0
        self.fps = 0.0
        self.last_update = 0.0
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        
    def _determine_source_type(self, source: str) -> str:
        if not source:
            return "not_configured"
        
        source_lower = source.lower()
        if source_lower == "simulator":
            return "simulator"
            
        try:
            int(source)
            return "webcam"
        except ValueError:
            pass
            
        if source_lower.startswith("rtsp://"):
            return "rtsp"
            
        import os
        if os.path.isfile(source):
            return "video"
            
        return "invalid"
        
    def start(self):
        with self._lock:
            if not self._running:
                self._running = True
                self._thread = threading.Thread(target=self._run, name=f"CameraWorker-{self.id}", daemon=True)
                self._thread.start()
                
    def stop(self):
        with self._lock:
            self._running = False
        if self._thread:
            self._thread.join(timeout=3)
            
    def get_latest_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            return self.latest_frame
            
    def get_state(self) -> dict:
        with self._lock:
            return {
                "id": self.id,
                "status": self.status,
                "fps": round(self.fps, 1),
                "frame_count": self.frame_count,
                "last_update": self.last_update
            }
            
    def generate_synthetic_frame(self) -> np.ndarray:
        # Create a simple high-contrast digital pattern (640x360 for 16:9 ratio)
        frame = np.zeros((360, 640, 3), dtype=np.uint8)
        
        # Segment 1: Deep slate background
        frame[:] = [25, 20, 15]
        
        # Draw target lines/grids
        cv2.line(frame, (0, 180), (640, 180), (50, 50, 50), 1)
        cv2.line(frame, (320, 0), (320, 360), (50, 50, 50), 1)
        cv2.circle(frame, (320, 180), 80, (50, 50, 50), 1)
        
        # Color bar indicator blocks at the bottom
        colors = [
            [255, 0, 0],    # Blue
            [0, 255, 0],    # Green
            [0, 0, 255],    # Red
            [0, 255, 255],  # Yellow
            [255, 0, 255],  # Magenta
            [255, 255, 0]   # Cyan
        ]
        w = 60
        for idx, col in enumerate(colors):
            x1 = 140 + idx * w
            cv2.rectangle(frame, (x1, 280), (x1 + w, 320), col, -1)
            
        # Draw scanning circle
        t = time.time()
        angle = t * 2.0
        x = int(320 + 80 * np.cos(angle))
        y = int(180 + 80 * np.sin(angle))
        cv2.circle(frame, (x, y), 8, (247, 148, 29), -1)  # KSJ Orange color dot
        
        # Overlay camera information text
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, f"FEED: {self.config.label} ({self.id})", (20, 40), font, 0.6, (240, 240, 240), 1, cv2.LINE_AA)
        cv2.putText(frame, f"LOC: {self.config.location}", (20, 70), font, 0.5, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, f"TIME: {time.strftime('%Y-%m-%d %X')}", (20, 100), font, 0.5, (180, 180, 180), 1, cv2.LINE_AA)
        cv2.putText(frame, "SIMULATOR ACTIVE", (20, 340), font, 0.45, (247, 148, 29), 1, cv2.LINE_AA)
        
        return frame
        
    def _run(self):
        try:
            # ── Startup log ────────────────────────────────────────────────────
            pretty_type = {
                "simulator": "Simulator",
                "webcam": "Webcam",
                "rtsp": "RTSP Stream",
                "video": "Video File",
                "invalid": "Invalid Source",
                "not_configured": "Not Configured"
            }.get(self.source_type, "Unknown")

            print(f"[CameraWorker {self.id}] ── Initializing ──────────────────────────")
            print(f"[CameraWorker {self.id}]   Camera  : {self.config.label}")
            print(f"[CameraWorker {self.id}]   Location: {self.config.location}")
            print(f"[CameraWorker {self.id}]   Source  : {self.source} (Resolved Type: {pretty_type})")
            if self.config.fallback_video_path:
                print(f"[CameraWorker {self.id}]   Fallback: {self.config.fallback_video_path}")
            print(f"[CameraWorker {self.id}] ─────────────────────────────────────────")

            # ── Path A: Simulator explicitly enabled ─────────────────────────
            if self.source_type == "simulator":
                with self._lock:
                    self.status = "online"
                self._run_simulator()
                return

            # ── Path B: No source configured ──────────────────────────────────
            if self.source_type == "not_configured":
                print(f"[CameraWorker {self.id}] No camera source configured. "
                      f"Set CAMERA_{self.id}_SOURCE in .env to activate this camera.")
                with self._lock:
                    self.status = "not_configured"
                # Dormant loop: sleep until worker is stopped.
                while True:
                    with self._lock:
                        if not self._running:
                            break
                    time.sleep(5)
                return

            # ── Path C: Invalid source configured ─────────────────────────────
            if self.source_type == "invalid":
                print(f"[CameraWorker {self.id}] Invalid source path/type configured: '{self.source}'")
                with self._lock:
                    self.status = "error"
                # Dormant loop: sleep until worker is stopped.
                while True:
                    with self._lock:
                        if not self._running:
                            break
                    time.sleep(5)
                return

            # ── Path D: Webcam, RTSP, or Video source ─────────────────────────
            retry_delay = 5.0
            max_retry_delay = 30.0
            current_delay = retry_delay
            reconnect_attempts = 0

            cap_source = int(self.source) if self.source_type == "webcam" else self.source

            while True:
                with self._lock:
                    if not self._running:
                        break

                with self._lock:
                    self.status = "connecting"

                if reconnect_attempts == 0:
                    print(f"[CameraWorker {self.id}] Attempting connection to source: {self.source}")
                else:
                    print(f"[CameraWorker {self.id}] Reconnect attempt #{reconnect_attempts}: {self.source}")
                
                cap = cv2.VideoCapture(cap_source)

                # If connection fails and fallback video path is configured, try that
                if not cap.isOpened():
                    print(f"[CameraWorker {self.id}] Connection FAILED: {self.source}")
                    if self.fallback_path:
                        print(f"[CameraWorker {self.id}] Trying fallback video file: {self.fallback_path}")
                        cap = cv2.VideoCapture(self.fallback_path)

                # If both primary and fallback failed, enter error state and retry
                if not cap.isOpened():
                    reconnect_attempts += 1
                    with self._lock:
                        self.status = "error"
                    print(f"[CameraWorker {self.id}] All sources unavailable. "
                          f"Next retry in {current_delay:.0f}s (attempt #{reconnect_attempts}).")
                    stop_event = threading.Event()
                    stop_event.wait(timeout=current_delay)
                    current_delay = min(current_delay * 1.5, max_retry_delay)
                    continue

                # ── Stream opened — report capabilities ────────────────────────
                reconnect_attempts = 0  # reset on successful connect
                current_delay = retry_delay
                width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                native_fps = cap.get(cv2.CAP_PROP_FPS)
                print(f"[CameraWorker {self.id}] ✓ Stream opened successfully.")
                print(f"[CameraWorker {self.id}]   Resolution : {width}x{height}")
                print(f"[CameraWorker {self.id}]   Native FPS : {native_fps:.1f}")
                with self._lock:
                    self.status = "online"

                last_frame_time = time.time()
                total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)

                while True:
                    with self._lock:
                        if not self._running:
                            break

                    ret, frame = cap.read()

                    # Loop local video file when it reaches the end
                    if not ret and total_frames > 0:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        ret, frame = cap.read()

                    if not ret:
                        print(f"[CameraWorker {self.id}] ✗ Lost stream — frame read failed. Will reconnect.")
                        with self._lock:
                            self.status = "offline"
                        reconnect_attempts += 1
                        break

                    now = time.time()
                    elapsed = now - last_frame_time
                    current_fps = 1.0 / elapsed if elapsed > 0 else 0.0
                    last_frame_time = now

                    with self._lock:
                        self.latest_frame = frame
                        self.frame_count += 1
                        self.fps = 0.9 * self.fps + 0.1 * current_fps if self.frame_count > 1 else current_fps
                        self.last_update = now
                        measured_fps = self.fps

                    # Log measured FPS briefly after first 30 frames to confirm stream health
                    if self.frame_count == 30:
                        print(f"[CameraWorker {self.id}]   Measured FPS (30-frame avg): {measured_fps:.1f}")

                    # Throttle CPU loop rate for file sources
                    native_fps = cap.get(cv2.CAP_PROP_FPS)
                    if native_fps > 0 and total_frames > 0:
                        # File-based: pace at native FPS
                        time.sleep(max(0.001, (1.0 / native_fps) - elapsed))
                    else:
                        # Live RTSP/Webcam: minimal sleep to avoid tight spin
                        time.sleep(0.001)

                cap.release()

        except Exception as e:
            print(f"[CameraWorker {self.id}] Unexpected worker crash in loop: {e}")
            with self._lock:
                self.status = "error"

    def _run_simulator(self):
        """Synthetic frame generator loop. Runs until worker is stopped."""
        last_frame_time = time.time()
        while True:
            with self._lock:
                if not self._running:
                    break

            frame = self.generate_synthetic_frame()
            now = time.time()
            elapsed = now - last_frame_time
            current_fps = 1.0 / elapsed if elapsed > 0 else 10.0
            last_frame_time = now

            with self._lock:
                self.latest_frame = frame
                self.frame_count += 1
                self.fps = 0.9 * self.fps + 0.1 * current_fps if self.frame_count > 1 else current_fps
                self.last_update = now

            # ~10 FPS to keep CPU overhead minimal
            time.sleep(0.1)
