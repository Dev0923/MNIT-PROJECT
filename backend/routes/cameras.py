import time
import cv2
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from camera.manager import CameraManager

router = APIRouter(prefix="/api/v1/cameras", tags=["cameras"])
manager = CameraManager()

@router.get("")
def list_cameras():
    """Retrieve all registered camera configs and their general connection status."""
    return manager.get_cameras()

@router.get("/{camera_id}/status")
def get_camera_status(camera_id: str):
    """Retrieve detailed state telemetry for a specific camera worker thread."""
    state = manager.get_camera_state(camera_id)
    if not state:
        raise HTTPException(status_code=404, detail="Camera worker not found")
    return state

@router.get("/{camera_id}/snapshot")
def get_camera_snapshot(camera_id: str):
    """Retrieve the latest single decoded frame as a JPEG image."""
    worker = manager.workers.get(camera_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Camera worker not found")
        
    frame = worker.get_latest_frame()
    if frame is None:
        # Fall back to generating a synthetic frame (e.g. connecting/loading screen)
        frame = worker.generate_synthetic_frame()
        
    ret, jpeg = cv2.imencode('.jpg', frame)
    if not ret:
        raise HTTPException(status_code=500, detail="Failed to encode frame as JPEG")
        
    return Response(content=jpeg.tobytes(), media_type="image/jpeg")

@router.get("/{camera_id}/stream")
def get_camera_stream(camera_id: str):
    """Retrieve a continuous multipart MJPEG live stream of the camera."""
    worker = manager.workers.get(camera_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Camera worker not found")
        
    def frame_generator():
        last_frame_count = -1
        while True:
            # Terminate generator if worker stops or is deleted
            if camera_id not in manager.workers or not worker._running:
                break
                
            frame = worker.get_latest_frame()
            current_count = worker.frame_count
            
            if frame is not None:
                if current_count != last_frame_count:
                    last_frame_count = current_count
                    ret, jpeg = cv2.imencode('.jpg', frame)
                    if ret:
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
                        )
            else:
                # Stream the synthetic connection/error page while connecting
                synth_frame = worker.generate_synthetic_frame()
                ret, jpeg = cv2.imencode('.jpg', synth_frame)
                if ret:
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
                    )
            
            # Limit generator iteration sleep to matching 30 FPS to avoid tight loops
            time.sleep(0.03)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
