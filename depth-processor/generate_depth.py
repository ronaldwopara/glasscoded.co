import os
import torch  # pyright: ignore[reportMissingImports]
from PIL import Image  # pyright: ignore[reportMissingImports]
from transformers import pipeline  # pyright: ignore[reportMissingImports]
from tqdm import tqdm  # pyright: ignore[reportMissingModuleSource]

# --- CONFIGURATION ---
INPUT_DIR = "../videos/video_frames/perfume_video_frames"  # Your source PNGs
FRAMES_OUT = "perfume_frames_webp"  # Your optimized web frames
DEPTH_OUT = "perfume_depth_webp"    # Your depth maps
# Using Depth Anything V2 for the best balance of speed and structural edges
MODEL_ID = "depth-anything/Depth-Anything-V2-Small-hf"

def run_pipeline():
    # Setup Device (Nvidia GPU, Apple Silicon, or CPU)
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"💎 Initializing Premium Pipeline on: {device.upper()}")

    # Initialize Depth Model
    pipe = pipeline(task="depth-estimation", model=MODEL_ID, device=device)

    # Create output directories
    for folder in [FRAMES_OUT, DEPTH_OUT]:
        if not os.path.exists(folder):
            os.makedirs(folder)

    # Collect and sort PNGs
    files = sorted([f for f in os.listdir(INPUT_DIR) if f.lower().endswith('.png')])
    print(f"🚀 Processing {len(files)} frames for Perfume project...")

    for filename in tqdm(files):
        # 1. Load Original PNG
        path = os.path.join(INPUT_DIR, filename)
        img = Image.open(path).convert("RGB")
        
        # Define clean name (0001.webp)
        clean_name = os.path.splitext(filename)[0] + ".webp"

        # 2. STEP ONE: Convert to Optimized WebP Frame
        # Quality 90 keeps the premium Smirnoff glass/liquid details perfect
        frame_path = os.path.join(FRAMES_OUT, clean_name)
        img.save(frame_path, "WEBP", quality=90, method=6) # method 6 = highest compression effort

        # 3. STEP TWO: Generate Depth from that Frame
        # We use the optimized image to ensure depth matches what the user sees
        result = pipe(img)
        depth_map = result["depth"]

        # 4. Save Depth as WebP
        # Quality 75 is plenty for a displacement map; it saves space without losing detail
        depth_path = os.path.join(DEPTH_OUT, clean_name)
        depth_map.save(depth_path, "WEBP", quality=75)

    print(f"\n✅ SUCCESS!")
    print(f"📁 Optimized Visuals: {FRAMES_OUT}")
    print(f"📁 Interaction Maps: {DEPTH_OUT}")

if __name__ == "__main__":
    run_pipeline()