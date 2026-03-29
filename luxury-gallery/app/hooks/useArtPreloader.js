// src/app/hooks/useArtPreloader.js
"use client";

import { useState, useEffect, useRef, startTransition } from 'react';
import * as THREE from 'three';

export function useArtPreloader(activeData) {
  const artworkId = activeData?.id ?? null;
  // Which artwork id has finished loading (null until first completes)
  const [loadedId, setLoadedId] = useState(null);
  const [progress, setProgress] = useState(0);

  const isLoading = artworkId != null && loadedId !== artworkId;

  // We use a Ref for textures so updating them doesn't cause infinite React re-renders
  const texturesRef = useRef({ frames: [], depths: [] });

  useEffect(() => {
    if (!activeData) return;

    // Safety switch: If a user clicks "Next" while an artwork is still loading,
    // this tells the engine to abandon the old download and start the new one.
    let isCancelled = false;
    const loadTargetId = activeData.id;

    startTransition(() => {
      setProgress(0);
    });

    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    const frames = new Array(activeData.frameCount);
    const depths = new Array(activeData.frameCount);

    // Track the exact percentage of downloaded files
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (isCancelled) return;
      setProgress(Math.round((itemsLoaded / itemsTotal) * 100));
    };

    // Unlock the vault when all 480 files are ready
    manager.onLoad = () => {
      if (isCancelled) return;
      texturesRef.current = { frames, depths };
      setLoadedId(loadTargetId);
    };

    // Fire off the 480 download requests to the /public folder
    for (let i = 1; i <= activeData.frameCount; i++) {
      const num = String(i).padStart(4, '0');
      frames[i - 1] = loader.load(`/${activeData.folderPrefix}_frames_webp/${activeData.folderPrefix}_${num}.webp`);
      depths[i - 1] = loader.load(`/${activeData.folderPrefix}_depth_webp/${activeData.folderPrefix}_${num}.webp`);
    }

    // Garbage Collection: Clears VRAM if the component unmounts
    return () => {
      isCancelled = true;
      frames.forEach(t => t && t.dispose());
      depths.forEach(t => t && t.dispose());
    };
  }, [activeData]); // Re-run this massive function ONLY when the artwork changes

  return { isLoading, progress, texturesRef };
}