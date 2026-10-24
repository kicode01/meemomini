import React, { useRef, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { CapturedPhoto, PhotoSettings, PlacedSticker } from '@/pages/Index';
import { getFrameColor, isBackgroundDark } from '@/utils/StripGenerator';
import { getPatternCss } from '@/utils/Patterns';
import { useAnimatedStrip } from '@/hooks/useAnimatedStrip';

export type CaptureStripDisplayProps = {
  photos: CapturedPhoto[];
  settings: PhotoSettings;
  showDate: boolean;
  showCaption: boolean;
  customCaption: string;
  captionFont: string;
  nowStr: string;
  stickers?: PlacedSticker[];
  previewMode: 'image-strip' | 'video-strip' | 'clips';
  isStripBackgroundVisible?: boolean;
  isFlightActive?: boolean;
  activeTab?: string;
  onReorder?: (newOrder: CapturedPhoto[]) => void;
  restartAnimation?: () => void;
  watermarkPlacement?: 'left' | 'center' | 'right';
  showWatermark?: boolean;
  // If true, forces all photos to be fully revealed and playing (default true for share page)
  fullyRevealed?: boolean;
};

export const CaptureStripDisplay: React.FC<CaptureStripDisplayProps> = ({
  photos,
  settings,
  showDate,
  showCaption,
  customCaption,
  captionFont,
  nowStr,
  stickers = [],
  previewMode,
  isStripBackgroundVisible = true,
  isFlightActive = false,
  activeTab = 'export',
  onReorder,
  restartAnimation,
  watermarkPlacement: watermarkPlacementProp,
  showWatermark: showWatermarkProp,
  fullyRevealed = true
}) => {
  const { captionSize = 1.0, captionColor = 'black', watermarkColor = 'black' } = settings;
  const isVideoStrip = previewMode === 'video-strip';
  
  const animState = useAnimatedStrip(photos, isVideoStrip && !fullyRevealed, settings.countdownDuration || 3);
  
  const revealed = fullyRevealed ? Array(photos.length).fill(true) : animState.revealed;
  const isFinalLoop = fullyRevealed ? false : animState.isFinalLoop;
  const getOverlayProps = fullyRevealed ? undefined : animState.getOverlayProps;
  
  // Use the hook's videoRefs instead of creating our own
  const videoRefs = animState.videoRefs;

  // Auto-play videos if fully revealed
  useEffect(() => {
    if (isVideoStrip && fullyRevealed) {
      videoRefs.current.forEach(video => {
        if (video) {
          video.play().catch(e => console.log("Autoplay blocked:", e));
        }
      });
    }
  }, [isVideoStrip, fullyRevealed, photos]);

  const style = settings.frameStyle;
  const isPolaroid = style === 'polaroid';
  const isFilm = style === 'film';
  const isScrapbook = style === 'scrapbook';
  const isMinimalist = style === 'minimalist';
  const isVintage = style === 'vintage';
  const isGallery = style === 'gallery';
  const isPhotobooth = style === 'photobooth';

  const shouldShowCaptionSection = (showDate || showCaption) && !isFlightActive;
  const showWatermark = showWatermarkProp ?? !isFlightActive;
  const watermarkPlacement = watermarkPlacementProp ?? ((settings.layout === 'grid' || settings.layout === 'strip-horizontal') ? 'center' : (photos.length % 2 === 0 ? 'right' : 'left'));

  return (
    <motion.div 
      id="print-container"
      onClick={() => { if (isVideoStrip && !fullyRevealed) animState.restartAnimation(); else if (isVideoStrip && restartAnimation) restartAnimation(); }}
      onMouseEnter={() => {
        if (isVideoStrip && fullyRevealed) {
          Object.values(videoRefs.current).forEach(video => video?.pause());
        }
      }}
      onMouseLeave={() => {
        if (isVideoStrip && fullyRevealed) {
          Object.values(videoRefs.current).forEach(video => video?.play().catch(() => {}));
        }
      }}
      className={`relative transition-all duration-300 flex-shrink-0 ${isFlightActive ? 'overflow-visible' : 'overflow-hidden'} ${isVideoStrip ? 'cursor-pointer' : ''}`}
      animate={{
        backgroundColor: !isStripBackgroundVisible 
          ? 'rgba(255,255,255,0)' 
          : (settings.stripBg && settings.stripBg !== '#ffffff' ? 'rgba(255,255,255,0)' : (settings.framePattern !== 'none' ? 'rgba(255,255,255,0)' : (isFilm ? undefined : (isVintage ? '#e8dac3' : (isScrapbook ? '#f8f1e5' : (isGallery ? '#fdfdfc' : getFrameColor(settings.frameColor))))))),
        boxShadow: !isStripBackgroundVisible
          ? 'none'
          : (isGallery ? "0 40px 60px -15px rgba(0,0,0,0.15), 0 20px 30px -10px rgba(0,0,0,0.1), inset 0 0 20px rgba(0,0,0,0.02)"
              : (isFilm ? "0 10px 30px -5px rgba(0,0,0,0.4)" : "0 10px 40px -10px rgba(0,0,0,0.1)")),
        borderColor: !isStripBackgroundVisible ? 'transparent' : (isFilm ? 'transparent' : (isVintage ? "#d4c5ab" : "#e2e8f0"))
      }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundImage: !isStripBackgroundVisible ? 'none' : (isFilm 
          ? 'linear-gradient(to right, #111111, #27272a, #111111)' 
          : (isVintage ? 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E")'
          : (isScrapbook ? 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)'
          : ((!['film', 'vintage', 'scrapbook', 'gallery'].includes(settings.frameStyle) && settings.stripBg && settings.stripBg !== '#ffffff') ? `url("${settings.stripBg}")` 
          : ((!isGallery && settings.framePattern && settings.framePattern !== 'none') ? getPatternCss(settings.framePattern, settings.patternColor) : undefined))))),
        backgroundSize: isScrapbook ? '20px 20px' : ((!['film', 'vintage', 'scrapbook', 'gallery'].includes(settings.frameStyle) && settings.stripBg && settings.stripBg !== '#ffffff') ? 'cover' : 'auto'),
        backgroundPosition: 'center',
        borderRadius: isFilm ? 0 : 20,
        borderStyle: 'solid',
        borderWidth: isFilm ? 0 : (isVintage ? 1 : 2),
        width: settings.layout === 'strip-horizontal' ? (photos.length * 280) + 40 : (settings.layout === 'grid' ? 560 : 320),
        padding: 0,
        minHeight: settings.layout === 'strip-horizontal' ? 260 : (settings.layout === 'grid' ? (Math.ceil(photos.length / 2) * 190) + 100 : (photos.length * 180) + 90),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
  
  {/* Scrapbook Detailed Background Overlays */}
  {isScrapbook && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: !isStripBackgroundVisible ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-[20px] rounded-b-[20px] z-0"
    >
      {/* Torn Kraft Paper Patch 1 */}
      <div className="absolute top-[15%] -left-8 w-[120%] h-32 opacity-[0.15] bg-[#8B5A2B] mix-blend-multiply" style={{ clipPath: 'polygon(0% 10%, 15% 5%, 35% 15%, 55% 5%, 75% 12%, 100% 0%, 100% 90%, 80% 95%, 60% 85%, 40% 100%, 20% 90%, 0% 100%)' }} />
      {/* Torn Kraft Paper Patch 2 */}
      <div className="absolute bottom-[20%] -left-4 w-[110%] h-40 opacity-[0.1] bg-[#8B5A2B] mix-blend-multiply" style={{ clipPath: 'polygon(0% 5%, 25% 15%, 50% 0%, 75% 10%, 100% 5%, 100% 95%, 75% 100%, 50% 85%, 25% 95%, 0% 100%)' }} />
      
      {/* SVG Ink Doodles */}
      <svg className="absolute top-[8%] left-[8%] w-8 h-8 opacity-40 stroke-[#334155] rotate-[-15deg]" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" strokeDasharray="3 3"/>
      </svg>
      <svg className="absolute top-[45%] right-[5%] w-7 h-7 opacity-50 stroke-[#334155] rotate-[20deg]" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeDasharray="2 4"/>
      </svg>
      <svg className="absolute bottom-[12%] left-[10%] w-10 h-10 opacity-40 stroke-[#334155] rotate-[45deg]" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" strokeDasharray="4 2"/>
      </svg>
      <svg className="absolute top-[75%] right-[10%] w-12 h-6 opacity-30 stroke-[#334155]" viewBox="0 0 50 20" fill="none" strokeWidth="1.5" strokeLinecap="round">
        <path d="M 0 10 Q 10 0 20 10 T 40 10 T 50 10" />
      </svg>
    </motion.div>
  )}

  {(() => {
    const photoItems = photos.map((photo, index) => {
      let padTopSide = '8px';
      let padBottom = '8px';
      if (isFilm) { padTopSide = '0'; padBottom = '0'; }
      else if (isPolaroid) { padBottom = '36px'; padTopSide = '10px'; }
      else if (isPhotobooth) { padTopSide = '8px'; padBottom = '24px'; }
      else if (isMinimalist) { padTopSide = '4px'; padBottom = '4px'; }
      else if (isGallery) { padTopSide = '18px'; padBottom = '18px'; }
      else if (isVintage) { padTopSide = '12px'; padBottom = '12px'; }
      else if (isScrapbook) { padTopSide = '12px'; padBottom = '12px'; }

      const scrapbookRotations = ['-3.5deg', '2.5deg', '-1.5deg', '3.5deg'];
      const rotation = isScrapbook ? scrapbookRotations[index % 4] : '0deg';

      const innerContent = (
          <div
            className="relative flex-shrink-0 group print-container-photo-card"
            style={{
              padding: padTopSide,
              paddingBottom: padBottom,
              paddingLeft: padTopSide,
              paddingRight: padTopSide,
              borderRadius: (isPolaroid || isFilm || isMinimalist) ? '2px' : '6px',
              width: settings.layout === 'grid' ? "240px" : "260px",
              background: isFilm ? 'transparent' : (isVintage ? '#fcf8ee' : (isScrapbook ? '#fdfbf7' : '#ffffff')),
              border: isFilm ? 'none' : (isVintage ? '1px solid #e3d9c6' : '1px solid #e2e8f0'),
              boxShadow: isGallery 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' 
                : (isScrapbook ? '4px 8px 16px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.1)' : (isPolaroid ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)')),
              transform: `rotate(${rotation})`,
            }}
          >
            {/* Texture Overlays */}
            {isVintage && (
              <>
                <div className="absolute inset-0 pointer-events-none rounded-[5px] border border-[#d2c5ae]/50" style={{ margin: '4px' }} />
                {/* Photo Corners */}
                <svg className="absolute top-2 left-2 w-4 h-4 pointer-events-none z-10 opacity-90 drop-shadow-sm" viewBox="0 0 100 100"><polygon points="0,0 100,0 0,100" fill="#1c1917" /></svg>
                <svg className="absolute top-2 right-2 w-4 h-4 pointer-events-none z-10 opacity-90 drop-shadow-sm" viewBox="0 0 100 100"><polygon points="0,0 100,0 100,100" fill="#1c1917" /></svg>
                <svg className="absolute bottom-[10px] left-2 w-4 h-4 pointer-events-none z-10 opacity-90 drop-shadow-sm" viewBox="0 0 100 100"><polygon points="0,100 0,0 100,100" fill="#1c1917" /></svg>
                <svg className="absolute bottom-[10px] right-2 w-4 h-4 pointer-events-none z-10 opacity-90 drop-shadow-sm" viewBox="0 0 100 100"><polygon points="100,100 0,100 100,0" fill="#1c1917" /></svg>
              </>
            )}
            {isGallery && (
              <div className="absolute inset-0 pointer-events-none rounded-[4px] border border-black/[0.03] shadow-[inset_0_0_8px_rgba(0,0,0,0.02)]" style={{ margin: '8px' }} />
            )}
            
            {/* Scrapbook Tape & Overlays */}
            {isScrapbook && (
              <>
                {/* Torn Notebook Paper Background Behind Photo */}
                <div className="absolute inset-[-8px] z-[-1] bg-[#fafafa] shadow-[1px_2px_4px_rgba(0,0,0,0.05)] rotate-[1.5deg]" 
                     style={{ 
                       backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', 
                       backgroundSize: '100% 20px', 
                       clipPath: 'polygon(2% 0%, 98% 2%, 100% 95%, 5% 100%)' 
                     }} 
                />
                
                {index % 4 === 0 && (
                  <>
                    {/* Striped Yellow Washi Tape Top Left */}
                    <div className="absolute -top-4 -left-4 w-16 h-8 opacity-95 z-20 pointer-events-none shadow-md flex items-center justify-center rotate-[-25deg] overlay-element">
                      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full fill-[#fde047] stroke-[#eab308]">
                        <defs><pattern id={`stripes-${index}`} width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="10" stroke="#fef08a" strokeWidth="5"/></pattern></defs>
                        <path d="M0 3c5-3 10 3 15 0s10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0v24c-5 3-10-3-15 0s-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0z" fill={`url(#stripes-${index})`} strokeWidth="1"/>
                      </svg>
                    </div>
                    {/* Pink Pushpin Bottom Right */}
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 z-20 pointer-events-none drop-shadow-md overlay-element">
                      <div className="w-4 h-4 bg-pink-500 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)] border border-pink-600 m-1"></div>
                      <div className="w-1 h-3 bg-slate-300 absolute top-3 left-2.5 z-[-1] shadow-sm transform -rotate-12"></div>
                    </div>
                  </>
                )}
                
                {index % 4 === 1 && (
                  <>
                    {/* Paperclip Top Center */}
                    <div className="absolute -top-4 left-1/2 -ml-3 w-6 h-12 z-20 pointer-events-none drop-shadow-md rotate-[12deg] overlay-element">
                      <svg viewBox="0 0 24 48" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 40V8a4 4 0 0 0-8 0v28a8 8 0 0 0 16 0V12a2 2 0 0 0-4 0v24"/>
                      </svg>
                    </div>
                    {/* Polka Dot Pink Tape Bottom Left */}
                    <div className="absolute -bottom-4 -left-4 w-16 h-8 opacity-95 z-20 pointer-events-none shadow-md flex items-center justify-center rotate-[20deg] overlay-element">
                      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full fill-[#fbcfe8] stroke-[#f472b6]">
                        <defs><pattern id={`dots-${index}`} width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2" fill="#fce7f3"/></pattern></defs>
                        <path d="M0 3c5-3 10 3 15 0s10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0v24c-5 3-10-3-15 0s-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0z" fill={`url(#dots-${index})`} strokeWidth="1"/>
                      </svg>
                    </div>
                  </>
                )}
                
                {index % 4 === 2 && (
                  <>
                    {/* Polka Dot Pink Tape Top Right */}
                    <div className="absolute -top-4 -right-4 w-16 h-8 opacity-95 z-20 pointer-events-none shadow-md flex items-center justify-center rotate-[25deg] overlay-element">
                      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full fill-[#fbcfe8] stroke-[#f472b6]">
                        <defs><pattern id={`dots-${index}`} width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2" fill="#fce7f3"/></pattern></defs>
                        <path d="M0 3c5-3 10 3 15 0s10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0v24c-5 3-10-3-15 0s-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0z" fill={`url(#dots-${index})`} strokeWidth="1"/>
                      </svg>
                    </div>
                    {/* Pushpin Top Left */}
                    <div className="absolute -top-3 -left-3 w-6 h-6 z-20 pointer-events-none drop-shadow-md overlay-element">
                      <div className="w-4 h-4 bg-sky-500 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)] border border-sky-600 m-1"></div>
                      <div className="w-1 h-3 bg-slate-300 absolute top-3 left-2.5 z-[-1] shadow-sm transform -rotate-[30deg]"></div>
                    </div>
                  </>
                )}

                {index % 4 === 3 && (
                  <>
                    {/* Striped Yellow Tape Bottom Right */}
                    <div className="absolute -bottom-4 -right-4 w-16 h-8 opacity-95 z-20 pointer-events-none shadow-md flex items-center justify-center rotate-[-15deg] overlay-element">
                      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full fill-[#fde047] stroke-[#eab308]">
                        <defs><pattern id={`stripes-${index}`} width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="10" stroke="#fef08a" strokeWidth="5"/></pattern></defs>
                        <path d="M0 3c5-3 10 3 15 0s10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0 10 3 15 0v24c-5 3-10-3-15 0s-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0-10-3-15 0z" fill={`url(#stripes-${index})`} strokeWidth="1"/>
                      </svg>
                    </div>
                    {/* Paperclip Top Left */}
                    <div className="absolute -top-2 -left-4 w-6 h-12 z-20 pointer-events-none drop-shadow-md rotate-[-30deg] overlay-element">
                      <svg viewBox="0 0 24 48" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 40V8a4 4 0 0 0-8 0v28a8 8 0 0 0 16 0V12a2 2 0 0 0-4 0v24"/>
                      </svg>
                    </div>
                  </>
                )}
              </>
            )}

            <div 
              className="relative overflow-hidden w-full h-full print-container-photo-slot"
              style={{
                borderRadius: (isPolaroid || isFilm || isMinimalist) ? '2px' : '6px',
                aspectRatio: (settings as any).aspectRatio === 'portrait' ? '3/4' : ((settings as any).aspectRatio === 'square' ? '1/1' : '4/3'),
                boxShadow: (!isStripBackgroundVisible || !isGallery) ? 'none' : 'inset 0 3px 6px rgba(0,0,0,0.15)',
                filter: (!isStripBackgroundVisible || !isVintage) ? 'none' : 'sepia(0.4) contrast(1.05) brightness(0.95)',
                background: isStripBackgroundVisible ? '#fff' : 'transparent',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease'
              }}>
              {(() => {
                const isStatic = fullyRevealed ? false : (isVideoStrip && revealed[index]);
                
                return (
                  <>
                    {isVideoStrip ? (
                      <>
                        <video
                          ref={el => { videoRefs.current[index] = el; }}
                          src={photo.videoUrl || photo.dataUrl}
                          className="w-full h-full object-cover export-hide cursor-pointer"
                          muted
                          loop={true} // Autoloop always on preview
                          playsInline
                          style={{
                            display: isStatic ? 'none' : 'block',
                            transform: settings.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'
                          }}
                        />
                        <motion.img
                          src={photo.dataUrl}
                          alt={`Photo ${index + 1}`}
                          className="object-cover w-full h-full pointer-events-none absolute inset-0 export-hide"
                          style={{ display: isStatic ? 'block' : 'none' }}
                        />
                      </>
                    ) : (
                      <motion.img
                        src={photo.dataUrl}
                        alt={`Photo ${index + 1}`}
                        className="object-cover w-full h-full pointer-events-none export-hide"
                      />
                    )}
                    
                    {/* Countdown Overlay */}
                    {(() => {
                      if (!getOverlayProps) return null;
                      const { show, alpha, seconds } = getOverlayProps(index, settings.countdownDuration || 3);
                      if (!show || alpha <= 0) return null;
                      return (
                        <div 
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                          style={{ backgroundColor: `rgba(255,255,255,${alpha * 0.4})` }}
                        >
                          {alpha > 0.05 && (
                            <span 
                              className="text-white font-black drop-shadow-md"
                              style={{ fontSize: 'clamp(2rem, 15vw, 4rem)', textShadow: '0px 4px 8px rgba(0,0,0,0.3)' }}
                            >
                              {seconds}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
              
              {/* Inner Gloss / Shadows */}
              {isPolaroid && (
                <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70" style={{
                  background: 'linear-gradient(105deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 100%)'
                }} />
              )}
              {isFilm && (
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] mix-blend-multiply" />
              )}

              {/* STICKERS for this specific slot (used in older implementations, kept for compat) */}
              {stickers && stickers.filter(s => s.photoIndex === index).map(sticker => (
                <div
                  key={sticker.id}
                  className="absolute pointer-events-none overlay-element"
                  style={{
                    left: sticker.x,
                    top: sticker.y,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                    zIndex: sticker.zIndex || 50
                  }}
                >
                  {sticker.type === '3D' ? (
                    <span className="text-4xl drop-shadow-md filter">{sticker.content}</span>
                  ) : (
                    <img src={sticker.content} alt="sticker" className="w-12 h-12 object-contain drop-shadow-sm filter" />
                  )}
                </div>
              ))}
            </div>
          </div>
      );

      // STICKERS mapped to the global container
      const globalStickers = stickers && stickers.filter(s => s.photoIndex === undefined).map(sticker => (
        <div
          key={sticker.id}
          className="absolute pointer-events-none overlay-element"
          style={{
            left: sticker.x,
            top: sticker.y,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
            zIndex: sticker.zIndex || 50
          }}
        >
          {sticker.type === '3D' ? (
            <span className="text-4xl drop-shadow-md filter">{sticker.content}</span>
          ) : (
            <img src={sticker.content} alt="sticker" className="w-12 h-12 object-contain drop-shadow-sm filter" />
          )}
        </div>
      ));

      if (settings.layout === 'grid') {
        return (
          <motion.div
            key={photo.id}
            layout
            drag={onReorder !== undefined && activeTab === 'layout'}
            dragSnapToOrigin
            data-photo-index={index}
            layoutId={`photo-wrapper-${photo.id}`}
            className={`relative z-10 flex justify-center active:z-50 ${onReorder && activeTab === 'layout' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ margin: '8px' }}
            whileDrag={onReorder ? { scale: 1.05, zIndex: 100 } : {}}
            onDragEnd={onReorder ? (e, info) => {
              let clientX = 0;
              let clientY = 0;
              if ('clientX' in e) {
                clientX = (e as MouseEvent | PointerEvent).clientX;
                clientY = (e as MouseEvent | PointerEvent).clientY;
              } else if ('changedTouches' in e && (e as TouchEvent).changedTouches.length > 0) {
                clientX = (e as TouchEvent).changedTouches[0].clientX;
                clientY = (e as TouchEvent).changedTouches[0].clientY;
              } else {
                clientX = info.point.x;
                clientY = info.point.y - window.scrollY;
              }

              const elements = document.elementsFromPoint(clientX, clientY);
              const dropTarget = elements.find(el => {
                const idx = el.getAttribute('data-photo-index');
                return idx !== null && parseInt(idx, 10) !== index;
              });
              
              if (dropTarget) {
                const targetIndex = parseInt(dropTarget.getAttribute('data-photo-index')!, 10);
                if (!isNaN(targetIndex)) {
                  const newPhotos = [...photos];
                  const temp = newPhotos[index];
                  newPhotos[index] = newPhotos[targetIndex];
                  newPhotos[targetIndex] = temp;
                  onReorder(newPhotos);
                }
              }
            } : undefined}
          >
            {innerContent}
            {index === photos.length - 1 && globalStickers}
          </motion.div>
        );
      }

      const wrapperProps = {
        layoutId: `photo-wrapper-${photo.id}`,
        className: `relative z-10 flex justify-center active:z-50 ${onReorder && activeTab === 'layout' ? 'cursor-grab active:cursor-grabbing' : ''}`,
        style: { 
          width: settings.layout === 'strip' ? '100%' : 'auto',
          margin: settings.layout === 'strip-horizontal' ? '0 8px' : '6px 0'
        }
      };

      const shouldRenderReorder = onReorder !== undefined && activeTab === 'layout' && !isFlightActive;

      if (!shouldRenderReorder) {
        return (
          <motion.div layout key={photo.id} {...wrapperProps}>
            {innerContent}
            {index === photos.length - 1 && globalStickers}
          </motion.div>
        );
      }

      return (
        <Reorder.Item 
          key={photo.id}
          {...wrapperProps}
          value={photo}
          dragListener={onReorder !== undefined && activeTab === 'layout'}
        >
          {innerContent}
          {index === photos.length - 1 && globalStickers}
        </Reorder.Item>
      );
    });

    if (settings.layout === 'grid') {
      return (
        <div className="relative w-full pt-[20px] pb-[10px] px-[20px] grid grid-cols-2">
          {photoItems}
        </div>
      );
    }

    if (!onReorder) {
      return (
        <div 
          className={`relative w-full pt-[20px] pb-[10px] px-[20px] ${
            settings.layout === 'strip-horizontal' ? 'flex flex-row justify-center' : 'flex flex-col items-center'
          }`}
        >
          {photoItems}
        </div>
      );
    }

    return (
      <Reorder.Group 
        axis={settings.layout === 'strip-horizontal' ? "x" : "y"} 
        values={photos} 
        onReorder={onReorder}
        className={`relative w-full pt-[20px] pb-[10px] px-[20px] ${
          settings.layout === 'strip-horizontal' ? 'flex flex-row justify-center' : 'flex flex-col items-center'
        }`}
      >
        {photoItems}
      </Reorder.Group>
    );
  })()}

  {/* Caption Section */}
  {shouldShowCaptionSection && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: !isStripBackgroundVisible ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className={`w-full flex flex-col items-center justify-center pb-2 pt-4 ${showCaption ? captionFont : "font-sans"} z-20`}
      style={{ minHeight: 60 }}
    >
      {showDate && (
        <div 
          className={`text-center tracking-widest ${captionColor === 'white' ? 'text-white/90' : captionColor === 'black' ? 'text-black/70' : isBackgroundDark(settings) ? 'text-slate-200' : 'text-slate-500'}`}
          style={{ fontSize: `${14 * captionSize}px`, lineHeight: `${20 * captionSize}px` }}
        >
          {nowStr}
        </div>
      )}
      {showCaption && customCaption.trim().length > 0 && (
        <div 
          className={`text-center tracking-widest font-medium break-all whitespace-pre-wrap px-4 ${captionColor === 'white' ? 'text-white' : captionColor === 'black' ? 'text-black' : isBackgroundDark(settings) ? 'text-slate-100' : 'text-slate-800'}`} 
          style={{
            marginTop: showDate ? Math.max(4, 4 * captionSize) : 0,
            fontSize: `${16 * captionSize}px`,
            lineHeight: `${24 * captionSize}px`
          }}
        >
          {customCaption}
        </div>
      )}
    </motion.div>
  )}
  
  {/* Watermark Section */}
  {showWatermark && (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: !isStripBackgroundVisible ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className={`w-full flex items-baseline gap-[6px] pb-6 pt-2 opacity-90 z-20 ${watermarkPlacement === 'left' ? 'justify-start px-6' : watermarkPlacement === 'right' ? 'justify-end px-6' : 'justify-center'} ${watermarkColor === 'white' ? 'text-white' : 'text-slate-900'}`}
    >
      <img src="/meemomini_front.png" alt="logo" className="h-[14px] w-auto object-contain translate-y-0.5" />
      <span className={`text-[15px] font-black tracking-tighter ${watermarkColor === 'white' ? 'text-white' : 'text-slate-900'}`}>
        meemomini<span className="animate-rainbow-text drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]">.</span>
      </span>
    </motion.div>
  )}
  
  {/* Film Sprocket Holes & Markings (CSS rendering for preview) */}
  {isFilm && (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Film Marks */}
      <div className="absolute inset-y-0 left-1 w-4 flex flex-col justify-around py-4 items-center opacity-60">
        {Array.from({length: 6}).map((_, i) => (
          <div key={`film-txt-l-${i}`} className="text-[#eab308] font-mono text-[6px] tracking-widest" style={{ writingMode: 'vertical-rl' }}>KODAK PORTRA 400</div>
        ))}
      </div>
      <div className="absolute inset-y-0 right-1 w-4 flex flex-col justify-around py-4 items-center opacity-60">
        {Array.from({length: 6}).map((_, i) => (
          <div key={`film-txt-r-${i}`} className="text-[#eab308] font-mono text-[7px] font-bold">1 {i+3}</div>
        ))}
      </div>
      {/* Sprocket Holes using repeating radial gradient */}
      <div 
        className="absolute inset-y-0 left-4 w-4 bg-repeat-y" 
        style={{ 
          backgroundImage: 'radial-gradient(ellipse 6px 8px at 50% 50%, #f1f5f9 50%, transparent 52%)',
          backgroundSize: '100% 28px'
        }} 
      />
      <div 
        className="absolute inset-y-0 right-4 w-4 bg-repeat-y" 
        style={{ 
          backgroundImage: 'radial-gradient(ellipse 6px 8px at 50% 50%, #f1f5f9 50%, transparent 52%)',
          backgroundSize: '100% 28px'
        }} 
      />
    </div>
  )}
  
  </motion.div>
  );
};
