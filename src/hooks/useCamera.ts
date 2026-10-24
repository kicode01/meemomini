import { useState, useRef, useEffect, useCallback } from 'react';
import { CapturedPhoto, PhotoSettings } from '../pages/Index';
import { playBeep, playShutter } from '../utils/SoundEffects';

export const useCamera = (settings: PhotoSettings, onPhotosComplete: (photos: CapturedPhoto[]) => void) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const segmentationCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const retakeRequestedRef = useRef(false);

  // Advanced Filters
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: settings.facingMode, width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      streamRef.current = mediaStream;
      setError('');
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions and try again.');
      console.error('Camera access error:', err);
    }
  }, [settings.facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const applyAspectRatioCrop = (sourceCanvas: HTMLCanvasElement) => {
    let finalCanvas = sourceCanvas;
    if (settings.aspectRatio === 'portrait' && sourceCanvas.width > sourceCanvas.height) {
      const portraitCanvas = document.createElement('canvas');
      portraitCanvas.width = sourceCanvas.height * 0.75;
      portraitCanvas.height = sourceCanvas.height;
      const pCtx = portraitCanvas.getContext('2d');
      if (pCtx) {
        const dx = (sourceCanvas.width - portraitCanvas.width) / 2;
        pCtx.drawImage(sourceCanvas, dx, 0, portraitCanvas.width, portraitCanvas.height, 0, 0, portraitCanvas.width, portraitCanvas.height);
        finalCanvas = portraitCanvas;
      }
    } else if (settings.aspectRatio === 'landscape' && sourceCanvas.height > sourceCanvas.width) {
      const landscapeCanvas = document.createElement('canvas');
      landscapeCanvas.width = sourceCanvas.width;
      landscapeCanvas.height = sourceCanvas.width * 0.75;
      const lCtx = landscapeCanvas.getContext('2d');
      if (lCtx) {
        const dy = (sourceCanvas.height - landscapeCanvas.height) / 2;
        lCtx.drawImage(sourceCanvas, 0, dy, landscapeCanvas.width, landscapeCanvas.height, 0, 0, landscapeCanvas.width, landscapeCanvas.height);
        finalCanvas = landscapeCanvas;
      }
    }
    return finalCanvas;
  };

  const capturePhoto = async (filterCss: string) => {
    if (settings.selectedARFilter.startsWith('jeeliz_')) {
      return new Promise<string | null>((resolve) => {
        const iframe = document.getElementById('jeeliz-iframe') as HTMLIFrameElement;
        if (!iframe || !iframe.contentWindow) {
          resolve(null);
          return;
        }

        const handleMessage = (e: MessageEvent) => {
          if (e.data && e.data.type === 'CAPTURED_PHOTO') {
            window.removeEventListener('message', handleMessage);
            
            // We must bake the filterCss and mirror settings into the raw iframe capture
            const img = new Image();
            img.onload = () => {
              if (!canvasRef.current) {
                resolve(e.data.dataUrl);
                return;
              }
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (!ctx) {
                resolve(e.data.dataUrl);
                return;
              }

              // We want to force the output to be exactly 640x480 (4:3) to match the native camera, 
              // regardless of the Jeeliz iframe's actual viewport dimensions.
              canvas.width = 640;
              canvas.height = 480;
              
              ctx.filter = filterCss;
              
              // The WebGL buffer from Jeeliz is un-mirrored natively (they mirror it visually with CSS rotateY).
              // So if the user wants a mirrored photo (settings.isMirrored === true), we must flip the canvas during draw!
              if (settings.isMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
              }
              
              // Draw using 'cover' logic to fill 640x480 without squishing
              const imgAspect = img.width / img.height;
              const canvasAspect = canvas.width / canvas.height;
              let drawW = canvas.width;
              let drawH = canvas.height;
              let drawX = 0;
              let drawY = 0;
              
              if (imgAspect > canvasAspect) {
                // Image is wider than canvas
                drawW = canvas.height * imgAspect;
                drawX = (canvas.width - drawW) / 2;
              } else {
                // Image is taller than canvas
                drawH = canvas.width / imgAspect;
                drawY = (canvas.height - drawH) / 2;
              }
              
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
              
              // Reset transform if we changed it
              if (settings.isMirrored) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
              ctx.filter = 'none';
              
              const croppedCanvas = applyAspectRatioCrop(canvas);
              resolve(croppedCanvas.toDataURL('image/jpeg', 0.9));
            };
            img.src = e.data.dataUrl;
          }
        };

        window.addEventListener('message', handleMessage);
        iframe.contentWindow.postMessage('CAPTURE', '*');
        
        // Timeout fallback in case iframe doesn't respond
        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          resolve(null);
        }, 1500);
      });
    }

    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.filter = filterCss;
    
    // 1. Draw Background if active
    if (settings.virtualBackground !== 'none') {
      if (settings.virtualBackground === 'bg_white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (settings.virtualBackground === 'bg_black') {
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (settings.virtualBackground === 'bg_pink') {
        ctx.fillStyle = '#fdf2f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (settings.virtualBackground === 'bg_blue') {
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (settings.virtualBackground === 'bg_green') {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (settings.virtualBackground === 'bg_y2k') {
        const grad = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
        grad.addColorStop(0, '#f0abfc'); // fuchsia-300
        grad.addColorStop(0.5, '#d8b4fe'); // purple-300
        grad.addColorStop(1, '#67e8f9'); // cyan-300
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (settings.virtualBackground === 'bg_checkers') {
        // Draw a basic checker pattern since SVG bg is complex on canvas
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        const size = 40;
        for (let y = 0; y < canvas.height; y += size) {
          for (let x = 0; x < canvas.width; x += size) {
            if ((x / size) % 2 === (y / size) % 2) {
              ctx.fillRect(x, y, size, size);
            }
          }
        }
      } else if (settings.virtualBackground === 'bg_grid') {
        ctx.fillStyle = '#2563eb'; // blue-600
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#3b82f6'; // blue-500
        ctx.lineWidth = 2;
        const size = 20;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += size) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y <= canvas.height; y += size) {
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
      } else if (settings.virtualBackground.startsWith('custom_bg')) {
        // Draw the custom background image if it's already loaded in the DOM
        // To be absolutely robust without async loading here, we can grab it from the DOM
        const imgElement = document.querySelector(`img[src="/segment_bg/${settings.virtualBackground}.jpg"]`) as HTMLImageElement;
        if (imgElement && imgElement.complete) {
          // Draw using object-cover logic
          const imgAspect = imgElement.naturalWidth / imgElement.naturalHeight;
          const canvasAspect = canvas.width / canvas.height;
          let drawW = canvas.width;
          let drawH = canvas.height;
          let drawX = 0;
          let drawY = 0;
          
          if (imgAspect > canvasAspect) {
            drawW = canvas.height * imgAspect;
            drawX = (canvas.width - drawW) / 2;
          } else {
            drawH = canvas.width / imgAspect;
            drawY = (canvas.height - drawH) / 2;
          }
          ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
        } else {
          // Fallback if image isn't loaded for some reason
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
    
    if (settings.isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    // 2. Draw Video or Segmented Person
    if (settings.virtualBackground !== 'none' && segmentationCanvasRef.current) {
      // Draw the segmented person without the background
      ctx.drawImage(segmentationCanvasRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw full raw video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    if (overlayCanvasRef.current && settings.selectedARFilter !== 'none') {
      ctx.drawImage(overlayCanvasRef.current, 0, 0, canvas.width, canvas.height);
    }
    
    if (settings.isMirrored) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    }
    ctx.filter = 'none';
    
    const croppedCanvas = applyAspectRatioCrop(canvas);
    return croppedCanvas.toDataURL('image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!stream) return;
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { 
      mimeType: 'video/webm',
      videoBitsPerSecond: 600000 // Optimize memory usage for 4 clips
    });
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        videoChunksRef.current.push(e.data);
      }
    };
    recorder.start(500); // 500ms timeslice to prevent truncation on longer recordings
    mediaRecorderRef.current = recorder;
  }

  const stopRecording = async (): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;
    return new Promise<string | null>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      };
      recorder.stop();
    });
  }

  const runCaptureSession = async (filterCss: string) => {
    setIsCapturing(true);
    setCapturedPhotos([]);
    setCurrentPhotoIndex(0);

    let newPhotos: CapturedPhoto[] = [];

    for (let i = 0; i < settings.photoCount; i++) {
      setCurrentPhotoIndex(i);
      startRecording();

      await new Promise<void>((resolve) => {
        setCountdown(settings.countdownDuration);
        if (settings.enableAudio) playBeep(800, 0.1);
        let remaining = settings.countdownDuration;
        const countdownInterval = setInterval(() => {
          if (retakeRequestedRef.current) {
            clearInterval(countdownInterval);
            setTimeout(() => resolve(), 50);
            return;
          }
          remaining -= 1;
          setCountdown(remaining > 0 ? remaining : null);
          if (remaining > 0 && settings.enableAudio) {
            playBeep(800, 0.1);
          }
          if (remaining <= 0) {
            clearInterval(countdownInterval);
            setTimeout(() => resolve(), 100);
          }
        }, 1000);
      });

      if (retakeRequestedRef.current) {
        retakeRequestedRef.current = false;
        if (newPhotos.length > 0) {
          newPhotos.pop();
          setCapturedPhotos([...newPhotos]);
        }
        i -= 2;
        if (i < -1) i = -1;
        setCountdown(null);
        continue;
      }

      setIsCapturing(true);
      
      let standardPhotoData: string | null = null;
      if (settings.captureMode !== 'boomerang') {
        standardPhotoData = await capturePhoto(filterCss);
        if (settings.enableAudio && standardPhotoData) playShutter();
      }

      const countdownVideoUrl = await stopRecording();

      if (settings.captureMode === 'boomerang') {
        const frames: string[] = [];
        const numFrames = 15;
        
        for (let j = 0; j < numFrames; j++) {
          const photoData = await capturePhoto(filterCss);
          if (photoData) {
            frames.push(photoData);
          }
          await new Promise(resolve => setTimeout(resolve, 100)); // ~10fps
        }
        
        if (settings.enableAudio) playShutter();

        const reversed = [...frames].reverse();
        reversed.shift();
        reversed.pop();
        const pingPong = [...frames, ...reversed];

        if (pingPong.length > 0) {
          const newPhoto: CapturedPhoto = {
            id: `boomerang-${Date.now()}-${i}`,
            dataUrl: pingPong[0],
            timestamp: Date.now(),
            videoUrl: countdownVideoUrl || undefined,
            isBoomerang: true,
            frames: pingPong
          };
          newPhotos = [...newPhotos, newPhoto];
          setCapturedPhotos([...newPhotos]);
        }
      } else {
        if (standardPhotoData) {
          const newPhoto: CapturedPhoto = {
            id: `photo-${Date.now()}-${i}`,
            dataUrl: standardPhotoData,
            timestamp: Date.now(),
            videoUrl: countdownVideoUrl || undefined,
          };
          newPhotos = [...newPhotos, newPhoto];
          setCapturedPhotos([...newPhotos]);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 700));
      if (i < settings.photoCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    setIsCapturing(false);
    setTimeout(() => {
      onPhotosComplete(newPhotos);
    }, 600);
  };

  const startSingleCapture = async (filterCss: string): Promise<CapturedPhoto | null> => {
    if (isCapturing) return null;
    setIsCapturing(true);

    await new Promise<void>((resolve) => {
      setCountdown(settings.countdownDuration);
      if (settings.enableAudio) playBeep(800, 0.1);
      let remaining = settings.countdownDuration;
      const countdownInterval = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining > 0 ? remaining : null);
        if (remaining > 0 && settings.enableAudio) {
          playBeep(800, 0.1);
        }
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setTimeout(() => resolve(), 100);
        }
      }, 1000);
    });

    const photoData = await capturePhoto(filterCss);
    if (settings.enableAudio && photoData) playShutter();
    
    setIsCapturing(false);
    return photoData ? {
      id: `photo-${Date.now()}-retake`,
      dataUrl: photoData,
      timestamp: Date.now()
    } : null;
  };

  const startCapture = (filterCss: string) => {
    if (isCapturing) return;
    runCaptureSession(filterCss);
  };

  return {
    videoRef,
    canvasRef,
    overlayCanvasRef,
    segmentationCanvasRef,
    stream,
    isCapturing,
    countdown,
    currentPhotoIndex,
    capturedPhotos,
    error,
    startCamera,
    stopCamera,
    startCapture,
    startSingleCapture,
    selectedFilter,
    setSelectedFilter,
    contrast,
    setContrast,
    brightness,
    setBrightness,
    saturation,
    setSaturation,
    requestRetake: () => {
      retakeRequestedRef.current = true;
    },
    resetAdvancedSettings: () => {
      setContrast(100);
      setBrightness(100);
      setSaturation(100);
    }
  };
};
