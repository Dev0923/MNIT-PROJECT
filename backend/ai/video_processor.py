import os
import time
import csv
import json
import numpy as np
import cv2
from typing import Optional, Callable, Union

from ai.inference_engine import InferenceEngine

def process_video(
    input_path: str,
    output_directory: str,
    mode: str = "overlay",
    sample_fps: Union[int, float, str] = 1,
    save_frames: bool = False,
    progress_callback: Optional[Callable[[int, int, float, float, float], None]] = None
) -> dict:
    """
    Offline video processing engine. Reads input video, samples frames according
    to the configured sample_fps, runs density estimation, and exports overlay/heatmap video,
    counts CSV, and metadata.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video file not found: {input_path}")

    os.makedirs(output_directory, exist_ok=True)
    if save_frames:
        os.makedirs(os.path.join(output_directory, "frames"), exist_ok=True)

    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError("Failed to open input video file with OpenCV")

    input_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if input_fps <= 0 or total_frames <= 0:
        raise RuntimeError(f"Invalid video metadata: FPS={input_fps}, total_frames={total_frames}")

    # Determine frame interval and output FPS
    if sample_fps == "full":
        frame_interval = 1
        output_fps = input_fps
    else:
        try:
            sample_fps_val = float(sample_fps)
            if sample_fps_val <= 0:
                raise ValueError("sample_fps must be positive")
            frame_interval = max(1, int(round(input_fps / sample_fps_val)))
            output_fps = sample_fps_val
        except ValueError:
            raise ValueError("sample_fps must be 'full' or a positive number")

    # Set up output VideoWriter
    if mode == "side-by-side":
        out_width = width * 2
    else:
        out_width = width
    out_height = height

    output_video_path = os.path.join(output_directory, "overlay.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, output_fps, (out_width, out_height))
    if not out.isOpened():
        cap.release()
        raise RuntimeError("Failed to initialize OpenCV VideoWriter")

    frame_idx = 0
    frames_processed = 0
    counts = []
    inference_times = []
    csv_rows = []

    start_time = time.time()
    total_sampled_frames = int(np.ceil(total_frames / frame_interval))

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                timestamp = frame_idx / input_fps

                # Run inference
                inf_start = time.time()
                result = InferenceEngine().estimate(frame)
                inf_time_ms = (time.time() - inf_start) * 1000.0

                inference_times.append(inf_time_ms)
                counts.append(result.crowd_count)

                # Generate density map representation
                d_map = result.density_map
                max_val = d_map.max()
                if max_val > 1e-5:
                    normalized = (d_map / max_val * 255.0).astype(np.uint8)
                else:
                    normalized = np.zeros_like(d_map, dtype=np.uint8)

                heatmap = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)
                heatmap_resized = cv2.resize(heatmap, (width, height), interpolation=cv2.INTER_CUBIC)

                # Composite frame
                if mode == "overlay":
                    composited = cv2.addWeighted(heatmap_resized, 0.4, frame, 0.6, 0)
                elif mode in ["heatmap", "density"]:
                    composited = heatmap_resized
                else:  # side-by-side
                    overlay = cv2.addWeighted(heatmap_resized, 0.4, frame, 0.6, 0)
                    composited = np.hstack((frame, overlay))

                out.write(composited)

                # Save frames for debug if requested
                if save_frames:
                    frames_dir = os.path.join(output_directory, "frames")
                    cv2.imwrite(os.path.join(frames_dir, f"frame_{frames_processed:06d}_orig.jpg"), frame)
                    cv2.imwrite(os.path.join(frames_dir, f"frame_{frames_processed:06d}_overlay.jpg"), composited)

                frames_processed += 1

                elapsed = time.time() - start_time
                processing_fps = frames_processed / elapsed if elapsed > 0 else 0.0

                csv_rows.append([
                    round(timestamp, 3),
                    round(result.crowd_count, 2),
                    round(inf_time_ms, 2),
                    round(processing_fps, 2)
                ])

                if progress_callback:
                    eta = (total_sampled_frames - frames_processed) / processing_fps if processing_fps > 0 else 0.0
                    progress_callback(frames_processed, total_sampled_frames, elapsed, eta, processing_fps)

            frame_idx += 1

    finally:
        cap.release()
        out.release()

    # Write CSV report
    csv_path = os.path.join(output_directory, "counts.csv")
    with open(csv_path, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Timestamp (seconds)", "Crowd Count", "Inference Time (ms)", "Processing FPS"])
        writer.writerows(csv_rows)

    # Write metadata.json report
    elapsed_total = time.time() - start_time
    frames_skipped = total_frames - frames_processed

    metadata = {
        "input_filename": os.path.basename(input_path),
        "input_fps": round(input_fps, 2),
        "sample_fps": sample_fps,
        "frames_processed": frames_processed,
        "frames_skipped": frames_skipped,
        "model": "Bay (LWCC)",
        "weights": "SHA",
        "processing_duration": round(elapsed_total, 2),
        "average_count": round(float(np.mean(counts)), 2) if counts else 0.0,
        "maximum_count": round(float(np.max(counts)), 2) if counts else 0.0,
        "minimum_count": round(float(np.min(counts)), 2) if counts else 0.0,
        "average_inference_time": round(float(np.mean(inference_times)), 2) if inference_times else 0.0
    }

    metadata_path = os.path.join(output_directory, "metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)

    return metadata
