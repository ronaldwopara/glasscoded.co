// src/app/page.js
"use client";

import { useState } from 'react';
import { artworks } from '../data/artworks';
import ArtCanvas from './components/ArtCanvas';

export default function Gallery() {
  // 1. State: Track which artwork is currently on screen
  const [activeIndex, setActiveIndex] = useState(0);
  const activeArtwork = artworks[activeIndex];

  // 2. Navigation Handlers (Loops back to the start when reaching the end)
  const handleNext = () => {
    setActiveIndex((prev) => (prev === artworks.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? artworks.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans flex flex-col selection:bg-black selection:text-white">
      
      {/* --- TOP NAVIGATION --- */}
      <header className="flex justify-between items-center px-12 py-10">
        <div className="text-xl font-bold tracking-tighter uppercase">Studio</div>
        <div className="flex gap-12 text-sm tracking-wide text-gray-400 font-medium">
          <button className="hover:text-black transition-colors duration-300">Clients</button>
          <button className="hover:text-black transition-colors duration-300">Contact</button>
        </div>
        <button className="px-8 py-3 bg-black text-white text-xs tracking-[0.2em] uppercase hover:bg-gray-800 transition-colors duration-300">
          Get in Touch
        </button>
      </header>

      {/* --- MAIN GRID LAYOUT --- */}
      <main className="flex-1 grid grid-cols-12 gap-16 px-12 pb-12 items-center">
        
        {/* LEFT COLUMN: Typography & Context */}
        <div className="col-span-5 flex flex-col pr-8">
          {/* Animated wrapper for smooth text swapping */}
          <div key={activeArtwork.id} className="animate-fade-in">
            <h1 className="text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[1.1]">
              {activeArtwork.title}
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-md font-light">
              {activeArtwork.description}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: The WebGL Canvas Area */}
        <div className="col-span-7 relative flex flex-col h-[75vh]">
          
          {/* Forward / Back Controls */}
          <div className="absolute top-6 right-6 z-20 flex gap-3">
            <button 
              onClick={handlePrev}
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-black flex items-center justify-center transition-all duration-300 shadow-sm"
              aria-label="Previous Artwork"
            >
              ←
            </button>
            <button 
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-black flex items-center justify-center transition-all duration-300 shadow-sm"
              aria-label="Next Artwork"
            >
              →
            </button>
          </div>

          {/* THE LIVE CANVAS */}
          <ArtCanvas activeData={activeArtwork} />

        </div>
      </main>

    </div>
  );
}