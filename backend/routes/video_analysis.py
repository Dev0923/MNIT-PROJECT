import os
import uuid
import time
import shutil
import csv
import json
import threading
from typing import Optional, Dict, Any
import numpy as np
import cv2
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from ai.inference_engine import InferenceEngine

router = APIRouter(prefix="/api/v1/video-analysis", tags=["video-analysis"])

# In-memory registry to track active task progress
# Schema: { task_id: { status, current_frame, total_frames, elapsed_time, eta, fps, error_message, results, cancellation_flag } }
tasks_registry: Dict[str, Dict[str, Any]] = {}
registry_lock = threading.Lock()

BASE_UPLOAD_DIR = os.path.join("backend", "uploads", "video_analysis")

def get_task_dir(task_id: str) -> str:
    return os.path.join(BASE_UPLOAD_DIR, f"task_{task_id}")

def process_video_thread(task_id: str, original_path: str, original_filename: str, mode: str):
    """Background worker thread to process video frames sequentially."""
    print(f"[VideoAnalysis] Starting task {task_id} with mode {mode}")
    task_dir = get_task_dir(task_id)
    
    cap = None
    out = None
    
    try:
        cap = cv2.VideoCapture(original_path)
        if not cap.isOpened():
            raise RuntimeError("Failed to open raw video file with OpenCV")

        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if fps <= 0 or total_frames <= 0:
            raise RuntimeError("Invalid video metadata (FPS or Frame Count <= 0)")

        # Determine output dimensions based on output mode
        if mode == "side-by-side":
            out_width = width * 2
        else:
            out_width = width
        out_height = height

        output_video_path = os.path.join(task_dir, "overlay.mp4")
        
        # Use MP4V codec inside MP4 container
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, fps, (out_width, out_height))
        if not out.isOpened():
            raise RuntimeError("Failed to initialize OpenCV VideoWriter")

        # Update status to processing
        with registry_lock:
            tasks_registry[task_id]["status"] = "processing"
            tasks_registry[task_id]["total_frames"] = total_frames
            tasks_registry[task_id]["start_time"] = time.time()

        counts = []
        csv_rows = []
        frame_idx = 0
        start_time = time.time()

        while True:
            # Check for cancellation request
            with registry_lock:
                if tasks_registry[task_id].get("cancellation_flag", False):
                    tasks_registry[task_id]["status"] = "cancelled"
                    print(f"[VideoAnalysis] Task {task_id} was cancelled by user")
                    break

            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            
            # Record inference latency
            inf_start = time.time()
            # Reuse the thread-safe InferenceEngine singleton provider
            result = InferenceEngine().estimate(frame)
            inf_time_ms = (time.time() - inf_start) * 1000.0

            # Composite the frame depending on output mode
            # 1. Normalize and color-map the density map
            d_map = result.density_map
            max_val = d_map.max()
            if max_val > 1e-5:
                normalized = (d_map / max_val * 255.0).astype(np.uint8)
            else:
                normalized = np.zeros_like(d_map, dtype=np.uint8)
                
            heatmap = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)
            heatmap_resized = cv2.resize(heatmap, (width, height), interpolation=cv2.INTER_CUBIC)

            if mode == "overlay":
                composited = cv2.addWeighted(heatmap_resized, 0.4, frame, 0.6, 0)
            elif mode == "density":
                composited = heatmap_resized
            else:  # side-by-side
                overlay = cv2.addWeighted(heatmap_resized, 0.4, frame, 0.6, 0)
                composited = np.hstack((frame, overlay))

            out.write(composited)
            
            # Metrics
            counts.append(result.crowd_count)
            
            elapsed = time.time() - start_time
            current_processing_fps = frame_idx / elapsed if elapsed > 0 else 0.0
            eta = (total_frames - frame_idx) / current_processing_fps if current_processing_fps > 0 else 0.0

            csv_rows.append([
                frame_idx,
                round(frame_idx / fps, 3),
                round(result.crowd_count, 2),
                round(inf_time_ms, 2),
                round(current_processing_fps, 2)
            ])

            # Update progress status
            with registry_lock:
                tasks_registry[task_id]["current_frame"] = frame_idx
                tasks_registry[task_id]["elapsed_time"] = elapsed
                tasks_registry[task_id]["fps"] = current_processing_fps
                tasks_registry[task_id]["eta"] = eta
                tasks_registry[task_id]["progress"] = round((frame_idx / total_frames) * 100, 1)

        # Release resources
        cap.release()
        out.release()
        
        # Check final status
        with registry_lock:
            final_status = tasks_registry[task_id]["status"]
            
        if final_status == "cancelled":
            # Remove output artifacts on cancel
            if os.path.exists(output_video_path):
                os.remove(output_video_path)
            return

        # Write CSV report
        csv_path = os.path.join(task_dir, "counts.csv")
        with open(csv_path, mode='w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Frame Number", "Timestamp (seconds)", "Crowd Count", "Inference Time (milliseconds)", "Processing FPS"])
            writer.writerows(csv_rows)

        # Write metadata.json summary
        elapsed_total = time.time() - start_time
        metadata = {
            "task_id": task_id,
            "input_filename": original_filename,
            "model": "Bay (LWCC)",
            "weights": "SHA",
            "output_mode": mode,
            "duration": round(total_frames / fps, 2),
            "frame_count": total_frames,
            "average_count": round(float(np.mean(counts)), 2) if counts else 0.0,
            "maximum_count": round(float(np.max(counts)), 2) if counts else 0.0,
            "minimum_count": round(float(np.min(counts)), 2) if counts else 0.0,
            "processing_time": round(elapsed_total, 2),
            "average_processing_fps": round(total_frames / elapsed_total, 2) if elapsed_total > 0 else 0.0,
            "completion_timestamp": time.time()
        }
        
        metadata_path = os.path.join(task_dir, "metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)

        # Update registry as completed
        with registry_lock:
            tasks_registry[task_id]["status"] = "completed"
            tasks_registry[task_id]["results"] = metadata
            tasks_registry[task_id]["progress"] = 100.0
            
        print(f"[VideoAnalysis] Task {task_id} successfully completed in {elapsed_total:.2f}s")

    except Exception as e:
        print(f"[VideoAnalysis] Error in task {task_id}: {e}")
        if cap is not None:
            cap.release()
        if out is not None:
            out.release()
            
        # Update registry with failure details
        with registry_lock:
            tasks_registry[task_id]["status"] = "failed"
            tasks_registry[task_id]["error_message"] = str(e)

@router.post("/upload")
def upload_video(file: UploadFile = File(...), mode: str = Form("overlay")):
    """Upload a recorded video, register the job, and start background processing."""
    # Validate formats
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".avi", ".mov", ".mkv"]:
        raise HTTPException(status_code=400, detail="Unsupported video format. Allowed: MP4, AVI, MOV, MKV")

    task_id = str(uuid.uuid4())
    task_dir = get_task_dir(task_id)
    os.makedirs(task_dir, exist_ok=True)

    # Save original video file
    original_filename = f"original{ext}"
    original_path = os.path.join(task_dir, original_filename)
    
    with open(original_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Initialize task state in registry
    with registry_lock:
        tasks_registry[task_id] = {
            "task_id": task_id,
            "status": "pending",
            "current_frame": 0,
            "total_frames": 0,
            "elapsed_time": 0.0,
            "eta": 0.0,
            "fps": 0.0,
            "progress": 0.0,
            "error_message": "",
            "cancellation_flag": False,
            "results": None
        }

    # Spawn thread to run estimation
    thread = threading.Thread(
        target=process_video_thread,
        args=(task_id, original_path, file.filename, mode),
        daemon=True
    )
    thread.start()

    return {"task_id": task_id, "status": "pending"}

@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    """Retrieve the current state/progress of a video analysis job."""
    with registry_lock:
        task = tasks_registry.get(task_id)
        
    if task:
        return task

    # Fallback to disk if it exists but is not in registry (e.g. server restart)
    task_dir = get_task_dir(task_id)
    metadata_path = os.path.join(task_dir, "metadata.json")
    
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            return {
                "task_id": task_id,
                "status": "completed",
                "current_frame": metadata["frame_count"],
                "total_frames": metadata["frame_count"],
                "elapsed_time": metadata["processing_time"],
                "eta": 0.0,
                "fps": metadata["average_processing_fps"],
                "progress": 100.0,
                "error_message": "",
                "results": metadata
            }
        except Exception:
            pass

    raise HTTPException(status_code=404, detail="Task not found")

@router.post("/cancel/{task_id}")
def cancel_task(task_id: str):
    """Gracefully cancel a running video analysis job."""
    with registry_lock:
        task = tasks_registry.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task["status"] in ["pending", "processing"]:
            task["cancellation_flag"] = True
            task["status"] = "cancelled"
            return {"status": "cancelled", "message": "Cancellation request submitted."}
            
    return {"status": task["status"], "message": f"Task cannot be cancelled since it is already {task['status']}."}

@router.delete("/jobs/{task_id}")
def delete_job(task_id: str):
    """Cancel job if active, recursively delete task folder, and purge from registry."""
    # First request cancel if running
    with registry_lock:
        task = tasks_registry.get(task_id)
        if task and task["status"] in ["pending", "processing"]:
            task["cancellation_flag"] = True
            
    # Allow worker thread time to exit
    time.sleep(0.5)

    # Delete task directory
    task_dir = get_task_dir(task_id)
    if os.path.exists(task_dir):
        try:
            shutil.rmtree(task_dir)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete directory: {e}")

    # Remove from registry
    with registry_lock:
        if task_id in tasks_registry:
            del tasks_registry[task_id]

    return {"status": "deleted", "task_id": task_id}

@router.get("/downloads/{task_id}/video")
def download_processed_video(task_id: str):
    """Serve the final processed video file."""
    task_dir = get_task_dir(task_id)
    video_path = os.path.join(task_dir, "overlay.mp4")
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Processed video not found.")
        
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"processed_{task_id}.mp4"
    )

@router.get("/downloads/{task_id}/csv")
def download_processed_csv(task_id: str):
    """Serve the frame-by-frame counts CSV report."""
    task_dir = get_task_dir(task_id)
    csv_path = os.path.join(task_dir, "counts.csv")
    
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found.")
        
    return FileResponse(
        csv_path,
        media_type="text/csv",
        filename=f"counts_{task_id}.csv"
    )
