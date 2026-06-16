"use client";

import React, { useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from "lucide-react";

export type CropState = { x: number; y: number; zoom: number };

interface PhotoEditorProps {
  imageUrl: string;
  imageRatio: number; // naturalWidth / naturalHeight
  crop: CropState;
  onChangeCrop: (crop: CropState) => void;
  onReset: () => void;
  onChangePhoto: () => void;
}

const CONTAINER_ASPECT = 1;

export function PhotoEditor({ imageUrl, imageRatio, crop, onChangeCrop, onReset, onChangePhoto }: PhotoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate base dimensions in percentages
  const coverWidthRatio = imageRatio > CONTAINER_ASPECT ? imageRatio / CONTAINER_ASPECT : 1;
  const coverHeightRatio = imageRatio > CONTAINER_ASPECT ? 1 : CONTAINER_ASPECT / imageRatio;

  const currentWidthPct = coverWidthRatio * crop.zoom * 100;
  const currentHeightPct = coverHeightRatio * crop.zoom * 100;

  // Clamping function
  const clampCrop = (newX: number, newY: number, newZoom: number) => {
    const wPct = coverWidthRatio * newZoom * 100;
    const hPct = coverHeightRatio * newZoom * 100;
    const mX = 100 - wPct;
    const mY = 100 - hPct;
    
    return {
      x: Math.min(0, Math.max(mX, newX)),
      y: Math.min(0, Math.max(mY, newY)),
      zoom: newZoom,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    onChangeCrop(clampCrop(crop.x + dx, crop.y + dy, crop.zoom));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Only prevent default if we are actively wheeling inside, though passive event listeners might complain.
    // For a simple editor, this is acceptable.
    const zoomSpeed = 0.05;
    const newZoom = Math.max(1, Math.min(3, crop.zoom - (e.deltaY > 0 ? zoomSpeed : -zoomSpeed)));
    onChangeCrop(clampCrop(crop.x, crop.y, newZoom));
  };

  return (
    <div className="w-full max-w-[280px] mx-auto sm:mx-0 border border-gray-200 rounded-xl p-4 bg-white shadow-sm mt-4">
      <p className="text-sm font-semibold text-gray-700 mb-2">Adjust Photo</p>
      
      {/* Editor Viewport */}
      <div 
        ref={containerRef}
        className="w-full relative overflow-hidden bg-gray-100 rounded-lg cursor-move touch-none aspect-square"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <img 
          src={imageUrl} 
          alt="Crop preview" 
          draggable={false}
          className="absolute max-w-none pointer-events-none"
          style={{
            left: `${crop.x}%`,
            top: `${crop.y}%`,
            width: `${currentWidthPct}%`,
            height: `${currentHeightPct}%`,
            transformOrigin: '0 0'
          }}
        />
      </div>

      <div className="text-center mt-2">
        <p className="text-[10px] text-gray-500">Drag to reposition • Scroll to zoom</p>
      </div>

      {/* Zoom Slider */}
      <div className="flex items-center gap-2 mt-4">
        <ZoomOut className="w-4 h-4 text-gray-400" />
        <input 
          type="range" 
          min="1" max="3" step="0.01" 
          value={crop.zoom}
          onChange={(e) => onChangeCrop(clampCrop(crop.x, crop.y, parseFloat(e.target.value)))}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <ZoomIn className="w-4 h-4 text-gray-400" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button type="button" onClick={onReset} className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center">
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </button>
        <button type="button" onClick={onChangePhoto} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
          <ImageIcon className="w-3 h-3 mr-1" /> Change Photo
        </button>
      </div>
    </div>
  );
}
