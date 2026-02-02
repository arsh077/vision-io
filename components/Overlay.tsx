
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface OverlayProps {
  onCapture: (rect: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ onCapture, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 5 && height > 5) {
      onCapture({ x, y, width, height });
    }
  };

  const rectStyle = {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black/40 cursor-crosshair overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700 text-sm font-medium shadow-2xl pointer-events-none text-white flex items-center gap-3">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        Click and drag to select an area to analyze
        <button 
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="ml-4 bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-0.5 rounded transition-colors pointer-events-auto"
        >
          Cancel
        </button>
      </div>

      {isDragging && (
        <div 
          className="absolute border-2 border-blue-400 bg-blue-400/10 shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-none"
          style={rectStyle}
        />
      )}
    </div>
  );
};

export default Overlay;
