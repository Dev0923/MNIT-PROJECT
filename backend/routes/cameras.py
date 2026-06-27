import time
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from camera.manager import CameraManager
from ai.service import AIService

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


@router.get("/{camera_id}/overlay")
def get_camera_overlay_stream(camera_id: str):
    """Retrieve a continuous multipart MJPEG stream of the camera with the density heatmap overlaid."""
    worker = manager.workers.get(camera_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Camera worker not found")
        
    service = AIService()
    
    def frame_generator():
        last_frame_count = -1
        while True:
            if camera_id not in manager.workers or not worker._running:
                break
                
            frame = worker.get_latest_frame()
            current_count = worker.frame_count
            
            if frame is not None:
                if current_count != last_frame_count:
                    last_frame_count = current_count
                    
                    combined_frame = frame.copy()
                    if service.is_ready:
                        result = service.get_result(camera_id)
                        if result is not None and result.density_map is not None:
                            density_map = result.density_map
                            max_val = density_map.max()
                            if max_val > 0:
                                normalized = (density_map / max_val * 255).astype(np.uint8)
                            else:
                                normalized = np.zeros_like(density_map, dtype=np.uint8)
                            
                            heatmap = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)
                            h, w = frame.shape[:2]
                            heatmap_resized = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
                            
                            alpha = 0.4
                            cv2.addWeighted(heatmap_resized, alpha, frame, 1 - alpha, 0, combined_frame)
                    
                    ret, jpeg = cv2.imencode('.jpg', combined_frame)
                    if ret:
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
                        )
            else:
                synth_frame = worker.generate_synthetic_frame()
                ret, jpeg = cv2.imencode('.jpg', synth_frame)
                if ret:
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
                    )
            
            time.sleep(0.03)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/{camera_id}/heatmap")
def get_camera_heatmap_stream(camera_id: str):
    """Retrieve a continuous multipart MJPEG stream of only the density heatmap."""
    worker = manager.workers.get(camera_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Camera worker not found")
        
    service = AIService()
    
    def frame_generator():
        last_frame_count = -1
        while True:
            if camera_id not in manager.workers or not worker._running:
                break
                
            frame = worker.get_latest_frame()
            current_count = worker.frame_count
            
            if frame is not None:
                if current_count != last_frame_count:
                    last_frame_count = current_count
                    
                    h, w = frame.shape[:2]
                    heatmap_resized = None
                    
                    if service.is_ready:
                        result = service.get_result(camera_id)
                        if result is not None and result.density_map is not None:
                            density_map = result.density_map
                            max_val = density_map.max()
                            if max_val > 0:
                                normalized = (density_map / max_val * 255).astype(np.uint8)
                            else:
                                normalized = np.zeros_like(density_map, dtype=np.uint8)
                            
                            heatmap = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)
                            heatmap_resized = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
                            
                    if heatmap_resized is None:
                        heatmap_resized = np.zeros((h, w, 3), dtype=np.uint8)
                        
                    ret, jpeg = cv2.imencode('.jpg', heatmap_resized)
                    if ret:
                        yield (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
                        )
            else:
                synth_frame = worker.generate_synthetic_frame()
                ret, jpeg = cv2.imencode('.jpg', synth_frame)
                if ret:
                    yield (
                        b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n'
                    )
            
            time.sleep(0.03)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
