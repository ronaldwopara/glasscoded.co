import os

# Ensure this points to your Next.js public folder
PUBLIC_DIR = "../luxury-gallery/public"

def smart_standardize():
    print("💎 Initializing Smart Semantic Standardizer...\n")
    
    if not os.path.exists(PUBLIC_DIR):
        print(f"❌ Error: Cannot find {PUBLIC_DIR}.")
        return

    all_items = os.listdir(PUBLIC_DIR)
    target_folders = [f for f in all_items if os.path.isdir(os.path.join(PUBLIC_DIR, f)) and 
                     (f.endswith("_frames_webp") or f.endswith("_depth_webp"))]

    for folder_name in target_folders:
        folder_path = os.path.join(PUBLIC_DIR, folder_name)
        
        # 1. Extract the semantic prefix (e.g., 'crown-royal' from 'crown-royal_frames_webp')
        if "_frames_webp" in folder_name:
            prefix = folder_name.replace("_frames_webp", "")
        else:
            prefix = folder_name.replace("_depth_webp", "")
            
        files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith('.webp')])
        
        if not files:
            continue
            
        print(f"📁 Processing {folder_name} -> Prefix: '{prefix}'")
        
        # 2. Rename using the Premium Convention: prefix_0001.webp
        renamed_count = 0
        for index, filename in enumerate(files, start=1):
            new_name = f"{prefix}_{index:04d}.webp"
            
            if filename != new_name:
                old_path = os.path.join(folder_path, filename)
                new_path = os.path.join(folder_path, new_name)
                os.rename(old_path, new_path)
                renamed_count += 1
                
        print(f"   ↳ Standardized {renamed_count} files.\n")

    print("✅ SUCCESS! All files now feature semantic identifiers.")

if __name__ == "__main__":
    smart_standardize()