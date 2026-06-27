import os
import sys
import argparse

# Add backend directory to path to locate the 'ai' package modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from ai.video_processor import process_video

def progress_bar_callback(current: int, total: int, elapsed: float, eta: float, fps: float):
    percentage = (current / total) * 100 if total > 0 else 0
    bar_length = 30
    filled_length = int(round(bar_length * current / float(total))) if total > 0 else 0
    bar = '=' * filled_length + '-' * (bar_length - filled_length)
    
    # Carriage return to update the same line in place
    sys.stdout.write(
        f"\r[{bar}] {percentage:5.1f}% | Frame: {current}/{total} | "
        f"Elapsed: {elapsed:5.1f}s | ETA: {eta:5.1f}s | Speed: {fps:4.1f} FPS"
    )
    sys.stdout.flush()

def main():
    parser = argparse.ArgumentParser(description="Developer validation tool for offline crowd density estimation.")
    parser.add_argument("--input", required=True, help="Path to input raw video file (.mp4, .avi, etc.)")
    parser.add_argument("--output", required=True, help="Output directory path where results will be stored")
    parser.add_argument("--mode", default="overlay", choices=["overlay", "heatmap", "density", "side-by-side"],
                        help="Visual presentation mode (default: overlay)")
    parser.add_argument("--sample-fps", default="1", 
                        help="Sampling rate in frames per second (e.g. 1, 2, 5) or 'full' to process every frame (default: 1)")
    parser.add_argument("--save-frames", action="store_true", 
                        help="Optional debug flag to save individual frames in frames/ subdirectory")

    args = parser.parse_args()

    # Parse sample_fps
    sample_fps_val = args.sample_fps
    if sample_fps_val != "full":
        try:
            # Check if it represents an integer or float
            if "." in sample_fps_val:
                sample_fps_val = float(sample_fps_val)
            else:
                sample_fps_val = int(sample_fps_val)
        except ValueError:
            print(f"Error: --sample-fps must be 'full' or a positive number. Got: {args.sample_fps}")
            sys.exit(1)

    print("══════════════════════════════════════════════════════════════")
    print("           CROWD DENSITY ESTIMATION OFFLINE VALIDATOR         ")
    print("══════════════════════════════════════════════════════════════")
    print(f"  Input Video : {args.input}")
    print(f"  Output Dir  : {args.output}")
    print(f"  Visual Mode : {args.mode}")
    print(f"  Sample Rate : {args.sample_fps} FPS")
    print(f"  Debug Frames: {'ENABLED' if args.save_frames else 'DISABLED'}")
    print("──────────────────────────────────────────────────────────────")
    print("Processing...")

    try:
        metadata = process_video(
            input_path=args.input,
            output_directory=args.output,
            mode=args.mode,
            sample_fps=sample_fps_val,
            save_frames=args.save_frames,
            progress_callback=progress_bar_callback
        )
        print("\n──────────────────────────────────────────────────────────────")
        print("Processing completed successfully!")
        print("\nExecution Summary:")
        print(f"  Input File Size  : {os.path.getsize(args.input) / (1024*1024):.2f} MB")
        print(f"  Original Video   : {metadata['input_fps']} FPS")
        print(f"  Frames Processed : {metadata['frames_processed']}")
        print(f"  Frames Skipped   : {metadata['frames_skipped']}")
        print(f"  Duration Spent   : {metadata['processing_duration']} seconds")
        print(f"  Average Count    : {metadata['average_count']} people")
        print(f"  Maximum Peak     : {metadata['maximum_count']} people")
        print(f"  Minimum Count    : {metadata['minimum_count']} people")
        print(f"  Avg Inf Latency  : {metadata['average_inference_time']:.2f} ms")
        print(f"  Output Video     : {os.path.join(args.output, 'overlay.mp4')}")
        print(f"  CSV Report       : {os.path.join(args.output, 'counts.csv')}")
        print(f"  Metadata JSON    : {os.path.join(args.output, 'metadata.json')}")
        if args.save_frames:
            print(f"  Debug Frames Dir : {os.path.join(args.output, 'frames')}")
        print("══════════════════════════════════════════════════════════════")
    except Exception as e:
        print(f"\nExecution failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
