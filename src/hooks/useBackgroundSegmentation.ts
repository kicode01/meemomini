import { useEffect, useRef, useState } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { PhotoSettings } from '@/pages/Index';

export const useBackgroundSegmentation = (
  videoRef: React.RefObject<HTMLVideoElement>,
  segmentationCanvasRef: React.RefObject<HTMLCanvasElement>,
  settings: PhotoSettings
) => {
  const [isSegmenterLoaded, setIsSegmenterLoaded] = useState(false);
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    let isMounted = true;

    const initSegmenter = async () => {
      if (segmenterRef.current) {
        setIsSegmenterLoaded(true);
        return; // Already loaded
      }

      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        // MediaPipe GPU delegate is notoriously buggy on iOS Safari due to WebGL limitations.
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
            delegate: isIOS ? "CPU" : "GPU"
          },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: false
        });

        if (isMounted) {
          segmenterRef.current = segmenter;
          setIsSegmenterLoaded(true);
        } else {
          segmenter.close();
        }
      } catch (error) {
        console.error("Failed to initialize ImageSegmenter:", error);
      }
    };

    // Preload the segmenter immediately on mount so it's ready instantly when the user clicks a background
    initSegmenter();

    return () => {
      isMounted = false;
      if (segmenterRef.current) {
        segmenterRef.current.close();
        segmenterRef.current = null;
      }
    };
  }, []); // Run ONLY once on mount!

  // We persist these offscreen canvases across effect re-runs
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    if (!tempMaskCanvasRef.current) {
      tempMaskCanvasRef.current = document.createElement('canvas');
    }

    // We start the loop whenever the segmenter is loaded. 
    // We do NOT depend on settings.virtualBackground for the loop itself, 
    // because that would needlessly destroy and recreate the loop on every background change!
    // Instead, the loop just keeps running and updating the canvas as long as a virtual background is active.
    if (!isSegmenterLoaded || !videoRef.current || !segmentationCanvasRef.current || settings.virtualBackground === 'none') {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = segmentationCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) return;

    let lastVideoTime = -1;
    const offscreenCanvas = offscreenCanvasRef.current!;
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
    const tempMaskCanvas = tempMaskCanvasRef.current!;
    const tempMaskCtx = tempMaskCanvas.getContext('2d', { willReadFrequently: true })!;

    const renderLoop = async () => {
      // If virtual background was turned off during the loop, stop
      if (settings.virtualBackground === 'none') return;
      
      try {
        if (video.readyState >= 2 && video.currentTime !== lastVideoTime && segmenterRef.current && offscreenCtx) {
          lastVideoTime = video.currentTime;
          
          // Ensure canvases match video size
          if (canvas.width !== video.videoWidth || offscreenCanvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            offscreenCanvas.width = video.videoWidth;
            offscreenCanvas.height = video.videoHeight;
          }
          
          // 1. Draw video to offscreen canvas FIRST to strip any CSS transforms
          offscreenCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const startTimeMs = performance.now();
          // 2. Segment the clean offscreen canvas instead of the CSS-transformed video
          const segmentationResult = segmenterRef.current.segmentForVideo(offscreenCanvas, startTimeMs);

          if (segmentationResult.categoryMask) {
            const mask = segmentationResult.categoryMask;
            
            if (tempMaskCanvas.width !== mask.width || tempMaskCanvas.height !== mask.height) {
              tempMaskCanvas.width = mask.width;
              tempMaskCanvas.height = mask.height;
            }

            const maskImageData = new ImageData(mask.width, mask.height);
            const data = maskImageData.data;
            const maskPixels = mask.getAsUint8Array();
            
            // Robust auto-detect: The top-left pixel is almost always background.
            const bgValue = maskPixels[0];
            
            for (let i = 0; i < maskPixels.length; i++) {
              const isPerson = maskPixels[i] !== bgValue;
              const alpha = isPerson ? 255 : 0;
              
              data[i * 4] = 0;     // R
              data[i * 4 + 1] = 0; // G
              data[i * 4 + 2] = 0; // B
              data[i * 4 + 3] = alpha; // A
            }
            
            if (tempMaskCtx) {
              tempMaskCtx.putImageData(maskImageData, 0, 0);
            }
            
            // Clear offscreen canvas for compositing
            offscreenCtx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply a slight blur to soften the mask edges for a more natural look
            offscreenCtx.filter = 'blur(3px)';
            
            // 3. Draw the scaled mask onto the offscreen canvas
            offscreenCtx.drawImage(tempMaskCanvas, 0, 0, canvas.width, canvas.height);
            
            // 4. Composite the video using "source-in" (keeps video only where mask is opaque)
            offscreenCtx.filter = 'none'; // reset filter
            offscreenCtx.globalCompositeOperation = "source-in";
            offscreenCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
            offscreenCtx.globalCompositeOperation = "source-over"; // reset

            // 5. Draw the final masked person onto the main visible canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(offscreenCanvas, 0, 0);
          }
        }
      } catch (err) {
        console.error("Segmentation loop error:", err);
      } finally {
        requestRef.current = requestAnimationFrame(renderLoop);
      }
    };

    if (video.readyState >= 2 && !video.paused) {
      renderLoop();
    } else {
      video.addEventListener('play', renderLoop, { once: true });
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      video.removeEventListener('play', renderLoop);
    };
  }, [isSegmenterLoaded, settings.virtualBackground]); // Restart the loop when background toggles

  return { isSegmenterLoaded };
};
