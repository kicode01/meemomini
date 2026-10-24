import { CapturedPhoto, PhotoSettings } from "@/pages/Index";
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export const exportReplayVideo = async (
  photos: CapturedPhoto[],
  settings: PhotoSettings,
  handleToast?: (text: string, opts?: { variant?: string }) => void,
  caption?: string,
  captionFont?: string,
  returnBlobOnly?: boolean,
  bgDataUrl?: string,
  fgDataUrl?: string,
  slotRects?: {cx: number, cy: number, w: number, h: number, radii: [number, number, number, number], rotation: number}[]
) => {
  if (!photos.length) return;

  if (!bgDataUrl || !slotRects || slotRects.length === 0) {
    handleToast?.("Error: Missing DOM layout data.", { variant: "destructive" });
    return;
  }

  // Load the static background image
  const bgImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = bgDataUrl;
  });

  const fgImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (fgDataUrl) img.src = fgDataUrl;
    else resolve(new Image()); // fallback
  });

  // Find a safe resolution (Max height 1920 for HD, 800 for Fast)
  const MAX_HEIGHT = settings.exportQuality === 'fast' ? 800 : 1920;
  let outWidth = bgImage.width;
  let outHeight = bgImage.height;
  
  if (outHeight > MAX_HEIGHT) {
    outWidth = Math.floor((outWidth * MAX_HEIGHT) / outHeight);
    outHeight = MAX_HEIGHT;
  }
  
  // H.264 requires even dimensions
  outWidth = outWidth - (outWidth % 2);
  outHeight = outHeight - (outHeight % 2);

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const frameRate = 30;

  // Load all images and videos
  const slotImages = await Promise.all(photos.map(async (photo) => {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = photo.dataUrl;
    });
  }));

  const slotVideos = await Promise.all(photos.map(async (photo) => {
    if (!photo.videoUrl) return null;
    return new Promise<HTMLVideoElement>((resolve) => {
      const vid = document.createElement('video');
      vid.crossOrigin = "anonymous";
      vid.muted = true;
      vid.playsInline = true;
      vid.src = photo.videoUrl;
      vid.onloadeddata = () => resolve(vid);
      vid.onerror = () => resolve(null as any);
      vid.load();
    });
  }));

  const overlayImages = await Promise.all(photos.map(async (photo) => {
    if (!photo.overlayUrl) return null;
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null as any);
      img.src = photo.overlayUrl!;
    });
  }));

  // ------- Prepare mp4-muxer -------
  if (!(window as any).VideoEncoder) {
    handleToast?.("Your browser does not support WebCodecs (VideoEncoder). Please try a modern browser.", { variant: "destructive" });
    return;
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: canvas.width,
      height: canvas.height,
    },
    fastStart: 'in-memory'
  });

  let encoderError = false;
  const videoEncoder = new (window as any).VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: any) => {
      console.error("VideoEncoder error", e);
      encoderError = true;
    }
  });

  try {
    videoEncoder.configure({
      codec: 'avc1.640034', // High Profile, Level 5.2 (supports up to 4K)
      width: canvas.width,
      height: canvas.height,
      bitrate: 10_000_000,
      framerate: frameRate
    });
  } catch (e) {
    console.error("VideoEncoder configure error", e);
    handleToast?.("Error configuring video encoder format.", { variant: "destructive" });
    return;
  }

  let globalFrameTick = 0;

  const pushFrame = async () => {
    if (encoderError || videoEncoder.state !== 'configured') return;
    if (canvas.width > 0 && canvas.height > 0) {
      const timestamp = (globalFrameTick * 1000000) / frameRate;
      const frame = new (window as any).VideoFrame(canvas, { timestamp });
      try {
        videoEncoder.encode(frame, { keyFrame: globalFrameTick % 30 === 0 });
      } catch (e) {
        console.error("Error encoding frame", e);
        encoderError = true;
      }
      frame.close();
    }
    globalFrameTick++;
  };

  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLVideoElement, dX: number, dY: number, dW: number, dH: number, mirrored = false) => {
    const srcW = img instanceof HTMLVideoElement ? img.videoWidth : img.width;
    const srcH = img instanceof HTMLVideoElement ? img.videoHeight : img.height;
    if (!srcW || !srcH) return;
    
    const srcRatio = srcW / srcH;
    const destRatio = dW / dH;
    
    let sX = 0, sY = 0, sW = srcW, sH = srcH;
    
    if (srcRatio > destRatio) {
      sW = srcH * destRatio;
      sX = (srcW - sW) / 2;
    } else {
      sH = srcW / destRatio;
      sY = (srcH - sH) / 2;
    }
    
    if (mirrored) {
      ctx.drawImage(img, sX, sY, sW, sH, dX + dW, dY, -dW, dH);
    } else {
      ctx.drawImage(img, sX, sY, sW, sH, dX, dY, dW, dH);
    }
  };

  const drawSlot = (i: number) => {
    const pRect = slotRects[i];
    if (!pRect) return;
    
    const absCX = pRect.cx * canvas.width;
    const absCY = pRect.cy * canvas.height;
    const absW = pRect.w * canvas.width;
    const absH = pRect.h * canvas.height;
    const absRadii = pRect.radii.map(r => r * canvas.width) as [number, number, number, number];
    const rotRad = (pRect.rotation || 0) * Math.PI / 180;

    ctx.save();
    
    // Move to center, apply rotation
    ctx.translate(absCX, absCY);
    ctx.rotate(rotRad);

    const topLeftX = -absW / 2;
    const topLeftY = -absH / 2;

    ctx.beginPath();
    const [tl, tr, br, bl] = absRadii;
    ctx.moveTo(topLeftX + tl, topLeftY);
    ctx.lineTo(topLeftX + absW - tr, topLeftY);
    ctx.quadraticCurveTo(topLeftX + absW, topLeftY, topLeftX + absW, topLeftY + tr);
    ctx.lineTo(topLeftX + absW, topLeftY + absH - br);
    ctx.quadraticCurveTo(topLeftX + absW, topLeftY + absH, topLeftX + absW - br, topLeftY + absH);
    ctx.lineTo(topLeftX + bl, topLeftY + absH);
    ctx.quadraticCurveTo(topLeftX, topLeftY + absH, topLeftX, topLeftY + absH - bl);
    ctx.lineTo(topLeftX, topLeftY + tl);
    ctx.quadraticCurveTo(topLeftX, topLeftY, topLeftX + tl, topLeftY);
    ctx.closePath();
    ctx.clip();

    const video = slotVideos[i];
    if (video) {
      drawImageCover(ctx, video, topLeftX, topLeftY, absW, absH, settings.isMirrored);
      const overlay = overlayImages[i];
      if (overlay) {
        drawImageCover(ctx, overlay, topLeftX, topLeftY, absW, absH, false);
      }
    } else {
      const img = slotImages[i];
      if (img) drawImageCover(ctx, img, topLeftX, topLeftY, absW, absH, settings.isMirrored);
    }
    ctx.restore();
  };

  const drawCountdown = (i: number, frac: number) => {
    const pRect = slotRects[i];
    if (!pRect || frac <= 0) return;
    
    const absCX = pRect.cx * canvas.width;
    const absCY = pRect.cy * canvas.height;
    const absW = pRect.w * canvas.width;
    const absH = pRect.h * canvas.height;
    const absRadii = pRect.radii.map(r => r * canvas.width) as [number, number, number, number];
    const rotRad = (pRect.rotation || 0) * Math.PI / 180;
    
    ctx.save();
    ctx.translate(absCX, absCY);
    ctx.rotate(rotRad);

    const topLeftX = -absW / 2;
    const topLeftY = -absH / 2;

    ctx.beginPath();
    ctx.roundRect(topLeftX, topLeftY, absW, absH, absRadii);
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${frac * 0.4})`;
    ctx.fill();
    
    if (frac > 0.05) {
      const seconds = Math.ceil(frac * (settings.countdownDuration || 3)) || 1;
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${absW * 0.25}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillText(seconds.toString(), 0, 0); // At center (0,0) due to translate
    }
    ctx.restore();
  };
  // Initialize all videos to 0 for a clean start
  for (const v of slotVideos) {
    if (v) {
      try { v.currentTime = 0; } catch {}
    }
  }

  // The animation sequence
  for (let i = 0; i < photos.length; ++i) {
    const video = slotVideos[i];
    
    // Animate: either video or static for 2.5s
    if (video) {
      try { video.pause(); } catch {}
      const duration = settings.countdownDuration || 3;
      const frames = Math.floor(duration * frameRate);
      for (let f = 0; f < frames; ++f) {
        video.currentTime = f / frameRate;
        await new Promise(resolve => {
          const handleSeeked = () => { video.removeEventListener('seeked', handleSeeked); resolve(true); };
          video.addEventListener('seeked', handleSeeked);
          setTimeout(() => { video.removeEventListener('seeked', handleSeeked); resolve(false); }, 200);
        });

        // 1. Draw Background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // 2. Draw ALL slots (past, current, and future)
        for (let s = 0; s < photos.length; ++s) {
          drawSlot(s);
        }
        
        // 4. Draw FG over the strip
        if (fgImage) {
          ctx.drawImage(fgImage, 0, 0, canvas.width, canvas.height);
        }
        
        // 5. Draw countdown on current slot
        const slotElapsed = (f / frameRate) * 1000;
        const countdownMax = (settings.countdownDuration || 3) * 1000;
        const frac = Math.max(0, 1 - (slotElapsed / countdownMax));
        drawCountdown(i, frac);

        await pushFrame();
      }
      
      // After finishing this slot's countdown, rewind it to 0 to match live preview
      try { video.currentTime = 0; } catch {}
    } else {
      // Animate as static image
      const duration = settings.countdownDuration || 3;
      const frames = Math.floor(duration * frameRate);
      for (let f = 0; f < frames; ++f) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Draw ALL slots
        for (let s = 0; s < photos.length; ++s) {
          drawSlot(s);
        }
        
        // Draw FG over the strip
        if (fgImage) {
          ctx.drawImage(fgImage, 0, 0, canvas.width, canvas.height);
        }
        
        const slotElapsed = (f / frameRate) * 1000;
        const countdownMax = (settings.countdownDuration || 3) * 1000;
        const frac = Math.max(0, 1 - (slotElapsed / countdownMax));
        drawCountdown(i, frac);
        
        await pushFrame();
      }
    }
  }

  // After anim, leave static overlay for 0.7s
  const holdFrames = Math.floor(0.7 * frameRate);
  for (let f = 0; f < holdFrames; ++f) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    for (let s = 0; s < photos.length; ++s) {
      drawSlot(s);
    }
    if (fgImage) {
      ctx.drawImage(fgImage, 0, 0, canvas.width, canvas.height);
    }
    await pushFrame();
  }

  // Final loop: all videos play together
  const LOOP_SECONDS = settings.countdownDuration || 3;
  const loopFrames = Math.floor(LOOP_SECONDS * frameRate);
  for (let f = 0; f < loopFrames; ++f) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    for (let s = 0; s < photos.length; ++s) {
      const vid = slotVideos[s];
      if (vid) {
        vid.currentTime = f / frameRate;
        await new Promise(resolve => {
          const handleSeeked = () => { vid.removeEventListener('seeked', handleSeeked); resolve(true); };
          vid.addEventListener('seeked', handleSeeked);
          setTimeout(() => { vid.removeEventListener('seeked', handleSeeked); resolve(false); }, 200);
        });
      }
      drawSlot(s);
    }
    if (fgImage) {
      ctx.drawImage(fgImage, 0, 0, canvas.width, canvas.height);
    }
    await pushFrame();
  }

  // Freeze final frame for 1.5s
  const endHoldFrames = Math.floor(1.5 * frameRate);
  for (let f = 0; f < endHoldFrames; ++f) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    for (let s = 0; s < photos.length; ++s) drawSlot(s);
    if (fgImage) {
      ctx.drawImage(fgImage, 0, 0, canvas.width, canvas.height);
    }
    await pushFrame();
  }

  await videoEncoder.flush();
  muxer.finalize();
  const buffer = muxer.target.buffer;

  const blob = new Blob([buffer], { type: 'video/mp4' });
  
  if (returnBlobOnly) {
    return blob;
  }

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `meemomini_vd.mp4`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  handleToast?.("Animated replay video exported!");
  return blob;
};
