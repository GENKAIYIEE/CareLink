'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';

interface SignaturePadProps {
  onSignatureCapture: (base64String: string | null) => void;
}

export default function SignaturePad({ onSignatureCapture }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e && e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onSignatureCapture(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath(); // Reset path
    setHasDrawn(false);
    onSignatureCapture(null);
  };

  return (
    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner relative w-full">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors border border-slate-300"
          title="Clear Signature"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>
      {!hasDrawn && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-30 select-none">
          <span className="font-bold text-2xl tracking-widest text-slate-500">SIGN HERE</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Use Finger or Mouse</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-48 touch-none cursor-crosshair relative z-0 bg-transparent"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-8 border-t-2 border-dashed border-slate-200 mx-8 pointer-events-none"></div>
    </div>
  );
}
