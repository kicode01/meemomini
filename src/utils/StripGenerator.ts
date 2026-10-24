import { CapturedPhoto, PhotoSettings } from "@/pages/Index";
import { PATTERN_LIST, getPatternCanvas } from "@/utils/Patterns";

export const getFrameColor = (color: string) => {
  switch (color) {
    case "none":
    case "classic":
      return "#fff";
    case "black":
      return "#18181b";
    case "gold":
      return "#fbbf24";
    case "blue":
      return "#3b82f6";
    default:
      return color && color.startsWith('#') ? color : "#fff";
  }
};

export const isBackgroundDark = (settings: PhotoSettings) => {
  if (settings.frameStyle === 'film') return true;
  if (!['film', 'vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle) && settings.stripBg && settings.stripBg !== '#ffffff') {
    if (settings.stripBg.includes('star.jpg') || settings.stripBg.includes('show.jpg') || settings.stripBg.includes('brick.jpg')) return true;
    return false;
  }
  if (['vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle)) return false;
  
  const hex = getFrameColor(settings.frameColor);
  if (!hex || hex.length < 7 || hex === 'transparent') return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
};

const getCanvasFont = (captionFont: string) => {
  switch (captionFont) {
    case "font-playfair":
      return 'bold 18px "Playfair Display", serif';
    case "font-caveat":
      return 'bold 20px "Caveat", cursive';
    case "font-mono":
      return 'bold 18px monospace';
    case "font-serif":
      return 'bold 18px serif';
    case "font-sans":
    default:
      return 'bold 18px sans-serif';
  }
};

const getCaptionY = (nPhotos: number) => {
  return 18 + nPhotos * (170 + 8) + 14;
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLVideoElement, dX: number, dY: number, dW: number, dH: number) => {
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
  
  ctx.drawImage(img, sX, sY, sW, sH, dX, dY, dW, dH);
};

export const generateStripBlob = async (
  photos: CapturedPhoto[],
  settings: PhotoSettings,
  showDate: boolean,
  showCaption: boolean,
  customCaption: string,
  captionFont: string,
  nowStr: string,
  showWatermark: boolean = true,
  watermarkPlacement: "left" | "center" | "right" = "center"
): Promise<Blob | null> => {
  let bgImg: HTMLImageElement | null = null;
  if (!['film', 'vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle) && settings.stripBg && settings.stripBg !== '#ffffff') {
    bgImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = settings.stripBg;
    });
  }

  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/meemomini_front.png";
    });
  } catch (e) {}

  const isGrid = settings.layout === 'grid';
  const isHorizontal = settings.layout === 'strip-horizontal';
  const cols = isGrid ? 2 : (isHorizontal ? photos.length : 1);
  const rows = isGrid ? Math.ceil(photos.length / 2) : (isHorizontal ? 1 : photos.length);
  
  let padTopSide = 8;
  let padBottom = 8;
  if (settings.frameStyle === 'film') { padTopSide = 0; padBottom = 0; }
  else if (settings.frameStyle === 'polaroid') { padTopSide = 10; padBottom = 36; }
  else if (settings.frameStyle === 'photobooth') { padTopSide = 8; padBottom = 24; }
  else if (settings.frameStyle === 'minimalist') { padTopSide = 4; padBottom = 4; }
  else if (settings.frameStyle === 'gallery') { padTopSide = 18; padBottom = 18; }
  else if (settings.frameStyle === 'vintage') { padTopSide = 12; padBottom = 12; }
  else if (settings.frameStyle === 'scrapbook') { padTopSide = 12; padBottom = 12; }

  const photoW = isGrid ? 240 : 260; // Wrapper width
  const imageW = photoW - (padTopSide * 2);
  const imageH = imageW * (3 / 4); // Exact 4:3
  const photoH = imageH + padTopSide + padBottom; // Wrapper height
  
  const photoMargin = 12; // Gap between photos matching DOM's margin 6px 0
  
  const sidePad = isGrid ? 20 : 24;
  const stripWidth = isGrid 
    ? (sidePad * 2 + photoW * 2 + photoMargin) 
    : (isHorizontal 
        ? (sidePad * 2 + photos.length * photoW + (photos.length - 1) * photoMargin) 
        : (sidePad * 2 + photoW));
  
  const borderRadius = 20;
  const borderWidth = 6;
  const topPad = 20; 
  const bottomPad = 24;
  
  const photosTotalH = rows * (photoH + photoMargin) - photoMargin;
  let captionSectionH = 56;
  let wrappedLines: string[] = [];
  if (showCaption && customCaption.trim().length > 0) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.font = getCanvasFont(captionFont);
    const maxWidth = stripWidth - 40;
    let currentLine = '';
    
    for (let i = 0; i < customCaption.length; i++) {
      const testLine = currentLine + customCaption[i];
      if (tempCtx.measureText(testLine).width > maxWidth && i > 0) {
        wrappedLines.push(currentLine);
        currentLine = customCaption[i];
      } else {
        currentLine = testLine;
      }
    }
    wrappedLines.push(currentLine);
    captionSectionH = Math.max(56, 30 + wrappedLines.length * 20);
  }

  const watermarkH = showWatermark ? 26 : 0;
  const totalHeight = borderWidth * 2 + topPad + photosTotalH + captionSectionH + watermarkH + bottomPad;

  const canvas = document.createElement("canvas");
  canvas.width = stripWidth * 2;
  canvas.height = totalHeight * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.save();
  ctx.scale(2, 2);

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 5;
  ctx.beginPath();
  ctx.moveTo(borderRadius, 0);
  ctx.lineTo(stripWidth - borderRadius, 0);
  ctx.quadraticCurveTo(stripWidth, 0, stripWidth, borderRadius);
  ctx.lineTo(stripWidth, totalHeight - borderRadius);
  ctx.quadraticCurveTo(stripWidth, totalHeight, stripWidth - borderRadius, totalHeight);
  ctx.lineTo(borderRadius, totalHeight);
  ctx.quadraticCurveTo(0, totalHeight, 0, totalHeight - borderRadius);
  ctx.lineTo(0, borderRadius);
  ctx.quadraticCurveTo(0, 0, borderRadius, 0);
  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,.04)";
  ctx.fill();
  ctx.restore();

  // Frame (background)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(borderRadius, 0);
  ctx.lineTo(stripWidth - borderRadius, 0);
  ctx.quadraticCurveTo(stripWidth, 0, stripWidth, borderRadius);
  ctx.lineTo(stripWidth, totalHeight - borderRadius);
  ctx.quadraticCurveTo(stripWidth, totalHeight, stripWidth - borderRadius, totalHeight);
  ctx.lineTo(borderRadius, totalHeight);
  ctx.quadraticCurveTo(0, totalHeight, 0, totalHeight - borderRadius);
  ctx.lineTo(0, borderRadius);
  ctx.quadraticCurveTo(0, 0, borderRadius, 0);
  ctx.closePath();
  
  if (settings.frameStyle === 'film') {
    const filmGrad = ctx.createLinearGradient(0, 0, stripWidth, 0);
    filmGrad.addColorStop(0, '#111');
    filmGrad.addColorStop(0.5, '#27272a');
    filmGrad.addColorStop(1, '#111');
    ctx.fillStyle = filmGrad;
    ctx.fill();
  } else if (settings.frameStyle === 'vintage') {
    ctx.fillStyle = '#e8dac3';
    ctx.fill();
  } else if (settings.frameStyle === 'scrapbook') {
    ctx.fillStyle = '#f8f1e5';
    ctx.fill();
    // Grid paper pattern
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    for (let x = 0; x < stripWidth; x += 20) {
      ctx.moveTo(x, 0); ctx.lineTo(x, totalHeight);
    }
    for (let y = 0; y < totalHeight; y += 20) {
      ctx.moveTo(0, y); ctx.lineTo(stripWidth, y);
    }
    ctx.stroke();
    
    // Torn Kraft Paper Patch 1
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(139, 90, 43, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, totalHeight * 0.15);
    ctx.lineTo(stripWidth * 0.15, totalHeight * 0.15 - 10);
    ctx.lineTo(stripWidth * 0.35, totalHeight * 0.15 + 5);
    ctx.lineTo(stripWidth * 0.55, totalHeight * 0.15 - 5);
    ctx.lineTo(stripWidth * 0.75, totalHeight * 0.15 + 10);
    ctx.lineTo(stripWidth, totalHeight * 0.15 - 15);
    ctx.lineTo(stripWidth, totalHeight * 0.15 + 120);
    ctx.lineTo(stripWidth * 0.8, totalHeight * 0.15 + 130);
    ctx.lineTo(stripWidth * 0.6, totalHeight * 0.15 + 110);
    ctx.lineTo(stripWidth * 0.4, totalHeight * 0.15 + 140);
    ctx.lineTo(stripWidth * 0.2, totalHeight * 0.15 + 120);
    ctx.lineTo(0, totalHeight * 0.15 + 140);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Torn Kraft Paper Patch 2
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(139, 90, 43, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, totalHeight * 0.7);
    ctx.lineTo(stripWidth * 0.25, totalHeight * 0.7 + 10);
    ctx.lineTo(stripWidth * 0.5, totalHeight * 0.7 - 5);
    ctx.lineTo(stripWidth * 0.75, totalHeight * 0.7 + 15);
    ctx.lineTo(stripWidth, totalHeight * 0.7 + 5);
    ctx.lineTo(stripWidth, totalHeight * 0.7 + 160);
    ctx.lineTo(stripWidth * 0.75, totalHeight * 0.7 + 170);
    ctx.lineTo(stripWidth * 0.5, totalHeight * 0.7 + 150);
    ctx.lineTo(stripWidth * 0.25, totalHeight * 0.7 + 165);
    ctx.lineTo(0, totalHeight * 0.7 + 170);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Doodles
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([3, 3]);
    
    // Star Doodle
    ctx.save();
    ctx.translate(stripWidth * 0.1, totalHeight * 0.1);
    ctx.rotate(-15 * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(3, -3); ctx.lineTo(10, -2); ctx.lineTo(5, 3);
    ctx.lineTo(6, 10); ctx.lineTo(0, 6); ctx.lineTo(-6, 10); ctx.lineTo(-5, 3);
    ctx.lineTo(-10, -2); ctx.lineTo(-3, -3); ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Heart Doodle
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([2, 4]);
    ctx.translate(stripWidth * 0.9, totalHeight * 0.45);
    ctx.rotate(20 * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(0, 5, 5, -5, 10, -5);
    ctx.bezierCurveTo(15, -5, 15, 0, 15, 0);
    ctx.bezierCurveTo(15, 0, 15, 10, 0, 20);
    ctx.bezierCurveTo(-15, 10, -15, 0, -15, 0);
    ctx.bezierCurveTo(-15, -5, -10, -5, -10, -5);
    ctx.bezierCurveTo(-5, -5, 0, 5, 0, 5);
    ctx.stroke();
    ctx.restore();
    
    // Arrow Doodle
    ctx.save();
    ctx.setLineDash([4, 2]);
    ctx.translate(stripWidth * 0.15, totalHeight * 0.88);
    ctx.rotate(45 * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
    ctx.moveTo(5, -5); ctx.lineTo(10, 0); ctx.lineTo(5, 5);
    ctx.stroke();
    ctx.restore();
    
    // Scribble Lines
    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.3;
    ctx.translate(stripWidth * 0.8, totalHeight * 0.75);
    ctx.beginPath();
    ctx.moveTo(-20, 5); ctx.quadraticCurveTo(-10, -5, 0, 5); ctx.quadraticCurveTo(10, -5, 20, 5);
    ctx.stroke();
    ctx.restore();
    
    ctx.restore();
  } else if (settings.frameStyle === 'gallery') {
    ctx.fillStyle = '#fdfdfc';
    ctx.fill();
  } else if (settings.frameStyle === 'custom') {
    if (bgImg) {
      ctx.save();
      ctx.clip();
      
      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = stripWidth / totalHeight;
      let drawW = stripWidth;
      let drawH = totalHeight;
      let drawX = 0;
      let drawY = 0;
      
      if (imgRatio > canvasRatio) {
        drawW = totalHeight * imgRatio;
        drawX = (stripWidth - drawW) / 2;
      } else {
        drawH = stripWidth / imgRatio;
        drawY = (totalHeight - drawH) / 2;
      }
      
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  } else {
    ctx.fillStyle = getFrameColor(settings.frameColor);
    ctx.fill();
  }
  
  if (!['film', 'vintage', 'scrapbook', 'custom'].includes(settings.frameStyle) && settings.framePattern && settings.framePattern !== 'none' && PATTERN_LIST[settings.framePattern]) {
    try {
      const pImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = getPatternCanvas(settings.framePattern, settings.patternColor);
      });
      const pattern = ctx.createPattern(pImg, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fill();
      }
    } catch (e) {
      console.warn("Failed to load pattern", e);
    }
  }
  
  // Border
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = "#ccc";
  ctx.stroke();
  ctx.restore();

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const isPolaroid = settings.frameStyle === 'polaroid';
    const isFilm = settings.frameStyle === 'film';
    const isScrapbook = settings.frameStyle === 'scrapbook';
    const isMinimalist = settings.frameStyle === 'minimalist';
    const isVintage = settings.frameStyle === 'vintage';
    const isGallery = settings.frameStyle === 'gallery';
    const isPhotobooth = settings.frameStyle === 'photobooth';
    
    
    const col = isGrid ? (i % 2) : (isHorizontal ? i : 0);
    const row = isGrid ? Math.floor(i / 2) : (isHorizontal ? 0 : i);

    const x = (isGrid || isHorizontal)
      ? sidePad + col * (photoW + photoMargin)
      : (stripWidth - photoW) / 2;
      
    const y = borderWidth + topPad + row * (photoH + photoMargin);

    const img = await loadImage(photos[i].dataUrl);

    if (isPolaroid || isPhotobooth) {
      // Draw background
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, photoW, photoH);
      // Draw shadow
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillRect(x, y, photoW, photoH);
      ctx.shadowColor = 'transparent';
      
      // Draw image
      drawImageCover(ctx, img, x + padTopSide, y + padTopSide, imageW, imageH);
      
      // Draw subtle inner border
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + padTopSide, y + padTopSide, imageW, imageH);

      // Draw Gloss for polaroid
      if (isPolaroid) {
        const grad = ctx.createLinearGradient(x + padTopSide, y + padTopSide, x + padTopSide + imageW, y + padTopSide + imageH);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.35, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(x + padTopSide, y + padTopSide, imageW, imageH);
        ctx.globalCompositeOperation = 'source-over';
      }
    } else if (isMinimalist) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, photoW, photoH);
      drawImageCover(ctx, img, x + padTopSide, y + padTopSide, imageW, imageH);
    } else if (isVintage) {
      ctx.fillStyle = '#fcf8ee'; // Warm sepia tone
      ctx.fillRect(x, y, photoW, photoH);
      
      // Sepia Image
      ctx.save();
      ctx.filter = 'sepia(0.4) contrast(1.05) brightness(0.95)';
      drawImageCover(ctx, img, x + padTopSide, y + padTopSide, imageW, imageH);
      ctx.restore();
      
      // Vintage inner border
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + padTopSide, y + padTopSide, imageW, imageH);
      
      // Double inset
      ctx.strokeStyle = 'rgba(210,197,174,0.5)';
      ctx.strokeRect(x + padTopSide - 4, y + padTopSide - 4, imageW + 8, imageH + 8);
      
      // Photo Corners
      ctx.fillStyle = '#1c1917';
      const ix = x + padTopSide;
      const iy = y + padTopSide;
      // Top Left
      ctx.beginPath(); ctx.moveTo(ix - 2, iy - 2); ctx.lineTo(ix + 14, iy - 2); ctx.lineTo(ix - 2, iy + 14); ctx.fill();
      // Top Right
      ctx.beginPath(); ctx.moveTo(ix + imageW + 2, iy - 2); ctx.lineTo(ix + imageW - 14, iy - 2); ctx.lineTo(ix + imageW + 2, iy + 14); ctx.fill();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(ix - 2, iy + imageH + 2); ctx.lineTo(ix + 14, iy + imageH + 2); ctx.lineTo(ix - 2, iy + imageH - 14); ctx.fill();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(ix + imageW + 2, iy + imageH + 2); ctx.lineTo(ix + imageW - 14, iy + imageH + 2); ctx.lineTo(ix + imageW + 2, iy + imageH - 14); ctx.fill();
      
    } else if (isGallery) {
      // Large drop shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, photoW, photoH);
      ctx.restore();
      
      // Draw image
      drawImageCover(ctx, img, x + padTopSide, y + padTopSide, imageW, imageH);
      
      // Matte inner shadow simulation
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + padTopSide, y + padTopSide, imageW, imageH);
      ctx.restore();
      
      // Outer subtle border
      ctx.strokeStyle = 'rgba(0,0,0,0.03)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4, y + 4, photoW - 8, photoH - 8);
    } else if (isFilm) {
      // Draw film edge holes (black background already handled by frameColor)
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, photoW, photoH);
      
      // draw image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, photoW, photoH, 2);
      ctx.clip();
      drawImageCover(ctx, img, x, y, photoW, photoH);
      // film inner shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, photoW + 2, photoH + 2);
      ctx.restore();
    } else {
      // Classic or Scrapbook background
      ctx.save();
      if (isScrapbook) {
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
      } else {
        ctx.shadowColor = "rgba(120,120,120,0.12)";
        ctx.shadowBlur = 7;
      }
      
      const scrapbookRotations = [-3.5, 2.5, -1.5, 3.5];
      const rot = isScrapbook ? (scrapbookRotations[i % 4] * Math.PI / 180) : 0;
      
      // Move to center of photo to rotate
      ctx.translate(x + photoW / 2, y + photoH / 2);
      ctx.rotate(rot);
      
      if (isScrapbook) {
        // Draw torn notebook paper behind the photo
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#fafafa';
        ctx.rotate(1.5 * Math.PI / 180);
        ctx.beginPath();
        const pW = photoW + 16;
        const pH = photoH + 16;
        ctx.moveTo(-pW/2 + pW*0.02, -pH/2);
        ctx.lineTo(pW/2 - pW*0.02, -pH/2 + pH*0.02);
        ctx.lineTo(pW/2, pH/2 - pH*0.05);
        ctx.lineTo(-pW/2 + pW*0.05, pH/2);
        ctx.closePath();
        ctx.fill();
        
        // Notebook lines
        ctx.clip();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for(let ly = -pH/2; ly < pH/2; ly += 20) {
          ctx.beginPath();
          ctx.moveTo(-pW/2, ly);
          ctx.lineTo(pW/2, ly);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      ctx.beginPath();
      ctx.roundRect(-photoW / 2, -photoH / 2, photoW, photoH, 12);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();

      // draw image clipped
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-photoW / 2 + padTopSide, -photoH / 2 + padTopSide, imageW, imageH, 8); // pad for classic
      ctx.clip();
      drawImageCover(ctx, img, -photoW / 2 + padTopSide, -photoH / 2 + padTopSide, imageW, imageH);
      ctx.restore();
      
      ctx.restore();
    }
    
    // Tape and clips overlay for scrapbook
    if (isScrapbook) {
      ctx.save();
      
      const drawJaggedTape = (tx: number, ty: number, rot: number, color: string, stroke: string, pattern?: 'stripes'|'dots') => {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.translate(tx, ty);
        ctx.rotate(rot * Math.PI / 180);
        
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(0, 3);
        for(let j=0; j<=60; j+=10) { ctx.lineTo(j+5, 0); ctx.lineTo(j+10, 3); }
        ctx.lineTo(60, 20);
        for(let j=60; j>=0; j-=10) { ctx.lineTo(j-5, 23); ctx.lineTo(j-10, 20); }
        ctx.closePath();
        ctx.fill();
        
        if (pattern === 'stripes') {
          ctx.save();
          ctx.clip();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 4;
          for(let dx = -20; dx < 80; dx += 10) {
            ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx + 20, 30); ctx.stroke();
          }
          ctx.restore();
        } else if (pattern === 'dots') {
          ctx.save();
          ctx.clip();
          ctx.fillStyle = '#fce7f3';
          for(let dx = 0; dx < 60; dx += 10) {
            for(let dy = 0; dy < 30; dy += 10) {
              ctx.beginPath(); ctx.arc(dx + 5, dy + 5, 2.5, 0, Math.PI*2); ctx.fill();
            }
          }
          ctx.restore();
        }
        
        ctx.stroke();
        ctx.restore();
      };
      
      const drawPaperclip = (tx: number, ty: number, rot: number) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rot * Math.PI / 180);
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(12, 35);
        ctx.lineTo(12, 8);
        ctx.arc(8, 8, 4, 0, Math.PI, true);
        ctx.lineTo(4, 36);
        ctx.arc(12, 36, 8, Math.PI, 0, true);
        ctx.lineTo(20, 12);
        ctx.arc(18, 12, 2, 0, Math.PI, true);
        ctx.lineTo(16, 30);
        ctx.stroke();
        ctx.restore();
      };
      
      const drawPushpin = (tx: number, ty: number, color: string, rimColor: string, rot: number) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rot * Math.PI / 180);
        // Pin shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        
        // Pin body
        ctx.fillStyle = color;
        ctx.strokeStyle = rimColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(12, 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Needle
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#cbd5e1'; // Metal color
        ctx.translate(12, 12);
        ctx.rotate(-12 * Math.PI / 180);
        ctx.fillRect(-1.5, 4, 3, 12);
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      };

      if (i % 4 === 0) {
        // Top left striped tape (Yellow)
        drawJaggedTape(x - 5, y - 5, -25, '#fde047', '#eab308', 'stripes');
        // Bottom right pushpin (Pink)
        drawPushpin(x + photoW - 20, y + photoH - 20, '#ec4899', '#db2777', 0);
      } else if (i % 4 === 1) {
        // Top center paperclip
        drawPaperclip(x + photoW / 2 - 12, y - 15, 12);
        // Bottom left polka dot tape (Pink)
        drawJaggedTape(x - 5, y + photoH - 15, 20, '#fbcfe8', '#f472b6', 'dots');
      } else if (i % 4 === 2) {
        // Top right polka dot tape (Pink)
        drawJaggedTape(x + photoW - 40, y - 15, 25, '#fbcfe8', '#f472b6', 'dots');
        // Top left pushpin (Sky Blue)
        drawPushpin(x - 5, y - 5, '#0ea5e9', '#0284c7', -30);
      } else if (i % 4 === 3) {
        // Bottom right striped tape (Yellow)
        drawJaggedTape(x + photoW - 40, y + photoH - 15, -15, '#fde047', '#eab308', 'stripes');
        // Top left paperclip
        drawPaperclip(x - 10, y - 5, -30);
      }
      
      ctx.restore();
    }
  }

  if (settings.frameStyle === 'film') {
    // Punch sprocket holes
    ctx.fillStyle = "#fff";
    if (isHorizontal) {
      const numHoles = Math.max(24, Math.floor(stripWidth / 20));
      for (let i = 0; i < numHoles; i++) {
        const holeX = borderWidth + sidePad + 10 + i * (stripWidth / numHoles);
        // Top hole
        ctx.beginPath();
        ctx.roundRect(holeX, 16, 16, 12, 4);
        ctx.fill();
        // Bottom hole
        ctx.beginPath();
        ctx.roundRect(holeX, totalHeight - 28, 16, 12, 4);
        ctx.fill();
      }
    } else {
      for (let i = 0; i < 24; i++) {
        const holeY = borderWidth + topPad + 10 + i * (totalHeight / 24);
        // Left hole
        ctx.beginPath();
        ctx.roundRect(16, holeY, 12, 16, 4);
        ctx.fill();
        // Right hole
        ctx.beginPath();
        ctx.roundRect(stripWidth - 28, holeY, 12, 16, 4);
        ctx.fill();
      }
      
      // Draw Kodak Markings
      ctx.save();
      ctx.fillStyle = "#eab308";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      for (let i = 0; i < 6; i++) {
        const txtY = borderWidth + topPad + 40 + i * (totalHeight / 6);
        // Left edge (KODAK PORTRA 400 rotated)
        ctx.save();
        ctx.translate(10, txtY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("KODAK PORTRA 400", 0, 0);
        ctx.restore();
        
        // Right edge (Numbers)
        ctx.save();
        ctx.translate(stripWidth - 10, txtY);
        ctx.fillText(`1 ${i + 3}`, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  
  const showDateHere = showDate;
  const { captionSize = 1.0, captionColor = 'black', watermarkColor = 'black' } = settings;
  const showCaptionHere = showCaption && customCaption.trim().length > 0;
  const yCaption = borderWidth + topPad + rows * (photoH + photoMargin) - photoMargin + 30;
  let nextY = yCaption;

  const isDark = isBackgroundDark(settings);

  if (showDateHere) {
    ctx.save();
    const dateSize = Math.round(14 * captionSize);
    ctx.font = `bold ${dateSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = captionColor === 'white' 
        ? "rgba(255, 255, 255, 0.85)" 
        : (captionColor === 'black' ? "rgba(0,0,0,0.7)" : (isDark ? "rgba(226, 232, 240, 0.85)" : "rgba(107,114,128,0.60)"));
    ctx.globalAlpha = isDark ? 1.0 : 0.72;
    ctx.fillText(nowStr, stripWidth / 2, nextY + 8);
    ctx.restore();
    nextY += 16;
  }

  if (showCaptionHere) {
    ctx.save();
    ctx.font = getCanvasFont(captionFont, captionSize);
    ctx.textAlign = "center";
    ctx.fillStyle = captionColor === 'white' ? "#ffffff" : (captionColor === 'black' ? "#000000" : (isDark ? "#f8fafc" : "#222"));
    ctx.globalAlpha = 1.0;
    wrappedLines.forEach((line, index) => {
      ctx.fillText(line, stripWidth / 2, nextY + 26 + (index * 20));
    });
    ctx.restore();
  }

  if (logoImg && showWatermark) {
    ctx.save();
    ctx.globalAlpha = isDark ? 0.95 : 0.85;
    const logoDrawH = 20;
    const aspect = logoImg.width / logoImg.height;
    const logoDrawW = logoDrawH * aspect;
    
    // Use an extra-bold font for "meemomini"
    ctx.font = "900 22px 'Inter', system-ui, sans-serif";
    ctx.letterSpacing = "-1px"; // HTML5 canvas supports letterSpacing in modern browsers
    const textStr = "meemomini";
    const textW = ctx.measureText(textStr).width;
    const dotW = ctx.measureText(".").width;
    
    const gap = 8;
    const totalW = logoDrawW + gap + textW + dotW;
    
    let startX = (stripWidth - totalW) / 2;
    if (watermarkPlacement === "left") {
      startX = 24;
    } else if (watermarkPlacement === "right") {
      startX = stripWidth - 24 - totalW;
    }
    
    const startY = totalHeight - bottomPad - 12;
    
    // Draw logo normally
    ctx.save();
    ctx.drawImage(logoImg, startX, startY - logoDrawH / 2 - 2, logoDrawW, logoDrawH);
    ctx.restore();
    
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = watermarkColor === 'white' ? "#ffffff" : (watermarkColor === 'black' ? "#000000" : (isDark ? "#ffffff" : "#0f172a"));
    ctx.fillText(textStr, startX + logoDrawW + gap, startY);
    
    // Glowing dot
    ctx.save();
    ctx.shadowColor = "rgba(163, 230, 53, 0.8)"; // Lime green glow
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#a3e635"; // Lime green dot matching the uploaded image
    ctx.fillText(".", startX + logoDrawW + gap + textW, startY);
    ctx.restore();
    
    ctx.restore();
  }

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
};

export const downloadPhotos = async (
  photos: CapturedPhoto[],
  settings: PhotoSettings,
  showDate: boolean,
  showCaption: boolean,
  customCaption: string,
  captionFont: string,
  nowStr: string,
  showWatermark: boolean = true,
  watermarkPlacement: "left" | "center" | "right" = "center"
) => {
  const blob = await generateStripBlob(photos, settings, showDate, showCaption, customCaption, captionFont, nowStr, showWatermark, watermarkPlacement);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `photobooth-strip-${Date.now()}.jpg`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
};

export const printPhotos = async (
  photos: CapturedPhoto[],
  settings: PhotoSettings,
  showDate: boolean,
  showCaption: boolean,
  customCaption: string,
  captionFont: string,
  nowStr: string,
  showWatermark: boolean = true,
  watermarkPlacement: "left" | "center" | "right" = "center"
) => {
  const blob = await generateStripBlob(photos, settings, showDate, showCaption, customCaption, captionFont, nowStr, showWatermark, watermarkPlacement);
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const targetW = 1200;
    const gap = 40;
    
    const isGrid = settings.layout === 'grid';
    const isHorizontal = settings.layout === 'strip-horizontal';
    const cols = isGrid ? 2 : (isHorizontal ? photos.length : 1);
    const rows = isGrid ? Math.ceil(photos.length / 2) : (isHorizontal ? 1 : photos.length);
    const stripTargetWidth = isGrid ? 800 : (isHorizontal ? Math.max(1200, 300 * cols) : (targetW - gap) / 2);
    const stripTargetHeight = stripTargetWidth * (img.height / img.width);
    const targetH = Math.max(1800, stripTargetHeight + 80);
    
    if (isGrid) {
      const startX = (targetW - stripTargetWidth) / 2;
      const startY = (targetH - stripTargetHeight) / 2;
      ctx.drawImage(img, startX, startY, stripTargetWidth, stripTargetHeight);
    } else {
      const startX = (targetW - (stripTargetWidth * 2 + gap)) / 2;
      const startY = (targetH - stripTargetHeight) / 2;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      
      ctx.drawImage(img, startX, startY, stripTargetWidth, stripTargetHeight);
      ctx.drawImage(img, startX + stripTargetWidth + gap, startY, stripTargetWidth, stripTargetHeight);
      
      ctx.restore();
    }
    
    const printDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Photobooth Strip</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #333; }
              @media print {
                @page { margin: 0; size: 4in 6in; }
                body { background: #fff; }
                img { width: 4in; height: 6in; object-fit: contain; }
              }
              img { max-height: 90vh; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
            </style>
          </head>
          <body>
            <img src="${printDataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };
  img.src = url;
};

export const generateBoomerangBlob = async (photo: CapturedPhoto): Promise<Blob | null> => {
  if (!photo.frames || photo.frames.length === 0) return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const firstImg = new Image();
  await new Promise((resolve) => {
    firstImg.onload = resolve;
    firstImg.src = photo.frames![0];
  });

  canvas.width = firstImg.width;
  canvas.height = firstImg.height;

  ctx.drawImage(firstImg, 0, 0);

  const stream = canvas.captureStream(15);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const blobPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
  });

  recorder.start();

  for (let i = 0; i < photo.frames.length; i++) {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = photo.frames![i];
    });
    ctx.drawImage(img, 0, 0);
    await new Promise((r) => setTimeout(r, 66));
  }

  recorder.stop();
  return blobPromise;
};

export const downloadBoomerang = async (photo: CapturedPhoto) => {
  const blob = await generateBoomerangBlob(photo);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `meemomini_vd.webm`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

