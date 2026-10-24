import React, { RefObject, memo } from "react";
import { PhotoSettings } from "@/pages/Index";

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  overlayCanvasRef: RefObject<HTMLCanvasElement>;
  getFilterCss: () => string;
  countdown: number | null;
  isCapturing: boolean;
  settings: PhotoSettings;
  capturedPhotos: any[];
  isCameraReady: boolean;
}

const CameraPreview = memo(({
  videoRef,
  canvasRef,
  overlayCanvasRef,
  segmentationCanvasRef,
  getFilterCss,
  countdown,
  isCapturing,
  settings,
  capturedPhotos,
  isCameraReady
}: CameraPreviewProps & { segmentationCanvasRef?: React.RefObject<HTMLCanvasElement> }) => (
  <div className="relative bg-black lg:bg-slate-100 lg:rounded-2xl overflow-hidden lg:shadow-2xl w-full h-full flex items-center justify-center">
    {!isCameraReady && (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100">
        <div className="w-12 h-12 border-[6px] border-slate-200 border-t-pink-400 rounded-full animate-spin mb-6 shadow-sm"></div>
        <p className="font-black text-slate-400 tracking-widest uppercase animate-pulse text-sm">Warming up camera...</p>
      </div>
    )}

    {/* The raw video feed. Visually hidden if using virtual background to save rendering overlap. */}
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover transition-opacity duration-1000 ${isCameraReady ? (settings.virtualBackground !== 'none' ? 'opacity-0' : 'opacity-100') : 'opacity-0'}`}
      style={{
        filter: getFilterCss() + (settings.enableBeautyMode ? ' brightness(1.05) contrast(0.95) saturate(1.1)' : ''),
        transform: settings.isMirrored ? "scaleX(-1)" : "scaleX(1)"
      }}
    />

    {/* Virtual Background Layer */}
    {settings.virtualBackground !== 'none' && (
      <>
        {settings.virtualBackground.startsWith('custom_bg') ? (
          <img 
            src={`/segment_bg/${settings.virtualBackground}.jpg`}
            alt="Virtual Background"
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />
        ) : (
          <div 
            className={`absolute inset-0 z-0 w-full h-full object-cover ${
              settings.virtualBackground === 'bg_y2k' ? 'bg-gradient-to-tr from-fuchsia-300 via-purple-300 to-cyan-300' :
              settings.virtualBackground === 'bg_checkers' ? 'bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0iI2YxZjVmOSIvPjxwYXRoIGQ9Ik0yMCAyMGgyMHYyMEgyMHoiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zz4=\')]' :
              settings.virtualBackground === 'bg_grid' ? 'bg-blue-600 bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDIwaDIwVjBoLTIwdjIweiIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=\')]' : ''
            }`}
            style={{
              backgroundColor: 
                settings.virtualBackground === 'bg_white' ? '#ffffff' :
                settings.virtualBackground === 'bg_black' ? '#111111' :
                settings.virtualBackground === 'bg_pink' ? '#fdf2f8' :
                settings.virtualBackground === 'bg_blue' ? '#f0f9ff' :
                settings.virtualBackground === 'bg_green' ? '#00ff00' : undefined
            }}
          />
        )}
      </>
    )}

    {/* Segmented Person Layer */}
    {settings.virtualBackground !== 'none' && (
      <canvas
        ref={segmentationCanvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover z-10"
        style={{
          filter: getFilterCss() + (settings.enableBeautyMode ? ' brightness(1.05) contrast(0.95) saturate(1.1)' : ''),
          transform: settings.isMirrored ? "scaleX(-1)" : "scaleX(1)"
        }}
      />
    )}

    {/* Beauty Mode Soft Focus (Orton Effect) */}
    {settings.enableBeautyMode && (
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-30"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />
    )}

    <canvas
      ref={overlayCanvasRef}
      className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none z-10"
      style={{
        transform: settings.isMirrored ? "scaleX(-1)" : "scaleX(1)"
      }}
    />
    
    {/* Composition Grid */}
    {settings.enableGrid && (
      <>
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-evenly z-20">
          <div className="w-full h-[1px] bg-white/40 shadow-sm" />
          <div className="w-full h-[1px] bg-white/40 shadow-sm" />
        </div>
        <div className="absolute inset-0 pointer-events-none flex justify-evenly z-20">
          <div className="w-[1px] h-full bg-white/40 shadow-sm" />
          <div className="w-[1px] h-full bg-white/40 shadow-sm" />
        </div>
      </>
    )}
    
    {/* Frame Overlays */}
    {settings.selectedARFilter === 'frame_camcorder' && (
      <div className="absolute inset-0 pointer-events-none z-20 p-8 flex flex-col justify-between font-mono text-white text-xl shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></div>
            <span className="font-bold tracking-widest text-red-500 drop-shadow-md">REC</span>
          </div>
          <div className="flex items-center gap-1 border-2 border-white p-1 rounded-sm">
            <div className="w-2 h-4 bg-white"></div>
            <div className="w-2 h-4 bg-white"></div>
            <div className="w-2 h-4 bg-white"></div>
            <div className="w-1 h-3 bg-white ml-1"></div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-30">
           <div className="w-32 h-[1px] bg-white absolute"></div>
           <div className="w-[1px] h-32 bg-white absolute"></div>
           <div className="w-16 h-16 border border-white rounded-full absolute"></div>
        </div>
        <div className="flex justify-between items-end text-sm opacity-80">
          <span>SP LP</span>
          <span>0:00:00</span>
        </div>
      </div>
    )}

    {settings.selectedARFilter === 'frame_polaroid' && (
      <div className="absolute inset-2 md:inset-4 pointer-events-none z-20 border-[20px] md:border-[30px] border-b-[60px] md:border-b-[80px] border-white shadow-inner bg-transparent">
        <div className="absolute -bottom-[45px] md:-bottom-[60px] left-1/2 -translate-x-1/2 font-serif text-slate-400 opacity-60 italic text-sm md:text-lg">
          vintage memories
        </div>
      </div>
    )}

    {settings.selectedARFilter === 'frame_y2k' && (
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        <div className="absolute top-4 left-4 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>✨</div>
        <div className="absolute top-10 right-10 text-5xl animate-pulse" style={{ animationDuration: '2s' }}>⭐</div>
        <div className="absolute bottom-10 left-8 text-6xl animate-pulse" style={{ animationDuration: '4s' }}>🌸</div>
        <div className="absolute bottom-4 right-4 text-4xl animate-bounce" style={{ animationDuration: '2.5s' }}>🦋</div>
        <div className="absolute top-1/2 left-2 text-2xl animate-pulse">💖</div>
        <div className="absolute top-1/3 right-4 text-3xl animate-bounce">🎀</div>
      </div>
    )}
    {/* Countdown Overlay */}
    {countdown !== null && (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
        <div key={countdown} className="text-[120px] font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping" style={{ animationDuration: '1s', animationIterationCount: 1 }}>
          {countdown}
        </div>
      </div>
    )}
    {/* Photo Flash Effect */}
    {settings.enableFlash && isCapturing && countdown === null && (
      <div className="absolute inset-0 bg-white animate-pulse z-50" />
    )}
    {/* Frame Preview */}
    {settings.frameColor !== "none" && (
      <div className={`absolute inset-4 border-4 rounded-lg pointer-events-none ${
        settings.frameColor === "classic"
          ? "border-white"
          : settings.frameColor === "black"
          ? "border-black"
          : settings.frameColor === "gold"
          ? "border-yellow-400"
          : "border-blue-400"
      }`} />
    )}
    <canvas ref={canvasRef} className="hidden" />
  </div>
));

export default CameraPreview;
