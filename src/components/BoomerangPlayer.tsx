import { useState, useEffect } from 'react';
import { CapturedPhoto } from '@/pages/Index';

interface BoomerangPlayerProps {
  photo: CapturedPhoto;
  className?: string;
  style?: React.CSSProperties;
}

const BoomerangPlayer = ({ photo, className, style }: BoomerangPlayerProps) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!photo.frames || photo.frames.length === 0) return;
    
    let lastTime = performance.now();
    let animationFrameId: number;
    const fps = 15;
    const interval = 1000 / fps;

    const tick = (now: number) => {
      if (now - lastTime >= interval) {
        setFrameIndex(prev => (prev + 1) % photo.frames!.length);
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [photo.frames]);

  if (!photo.frames || photo.frames.length === 0) {
    return null;
  }

  return (
    <img 
      src={photo.frames[frameIndex]} 
      alt="Boomerang"
      className={className || "w-full h-full object-cover rounded-xl shadow-lg border-4 border-white"}
      style={style}
    />
  );
};

export default BoomerangPlayer;
