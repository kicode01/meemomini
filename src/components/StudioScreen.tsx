import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useStore } from "@/store/useStore";
import { Paintbrush, Eraser, Undo, Check, Camera, Download, PlaySquare, QrCode, Layers, Share2, Sparkles, Images, X, RefreshCw, Printer, Trash2, Copy } from "lucide-react";
import { ZoomContainer } from "./ZoomContainer";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { isFirebaseConfigured } from '@/lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import BoomerangPlayer from "./BoomerangPlayer";
import { downloadPhotos, getFrameColor, isBackgroundDark, generateStripBlob, printPhotos, downloadBoomerang, generateBoomerangBlob, generateSessionDataForShare } from "@/utils/StripGenerator";
import { exportReplayVideo } from "@/utils/ExportReplayVideo";
import { PATTERN_LIST, getPatternCss } from "@/utils/Patterns";
import { useGallery } from "@/hooks/useGallery";
import { GALLERY_ENABLED } from "@/lib/features";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaptureStripDisplay } from "./CaptureStripDisplay";

const STICKERS_3D = [
  "💖", "❤️", "💕", "✨", "⭐", "💫", 
  "👑", "🕶️", "👓", "🎀", "🎩", "🧢", 
  "🎉", "🎈", "🔥", "💯", "✌️", "🫶",
  "🐱", "🐶", "🐰", "🐻", "🦋", "🦄",
  "🍭", "🍩", "🍹", "🥂", "🍓", "🍉",
  "🌈", "🌸", "🎵", "⚡", "🍀", "💎"
];

const STICKERS_2D = [
  "★", "☆", "♡", "♥", "✿", "❀",
  "✦", "✧", "☾", "☼", "☁", "☂",
  "♪", "♫", "♠", "♣", "♦", "☻",
  "✔", "✘", "▲", "▼", "◄", "►",
  "●", "■", "◆", "✖", "✚", "✱"
];
const COLORS = [
  "#000000", "#ffffff", // Black, White
  "#ef4444", "#f97316", "#f59e0b", "#eab308", // Reds, Oranges, Yellows
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", // Greens, Teals
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", // Blues, Indigos
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899" // Purples, Pinks (removed 19th color for perfect 3x6 grid)
];

const fontOptions = [
  { name: "Inter (Default)", value: "font-sans" },
  { name: "Outfit", value: "font-outfit" },
  { name: "Open Runde", value: "font-runde" },
  { name: "Serif", value: "font-serif" },
  { name: "Monospace", value: "font-mono" },
  { name: "Playfair Display", value: "font-playfair" },
  { name: "Caveat", value: "font-caveat" },
];

type AnimState = 'idle' | 'leaving-decorate' | 'morphing-to-frame' | 'flying-to-layout' | 'leaving-layout' | 'flying-to-decorate' | 'morphing-to-thumbnail' | 'arriving-decorate';

interface PlacedSticker {
  id: string;
  sticker: string;
  initialX: number;
  initialY: number;
  scale: number;
  type: "3D" | "2D";
  color?: string;
  border: "white" | "black" | "none";
  rotation?: number;
}

