import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ZoomContainerProps {
  children: React.ReactNode;
  className?: string;
  minScale?: number;
  maxScale?: number;
  allowScaleUp?: boolean;
  controlsVisible?: boolean;
}

export const ZoomContainer: React.FC<ZoomContainerProps> = ({ 
  children, 
  className = "",
  minScale = 0.2,
  maxScale = 2.5,
  allowScaleUp = false,
  controlsVisible = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [isFit, setIsFit] = useState(true);

  // We need a stable function for ResizeObserver
  const calculateFitScale = () => {
    if (!containerRef.current || !contentRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Force the content to measure its true intrinsic size without scale
    const contentWidth = contentRef.current.scrollWidth;
    const contentHeight = contentRef.current.scrollHeight;
    
    if (contentWidth === 0 || contentHeight === 0 || containerWidth === 0 || containerHeight === 0) return;
    
    // Add some padding (e.g. 0.9 for 90% of screen)
    const scaleX = (containerWidth * 0.9) / contentWidth;
    const scaleY = (containerHeight * 0.9) / contentHeight;
    
    // Never scale UP by default if the content is small enough, only scale down if it's too big
    let newFitScale = Math.min(scaleX, scaleY);
    if (!allowScaleUp && newFitScale > 1) {
      newFitScale = 1;
    }

    setFitScale(newFitScale);
  };

  useEffect(() => {
    calculateFitScale();
    
    const observer = new ResizeObserver(() => {
      calculateFitScale();
    });
    
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    
    window.addEventListener('resize', calculateFitScale);
    
    // Small delay to recalculate after images load or layout shifts
    const timeout = setTimeout(calculateFitScale, 100);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateFitScale);
      clearTimeout(timeout);
    };
  }, []);

  // Sync scale with fitScale if it's supposed to fit
  useEffect(() => {
    if (isFit) {
      setScale(fitScale);
    }
  }, [fitScale, isFit]);

  const handleZoomIn = () => {
    setIsFit(false);
    setScale(prev => Math.min(prev * 1.3, maxScale));
  };

  const handleZoomOut = () => {
    setIsFit(false);
    setScale(prev => Math.max(prev / 1.3, minScale));
  };

  const handleFit = () => {
    setIsFit(true);
    setScale(fitScale);
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden flex items-center justify-center ${className}`}>
      
      {/* Interactive controls */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`absolute top-4 right-4 flex flex-col gap-2 z-[100] bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-lg border border-slate-200 transition-opacity ${!controlsVisible ? 'pointer-events-none' : ''}`}
      >
        <button 
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-blue-500 transition-colors shadow-sm"
          title="Zoom In"
        >
          <ZoomIn size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-blue-500 transition-colors shadow-sm"
          title="Zoom Out"
        >
          <ZoomOut size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={handleFit}
          className={`w-8 h-8 rounded-full bg-white flex items-center justify-center transition-colors shadow-sm ${isFit ? 'text-blue-500 bg-blue-50' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-500'}`}
          title="Fit to Screen"
        >
          <Maximize size={16} strokeWidth={2.5} />
        </button>
      </motion.div>

      <motion.div
        drag={!isFit}
        dragConstraints={containerRef}
        dragElastic={0.1}
        animate={{ scale }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{ touchAction: 'none' }}
        className={`flex items-center justify-center origin-center ${!isFit ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div ref={contentRef} className="w-auto h-auto relative flex flex-col items-center justify-center origin-center">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
