import { useState, useEffect, useRef, useMemo } from 'react';
import { CapturedPhoto } from '@/pages/Index';

const REVEAL_PAUSE = 900;

export function useAnimatedStrip(photos: CapturedPhoto[], isVideoMode: boolean, countdownDuration: number = 3) {
  const slotDurationMs = countdownDuration * 1000;
  const [revealed, setRevealed] = useState<boolean[]>(() => Array(photos.length).fill(false));
  const [activeSlot, setActiveSlot] = useState(0);
  const [slotElapsed, setSlotElapsed] = useState(0);
  const [stripKey, setStripKey] = useState(0);
  const [isFinalLoop, setIsFinalLoop] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const restartAnimation = () => setStripKey(k => k + 1);

  useEffect(() => {
    if (!isVideoMode) return;
    setRevealed(Array(photos.length).fill(false));
    setActiveSlot(0);
    setSlotElapsed(0);
    setIsFinalLoop(false);
    
    // Force rewind all videos when restarting the sequence
    videoRefs.current.forEach(ref => {
      if (ref) {
        ref.currentTime = 0;
      }
    });
  }, [stripKey, photos.length, isVideoMode]);

  useEffect(() => {
    if (!isVideoMode || activeSlot >= photos.length) {
      setSlotElapsed(0);
      if (activeSlot >= photos.length && !isFinalLoop) {
        setIsFinalLoop(true);
      }
      return;
    }
    const start = Date.now();
    setSlotElapsed(0);
    
    function tick() {
      const elapsed = Date.now() - start;
      setSlotElapsed(elapsed);
      if (elapsed < slotDurationMs) {
        timerRef.current = setTimeout(tick, 40);
      } else {
        setRevealed((prev) => {
          const arr = [...prev];
          arr[activeSlot] = true;
          return arr;
        });
        setSlotElapsed(0);
        timerRef.current = setTimeout(() => {
          setActiveSlot((slot) => slot + 1);
        }, REVEAL_PAUSE);
      }
    }
    
    tick();
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeSlot, stripKey, photos.length, isVideoMode, slotDurationMs]);

  useEffect(() => {
    if (!isVideoMode) return;
    
    let isCancelled = false;

    revealed.forEach((isRevealed, idx) => {
      const ref = videoRefs.current[idx];
      if (photos[idx]?.videoUrl && ref) {
        const shouldPlay = isFinalLoop || (!isRevealed && idx === activeSlot);
        
        if (shouldPlay) {
          const playPromise = ref.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          ref.pause();
          ref.currentTime = 0;
          
          // Fallback: If a previous play() promise was pending, the browser might ignore our synchronous pause() call.
          // By checking again slightly later, we guarantee it gets paused after the promise resolves!
          setTimeout(() => {
            if (isCancelled) return;
            // Double check if it still shouldn't be playing!
            // We use a local state check based on the snapshot of this render.
            // If the component re-rendered and it SHOULD play, isCancelled would be true, so this wouldn't run!
            if (!ref.paused) {
              ref.pause();
              ref.currentTime = 0;
            }
          }, 150);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [revealed, activeSlot, photos, isVideoMode, isFinalLoop]);

  const getOverlayProps = (idx: number, countdown: number) => {
    if (!isVideoMode) return { show: false, alpha: 0, seconds: 0 };
    if (revealed[idx]) return { show: false, alpha: 0, seconds: 0 };
    if (idx === activeSlot) {
      const frac = 1 - Math.min(slotElapsed / slotDurationMs, 1);
      const seconds = Math.ceil(frac * countdown) || 1;
      return { show: true, alpha: frac, seconds };
    }
    return { show: true, alpha: 1, seconds: countdown };
  };

  return {
    revealed,
    activeSlot,
    slotElapsed,
    isFinalLoop,
    videoRefs,
    getOverlayProps,
    restartAnimation
  };
}