export default function StudioScreen() {
  const photos = useStore(state => state.capturedPhotos);
  const setPhotos = useStore(state => state.setCapturedPhotos);
  const setAppState = useStore(state => state.setAppState);
  const settings = useStore(state => state.settings);
  const resetSession = useStore(state => state.resetSession);

  const { 
    showDate = false, 
    showCaption = false, 
    customCaption = "", 
    captionFont = fontOptions[0].value, 
    captionSize = 1.0,
    captionColor = "black",
    showWatermark = true, 
    watermarkPlacement = "center",
    watermarkColor = "black",
    activeStudioTab = "decorate" 
  } = settings;
  
  const updateSetting = (key: string, value: any) => {
    useStore.getState().setSettings({ ...useStore.getState().settings, [key]: value });
  };
  const { saveToGallery } = useGallery();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(true);

  const [animState, setAnimState] = useState<AnimState>('idle');
  const [targetTabState, setTargetTab] = useState<'decorate' | 'layout' | 'export' | null>(null);
  
  const currentTab = activeStudioTab;
  const highlightTab = targetTabState || activeStudioTab;
  const handleTabClick = (tab: 'decorate' | 'layout' | 'export') => {
    if (window.innerWidth < 1024) setIsMobilePanelOpen(true);
    if (currentTab === tab || targetTabState === tab || animState !== 'idle') return;
    setTargetTab(tab);

    if (currentTab === 'decorate') {
      // Forward Sequence
      setAnimState('leaving-decorate');
      setTimeout(() => {
        setAnimState('morphing-to-frame');
        setTimeout(() => {
          updateSetting("activeStudioTab", tab);
          setAnimState('flying-to-layout');
          setTimeout(() => {
            setAnimState('idle');
            setTargetTab(null);
          }, 600);
        }, 200);
      }, 200);
    } else if (tab === 'decorate') {
      // Reverse Sequence
      setAnimState('leaving-layout');
      setTimeout(() => {
        updateSetting("activeStudioTab", tab);
        setAnimState('flying-to-decorate');
        setTimeout(() => {
          setAnimState('morphing-to-thumbnail');
          setTimeout(() => {
            setAnimState('arriving-decorate');
            setTimeout(() => {
              setAnimState('idle');
              setTargetTab(null);
            }, 200);
          }, 200);
        }, 600);
      }, 200);
    } else {
      updateSetting("activeStudioTab", tab);
      setTargetTab(null);
    }
  };

  // Decorate State
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<"brush" | "sticker">("brush");
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(2.5); // percentage of canvas width
  const [stickerType, setStickerType] = useState<"3D" | "2D">("3D");
  const [activeSticker, setActiveSticker] = useState(STICKERS_3D[0]);
  const [stickerBorder, setStickerBorder] = useState<"white" | "black" | "none">("white");
  const [stickerSize, setStickerSize] = useState(1); // scale factor
  
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const stickerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCardRef = useRef<HTMLDivElement>(null);
  const qrSaveAreaRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadQrCard = async () => {
    if (qrCardRef.current) {
      const canvas = await html2canvas(qrCardRef.current);
      const data = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = data;
      link.download = "qr-code.png";
      link.click();
    }
  };
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const activePhoto = photos[activePhotoIdx];

  // Layout & Export State
  const [previewMode, setPreviewMode] = useState<'image-strip' | 'video-strip' | 'clips'>('image-strip');
  const [nowStr, setNowStr] = useState(() => new Date().toLocaleDateString());
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrCacheKey, setQrCacheKey] = useState<string | null>(null);
  const qrSectionRef = useRef<HTMLDivElement>(null);
  const confirmResetRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false); // Legacy, can be kept for other uses if needed but we'll use activeExportAction
  const [activeExportAction, setActiveExportAction] = useState<string | null>(null);
  const isAnyActionActive = activeExportAction !== null;
  
  const isVideoStrip = previewMode === 'video-strip' && settings.captureMode !== 'boomerang';

  useEffect(() => {
    if (!showDate) return;
    const interval = setInterval(() => {
      setNowStr(new Date().toLocaleDateString());
    }, 1000);
    return () => clearInterval(interval);
  }, [showDate]);

  // Auto-scroll to QR section when generated
  useEffect(() => {
    if (qrUrl && qrSectionRef.current) {
      setTimeout(() => qrSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [qrUrl]);

  // Invalidate QR cache key when photos or key settings change
  const currentCacheKey = `${photos.map(p => p.id).join(',')}_${settings.layout}_${settings.photoCount}_${settings.frameStyle}_${showCaption}_${customCaption}_${showDate}`;
  useEffect(() => {
    if (qrCacheKey && qrCacheKey !== currentCacheKey) {
      setQrUrl(null);
      setQrCacheKey(null);
    }
  }, [currentCacheKey]);


  useEffect(() => {
    setPlacedStickers([]); // Clear unsaved stickers on photo or tab switch
    if (currentTab !== 'decorate') return;
    const canvas = canvasRef.current;
    if (!canvas || !activePhoto) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let targetWidth = img.width;
      let targetHeight = img.height;
      
      // Maintain reasonable internal resolution based on original aspect
      const maxDim = 1200;
      if (targetWidth > maxDim || targetHeight > maxDim) {
        const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
        targetWidth = Math.floor(targetWidth * ratio);
        targetHeight = Math.floor(targetHeight * ratio);
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      
      // Store just the transparent canvas in history! (Photo is shown via CSS)
      setHistory([ctx.getImageData(0, 0, targetWidth, targetHeight)]);
    };
    img.src = activePhoto.dataUrl;
  }, [activePhotoIdx, activePhoto, currentTab]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)].slice(-10)); // keep last 10
  };

  const undo = () => {
    if (placedStickers.length > 0) {
      setPlacedStickers(prev => prev.slice(0, -1));
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas || history.length <= 1) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;
    
    const pos = getPos(e);
    
    if (activeTool === "brush") {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = canvas.width * (brushSize / 100);
      ctx.strokeStyle = activeColor;
    } else if (activeTool === "sticker") {
      setPlacedStickers(prev => [...prev, {
        id: Date.now().toString(),
        sticker: activeSticker,
        initialX: pos.x,
        initialY: pos.y,
        scale: stickerSize,
        type: stickerType,
        color: activeColor,
        border: stickerBorder
      }]);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || activeTool !== "brush") return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  const handleSavePhoto = (callback?: () => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (placedStickers.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const baseFontSize = canvas.width * 0.15;
      
      placedStickers.forEach(sticker => {
        const el = stickerRefs.current[sticker.id];
        if (!el) return;
        
        const elRect = el.getBoundingClientRect();
        const domX = elRect.left - rect.left + elRect.width / 2;
        const domY = elRect.top - rect.top + elRect.height / 2;
        
        const internalX = domX * scaleX;
        const internalY = domY * scaleY;
        
        ctx.font = `${baseFontSize * sticker.scale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        ctx.save();
        ctx.translate(internalX, internalY);
        if (sticker.rotation) {
          ctx.rotate((sticker.rotation * Math.PI) / 180);
        }
        
        if (sticker.border !== "none") {
          const thickness = baseFontSize * sticker.scale * 0.04;
          ctx.shadowColor = sticker.border === "white" ? "white" : "black";
          ctx.shadowBlur = 0;
          
          const numSteps = 32;
          for (let i = 0; i < numSteps; i++) {
              const rad = (i * 2 * Math.PI) / numSteps;
              ctx.shadowOffsetX = Math.cos(rad) * thickness;
              ctx.shadowOffsetY = Math.sin(rad) * thickness;
              ctx.fillText(sticker.sticker, 0, 0);
          }
          ctx.shadowColor = "transparent";
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        ctx.fillStyle = sticker.type === "2D" ? (sticker.color || "black") : "black";
        ctx.fillText(sticker.sticker, 0, 0);
        ctx.restore();
      });
      saveHistory();
    }

    const overlayUrl = canvas.toDataURL("image/png");

    const bakeImageAsync = async () => {
      const compCanvas = document.createElement("canvas");
      compCanvas.width = canvas.width;
      compCanvas.height = canvas.height;
      const compCtx = compCanvas.getContext("2d");
      if (!compCtx) return;

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = activePhoto.dataUrl;
      });

      compCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      compCtx.drawImage(canvas, 0, 0);

      const newPhotos = [...photos];
      newPhotos[activePhotoIdx] = {
        ...newPhotos[activePhotoIdx],
        dataUrl: compCanvas.toDataURL("image/jpeg", 0.9),
        overlayUrl: overlayUrl
      };
      setPhotos(newPhotos);
      setPlacedStickers([]); // Clear stickers after baking
      
      if (callback) {
        callback();
      }
    };
    
    bakeImageAsync();
  };

  // Export Logic
  const handleDownload = async () => {
    setActiveExportAction('image-strip');
    await new Promise(resolve => setTimeout(resolve, 50)); // Force UI paint before heavy task
    try {
      saveHistory();
      if (settings.captureMode === 'boomerang' && photos[0]?.isBoomerang) {
        await downloadBoomerang(photos[0]);
      } else {
        // Use html-to-image for a pixel-perfect, exact match of the preview!
        const element = document.getElementById('print-container');
        if (element) {
          // Dynamically import to avoid SSR issues if this were a framework, but it works fine here
          const { toPng } = await import('html-to-image');
          
          // Generate the image with a pixel ratio for 2K quality (320px * 8 = 2560px width)
          // Add fontEmbedCSS: '' to prevent CORS SecurityError from Google Fonts
          const dataUrl = await toPng(element, { 
            pixelRatio: 8, 
            backgroundColor: '#ffffff',
            fontEmbedCSS: ''
          });
          
          // Convert massive base64 Data URL to Blob to prevent browser size limits and force native download
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = `meemomini_img.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          // Fallback to legacy canvas generator if DOM node is missing
          await downloadPhotos(photos, settings, showDate, showCaption, customCaption, captionFont, nowStr, showWatermark, watermarkPlacement);
        }
      }
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);
      alert("Oops! Something went wrong saving the image: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setActiveExportAction(null);
    }
  };

  const handlePrint = async () => {
    saveHistory();
    const element = document.getElementById('print-container');
    if (element) {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(element, { 
        pixelRatio: 8, 
        backgroundColor: '#ffffff',
        fontEmbedCSS: '' 
      });
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>meemomini_strp</title>
              <link rel="icon" type="image/x-icon" href="${window.location.origin}/favicon.ico" />
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; height: 100vh; }
                @page { 
                  margin: 0; 
                  size: ${settings.layout === 'strip-horizontal' ? 'landscape' : 'portrait'}; 
                }
                img { max-width: 85vw; max-height: 85vh; object-fit: contain; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      await printPhotos(photos, settings, showDate, showCaption, customCaption, captionFont, nowStr, showWatermark, watermarkPlacement);
    }
  };

  const handleConfirmReset = () => {
    setShowConfirmReset(false);
    setTimeout(() => resetSession(), 200); // slight delay for animation
  };

  const shouldShowCaptionSection = showDate || (showCaption && customCaption.trim().length > 0);

  const isThumbnailDecoratorsVisible = animState === 'idle' || animState === 'arriving-decorate' || animState === 'leaving-layout';
  const hasFrame = animState === 'morphing-to-frame' || animState === 'flying-to-layout' || animState === 'flying-to-decorate' || animState === 'morphing-to-thumbnail';
  const isStripBackgroundVisible = animState === 'idle';
  const isBigPreviewVisible = animState === 'idle' || animState === 'arriving-decorate';
  const isFlightActive = animState === 'flying-to-layout' || animState === 'flying-to-decorate';

  const prepareVideoExportArgs = async () => {
    const originalMode = previewMode;
    setPreviewMode('image-strip');
    await new Promise(r => setTimeout(r, 100)); // wait for React render
    
    let bgDataUrl = "";
    let fgDataUrl = "";
    const slotRects: Array<{cx: number, cy: number, w: number, h: number, radii: [number, number, number, number], rotation: number}> = [];
    try {
      const element = document.getElementById('print-container');
      if (element) {
        const { toPng } = await import('html-to-image');
        
        // 1. Capture BG without videos and overlays
        bgDataUrl = await toPng(element, { 
          pixelRatio: 4, 
          backgroundColor: '#ffffff',
          fontEmbedCSS: '',
          filter: (node) => {
            if ((node as HTMLElement).classList?.contains('export-hide')) return false;
            if ((node as HTMLElement).classList?.contains('overlay-element')) return false;
            return true;
          }
        });
        
        // 2. Capture FG (just the overlays on transparent BG)
        const originalStripCss = element.style.cssText;
        element.style.background = 'transparent';
        
        const slots = document.querySelectorAll('.print-container-photo-slot');
        const cards = document.querySelectorAll('.print-container-photo-card');
        
        const originalSlotCss: string[] = [];
        slots.forEach(slot => {
           const el = slot as HTMLElement;
           originalSlotCss.push(el.style.cssText);
           el.style.background = 'transparent';
           el.style.backgroundColor = 'transparent';
           el.style.boxShadow = 'none';
        });
        
        const originalCardCss: string[] = [];
        cards.forEach(card => {
           const el = card as HTMLElement;
           originalCardCss.push(el.style.cssText);
           el.style.background = 'transparent';
           el.style.backgroundColor = 'transparent';
           el.style.borderColor = 'transparent';
           el.style.boxShadow = 'none';
        });
        
        // Force transparency via CSS to guarantee html-to-image reads it properly
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
          .print-container-photo-slot { background: transparent !important; background-color: transparent !important; box-shadow: none !important; }
          .print-container-photo-card { background: transparent !important; background-color: transparent !important; border-color: transparent !important; box-shadow: none !important; }
        `;
        document.body.appendChild(styleEl);
        
        fgDataUrl = await toPng(element, {
          pixelRatio: 4,
          backgroundColor: 'rgba(0,0,0,0)',
          fontEmbedCSS: '',
          filter: (node) => {
            const el = node as HTMLElement;
            if (el.classList?.contains('export-hide')) return false;
            // PREVENT WHITE BOX OVERLAYS: Completely skip the photo slots from fgDataUrl.
            // The video and inner overlays are drawn manually anyway!
            if (el.classList?.contains('print-container-photo-slot')) return false;
            return true;
          }
        });
        
        document.body.removeChild(styleEl);
        
        // Restore backgrounds perfectly
        element.style.cssText = originalStripCss;
        slots.forEach((slot, i) => {
           const el = slot as HTMLElement;
           el.style.cssText = originalSlotCss[i];
        });
        cards.forEach((card, i) => {
           const el = card as HTMLElement;
           el.style.cssText = originalCardCss[i];
        });
        
        const containerRect = element.getBoundingClientRect();
        slots.forEach(slot => {
          const rect = slot.getBoundingClientRect();
          const style = window.getComputedStyle(slot);
          
          // Get rotation by walking up the tree to find the transformed wrapper
          let currentEl: HTMLElement | null = slot as HTMLElement;
          let rotation = 0;
          while (currentEl && currentEl !== element) {
            const currentStyle = window.getComputedStyle(currentEl);
            const transform = currentStyle.transform;
            if (transform && transform !== 'none') {
              const values = transform.split('(')[1].split(')')[0].split(',');
              const a = parseFloat(values[0]);
              const b = parseFloat(values[1]);
              rotation = Math.atan2(b, a) * (180/Math.PI);
              break;
            }
            currentEl = currentEl.parentElement;
          }

          // Get unrotated center relative to container
          const cx = rect.left + rect.width / 2 - containerRect.left;
          const cy = rect.top + rect.height / 2 - containerRect.top;
          
          // Use offsetWidth/Height for true unrotated dimensions
          const w = (slot as HTMLElement).offsetWidth;
          const h = (slot as HTMLElement).offsetHeight;

          const baseRadius = parseInt(style.borderRadius) || 0;
          const tlVal = parseFloat(style.borderTopLeftRadius);
          const trVal = parseFloat(style.borderTopRightRadius);
          const brVal = parseFloat(style.borderBottomRightRadius);
          const blVal = parseFloat(style.borderBottomLeftRadius);
          
          const tl = (isNaN(tlVal) ? baseRadius : tlVal) / element.offsetWidth;
          const tr = (isNaN(trVal) ? baseRadius : trVal) / element.offsetWidth;
          const br = (isNaN(brVal) ? baseRadius : brVal) / element.offsetWidth;
          const bl = (isNaN(blVal) ? baseRadius : blVal) / element.offsetWidth;

          slotRects.push({
            cx: cx / containerRect.width,
            cy: cy / containerRect.height,
            w: w / element.offsetWidth,
            h: h / element.offsetHeight,
            rotation: rotation,
            radii: [tl, tr, br, bl]
          });
        });
      }
    } catch (e) {
      console.error("DOM Capture failed", e);
    }
    
    setPreviewMode(originalMode);
    return { bgDataUrl, fgDataUrl, slotRects };
  };

  return (
    <div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[100dvh] w-full flex flex-col lg:flex-row overflow-hidden bg-gradient-to-br from-blue-100 via-pink-100 to-yellow-50"
    >
      
      {/* Left Area: Main Preview */}
      <div className={`flex-1 relative flex flex-col p-4 lg:p-8 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.2)] ${window.innerWidth < 1024 ? (isMobilePanelOpen ? 'pb-[50vh]' : 'pb-[110px]') : 'pb-8'}`}>
        <div className="flex items-center justify-end mb-2 lg:mb-4 h-8 lg:h-10">
          {GALLERY_ENABLED && (
            <button 
              onClick={() => setAppState('gallery')} 
              className="group flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-black text-xs tracking-widest shadow-sm border-b-[4px] border-blue-700 active:border-b-0 active:mt-[4px] transition-all"
            >
              <Images className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
              VIEW GALLERY
            </button>
          )}
        </div>

        <div className="flex-1 w-full relative flex items-center justify-center">
          <AnimatePresence>
            {currentTab === 'decorate' ? (
              // DECORATE PREVIEW
              <motion.div 
                key="decorate-view"
                className="absolute inset-0 max-w-6xl mx-auto w-full h-full min-h-0 min-w-0 flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8 pt-12 lg:pt-0"
              >
                {/* Strip Navigation for Decorating on the LEFT */}
                <div className={`w-full lg:w-28 flex-shrink-0 flex lg:flex-col lg:pr-2 snap-x lg:snap-y hide-scrollbar z-50 transition-all duration-300 ${isFlightActive ? 'overflow-visible' : 'overflow-x-auto lg:overflow-y-auto'} ${isMobilePanelOpen && animState === 'idle' ? 'h-0 opacity-0 py-0 pointer-events-none lg:h-full lg:max-h-[70vh] lg:opacity-100 lg:py-1 lg:pointer-events-auto' : 'h-auto max-h-[150px] opacity-100 py-2 lg:h-full lg:max-h-[70vh] lg:py-1'}`}>
                  <div className="flex lg:flex-col gap-3 min-w-max lg:min-w-0 px-4 lg:px-0 mx-auto lg:mx-0">
                  {photos.map((p, i) => (
                    <motion.button 
                      layoutId={`photo-wrapper-${p.id}`}
                      key={p.id}
                      onClick={() => {
                        if (activePhotoIdx !== i) {
                          if (currentTab === 'decorate') {
                            handleSavePhoto(() => setActivePhotoIdx(i));
                          } else {
                            setActivePhotoIdx(i);
                          }
                        }
                      }}
                      animate={{
                        borderColor: isThumbnailDecoratorsVisible ? (activePhotoIdx === i ? '#3b82f6' : 'rgba(0,0,0,0)') : 'transparent',
                        paddingTop: hasFrame ? (settings.frameStyle === 'film' ? '0px' : (settings.frameStyle === 'polaroid' ? '10px' : (settings.frameStyle === 'minimalist' ? '4px' : (settings.frameStyle === 'gallery' ? '18px' : '12px')))) : '0px',
                        paddingBottom: hasFrame ? (settings.frameStyle === 'film' ? '0px' : (settings.frameStyle === 'polaroid' ? '36px' : (settings.frameStyle === 'photobooth' ? '24px' : (settings.frameStyle === 'minimalist' ? '4px' : (settings.frameStyle === 'gallery' ? '18px' : '12px'))))) : '0px',
                        paddingLeft: hasFrame ? (settings.frameStyle === 'film' ? '0px' : (settings.frameStyle === 'polaroid' ? '10px' : (settings.frameStyle === 'minimalist' ? '4px' : (settings.frameStyle === 'gallery' ? '18px' : '12px')))) : '0px',
                        paddingRight: hasFrame ? (settings.frameStyle === 'film' ? '0px' : (settings.frameStyle === 'polaroid' ? '10px' : (settings.frameStyle === 'minimalist' ? '4px' : (settings.frameStyle === 'gallery' ? '18px' : '12px')))) : '0px',
                        backgroundColor: hasFrame ? (settings.frameStyle === 'film' ? 'transparent' : '#ffffff') : 'transparent',
                        borderWidth: hasFrame ? (settings.frameStyle === 'film' ? 0 : 2) : 4,
                      }}
                      transition={{ duration: 0.2 }}
                      className={`w-20 lg:w-24 relative snap-start flex-shrink-0 rounded-2xl overflow-hidden group ${
                        activePhotoIdx === i ? 'shadow-sm z-10' : 'hover:border-slate-300'
                      }`}
                      style={{ originX: 0, originY: 0 }}
                    >
                      <motion.div 
                        className="w-full h-full"
                        animate={{ scale: (activePhotoIdx === i && isThumbnailDecoratorsVisible && !hasFrame) ? 1.05 : 1 }} 
                        transition={{ type: 'spring', bounce: 0.3 }}
                      >
                        <motion.img
                          src={p.dataUrl} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      </motion.div>
                      <motion.div 
                        animate={{ opacity: isThumbnailDecoratorsVisible ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm"
                      >
                        {i + 1}
                      </motion.div>
                      {/* Retake Overlay Desktop */}
                      <motion.div 
                        animate={{ opacity: isThumbnailDecoratorsVisible ? undefined : 0 }}
                        className="hidden lg:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center"
                      >
                         <div 
                           onClick={(e) => {
                             e.stopPropagation();
                             const retake = () => {
                               useStore.getState().setRetakeIndex(i);
                               setAppState('camera');
                             };
                             if (currentTab === 'decorate') {
                               handleSavePhoto(retake);
                             } else {
                               retake();
                             }
                           }}
                           className="theme-btn py-1 px-2 text-xs flex items-center shadow-lg"
                         >
                           <Camera className="w-3 h-3 mr-1" /> Retake
                         </div>
                        </motion.div>

                      {/* Retake Button Mobile */}
                      <motion.div 
                        animate={{ opacity: isThumbnailDecoratorsVisible ? 1 : 0 }}
                        className="lg:hidden absolute bottom-1 right-1"
                      >
                         <div 
                           onClick={(e) => {
                             e.stopPropagation();
                             const retake = () => {
                               useStore.getState().setRetakeIndex(i);
                               setAppState('camera');
                             };
                             if (currentTab === 'decorate') {
                               handleSavePhoto(retake);
                             } else {
                               retake();
                             }
                           }}
                           className="bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full shadow-lg border border-white/20 active:bg-black/80 flex items-center justify-center"
                         >
                           <Camera className="w-3 h-3" />
                         </div>
                        </motion.div>
                     </motion.button>
                  ))}
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: isBigPreviewVisible ? 1 : 0, 
                    scale: isBigPreviewVisible ? 1 : 0.95 
                  }}
                  transition={{ 
                    duration: 0.2,
                  }}
                  className="relative shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border-[12px] md:border-[16px] border-white flex items-center justify-center ring-4 ring-pink-200/50 z-10" 
                  style={{ aspectRatio: settings.aspectRatio === 'portrait' ? '3/4' : '4/3', maxHeight: '100%', maxWidth: '100%' }}
                >
                  {/* Invisible huge spacer to force the box to expand to its maximum allowed constraints */}
                  <div style={{ width: 10000, height: 10000 }} />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {activePhoto && (
                        <img 
                          src={activePhoto.dataUrl} 
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50"
                          style={{ objectFit: 'contain', zIndex: 0 }}
                          alt=""
                        />
                      )}
                      <div className="relative w-full h-full" style={{ zIndex: 1, backgroundImage: `url(${activePhoto?.dataUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleStart}
                          onMouseMove={handleMove}
                          onMouseUp={handleEnd}
                          onMouseLeave={handleEnd}
                          onTouchStart={handleStart}
                          onTouchMove={handleMove}
                          onTouchEnd={handleEnd}
                          className="w-full h-full cursor-crosshair touch-none"
                        />
                      
                      {/* Interactive Stickers Overlay */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {placedStickers.map(sticker => {
                          const canvasW = canvasRef.current?.width || 1080;
                          const canvasH = canvasRef.current?.height || 1440;
                          const rectW = canvasRef.current?.getBoundingClientRect().width || 400;
                          
                          const leftPercent = (sticker.initialX / canvasW) * 100;
                          const topPercent = (sticker.initialY / canvasH) * 100;
                          const baseFontSize = rectW * 0.15;
                          
                          return (
                            <div
                              key={sticker.id}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${leftPercent}%`,
                                top: `${topPercent}%`,
                              }}
                            >
                              <motion.div
                                key={`${sticker.id}-${sticker.initialX}-${sticker.initialY}`}
                                className="absolute pointer-events-auto group flex items-center justify-center leading-none aspect-square w-max h-max"
                                drag
                                dragMomentum={false}
                                onDragEnd={(e, info) => {
                                  const canvas = canvasRef.current;
                                  if (!canvas) return;
                                  const rect = canvas.getBoundingClientRect();
                                  const scaleX = canvas.width / rect.width;
                                  const scaleY = canvas.height / rect.height;
                                  
                                  const deltaX = info.offset.x * scaleX;
                                  const deltaY = info.offset.y * scaleY;
                                  
                                  setPlacedStickers(prev => prev.map(s => 
                                    s.id === sticker.id 
                                      ? { ...s, initialX: s.initialX + deltaX, initialY: s.initialY + deltaY }
                                      : s
                                  ));
                                }}
                                style={{
                                  x: "-50%",
                                  y: "-50%",
                                  rotate: sticker.rotation || 0,
                                  fontSize: `${baseFontSize * sticker.scale}px`,
                                  color: sticker.type === "2D" ? (sticker.color || "black") : "black",
                                  textShadow: sticker.border !== 'none' 
                                    ? `-0.04em -0.04em 0 ${sticker.border === 'white' ? '#fff' : '#000'}, 0.04em -0.04em 0 ${sticker.border === 'white' ? '#fff' : '#000'}, -0.04em 0.04em 0 ${sticker.border === 'white' ? '#fff' : '#000'}, 0.04em 0.04em 0 ${sticker.border === 'white' ? '#fff' : '#000'}, -0.04em 0 0 ${sticker.border === 'white' ? '#fff' : '#000'}, 0.04em 0 0 ${sticker.border === 'white' ? '#fff' : '#000'}, 0 0.04em 0 ${sticker.border === 'white' ? '#fff' : '#000'}, 0 -0.04em 0 ${sticker.border === 'white' ? '#fff' : '#000'}${sticker.type === '3D' ? ', 0px 8px 10px rgba(0,0,0,0.3)' : ''}`
                                    : (sticker.type === '3D' ? `0px 8px 10px rgba(0,0,0,0.3)` : 'none'),
                                }}
                              >
                                {sticker.sticker}
                                
                                {/* Delete Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlacedStickers(prev => prev.filter(s => s.id !== sticker.id));
                                  }}
                                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110"
                                >
                                  <X size={14} strokeWidth={2.5} />
                                </button>
    
                                {/* Resize Handles (Corners and Sides) */}
                                <div ref={el => stickerRefs.current[sticker.id] = el} className="absolute inset-0 pointer-events-none border-[3px] border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 overlay-element">
                                  {[
                                    { pos: "-top-[5px] -left-[5px]", cursor: "cursor-nwse-resize" },
                                    { pos: "-bottom-[5px] -left-[5px]", cursor: "cursor-nesw-resize" },
                                    { pos: "-bottom-[5px] -right-[5px]", cursor: "cursor-nwse-resize" },
                                    { pos: "-top-[5px] left-1/2 -translate-x-1/2", cursor: "cursor-ns-resize" },
                                    { pos: "-bottom-[5px] left-1/2 -translate-x-1/2", cursor: "cursor-ns-resize" },
                                    { pos: "top-1/2 -translate-y-1/2 -left-[5px]", cursor: "cursor-ew-resize" },
                                    { pos: "top-1/2 -translate-y-1/2 -right-[5px]", cursor: "cursor-ew-resize" }
                                  ].map((handle, idx) => (
                                    <div 
                                      key={idx}
                                      className={`absolute ${handle.pos} w-2.5 h-2.5 bg-white border-[1.5px] border-blue-500 opacity-0 group-hover:opacity-100 z-10 pointer-events-auto ${handle.cursor}`}
                                      onPointerDownCapture={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        
                                        const el = stickerRefs.current[sticker.id];
                                        if (!el) return;
                                        
                                        const rect = el.getBoundingClientRect();
                                        const centerX = rect.left + rect.width / 2;
                                        const centerY = rect.top + rect.height / 2;
                                        
                                        const initialDistance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
                                        const initialScale = sticker.scale;
                                        
                                        const handlePointerMove = (moveEvent: PointerEvent) => {
                                          const newDistance = Math.sqrt(Math.pow(moveEvent.clientX - centerX, 2) + Math.pow(moveEvent.clientY - centerY, 2));
                                          const scaleFactor = newDistance / initialDistance;
                                          const newScale = Math.max(0.2, initialScale * scaleFactor);
                                          
                                          setPlacedStickers(prev => prev.map(s => 
                                            s.id === sticker.id ? { ...s, scale: newScale } : s
                                          ));
                                        };
                                        
                                        const handlePointerUp = () => {
                                          window.removeEventListener("pointermove", handlePointerMove);
                                          window.removeEventListener("pointerup", handlePointerUp);
                                        };
                                        
                                        window.addEventListener("pointermove", handlePointerMove);
                                        window.addEventListener("pointerup", handlePointerUp);
                                      }}
                                    />
                                  ))}
                                  
                                  {/* Dedicated Rotation Handle */}
                                  <div className="absolute -top-[20px] left-1/2 w-[2px] h-[20px] bg-blue-500 opacity-0 group-hover:opacity-100 z-10 pointer-events-none" />
                                  <div 
                                    className="absolute -top-[32px] left-1/2 -translate-x-1/2 w-7 h-7 bg-white border-[2px] border-blue-500 rounded-full flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 z-20 pointer-events-auto hover:scale-110 shadow-md transition-transform"
                                    onPointerDownCapture={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      
                                      const el = stickerRefs.current[sticker.id];
                                      if (!el) return;
                                      
                                      const rect = el.getBoundingClientRect();
                                      const centerX = rect.left + rect.width / 2;
                                      const centerY = rect.top + rect.height / 2;
                                      
                                      const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                                      const initialRotation = sticker.rotation || 0;
                                      
                                      const handlePointerMove = (moveEvent: PointerEvent) => {
                                        const newAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                                        let deltaRotation = (newAngle - initialAngle) * (180 / Math.PI);
                                        
                                        setPlacedStickers(prev => prev.map(s => 
                                          s.id === sticker.id ? { ...s, rotation: initialRotation + deltaRotation } : s
                                        ));
                                      };
                                      
                                      const handlePointerUp = () => {
                                        window.removeEventListener("pointermove", handlePointerMove);
                                        window.removeEventListener("pointerup", handlePointerUp);
                                      };
                                      
                                      window.addEventListener("pointermove", handlePointerMove);
                                      window.addEventListener("pointerup", handlePointerUp);
                                    }}
                                  >
                                    <RefreshCw size={14} className="text-blue-600" />
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              // LAYOUT / EXPORT PREVIEW
              <motion.div 
                key="layout-view"
                className="absolute inset-0 flex flex-col items-center overflow-hidden px-4"
              >
                  {/* Toggle UI */}
                  {(highlightTab === 'export' || highlightTab === 'layout') && settings.captureMode !== 'boomerang' && (
                    <div 
                      className={`flex-shrink-0 mb-6 mt-6 bg-slate-900/10 backdrop-blur-md p-1.5 rounded-full flex gap-1 shadow-sm border border-slate-900/10 z-10 w-full max-w-[400px] relative transition-opacity duration-300 ${isStripBackgroundVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    >
                      {(['image-strip', 'video-strip', 'clips'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPreviewMode(mode)}
                          className={`relative flex-1 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors duration-300 z-10 ${
                            previewMode === mode 
                              ? (mode === 'image-strip' ? 'text-slate-800' : 'text-white') 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {previewMode === mode && (
                            <motion.div
                              layoutId="preview-mode-pill"
                              className={`absolute inset-0 rounded-full shadow-md z-[-1] ${
                                mode === 'image-strip' ? 'bg-white' 
                                : mode === 'video-strip' ? 'bg-indigo-500 shadow-indigo-500/30' 
                                : 'bg-pink-500 shadow-pink-500/30'
                              }`}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <span className="relative z-10">
                            {mode.replace('-', ' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex-1 w-full relative min-h-0">
                    <ZoomContainer controlsVisible={isStripBackgroundVisible}>
                      {previewMode === 'clips' && settings.captureMode !== 'boomerang' ? (
                        currentTab === 'layout' && !isFlightActive ? (
                          <Reorder.Group 
                            values={photos}
                            onReorder={(newOrder) => useStore.getState().setCapturedPhotos(newOrder)}
                            className="grid grid-cols-2 gap-4 pb-8 max-w-[400px] w-full mx-auto px-4"
                          >
                            {photos.map((p, idx) => (
                              <Reorder.Item 
                                value={p}
                                layoutId={`photo-wrapper-${p.id}`}
                                key={p.id} 
                                className={`transition-all duration-300 rounded-2xl overflow-hidden aspect-[4/3] relative group cursor-grab active:cursor-grabbing ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}
                              >
                                {p.videoUrl && (
                                  <motion.video 
                                    src={p.videoUrl} 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    preload="none"
                                    style={{
                                      transform: settings.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  />
                                )}
                                <motion.img
                                  src={p.dataUrl} 
                                  className={`object-cover w-full h-full pointer-events-none ${p.videoUrl ? 'absolute inset-0' : ''}`} 
                                  alt={`Clip ${idx + 1}`} 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: (p.videoUrl && isStripBackgroundVisible) ? 0 : 1 }}
                                  transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none" />
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md"
                                >
                                  {idx + 1}
                                </motion.div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 pb-8 max-w-[400px] w-full mx-auto px-4">
                            {photos.map((p, idx) => (
                              <motion.div 
                                layoutId={`photo-wrapper-${p.id}`}
                                key={p.id} 
                                className={`transition-all duration-300 rounded-2xl overflow-hidden aspect-[4/3] relative group ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}
                              >
                                {p.videoUrl && (
                                  <motion.video 
                                    src={p.videoUrl} 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    preload="none"
                                    style={{
                                      transform: settings.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  />
                                )}
                                <motion.img
                                  src={p.dataUrl} 
                                  className={`object-cover w-full h-full pointer-events-none ${p.videoUrl ? 'absolute inset-0' : ''}`} 
                                  alt={`Clip ${idx + 1}`} 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: (p.videoUrl && isStripBackgroundVisible) ? 0 : 1 }}
                                  transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none" />
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md"
                                >
                                  {idx + 1}
                                </motion.div>
                              </motion.div>
                            ))}
                          </div>
                        )
                      ) : (
                        <CaptureStripDisplay
                          photos={photos}
                          settings={settings}
                          showDate={showDate}
                          showCaption={showCaption}
                          customCaption={customCaption}
                          captionFont={captionFont}
                          nowStr={nowStr}
                          stickers={placedStickers}
                          previewMode={previewMode}
                          isStripBackgroundVisible={isStripBackgroundVisible}
                          isFlightActive={isFlightActive}
                          currentTab={currentTab}
                          watermarkPlacement={watermarkPlacement}
                          showWatermark={showWatermark}
                          onReorder={(newOrder) => useStore.getState().setCapturedPhotos(newOrder)}
                          restartAnimation={() => {}}
                          fullyRevealed={false}
                        />
                      )}
                    </ZoomContainer>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Area: Sidebar Controls */}
      <motion.div 
        className={`flex-shrink-0 bg-white/80 backdrop-blur-3xl lg:border-l-4 border-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col z-40 rounded-t-[3rem] lg:rounded-none transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.2)] ${
          window.innerWidth < 1024 
            ? `absolute bottom-0 left-0 right-0 overflow-hidden ${isMobilePanelOpen ? 'h-[50vh]' : 'h-[100px]'}`
            : 'w-[400px] h-full'
        }`}
        drag={window.innerWidth < 1024 ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 50) setIsMobilePanelOpen(false);
          if (info.offset.y < -50) setIsMobilePanelOpen(true);
        }}
      >
        {window.innerWidth < 1024 && (
          <div 
            className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
            onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>
        )}
        
        {/* Tabs Header */}
        <div className="flex justify-around lg:justify-start p-4 gap-2 bg-white/50 backdrop-blur-md rounded-t-[3rem] lg:rounded-none border-b-2 border-slate-100/50">
          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${highlightTab === 'decorate' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-blue-500 text-white border-blue-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-blue-500 lg:text-white lg:border-blue-700 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500')}`}
            onClick={() => handleTabClick('decorate')}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <Sparkles className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${highlightTab === 'decorate' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0'}`}>
              Decorate
            </span>
          </motion.button>

          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${highlightTab === 'layout' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-pink-500 text-white border-pink-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-pink-500 lg:text-white lg:border-pink-700 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500')}`}
            onClick={() => handleTabClick('layout')}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <Layers className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${highlightTab === 'layout' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0'}`}>
              Layout
            </span>
          </motion.button>

          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${highlightTab === 'export' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-yellow-400 text-yellow-900 border-yellow-600 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-yellow-400 lg:text-yellow-900 lg:border-yellow-600 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600')}`}
            onClick={() => handleTabClick('export')}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <Share2 className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${highlightTab === 'export' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0'}`}>
              Export
            </span>
          </motion.button>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-8">
          
          {/* DECORATE TAB */}
          {highlightTab === 'decorate' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                <button 
                  onClick={() => setActiveTool("brush")}
                  className={`relative flex-1 py-3 text-sm font-bold z-10 transition-colors ${activeTool === 'brush' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {activeTool === 'brush' && (
                    <motion.div
                      layoutId="activeToolMarker"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="flex items-center justify-center"><Paintbrush className="w-5 h-5" /></span>
                </button>
                <button 
                  onClick={() => setActiveTool("sticker")}
                  className={`relative flex-1 py-3 text-sm font-bold z-10 transition-colors ${activeTool === 'sticker' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {activeTool === 'sticker' && (
                    <motion.div
                      layoutId="activeToolMarker"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fef08a" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                      <path d="M12 2.5a.75.75 0 01.71.53l1.8 5.67a2.5 2.5 0 001.59 1.59l5.67 1.8a.75.75 0 010 1.42l-5.67 1.8a2.5 2.5 0 00-1.59 1.59l-1.8 5.67a.75.75 0 01-1.42 0l-1.8-5.67a2.5 2.5 0 00-1.59-1.59l-5.67-1.8a.75.75 0 010-1.42l5.67-1.8a2.5 2.5 0 001.59-1.59l1.8-5.67a.75.75 0 01.71-.53z" fill="url(#sparkle-gradient)"/>
                      <path d="M5.5 3.5a.5.5 0 01.47.35l.87 2.74a1.5 1.5 0 00.97.97l2.74.87a.5.5 0 010 .94l-2.74.87a1.5 1.5 0 00-.97.97l-.87 2.74a.5.5 0 01-.94 0l-.87-2.74a1.5 1.5 0 00-.97-.97l-2.74-.87a.5.5 0 010-.94l2.74-.87a1.5 1.5 0 00.97-.97l.87-2.74a.5.5 0 01.47-.35z" fill="url(#sparkle-gradient)"/>
                      <path d="M19 16a.5.5 0 01.47.35l.55 1.74a1.5 1.5 0 00.97.97l1.74.55a.5.5 0 010 .94l-1.74.55a1.5 1.5 0 00-.97.97l-.55 1.74a.5.5 0 01-.94 0l-.55-1.74a1.5 1.5 0 00-.97-.97l-1.74-.55a.5.5 0 010-.94l1.74-.55a1.5 1.5 0 00.97-.97l.55-1.74A.5.5 0 0119 16z" fill="url(#sparkle-gradient)"/>
                    </svg>
                  </span>
                </button>
              </div>

              <div className="relative mt-2 min-h-[250px]">
                <AnimatePresence mode="wait">
                  {activeTool === "brush" ? (
                    <motion.div 
                      key="brush"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Colors</h4>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3 justify-items-center">
                          {COLORS.slice(0, 17).map(c => (
                            <button
                              key={c}
                              onClick={() => setActiveColor(c)}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl transition-all ${activeColor === c ? 'scale-110 shadow-sm ring-4 ring-blue-200' : 'border border-slate-200 hover:scale-105'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          {/* Custom Color Picker */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden transition-all ${!COLORS.slice(0, 17).includes(activeColor) ? 'scale-110 shadow-sm ring-4 ring-blue-200' : 'border border-slate-200 hover:scale-105'}`}
                                   style={{
                                     background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)'
                                   }}>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3 rounded-3xl border-slate-200 shadow-xl" align="start">
                              <HexColorPicker color={activeColor} onChange={setActiveColor} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Brush Size</h4>
                          <span className="text-xs font-medium text-slate-500">{brushSize}%</span>
                        </div>
                        <Slider 
                          value={[brushSize]} 
                          onValueChange={(v) => setBrushSize(v[0])} 
                          min={0.5} 
                          max={10} 
                          step={0.5} 
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="sticker"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Style</h4>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                          <button 
                            onClick={() => { setStickerType("3D"); setActiveSticker(STICKERS_3D[0]); }}
                            className={`relative text-[10px] font-bold px-2 py-1 rounded-md transition-colors z-10 ${stickerType === '3D' ? 'text-blue-600' : 'text-slate-500'}`}
                          >
                            {stickerType === '3D' && (
                              <motion.div
                                layoutId="stickerTypeMarker"
                                className="absolute inset-0 bg-white shadow-sm rounded-md z-[-1]"
                                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                              />
                            )}
                            3D Emojis
                          </button>
                          <button 
                            onClick={() => { setStickerType("2D"); setActiveSticker(STICKERS_2D[0]); }}
                            className={`relative text-[10px] font-bold px-2 py-1 rounded-md transition-colors z-10 ${stickerType === '2D' ? 'text-blue-600' : 'text-slate-500'}`}
                          >
                            {stickerType === '2D' && (
                              <motion.div
                                layoutId="stickerTypeMarker"
                                className="absolute inset-0 bg-white shadow-sm rounded-md z-[-1]"
                                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                              />
                            )}
                            2D Shapes
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Border</h4>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                          {["white", "black", "none"].map(borderOption => (
                            <button 
                              key={borderOption}
                              onClick={() => setStickerBorder(borderOption as any)}
                              className={`relative text-[10px] font-bold px-2 py-1 rounded-md transition-colors z-10 ${stickerBorder === borderOption ? 'text-slate-800' : 'text-slate-500'}`}
                            >
                              {stickerBorder === borderOption && (
                                <motion.div
                                  layoutId="stickerBorderMarker"
                                  className="absolute inset-0 bg-white shadow-sm rounded-md z-[-1]"
                                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                                />
                              )}
                              <span className="capitalize">{borderOption}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-6 gap-2 justify-items-center h-32 overflow-y-auto pr-1 custom-scrollbar mt-3">
                        {(stickerType === "3D" ? STICKERS_3D : STICKERS_2D).map(s => (
                          <button
                            key={s}
                            onClick={() => setActiveSticker(s)}
                            className={`w-11 h-11 text-2xl flex items-center justify-center rounded-2xl transition-all ${activeSticker === s ? 'bg-blue-100 scale-110' : 'bg-slate-50 hover:bg-slate-100 hover:scale-105'}`}
                            style={stickerType === "2D" ? { color: activeColor } : {}}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Sticker Size</h4>
                          <span className="text-xs font-medium text-slate-500">{Math.round(stickerSize * 100)}%</span>
                        </div>
                        <Slider 
                          value={[stickerSize]} 
                          onValueChange={(v) => setStickerSize(v[0])} 
                          min={0.5} 
                          max={3} 
                          step={0.1} 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button onClick={undo} disabled={history.length <= 1} className="flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors">
                  <Undo className="w-4 h-4" /> Undo
                </button>
                <button onClick={handleSavePhoto} className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold bg-blue-500 text-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <Check className="w-4 h-4" /> Save Photo
                </button>
              </div>
              <p className="text-xs text-slate-400 font-bold text-center mt-2">
                Save photo to apply edits, then select the next one below.
              </p>
            </div>
          )}

          {/* LAYOUT TAB */}
          {highlightTab === 'layout' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Strip Layout Selector */}
              <div>
                <label className="font-bold text-sm tracking-wide uppercase text-slate-500 mb-3 block">Strip Layout</label>
                <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                  <button
                    className={`relative flex flex-col items-center justify-center p-3 flex-1 text-sm font-bold z-10 transition-colors ${settings.layout === 'strip' ? 'text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => useStore.getState().setSettings({ ...settings, layout: 'strip' })}
                  >
                    {settings.layout === 'strip' && (
                      <motion.div
                        layoutId="activeStripLayout"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="text-xs font-bold text-center leading-tight">1x{settings.photoCount} <br/>Vertical</span>
                  </button>
                  
                  <button
                    className={`relative flex flex-col items-center justify-center p-3 flex-1 text-sm font-bold z-10 transition-colors ${settings.layout === 'strip-horizontal' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => useStore.getState().setSettings({ ...settings, layout: 'strip-horizontal' })}
                  >
                    {settings.layout === 'strip-horizontal' && (
                      <motion.div
                        layoutId="activeStripLayout"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                    <span className="text-xs font-bold text-center leading-tight">{settings.photoCount}x1 <br/>Horizontal</span>
                  </button>
                  
                  {settings.photoCount % 2 === 0 ? (
                    <button
                      className={`relative flex flex-col items-center justify-center p-3 flex-1 text-sm font-bold z-10 transition-colors ${settings.layout === 'grid' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => useStore.getState().setSettings({ ...settings, layout: 'grid' })}
                    >
                      {settings.layout === 'grid' && (
                        <motion.div
                          layoutId="activeStripLayout"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      <span className="text-xs font-bold text-center leading-tight">2x{settings.photoCount / 2} <br/>Grid</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 flex-1 opacity-50">
                      <span className="text-xs font-bold text-center leading-tight text-slate-400">Grid<br/>(Even Only)</span>
                    </div>
                  )}
                </div>
              </div>

              {settings.captureMode !== 'boomerang' && (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="font-black text-[11px] tracking-[0.15em] uppercase text-slate-400 mb-2 block">Standard Frames (Supports Patterns)</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                        {[
                          { id: 'classic', label: 'Classic' },
                          { id: 'polaroid', label: 'Polaroid' },
                          { id: 'minimalist', label: 'Minimalist' },
                          { id: 'photobooth', label: 'Photobooth' },
                        ].map(style => {
                          const isSelected = settings.frameStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              className={`relative py-2.5 px-1 font-bold text-[12px] sm:text-[13px] tracking-tight whitespace-nowrap rounded-xl transition-colors z-10 ${isSelected ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                              onClick={() => useStore.getState().setSettings({ ...settings, frameStyle: style.id })}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="activeFrameLayout"
                                  className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                                />
                              )}
                              {style.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="font-black text-[11px] tracking-[0.15em] uppercase text-amber-600/70 mb-2 block">Premium Themes (Fixed Styles)</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-amber-50 p-1.5 rounded-2xl shadow-inner border border-amber-200/50">
                        {[
                          { id: 'film', label: 'Film Roll' },
                          { id: 'vintage', label: 'Vintage' },
                          { id: 'gallery', label: 'Gallery' },
                          { id: 'scrapbook', label: 'Scrapbook' },
                        ].map(style => {
                          const isSelected = settings.frameStyle === style.id;
                          return (
                            <button
                              key={style.id}
                              className={`relative py-2.5 px-1 font-bold text-[12px] sm:text-[13px] tracking-tight whitespace-nowrap rounded-xl transition-colors z-10 ${isSelected ? 'text-amber-700' : 'text-amber-900/40 hover:text-amber-900/70'}`}
                              onClick={() => useStore.getState().setSettings({ ...settings, frameStyle: style.id })}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="activeFrameLayout"
                                  className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                                />
                              )}
                              {style.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!['film', 'vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle) && (
                      <div>
                      <label className="font-black text-[11px] tracking-[0.15em] uppercase text-emerald-600/70 mb-2 block">Strip Background</label>
                      <div className="grid grid-cols-4 gap-3 bg-emerald-50/50 p-3 rounded-2xl shadow-inner border border-emerald-100">
                        {/* Provided Backgrounds */}
                        {['brick.jpg', 'card.jpg', 'fabric.jpg', 'show.jpg', 'star.jpg'].map(bg => {
                          const isSelected = settings.stripBg === `/strip_bg/${bg}` && !['film', 'vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle);
                          return (
                            <button
                              key={bg}
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${isSelected ? 'border-emerald-500 scale-105 shadow-md' : 'border-emerald-200/50 hover:border-emerald-300 hover:scale-105'}`}
                              onClick={() => {
                                let newStyle = settings.frameStyle;
                                if (['film', 'vintage', 'gallery', 'scrapbook'].includes(newStyle)) newStyle = 'classic';
                                useStore.getState().setSettings({ ...settings, frameStyle: newStyle, stripBg: `/strip_bg/${bg}`, framePattern: 'none' });
                              }}
                            >
                              <img src={`/strip_bg/${bg}`} alt={bg} className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                          );
                        })}

                        {/* Custom Upload Button / Thumbnail */}
                        {(settings.stripBg.startsWith('blob:') && !['film', 'vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle)) ? (
                          <div className="relative aspect-square rounded-xl border-2 border-emerald-500 scale-105 shadow-md overflow-hidden group">
                            <img src={settings.stripBg} alt="Uploaded Background" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  useStore.getState().setSettings({ ...settings, stripBg: '#ffffff' });
                                }}
                                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-transform"
                                title="Remove Uploaded Background"
                              >
                                <X className="w-4 h-4 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <label 
                              htmlFor="strip-bg-upload"
                              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed transition-all cursor-pointer border-emerald-300/70 text-emerald-600/70 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50`}
                            >
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                            </label>
                            <input 
                              type="file" 
                              id="strip-bg-upload" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  let newStyle = settings.frameStyle;
                                  if (['film', 'vintage', 'gallery', 'scrapbook'].includes(newStyle)) newStyle = 'classic';
                                  useStore.getState().setSettings({ ...settings, frameStyle: newStyle, stripBg: url, framePattern: 'none' });
                                }
                                e.target.value = '';
                              }}
                            />
                          </>
                        )}
                      </div>
                      </div>
                    )}
                  </div>

                  {/* Border Pattern - Only show if not a Premium Theme */}
                  {!['film', 'vintage', 'gallery', 'scrapbook'].includes(settings.frameStyle) && (
                    <>
                    <div className="space-y-4">
                      <label className="font-black text-[11px] tracking-[0.15em] uppercase text-slate-400">Border Pattern</label>
                      <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-3xl border border-slate-100">
                        {Object.entries(PATTERN_LIST).map(([id, p]) => {
                          const isSelected = settings.framePattern === id && settings.stripBg === '#ffffff';
                          return (
                            <button
                              key={id}
                              className={`relative aspect-square rounded-[1.2rem] flex flex-col items-center justify-center gap-1.5 transition-colors z-10 group ${isSelected ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                              onClick={() => useStore.getState().setSettings({ ...settings, framePattern: id, stripBg: '#ffffff' })}
                            >
                              <div className={`absolute inset-0 rounded-[1.2rem] transition-colors z-[-2] ${!isSelected ? 'bg-[#f0f4f8] group-hover:bg-[#e2e8f0]' : ''}`} />
                            {isSelected && (
                              <motion.div
                                layoutId="activePatternMarker"
                                className="absolute inset-0 bg-blue-500 rounded-[1.2rem] shadow-sm z-[-1]"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                              />
                            )}
                            <div 
                              className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center bg-white shadow-sm"
                            >
                              <div 
                                className="w-full h-full opacity-80"
                                style={{ backgroundImage: getPatternCss(id, isSelected ? '#3b82f6' : '#475569', 1.0) }}
                              />
                            </div>
                            <span className="text-[8px] font-black tracking-wider uppercase truncate w-full text-center px-1">
                              {p.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {settings.framePattern !== 'none' && (
                    <div className="space-y-3">
                      <label className="font-black text-[11px] tracking-[0.15em] uppercase text-slate-400">Pattern Color</label>
                      <div className="flex gap-3 relative">
                        {[
                          { name: 'Black', hex: '#000000' },
                          { name: 'White', hex: '#ffffff' },
                          { name: 'Pink', hex: '#f472b6' },
                          { name: 'Blue', hex: '#3b82f6' },
                          { name: 'Yellow', hex: '#eab308' },
                        ].map(color => {
                          const isSelected = settings.patternColor === color.hex;
                          return (
                            <button
                              key={color.hex}
                              className={`relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${isSelected ? 'border-white scale-110 shadow-sm z-10' : 'border-slate-200 hover:border-slate-300 hover:scale-105'}`}
                              style={{ backgroundColor: color.hex }}
                              onClick={() => useStore.getState().setSettings({ ...settings, patternColor: color.hex, stripBg: '#ffffff' })}
                              title={color.name}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="activePatternColorMarker"
                                  className="absolute -inset-[6px] rounded-full ring-[3px] ring-blue-100 border-2 border-blue-500 z-[-1]"
                                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  

                  </>
                  )}

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label htmlFor="show-date-switch" className="font-black text-[11px] tracking-[0.15em] uppercase text-slate-400">Date Stamp</label>
                      <Switch checked={showDate} onCheckedChange={(v) => updateSetting("showDate", v)} id="show-date-switch" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="show-caption-switch" className="font-black text-[11px] tracking-[0.15em] uppercase text-slate-400">Caption</label>
                      <Switch checked={showCaption} onCheckedChange={(v) => updateSetting("showCaption", v)} id="show-caption-switch" />
                    </div>
                    <AnimatePresence>
                      {(showCaption || showDate) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Color</label>
                              <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                <button
                                  onClick={() => updateSetting("captionColor", "black")}
                                  className={`w-8 h-6 rounded-md flex items-center justify-center transition-all ${captionColor === 'black' ? 'bg-white shadow-sm ring-1 ring-black/10' : 'opacity-50 hover:opacity-100'}`}
                                >
                                  <div className="w-4 h-4 rounded-full bg-slate-900" />
                                </button>
                                <button
                                  onClick={() => updateSetting("captionColor", "white")}
                                  className={`w-8 h-6 rounded-md flex items-center justify-center transition-all ${captionColor === 'white' ? 'bg-white shadow-sm ring-1 ring-black/10' : 'opacity-50 hover:opacity-100'}`}
                                >
                                  <div className="w-4 h-4 rounded-full bg-white border border-slate-200" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Size</label>
                                <span className="text-[10px] font-bold text-slate-500">{Math.round(captionSize * 100)}%</span>
                              </div>
                              <Slider
                                value={[captionSize]}
                                onValueChange={(v) => updateSetting("captionSize", v[0])}
                                min={0.5}
                                max={1.5}
                                step={0.1}
                                className="py-1"
                              />
                            </div>

                            <Select value={captionFont} onValueChange={(v) => updateSetting("captionFont", v)}>
                              <SelectTrigger className="w-full bg-white border-slate-200 rounded-lg font-bold text-sm focus:ring-blue-500">
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontOptions.map(f => (
                                  <SelectItem key={f.value} value={f.value} className={`font-bold ${f.value}`}>
                                    {f.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {showCaption && (
                              <input
                                type="text"
                                placeholder="Enter a memory..."
                                value={customCaption}
                                onChange={e => updateSetting("customCaption", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 font-bold text-sm outline-none focus:border-blue-500"
                              />
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between">
                      <label htmlFor="show-watermark-switch" className="font-black text-[11px] tracking-[0.15em] uppercase text-slate-400">Watermark</label>
                      <Switch checked={showWatermark} onCheckedChange={(v) => updateSetting("showWatermark", v)} id="show-watermark-switch" />
                    </div>
                    <AnimatePresence>
                      {showWatermark && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-3 pt-2 pl-2 overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Color</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                              <button
                                onClick={() => updateSetting("watermarkColor", "black")}
                                className={`w-8 h-6 rounded-md flex items-center justify-center transition-all ${watermarkColor === 'black' ? 'bg-white shadow-sm ring-1 ring-black/10' : 'opacity-50 hover:opacity-100'}`}
                              >
                                <div className="w-4 h-4 rounded-full bg-slate-900" />
                              </button>
                              <button
                                onClick={() => updateSetting("watermarkColor", "white")}
                                className={`w-8 h-6 rounded-md flex items-center justify-center transition-all ${watermarkColor === 'white' ? 'bg-white shadow-sm ring-1 ring-black/10' : 'opacity-50 hover:opacity-100'}`}
                              >
                                <div className="w-4 h-4 rounded-full bg-white border border-slate-200" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Position</label>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                              {["left", "center", "right"].map(pos => (
                                <button
                                  key={pos}
                                  onClick={() => updateSetting("watermarkPlacement", pos as "left" | "center" | "right")}
                                  className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-colors ${watermarkPlacement === pos ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                  {pos}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          )}

          {/* EXPORT TAB */}
          {highlightTab === 'export' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
              
              <div className="flex bg-slate-200/60 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                <button
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                    settings.exportQuality === 'hd' || !settings.exportQuality ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => useStore.getState().setSettings({ ...settings, exportQuality: 'hd' })}
                >
                  { (settings.exportQuality === 'hd' || !settings.exportQuality) && (
                    <motion.div layoutId="activeQuality" className="absolute inset-0 bg-white shadow-sm rounded-xl z-[-1]" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />
                  )}
                  HD Export (High Res)
                </button>
                <button
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                    settings.exportQuality === 'fast' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => useStore.getState().setSettings({ ...settings, exportQuality: 'fast' })}
                >
                  { settings.exportQuality === 'fast' && (
                    <motion.div layoutId="activeQuality" className="absolute inset-0 bg-white shadow-sm rounded-xl z-[-1]" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />
                  )}
                  Fast Export (Low Res)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                
                <button
                  onMouseEnter={() => setPreviewMode('image-strip')}
                  onClick={handleDownload}
                  disabled={isAnyActionActive}
                  className={`col-span-1 rounded-[1.5rem] py-4 flex flex-col items-center justify-center gap-1 font-black uppercase tracking-wider transition-all duration-300 ${
                    isAnyActionActive 
                      ? (activeExportAction === 'image-strip' ? 'bg-blue-600 text-white shadow-inner' : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed') 
                      : 'bg-blue-500 hover:bg-blue-400 text-white shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {activeExportAction === 'image-strip' ? <RefreshCw className="w-9 h-9 animate-spin" /> : (
                    <>
                      <Download className="w-7 h-7 mb-1" />
                      <span className="text-xs">Image Strip</span>
                    </>
                  )}
                </button>

                <div className="col-span-1 flex flex-col gap-1 relative group">
                  <button
                    onMouseEnter={() => setPreviewMode('video-strip')}
                    onClick={async () => {
                      setActiveExportAction('video-strip');
                      try {
                        const { bgDataUrl, fgDataUrl, slotRects } = await prepareVideoExportArgs();
                        await exportReplayVideo(
                          photos, settings,
                          (msg, opts) => opts?.variant === "destructive" ? console.error(msg) : console.log(msg),
                          shouldShowCaptionSection ? (showCaption ? customCaption : nowStr) : undefined, captionFont,
                          false, bgDataUrl, fgDataUrl, slotRects
                        );
                      } finally { setActiveExportAction(null); }
                    }}
                    disabled={isAnyActionActive}
                    className={`w-full rounded-[1.5rem] py-4 flex flex-col items-center justify-center gap-1 font-black uppercase tracking-wider transition-all duration-300 ${
                      isAnyActionActive 
                        ? (activeExportAction === 'video-strip' ? 'bg-indigo-600 text-white shadow-inner' : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed') 
                        : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {activeExportAction === 'video-strip' ? <RefreshCw className="w-9 h-9 animate-spin" /> : (
                      <>
                        <Download className="w-7 h-7 mb-1" />
                        <span className="text-xs">Video Strip</span>
                      </>
                    )}
                  </button>
                  {(settings.frameStyle === 'vintage' || settings.frameStyle === 'scrapbook') && (
                    <span className="text-[10px] text-orange-500 font-bold text-center leading-tight">
                      *Video overlays still in development
                    </span>
                  )}
                  {(settings.photoCount >= 5 || settings.countdownDuration >= 5) && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 mt-2 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                      <span className="block text-[10px] text-blue-600 font-bold text-center leading-tight bg-blue-50/95 backdrop-blur-sm p-2 rounded-md shadow-lg border border-blue-200">
                        *Heads up! Large layouts take a bit longer to export.
                      </span>
                    </div>
                  )}
                </div>

                {settings.captureMode !== 'boomerang' && (
                  <button
                    onMouseEnter={() => setPreviewMode('clips')}
                    onClick={async () => {
                      setActiveExportAction('clips');
                      try {
                        const { generateClipsGif } = await import('@/utils/GifGenerator');
                        const blob = await generateClipsGif(
                          photos, 
                          settings.isMirrored, 
                          shouldShowCaptionSection ? (showCaption ? customCaption : nowStr) : 'meemomini',
                          settings.countdownDuration,
                          settings.exportQuality || 'hd'
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `meemomini_clips.gif`;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
                        console.error("GIF exported successfully");
                      } catch (e) {
                        console.error("Failed to export GIF", e);
                      } finally { setActiveExportAction(null); }
                    }}
                    disabled={isAnyActionActive}
                    className={`col-span-2 rounded-[1.5rem] py-4 flex flex-row items-center justify-center gap-3 font-black uppercase tracking-wider transition-all duration-300 ${
                      isAnyActionActive 
                        ? (activeExportAction === 'clips' ? 'bg-pink-600 text-white shadow-inner' : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed') 
                        : 'bg-pink-500 hover:bg-pink-400 text-white shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {activeExportAction === 'clips' ? <RefreshCw className="w-9 h-9 animate-spin" /> : (
                      <>
                        <Download className="w-7 h-7" />
                        <span className="text-sm">Save Clips (GIF)</span>
                      </>
                    )}
                  </button>
                )}

                <div className="col-span-2 flex flex-col gap-1">
                  <button
                    onClick={async () => {
                      // If already cached, just re-show (scroll will fire via useEffect)
                      if (qrUrl && qrCacheKey === currentCacheKey) {
                        qrSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                      }
                      setActiveExportAction('share-all');
                      try {
                        // Upload individual raw photo and video clips to Cloudinary so "Live Preview" works on the phone
                        let uploadedPhotos = [...photos];
                        if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
                          const { uploadToCloudinary } = await import('@/hooks/useGallery');
                          uploadedPhotos = await Promise.all(photos.map(async (p) => {
                            let newPhoto = { ...p };
                            try {
                              // Upload Image
                              if (p.dataUrl && p.dataUrl.length > 1000) { // check if it's base64 or blob and not already a public URL
                                const imgRes = await fetch(p.dataUrl);
                                const imgBlob = await imgRes.blob();
                                newPhoto.dataUrl = await uploadToCloudinary(imgBlob, 'image');
                                newPhoto.thumbnailUrl = newPhoto.dataUrl; // Use the same for thumbnail online
                              }
                              // Upload Video
                              if (p.videoUrl && p.videoUrl.startsWith('blob:')) {
                                const vidRes = await fetch(p.videoUrl);
                                const vidBlob = await vidRes.blob();
                                newPhoto.videoUrl = await uploadToCloudinary(vidBlob, 'video');
                              }
                            } catch(e) {
                              console.error("Failed to upload raw clip/image to Cloudinary", e);
                            }
                            return newPhoto;
                          }));
                        }

                        const sessionData = JSON.stringify({
                          settings,
                          photos: uploadedPhotos,
                          showDate,
                          showCaption,
                          customCaption,
                          captionFont,
                          nowStr,
                          stickers: placedStickers,
                          showWatermark,
                          watermarkPlacement
                        });

                        let gifBlob: Blob | undefined = undefined;
                        if (settings.captureMode !== 'boomerang') {
                          const { generateClipsGif } = await import('@/utils/GifGenerator');
                          gifBlob = await generateClipsGif(
                            photos, 
                            settings.isMirrored, 
                            shouldShowCaptionSection ? (showCaption ? customCaption : nowStr) : 'meemomini',
                            settings.countdownDuration,
                            settings.exportQuality || 'hd'
                          ) as Blob;
                        }

                        // Generate a quick image strip for the gallery thumbnail
                        const imgBlob = await generateStripBlob(photos, settings, showDate, showCaption, customCaption, captionFont, nowStr);

                        const id = `booth_${Date.now()}`;
                        const item = await saveToGallery(id, imgBlob, null, gifBlob, undefined, sessionData);
                        if (item) {
                          setQrUrl(window.location.origin + '/share/' + item.id);
                          setQrCacheKey(currentCacheKey);
                        }
                      } catch(e) { console.error(e); }
                      setActiveExportAction(null);
                    }}
                    disabled={isAnyActionActive || !!qrUrl}
                    className={`w-full rounded-[1.5rem] py-4 flex flex-col items-center justify-center gap-1 font-black uppercase tracking-wider transition-all duration-300 ${
                      !!qrUrl
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                        : isAnyActionActive 
                          ? (activeExportAction === 'share-all' ? 'bg-cyan-600 text-white shadow-inner' : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed') 
                          : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {activeExportAction === 'share-all' ? <RefreshCw className="w-9 h-9 animate-spin" /> : (
                      <>
                        <QrCode className="w-7 h-7 mb-1" />
                        <span className="text-xs text-center leading-tight">Share QR<br/>{settings.captureMode === 'boomerang' ? 'Media' : 'All Formats'}</span>
                      </>
                    )}
                  </button>
                  {(settings.frameStyle === 'vintage' || settings.frameStyle === 'scrapbook') && (
                    <span className="text-[10px] text-orange-500 font-bold text-center leading-tight">
                      *Video overlays still in development
                    </span>
                  )}
                </div>

                <button
                  onMouseEnter={() => setPreviewMode('image-strip')}
                  onClick={handlePrint}
                  disabled={isAnyActionActive}
                  className={`col-span-1 rounded-[1.5rem] py-4 flex flex-col items-center justify-center gap-1 font-black uppercase tracking-wider transition-all duration-300 ${
                    isAnyActionActive ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-400 text-white shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <Printer className="w-7 h-7 mb-1" />
                  <span className="text-xs text-center leading-tight">Print<br/>Strip</span>
                </button>

                <button
                  onClick={() => {
                    setShowConfirmReset(true);
                    setTimeout(() => confirmResetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                  }}
                  disabled={isAnyActionActive}
                  className={`col-span-1 rounded-[1.5rem] py-4 flex flex-col items-center justify-center gap-1 font-black uppercase tracking-wider transition-all duration-300 ${
                    isAnyActionActive ? 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed' : 'bg-red-500 hover:bg-red-400 text-white shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <RefreshCw className="w-7 h-7 mb-1" />
                  <span className="text-xs text-center leading-tight">Take<br/>Another</span>
                </button>
                <AnimatePresence mode="wait">
                  {qrUrl && (
                    <motion.div
                      ref={qrSectionRef}
                      key="qr-card"
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                      className="col-span-2"
                    >
                      {/* Premium QR Card */}
                      <div className="mt-6 w-full flex justify-center">
                        <div ref={qrCardRef} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 flex flex-col items-center w-full max-w-sm overflow-hidden">
                          {/* Saveable area: only this gets captured by Save Image */}
                          <div ref={qrSaveAreaRef} className="bg-white flex flex-col items-center gap-2 px-8 pt-7 pb-5 w-full">
                            <motion.div 
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                              className="flex flex-col items-center gap-0.5"
                            >
                              <h2 className="text-slate-800 text-xl font-black uppercase tracking-tight">
                                {isFirebaseConfigured() ? "Scan Me!" : "Local Test Mode"}
                              </h2>
                              <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-semibold">
                                Point your camera here
                              </p>
                            </motion.div>
                            <motion.a 
                              href={qrUrl} target="_blank" rel="noreferrer"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 20 }}
                              className="block p-3 rounded-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer relative mt-1"
                            >
                              <QRCodeSVG
                                value={qrUrl}
                                size={200}
                                level="H"
                                fgColor="#1e293b"
                                imageSettings={{
                                  src: "/meemomini_qr.png",
                                  excavate: true,
                                  height: 48,
                                  width: 48,
                                }}
                              />
                              {/* Overlay logo as regular img for html2canvas compatibility */}
                              <img 
                                src="/meemomini_qr.png" 
                                alt="meemomini" 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[48px] h-[48px] object-contain pointer-events-none"
                              />
                            </motion.a>
                          </div>

                          {/* Divider */}
                          <div className="w-full h-px bg-slate-100" />

                          {/* Action buttons */}
                          <div className="w-full flex gap-2 px-5 py-4">
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                navigator.clipboard.writeText(qrUrl);
                                toast.success("Link copied to clipboard!");
                              }}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors flex items-center justify-center gap-1.5 border border-slate-200/60"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Link
                            </motion.button>
                            
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 22 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                if (!qrSaveAreaRef.current) return;
                                try {
                                  const canvas = await html2canvas(qrSaveAreaRef.current, { scale: 2, backgroundColor: '#ffffff' });
                                  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                                  if (blob) {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `meemomini-qr-${Date.now()}.png`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    toast.success("QR Code saved!");
                                  }
                                } catch(e) {
                                  toast.error("Failed to save QR Code");
                                }
                              }}
                              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Save Image
                            </motion.button>
                          </div>

                          {!isFirebaseConfigured() && (
                            <div className="flex flex-col items-center gap-3 w-full px-5 pb-3">
                              <p className="text-center font-bold text-[10px] text-amber-500 uppercase tracking-widest leading-relaxed px-2">
                                Firebase not configured. Localhost QR won't work on phones.
                              </p>
                              <a 
                                href={qrUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full bg-blue-500 hover:bg-blue-400 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors text-center shadow-sm"
                              >
                                Open Share Page Locally
                              </a>
                            </div>
                          )}

                          {/* Close */}
                          <motion.button 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setQrUrl(null); }}
                            className="pb-4 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Close
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {showConfirmReset && (
                    <motion.div
                      ref={confirmResetRef}
                      key="confirm-reset"
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                      className="col-span-2"
                    >
                      <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                        {/* Top accent */}
                        <div className="h-1 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400" />
                        <div className="p-7 flex flex-col items-center text-center">
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
                            className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mb-4"
                          >
                            <RefreshCw className="w-6 h-6" />
                          </motion.div>
                          <motion.h2 
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1"
                          >
                            Start Over?
                          </motion.h2>
                          <motion.p 
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed"
                          >
                            Your current strip will be discarded. Download it first if you want to keep it.
                          </motion.p>
                          <div className="w-full flex gap-2">
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 22 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleConfirmReset}
                              className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all shadow-sm"
                            >
                              Yes, Restart
                            </motion.button>
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowConfirmReset(false)}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 py-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-colors border border-slate-200/60"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}

        </div>
      </motion.div>
      

    </div>
  );
};
