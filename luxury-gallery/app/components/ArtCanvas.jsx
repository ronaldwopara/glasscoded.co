// app/components/ArtCanvas.jsx
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useArtPreloader } from '../hooks/useArtPreloader';

// --- THE SHADERS ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uImage;
  uniform sampler2D uDepth;
  uniform vec2 uMouse;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    float depth = texture2D(uDepth, vUv).r;
    vec2 offset = uMouse * depth * uIntensity;
    gl_FragColor = texture2D(uImage, vUv + offset);
  }
`;

export default function ArtCanvas({ activeData }) {
  const containerRef = useRef(null);
  
  // 1. Initialize our custom Preloader Hook
  const { isLoading, progress, texturesRef } = useArtPreloader(activeData);

  // 2. Physics State (Refs prevent React re-renders during 60fps animation)
  const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const frameRef = useRef({ target: 0, current: 0 });

  useEffect(() => {
    if (!containerRef.current || !activeData) return;

    // --- SCENE SETUP ---
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- MATERIAL SETUP ---
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uImage: { value: null },
        uDepth: { value: null },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uIntensity: { value: 0.015 } // The Golden Rule: Keep this low (0.01 - 0.02)
      }
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- INTERACTION TRACKING ---
    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      // MACRO: Horizontal movement scrubs the 240 frames
      frameRef.current.target = x * (activeData.frameCount - 1);

      // MICRO: X and Y movement drives the depth map parallax
      mouseRef.current.targetX = x - 0.5;
      mouseRef.current.targetY = 1.0 - y - 0.5; 
    };

    const handleMouseLeave = () => {
      // Gently return depth to center when mouse leaves the canvas
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // --- RENDER LOOP (The 60fps Engine) ---
    let animationId;
    const render = () => {
      // Only attempt to render if the preloader has finished
      if (!isLoading && texturesRef.current.frames.length > 0) {
        
        // INERTIA MATH: This creates the "expensive" heavy weight feel
        frameRef.current.current += (frameRef.current.target - frameRef.current.current) * 0.08;
        mouseRef.current.currentX += (mouseRef.current.targetX - mouseRef.current.currentX) * 0.05;
        mouseRef.current.currentY += (mouseRef.current.targetY - mouseRef.current.currentY) * 0.05;

        // Apply calculated values to the shader
        const currentIndex = Math.floor(frameRef.current.current);
        const safeIndex = Math.max(0, Math.min(currentIndex, activeData.frameCount - 1));

        material.uniforms.uImage.value = texturesRef.current.frames[safeIndex];
        material.uniforms.uDepth.value = texturesRef.current.depths[safeIndex];
        material.uniforms.uMouse.value.set(mouseRef.current.currentX, mouseRef.current.currentY);
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(render);
    };

    render();

    // --- TEARDOWN (Critical for Next.js routing) ---
    const handleResize = () => {
        if (container) renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeData, isLoading, texturesRef]); // Reacts to preloader finishing

  return (
    <div className="relative w-full h-full bg-[#111] overflow-hidden rounded-2xl">
      {/* Loading Overlay */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#111] text-gray-400 font-mono text-xs uppercase tracking-widest transition-opacity duration-700 pointer-events-none ${isLoading ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="mb-3 w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></span>
        <span className="tracking-[0.3em]">Loading Neural Textures</span>
        <span className="mt-2 text-gray-600">[{progress}%]</span>
      </div>
      
      {/* The WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        className={`w-full h-full transition-opacity duration-1000 cursor-crosshair ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
}