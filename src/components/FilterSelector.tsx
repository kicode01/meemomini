import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Filter as FilterIcon, Settings2, Maximize2, X } from "lucide-react";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";

export interface FilterDef {
  id: string;
  name: string;
  css: string;
}

interface FilterSelectorProps {
  filters: FilterDef[];
  selectedFilter: string;
  setSelectedFilter: (f: string) => void;
  isCapturing: boolean;
  contrast: number;
  setContrast: (v: number) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  resetAdvancedSettings: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  isMirrored: boolean;
}

const FilterSelector = ({
  filters, selectedFilter, setSelectedFilter, isCapturing,
  contrast, setContrast, brightness, setBrightness, saturation, setSaturation, resetAdvancedSettings,
  videoRef, isMirrored
}: FilterSelectorProps) => {
  const [isFullScreenView, setIsFullScreenView] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    isClosingRef.current = isClosing;
  }, [isClosing]);

  const toggleFullScreen = () => {
    if (isFullScreenView) {
      setIsClosing(true);
      setTimeout(() => {
        setIsFullScreenView(false);
        setIsClosing(false);
      }, 300);
    } else {
      setIsFullScreenView(true);
    }
  };
  
  // Store refs to all rendered canvas elements
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  // Track which canvases are currently visible on screen
  const visibleImages = useRef<Set<string>>(new Set());
  
  // Track scrolling state for performance optimization
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150); // Resume 150ms after scrolling stops
    };

    // Use capture phase to catch scroll events from any nested container
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    // 1. Setup IntersectionObserver to track which filters are visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-filter-id");
          if (id) {
            if (entry.isIntersecting) {
              visibleImages.current.add(id);
            } else {
              visibleImages.current.delete(id);
            }
          }
        });
      },
      { root: null, rootMargin: "50px", threshold: 0.1 }
    );

    // Observe all filter containers
    const elements = document.querySelectorAll('.filter-btn-container');
    elements.forEach(el => observer.observe(el));

    // 2. Setup ultra-high-performance canvas drawing loop
    let animationFrameId: number;
    let lastDrawTime = 0;
    const fpsInterval = 1000 / 30; // 30fps

    const drawFrames = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(drawFrames);

      // OPTIMIZATION: Completely pause canvas drawing while actively scrolling.
      // This prevents layout thrashing and stuttering on lower-end devices.
      if (isScrollingRef.current) return;

      if (timestamp - lastDrawTime < fpsInterval) return;
      lastDrawTime = timestamp;

      if (videoRef.current && videoRef.current.readyState >= 2 && visibleImages.current.size > 0) {
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        if (!vw || !vh) return;

        // Draw directly to the visible canvases - no base64, no memory bloat!
        visibleImages.current.forEach(id => {
          // PAUSE inline rendering while the modal is fully open to save CPU/GPU.
          // They instantly unpause during the fade-out animation (isClosingRef.current) 
          // so the transition remains perfectly smooth!
          if (isFullScreenView && !isClosingRef.current && id.startsWith('inline-')) {
            return;
          }

          const canvasEl = canvasRefs.current.get(id);
          if (canvasEl) {
            // Keep internal resolution low for performance (1/3 size)
            if (canvasEl.width !== Math.floor(vw / 3)) {
              canvasEl.width = Math.floor(vw / 3);
              canvasEl.height = Math.floor(vh / 3);
            }
            
            const ctx = canvasEl.getContext("2d", { alpha: false, willReadFrequently: false });
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, canvasEl.width, canvasEl.height);
            }
          }
        });
      }
    };

    animationFrameId = requestAnimationFrame(drawFrames);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [videoRef, filters, isFullScreenView]);

  // The grid of filter buttons
  const renderGrid = (isFullScreenMode: boolean, prefix: string) => {
    // Dynamic classes based on view mode
    const gridClasses = isFullScreenMode
      ? "flex-1 min-h-0 w-full flex flex-wrap justify-center content-center gap-2"
      : "grid gap-3 pb-8 grid-cols-3";

    return (
      <div className={gridClasses}>
        {filters.map(filter => {
          const isActive = selectedFilter === filter.id;
          
          const buttonClasses = isFullScreenMode
            ? `filter-btn-container relative flex-grow-0 flex-shrink-0 w-[calc(25%-0.5rem)] sm:w-[calc(16.66%-0.5rem)] md:w-[calc(12.5%-0.5rem)] lg:w-[calc(10%-0.5rem)] h-[calc(24%-0.5rem)] flex flex-col items-center overflow-hidden rounded-xl transition-all duration-300 shadow-md bg-slate-100 ring-1 ring-slate-200 hover-rainbow-ring`
            : `filter-btn-container relative flex flex-col items-center overflow-hidden rounded-2xl transition-all duration-300 aspect-[3/4] shadow-sm ${
                isActive ? 'ring-4 ring-blue-500 scale-[1.02] shadow-blue-500/30' : 'ring-1 ring-slate-200 hover:ring-slate-300 hover:scale-[1.02]'
              }`;

          return (
            <button
              key={`${prefix}-${filter.id}`}
              id={`filter-container-${prefix}-${filter.id}`}
              data-filter-id={`${prefix}-${filter.id}`}
              className={buttonClasses}
              onClick={() => {
                setSelectedFilter(filter.id);
                if (isFullScreenMode) {
                  toggleFullScreen();
                }
              }}
              disabled={isCapturing}
            >
              {/* 30fps Direct Canvas Render with CSS filter applied */}
              <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                 <canvas
                    ref={(el) => {
                      if (el) canvasRefs.current.set(`${prefix}-${filter.id}`, el);
                      else canvasRefs.current.delete(`${prefix}-${filter.id}`);
                    }}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75"
                    style={{
                      transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
                      filter: filter.css
                    }}
                  />
              </div>
              
              {/* Name Overlay (Only in normal view) */}
              {!isFullScreenMode && (
                <div className="absolute bottom-0 inset-x-0 p-1 md:p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <span className={`block text-[10px] md:text-xs font-black tracking-wide text-center drop-shadow-md leading-tight ${isActive ? 'text-blue-300' : 'text-white'}`}>
                    {filter.name}
                  </span>
                </div>
              )}
              
              {isActive && !isFullScreenMode && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Normal Inline View (Always in DOM to prevent layout flash) */}
      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar w-full relative">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-slate-400 font-black text-[11px] tracking-[0.15em] uppercase">
            Filter Presets
          </label>
          <div className="flex items-center gap-2">
              <button 
                onClick={toggleFullScreen}
                className="p-2.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-sm"
                title="Expand to Full Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <AdvancedSettingsPanel
                contrast={contrast}
                setContrast={setContrast}
                brightness={brightness}
                setBrightness={setBrightness}
                saturation={saturation}
                setSaturation={setSaturation}
                reset={resetAdvancedSettings}
              />
          </div>
        </div>
        {renderGrid(false, 'inline')}
      </div>

      {/* Full Screen Overlay View - NON-SCROLLABLE MOSAIC */}
      {(isFullScreenView || isClosing) && createPortal(
        <div className={`fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col overflow-hidden ${
          isClosing ? 'animate-out fade-out zoom-out-95 duration-300 ease-in-out fill-mode-forwards' : 'animate-in fade-in zoom-in-95 duration-300 ease-out'
        }`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-2 drop-shadow-lg bg-white/60 px-5 py-3 rounded-xl backdrop-blur-md shadow-xl border border-white/50">
              <img src="/meemomini_front.png" alt="logo" className="h-6 md:h-8 w-auto object-contain" />
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-[#0b0c10] leading-none pt-1">
                meemomini<span className="animate-color-cycle">.</span>
              </h1>
            </div>
          </div>
          
          {/* Mosaic Grid Area - Flexbox perfectly centers remaining items */}
          <div className="flex-1 w-full h-full p-2 md:p-4 flex flex-col">
            {renderGrid(true, 'fs')}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default FilterSelector;
