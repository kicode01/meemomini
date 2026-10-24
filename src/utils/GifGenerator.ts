import GIF from 'gif.js';
import { CapturedPhoto } from '@/pages/Index';

// Function to fetch worker script from CDN and create a Blob URL to avoid CORS Web Worker restrictions
const getWorkerUrl = async () => {
  try {
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const blob = new Blob([text], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to fetch gif.worker.js from CDN, falling back to local /gif.worker.js", error);
    return '/gif.worker.js'; // Fallback to local if fetch fails
  }
};

export const generateClipsGif = async (photos: CapturedPhoto[], isMirrored: boolean = true, customText: string = 'meemomini', countdownDuration: number = 3, exportQuality: 'hd' | 'fast' = 'hd'): Promise<Blob> => {
  if (!photos || photos.length === 0) {
    throw new Error('Generating Clips GIF requires at least 1 photo.');
  }

  // Match the live preview grid: always 2 columns if > 1 photo
  let cols = 1;
  let rows = 1;
  
  if (photos.length > 1) {
    cols = 2;
    rows = Math.ceil(photos.length / 2);
  }

  const width = exportQuality === 'fast' ? 400 : 800; // Total GIF width
  const cellW = width / cols;
  const cellH = cellW * (3 / 4); // 4:3 aspect ratio per cell
  const gridHeight = cellH * rows;
  const bannerHeight = 60; // 3/4 of previous 80
  const height = gridHeight + bannerHeight;
  const fps = 10;
  const frameDelay = 1000 / fps;
  const totalDuration = countdownDuration * 1000;
  const totalFrames = (totalDuration / 1000) * fps;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get canvas context');

  // Preload static logo
  const logoImg = new Image();
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = resolve; // Ignore error and continue
    logoImg.src = '/meemomini_front.png';
  });

  // Load all videos
  const videos = await Promise.all(
    photos.map((p) => {
      return new Promise<HTMLVideoElement>((resolve, reject) => {
        if (!p.videoUrl) {
          // If no video, we just use the image
          const img = new Image();
          img.onload = () => {
            const mockVideo = document.createElement('video'); // Mock
            // @ts-ignore
            mockVideo._isStatic = true;
            // @ts-ignore
            mockVideo._image = img;
            resolve(mockVideo);
          };
          img.onerror = reject;
          img.src = p.dataUrl;
          return;
        }

        const video = document.createElement('video');
        if (!p.videoUrl.startsWith('blob:')) {
          video.crossOrigin = 'anonymous';
        }
        video.muted = true;
        video.playsInline = true;
        video.onloadeddata = () => resolve(video);
        video.onerror = (e) => reject(new Error('Video failed to load for GIF: ' + String(e)));
        video.src = p.videoUrl;
      });
    })
  );

  const workerScript = await getWorkerUrl();

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width,
    height,
    workerScript
  });

  // Play all videos
  videos.forEach(v => {
    // @ts-ignore
    if (!v._isStatic) {
      v.currentTime = 0;
      v.play().catch(e => console.warn('Autoplay failed', e));
    }
  });

  // Render loop
  for (let i = 0; i < totalFrames; i++) {
    // Fill background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw each video in the grid
    videos.forEach((video, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * cellW;
      const y = row * cellH;

      ctx.save();
      
      // Calculate crop to fill the cell (cell is 400x300 - 4:3)
      let sourceWidth = 0;
      let sourceHeight = 0;
      let drawImg: HTMLVideoElement | HTMLImageElement = video;

      // @ts-ignore
      if (video._isStatic) {
        // @ts-ignore
        drawImg = video._image;
        sourceWidth = drawImg.width;
        sourceHeight = drawImg.height;
      } else {
        sourceWidth = video.videoWidth;
        sourceHeight = video.videoHeight;
      }

      if (sourceWidth > 0 && sourceHeight > 0) {
        const sourceAspect = sourceWidth / sourceHeight;
        const cellAspect = cellW / cellH;

        let sWidth = sourceWidth;
        let sHeight = sourceHeight;
        let sx = 0;
        let sy = 0;

        if (sourceAspect > cellAspect) {
          sWidth = sourceHeight * cellAspect;
          sx = (sourceWidth - sWidth) / 2;
        } else {
          sHeight = sourceWidth / cellAspect;
          sy = (sourceHeight - sHeight) / 2;
        }

        // Apply mirroring
        if (isMirrored) {
            ctx.translate(x + cellW, y);
            ctx.scale(-1, 1);
            ctx.drawImage(drawImg, sx, sy, sWidth, sHeight, 0, 0, cellW, cellH);
        } else {
            ctx.drawImage(drawImg, sx, sy, sWidth, sHeight, x, y, cellW, cellH);
        }
      }
      
      ctx.restore();
    });

    // Draw bottom banner
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, gridHeight, width, bannerHeight);

    // Draw logo in banner
    if (logoImg.width > 0) {
      const logoAspect = logoImg.width / logoImg.height;
      const logoH = 30; // scaled down from 40 for smaller banner
      const logoW = logoH * logoAspect;
      ctx.drawImage(logoImg, 20, gridHeight + (bannerHeight - logoH) / 2, logoW, logoH);
    }

    // Draw static logo text "meemomini"
    ctx.fillStyle = '#0b0c10'; // Text color from Index.tsx
    // @ts-ignore
    ctx.letterSpacing = '-1.5px'; // match tracking-tighter
    ctx.font = '900 28px "Inter", sans-serif'; // font-black is 900 weight
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Calculate hue for rainbow dot
    const hue = (i / totalFrames) * 360;
    const dotColor = `hsl(${hue}, 100%, 50%)`;
    
    // Draw "meemomini"
    const textStr = "meemomini";
    const dotStr = ".";
    const dotWidth = ctx.measureText(dotStr).width;
    
    // Draw "meemomini"
    ctx.fillText(textStr, width - 20 - dotWidth, gridHeight + bannerHeight / 2);
    
    // Draw color changing "."
    ctx.fillStyle = dotColor;
    ctx.fillText(dotStr, width - 20, gridHeight + bannerHeight / 2);

    // Reset letter spacing
    // @ts-ignore
    ctx.letterSpacing = '0px';

    gif.addFrame(canvas, { copy: true, delay: frameDelay });

    // Wait for the next frame time (approximate since we can't seek smoothly on blob URLs sometimes)
    await new Promise(r => setTimeout(r, frameDelay));
  }

  return new Promise((resolve, reject) => {
    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });
    gif.on('abort', () => {
      reject(new Error('GIF generation aborted'));
    });
    gif.render();
  });
};
