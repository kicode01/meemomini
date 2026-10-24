import { useEffect, useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useCamera } from '@/hooks/useCamera';
import FilterSelector from './FilterSelector';
import CameraPreview from './CameraPreview';
import CameraHeaderBar from './CameraHeaderBar';
import PhotoThumbnails from './PhotoThumbnails';
import CaptureButton from './CaptureButton';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { useBackgroundSegmentation } from '@/hooks/useBackgroundSegmentation';
import { GALLERY_ENABLED } from '@/lib/features';
import jeelizFilters from '@/utils/jeelizFilters.json';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { SwitchCamera, FlipHorizontal, Zap, ZapOff, Sparkles, Settings2, Image as ImageIcon, Wand2, ArrowLeft, Volume2, VolumeX, Grid, MoreVertical, Images, Palette, LayoutGrid, ChevronDown, Crown, Star, Flame, Leaf, PartyPopper, Smile, Glasses, Heart, EyeOff, Scissors, Video } from 'lucide-react';

const filters = [
  { id: 'none', name: 'Original', css: '' },
  { id: 'clarendon', name: 'Clarendon', css: 'contrast(1.3) saturate(1.5) brightness(1.1)' },
  { id: 'gingham', name: 'Gingham', css: 'brightness(1.15) hue-rotate(340deg) contrast(0.9)' },
  { id: 'moon', name: 'Moon', css: 'grayscale(1) contrast(1.2) brightness(1.2)' },
  { id: 'lark', name: 'Lark', css: 'contrast(0.8) brightness(1.3) saturate(1.2)' },
  { id: 'reyes', name: 'Reyes', css: 'sepia(0.3) brightness(1.2) contrast(0.8) saturate(0.7)' },
  { id: 'juno', name: 'Juno', css: 'saturate(1.6) contrast(1.2) hue-rotate(350deg)' },
  { id: 'slumber', name: 'Slumber', css: 'saturate(0.5) brightness(1.1) sepia(0.2)' },
  { id: 'crema', name: 'Crema', css: 'saturate(0.8) contrast(1.25) sepia(0.3)' },
  { id: 'ludwig', name: 'Ludwig', css: 'contrast(1.15) saturate(1.3) brightness(1.1) hue-rotate(350deg)' },
  { id: 'aden', name: 'Aden', css: 'hue-rotate(330deg) contrast(0.85) saturate(0.8) brightness(1.3)' },
  { id: 'perpetua', name: 'Perpetua', css: 'contrast(1.2) saturate(1.2) brightness(1.2) hue-rotate(340deg)' },
  { id: 'amaro', name: 'Amaro', css: 'hue-rotate(345deg) contrast(1.2) brightness(1.2) saturate(1.4)' },
  { id: 'mayfair', name: 'Mayfair', css: 'contrast(1.2) saturate(1.2) sepia(0.1)' },
  { id: 'rise', name: 'Rise', css: 'brightness(1.15) sepia(0.3) contrast(0.85) saturate(0.8)' },
  { id: 'hudson', name: 'Hudson', css: 'brightness(1.3) contrast(0.85) saturate(1.2) hue-rotate(180deg)' },
  { id: 'valencia', name: 'Valencia', css: 'contrast(1.15) brightness(1.15) sepia(0.15)' },
  { id: 'xpro', name: 'X-Pro II', css: 'sepia(0.4) contrast(1.4) brightness(0.9) saturate(1.5)' },
  { id: 'sierra', name: 'Sierra', css: 'contrast(0.7) saturate(1.3) sepia(0.25)' },
  { id: 'willow', name: 'Willow', css: 'grayscale(0.8) contrast(0.9) brightness(0.9)' },
  { id: 'lofi', name: 'Lo-Fi', css: 'saturate(1.8) contrast(1.8)' },
  { id: 'inkwell', name: 'Inkwell', css: 'sepia(0.4) contrast(1.2) brightness(1.2) grayscale(1)' },
  { id: 'hefe', name: 'Hefe', css: 'contrast(1.6) saturate(1.6) sepia(0.1)' },
  { id: 'nashville', name: 'Nashville', css: 'sepia(0.3) contrast(1.3) brightness(1.1) saturate(1.4)' },
  { id: 'bw', name: 'Classic B&W', css: 'grayscale(1) contrast(1.5)' },
  { id: 'sepia', name: 'Old Vintage', css: 'sepia(0.8) contrast(1.5) saturate(1.2)' },
  { id: 'negative', name: 'Negative', css: 'invert(1) contrast(1.2)' },
  { id: 'xray', name: 'X-Ray', css: 'invert(1) grayscale(1) contrast(2)' },
  { id: 'thermal', name: 'Thermal', css: 'invert(1) hue-rotate(90deg) saturate(4) contrast(2)' },
  { id: 'cyberpunk', name: 'Cyberpunk', css: 'hue-rotate(90deg) saturate(3) contrast(1.5) brightness(0.9)' },
  { id: 'neon', name: 'Neon Party', css: 'hue-rotate(45deg) saturate(3) contrast(2)' },
  { id: 'frost', name: 'Deep Frost', css: 'hue-rotate(180deg) saturate(1.5) contrast(1.2) brightness(1.2)' },
  { id: 'golden', name: 'Golden Hour', css: 'sepia(0.4) saturate(2) brightness(1.1) contrast(1.2)' },
  { id: 'noir', name: 'Film Noir', css: 'grayscale(1) contrast(2) brightness(0.8)' },
  { id: 'popart', name: 'Pop Art', css: 'saturate(3) contrast(3)' },
  { id: 'washed', name: 'Faded', css: 'contrast(0.6) brightness(1.2) saturate(0.5)' },
  { id: 'crimson', name: 'Crimson', css: 'hue-rotate(300deg) saturate(1.5) contrast(1.3)' },
  { id: 'matrix', name: 'Matrix', css: 'hue-rotate(90deg) saturate(2) brightness(0.8) contrast(1.5)' },
  { id: 'aqua', name: 'Aqua Glow', css: 'hue-rotate(180deg) saturate(1.8) brightness(1.2) contrast(1.2)' },
  { id: 'sunset', name: 'Sunset Boulevard', css: 'sepia(0.5) hue-rotate(-30deg) saturate(1.6) contrast(1.2)' },
];

const CameraView = () => {
  const appState = useStore((state) => state.appState);
  const settings = useStore((state) => state.settings);
  const setSettings = useStore((state) => state.setSettings);
  const setAppState = useStore((state) => state.setAppState);
  const setCapturedPhotosStore = useStore((state) => state.setCapturedPhotos);
  const retakeIndex = useStore((state) => state.retakeIndex);
  const setRetakeIndex = useStore((state) => state.setRetakeIndex);
  const replacePhoto = useStore((state) => state.replacePhoto);

  const [activeTab, setActiveTab] = useState<'layout' | 'filters' | 'ar' | 'backgrounds' | 'extras'>('layout');
  const isMobilePanelOpen = useStore((state) => state.isMobilePanelOpen);
  const setIsMobilePanelOpen = useStore((state) => state.setIsMobilePanelOpen);
  const [showQuickControls, setShowQuickControls] = useState(false);
  const dragControls = useDragControls();
  const [expandedARCategory, setExpandedARCategory] = useState<string>('Headwear');

  const handleTabClick = (tab: 'layout' | 'filters' | 'ar' | 'backgrounds' | 'extras') => {
    if (activeTab === tab) {
      setIsMobilePanelOpen(!isMobilePanelOpen);
    } else {
      setActiveTab(tab);
      setIsMobilePanelOpen(true);
    }
  };

  const handlePhotosComplete = (photos: any[]) => {
    setCapturedPhotosStore(photos);
    setAppState('studio');
  };

  const {
    videoRef,
    canvasRef,
    overlayCanvasRef,
    segmentationCanvasRef,
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
    resetAdvancedSettings
  } = useCamera(settings, handlePhotosComplete);

  const { isModelLoaded } = useFaceTracking(videoRef, overlayCanvasRef, settings);
  const { isSegmenterLoaded } = useBackgroundSegmentation(videoRef, segmentationCanvasRef, settings);

  const isJeelizActive = settings.selectedARFilter.startsWith('jeeliz_');
  const activeJeelizFilter = jeelizFilters.find(f => `jeeliz_${f.id}` === settings.selectedARFilter);

  let iframeSrc = activeJeelizFilter?.path;
  if (iframeSrc) {
    if (activeJeelizFilter!.id === 'beautification') {
      iframeSrc += `?intensity=${settings.beautificationIntensity}`;
    } else if (activeJeelizFilter!.id === 'dynamic_gltf') {
      iframeSrc += `?model=${encodeURIComponent(settings.customGltfUrl)}`;
    }
  }

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const getFilterCss = useCallback(() => {
    const presetCss = filters.find(f => f.id === selectedFilter)?.css || '';
    const manualCss = `contrast(${contrast/100}) brightness(${brightness/100}) saturate(${saturation/100})`;
    if (selectedFilter === 'none') return manualCss;
    return presetCss + ' ' + manualCss;
  }, [selectedFilter, contrast, brightness, saturation]);

  const handleCapture = async () => {
    if (retakeIndex !== null) {
      const newPhoto = await startSingleCapture(getFilterCss());
      if (newPhoto) {
        replacePhoto(retakeIndex, newPhoto);
      }
      setRetakeIndex(null);
      setAppState('studio');
    } else {
      startCapture(getFilterCss());
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <Card className="p-8 border-2 border-slate-200 text-center max-w-md shadow-xl rounded-2xl">
          <h3 className="text-3xl font-black tracking-tighter text-[#0b0c10] mb-4">CAMERA ACCESS NEEDED</h3>
          <p className="font-semibold text-slate-500 mb-8">{error}</p>
          <button onClick={startCamera} className="w-full theme-btn py-4 text-lg">
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-[100dvh] w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50 lg:bg-transparent"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-100 via-pink-100 to-yellow-50 z-0"
      />
      <div 
        className={`flex-1 relative flex flex-col p-0 lg:p-8 overflow-hidden h-full min-h-0 z-10 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.2)] ${
          window.innerWidth < 1024 ? (isMobilePanelOpen ? 'pb-[50vh]' : 'pb-[110px]') : 'pb-8'
        }`}
      >
        <div className="absolute top-4 right-4 z-50 lg:relative lg:top-0 lg:right-0 lg:flex lg:items-center lg:justify-end lg:mb-4 lg:h-10">
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

        <div className="flex-1 flex flex-col items-center justify-between max-w-7xl mx-auto w-full min-h-0 pt-2 pb-4">
          {retakeIndex !== null ? (
            <div className={`w-full z-50 px-4 lg:px-0 lg:mb-6 pt-16 lg:pt-0 overflow-hidden ${window.innerWidth < 1024 && isMobilePanelOpen ? 'pointer-events-none' : ''}`}>
              <motion.div 
                initial={{ opacity: 0, height: 'auto', marginBottom: '1.5rem' }} 
                animate={window.innerWidth < 1024 && isMobilePanelOpen ? {
                  opacity: 0,
                  y: -20,
                  height: 0,
                  marginBottom: 0,
                } : {
                  opacity: 1,
                  y: 0,
                  height: 'auto',
                  marginBottom: '1.5rem',
                }} 
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} 
                className="w-full flex justify-start"
              >
                <button 
                  onClick={() => { setRetakeIndex(null); setAppState('studio'); }}
                  className="theme-btn-secondary py-2 px-4 text-sm flex items-center gap-2 shadow-md bg-white border-2 border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" /> Cancel Retake
                </button>
              </motion.div>
            </div>
          ) : (
            <div className={`w-full z-50 px-4 lg:px-0 lg:mb-6 pt-16 lg:pt-0 overflow-hidden ${window.innerWidth < 1024 && isMobilePanelOpen ? 'pointer-events-none' : ''}`}>
              <motion.div 
                initial={{ opacity: 0, height: 'auto', marginBottom: '1.5rem' }} 
                animate={window.innerWidth < 1024 && isMobilePanelOpen ? {
                  opacity: 0,
                  y: -20,
                  height: 0,
                  marginBottom: 0,
                } : {
                  opacity: 1,
                  y: 0,
                  height: 'auto',
                  marginBottom: '1.5rem',
                }} 
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} 
                className="w-full"
              >
                <CameraHeaderBar
                  onBack={() => setAppState('welcome')}
                  currentPhotoIndex={currentPhotoIndex}
                  totalPhotos={settings.photoCount}
                />
              </motion.div>
            </div>
          )}

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }} className="flex-1 w-full min-h-0 flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8">
            <div className="w-full lg:w-28 flex-shrink-0 lg:h-full lg:max-h-[70vh] flex lg:flex-col overflow-x-auto lg:overflow-y-auto lg:pr-2 snap-x lg:snap-y hide-scrollbar py-2 lg:py-1 z-50">
              {capturedPhotos.length > 0 && (
                <div className="flex lg:flex-col gap-3 min-w-max lg:min-w-0 px-4 lg:px-0 mx-auto lg:mx-0">
                  <PhotoThumbnails capturedPhotos={capturedPhotos} direction={window.innerWidth < 1024 ? "row" : "col"} />
                </div>
              )}
            </div>
            <div 
              className="relative rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl border-[12px] lg:border-[16px] border-white bg-slate-900 flex items-center justify-center ring-4 ring-pink-200/50 z-10"
              style={{ 
                aspectRatio: settings.aspectRatio === 'portrait' ? '3/4' : '4/3', 
                maxWidth: '100%', 
                maxHeight: '100%' 
              }}
            >
              {/* Invisible huge spacer to force the box to expand to its maximum allowed constraints */}
              <div style={{ width: 10000, height: 10000 }} />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <CameraPreview
                videoRef={videoRef}
                canvasRef={canvasRef}
                overlayCanvasRef={overlayCanvasRef}
                segmentationCanvasRef={segmentationCanvasRef}
                getFilterCss={getFilterCss}
                countdown={countdown}
                isCapturing={isCapturing}
                settings={settings}
                capturedPhotos={capturedPhotos}
                isCameraReady={!!videoRef.current}
              />
              {isJeelizActive && activeJeelizFilter && (
                <iframe
                  id="jeeliz-iframe"
                  src={iframeSrc}
                  allow="camera"
                  className="absolute top-0 left-0 w-full h-full border-0 z-20"
                  style={{ backgroundColor: 'transparent', filter: getFilterCss(), transform: settings.isMirrored ? 'scaleX(1)' : 'scaleX(-1)' }}
                />
              )}

              <div className="absolute left-1/2 -translate-x-1/2 z-[60] bottom-4 lg:bottom-6 hidden lg:block">
                <CaptureButton onClick={handleCapture} isCapturing={isCapturing} disabled={isCapturing} />
              </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, height: 'auto', marginTop: '1rem', marginBottom: '1rem' }}
            animate={window.innerWidth < 1024 && isMobilePanelOpen ? {
              opacity: 0,
              height: 0,
              marginTop: 0,
              marginBottom: 0
            } : {
              opacity: 1,
              height: 'auto',
              marginTop: '1rem',
              marginBottom: '1rem'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="lg:hidden w-full flex justify-center items-center overflow-hidden flex-shrink-0 z-50"
          >
            <CaptureButton onClick={handleCapture} isCapturing={isCapturing} disabled={isCapturing} />
          </motion.div>
        </div>
      </div>

      <motion.div 
        layout
        drag={window.innerWidth < 1024 ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (window.innerWidth >= 1024) return;
          const threshold = 50;
          const velocityThreshold = 500;
          if (isMobilePanelOpen && (info.offset.y > threshold || info.velocity.y > velocityThreshold)) {
            setIsMobilePanelOpen(false);
          } else if (!isMobilePanelOpen && (info.offset.y < -threshold || info.velocity.y < -velocityThreshold)) {
            setIsMobilePanelOpen(true);
          }
        }}
        initial={{ opacity: 0, y: window.innerWidth < 1024 ? '100%' : 0, x: window.innerWidth < 1024 ? 0 : 50 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ 
          layout: { type: 'spring', stiffness: 400, damping: 30 },
          default: { delay: 0.3, type: 'spring', stiffness: 150, damping: 20 } 
        }}
        className={`absolute bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto w-full lg:w-[400px] flex-shrink-0 bg-white/95 backdrop-blur-3xl lg:bg-white/80 lg:border-l-4 lg:border-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col z-40 rounded-t-[2rem] lg:rounded-none ${isMobilePanelOpen ? 'h-[50vh] lg:h-full' : 'h-auto pb-4 pt-1 lg:pt-0 lg:pb-0 lg:h-full'}`}
      >
        {/* Mobile Collapse Handle */}
        <div 
          className="lg:hidden w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Tabs Header */}
        <div className="flex justify-around lg:justify-start p-4 gap-2 bg-white/50 backdrop-blur-md rounded-t-[3rem] lg:rounded-none border-b-2 border-slate-100/50">
          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${
              activeTab === 'layout' 
                ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-blue-500 text-white border-blue-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-blue-500 lg:text-white lg:border-blue-700 lg:shadow-lg lg:scale-[1.02]') 
                : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500')
            }`}
            onClick={() => {
              setActiveTab('layout');
              if (window.innerWidth < 1024) setIsMobilePanelOpen(true);
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <Settings2 className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              activeTab === 'layout' 
                ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') 
                : 'max-w-0 opacity-0'
            }`}>
              Setup
            </span>
          </motion.button>
          
          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${
              activeTab === 'filters' 
                ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-pink-500 text-white border-pink-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-pink-500 lg:text-white lg:border-pink-700 lg:shadow-lg lg:scale-[1.02]') 
                : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500')
            }`}
            onClick={() => {
              setActiveTab('filters');
              if (window.innerWidth < 1024) setIsMobilePanelOpen(true);
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <Palette className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              activeTab === 'filters' 
                ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') 
                : 'max-w-0 opacity-0'
            }`}>
              Filters
            </span>
          </motion.button>
          
          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${
              activeTab === 'ar' 
                ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-yellow-400 text-yellow-900 border-yellow-600 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-yellow-400 lg:text-yellow-900 lg:border-yellow-600 lg:shadow-lg lg:scale-[1.02]') 
                : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600')
            }`}
            onClick={() => {
              setActiveTab('ar');
              if (window.innerWidth < 1024) setIsMobilePanelOpen(true);
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <Wand2 className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              activeTab === 'ar' 
                ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') 
                : 'max-w-0 opacity-0'
            }`}>
              AR Face
            </span>
          </motion.button>
          
          <motion.button 
            layout
            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${
              activeTab === 'backgrounds' 
                ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-emerald-500 text-white border-emerald-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-emerald-500 lg:text-white lg:border-emerald-700 lg:shadow-lg lg:scale-[1.02]') 
                : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-500')
            }`}
            onClick={() => {
              setActiveTab('backgrounds');
              if (window.innerWidth < 1024) setIsMobilePanelOpen(true);
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <motion.div layout="position">
              <ImageIcon className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              activeTab === 'backgrounds' 
                ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') 
                : 'max-w-0 opacity-0'
            }`}>
              BG
            </span>
          </motion.button>
        </div>

        {/* Tabs Content - Scrollable */}
        <div className={`flex-1 flex-col min-h-0 relative bg-white/30 transition-opacity duration-300 ${isMobilePanelOpen ? 'opacity-100 flex' : 'opacity-0 hidden lg:flex lg:opacity-100'}`}>
          
          {/* SETUP TAB */}
          {activeTab === 'layout' && (
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-8"
            >
              {/* BOOTH MODE */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Booth Mode</label>
                <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                  {['classic', 'boomerang'].map((mode) => {
                    const isActive = settings.captureMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setSettings({ ...settings, captureMode: mode as any })}
                        disabled={isCapturing}
                        className={`relative flex-1 py-3 text-sm font-bold z-10 capitalize transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeBoothMode"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span>{mode}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* NUMBER OF SNAPS */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Number of Snaps</label>
                <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                  {[2, 3, 4, 6, 8].map((count) => {
                    const isActive = settings.photoCount === count;
                    return (
                      <button
                        key={count}
                        onClick={() => setSettings({ ...settings, photoCount: count })}
                        disabled={isCapturing}
                        className={`relative flex-1 py-2.5 text-sm font-bold z-10 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeSnapCount"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* BORDER COLOR */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Border Color</label>
                <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                  {['none', 'classic', 'black', 'gold', 'blue'].map((color) => {
                    const isActive = settings.frameColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSettings({ ...settings, frameColor: color })}
                        disabled={isCapturing}
                        className={`relative flex-1 py-2.5 text-xs font-bold z-10 capitalize transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeBorderColor"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span>{color === 'classic' ? 'White' : color}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* COUNTDOWN TIMER */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Countdown Timer</label>
                <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner border border-slate-300/30">
                  {[2, 3, 5, 8, 10].map((s) => {
                    const isActive = settings.countdownDuration === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSettings({ ...settings, countdownDuration: s })}
                        disabled={isCapturing}
                        className={`relative flex-1 py-2.5 text-sm font-bold z-10 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeCountdown"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span>{s}S</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* APP & INTERFACE */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }} className="pt-4 border-t border-slate-100">
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">App & Interface</label>
                <div className="flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
                  <motion.button
                    className="w-full py-5 px-6 flex items-center justify-between border-b-2 border-slate-100 transition-colors hover:bg-slate-50 active:bg-slate-100"
                    onClick={() => setSettings({ ...settings, enableAudio: !settings.enableAudio })}
                    disabled={isCapturing}
                  >
                    <span className="flex items-center gap-4 font-bold text-slate-700">
                      <div className={`p-2 rounded-xl ${settings.enableAudio ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Volume2 className="w-5 h-5" /></div>
                      Audio Effects
                    </span>
                    <div className={`flex w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.enableAudio ? 'bg-blue-500' : 'bg-slate-200'}`} style={{ justifyContent: settings.enableAudio ? 'flex-end' : 'flex-start' }}>
                      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                  </motion.button>
                  
                  <motion.button
                    className="w-full py-5 px-6 flex items-center justify-between border-b-2 border-slate-100 transition-colors hover:bg-slate-50 active:bg-slate-100"
                    onClick={() => setSettings({ ...settings, enableGrid: !settings.enableGrid })}
                    disabled={isCapturing}
                  >
                    <span className="flex items-center gap-4 font-bold text-slate-700">
                      <div className={`p-2 rounded-xl ${settings.enableGrid ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Grid className="w-5 h-5" /></div>
                      Camera Grid
                    </span>
                    <div className={`flex w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.enableGrid ? 'bg-blue-500' : 'bg-slate-200'}`} style={{ justifyContent: settings.enableGrid ? 'flex-end' : 'flex-start' }}>
                      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                  </motion.button>

                  <motion.button
                    className="w-full py-5 px-6 flex items-center justify-between transition-colors hover:bg-slate-50 active:bg-slate-100"
                    onClick={() => setSettings({ ...settings, enableBeautyMode: !settings.enableBeautyMode })}
                    disabled={isCapturing}
                  >
                    <span className="flex items-center gap-4 font-bold text-slate-700">
                      <div className={`p-2 rounded-xl ${settings.enableBeautyMode ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Sparkles className="w-5 h-5" /></div>
                      Beauty Mode
                    </span>
                    <div className={`flex w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.enableBeautyMode ? 'bg-blue-500' : 'bg-slate-200'}`} style={{ justifyContent: settings.enableBeautyMode ? 'flex-end' : 'flex-start' }}>
                      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              {/* CAMERA & FLASH */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Camera & Flash</label>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`py-6 px-4 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-2 ${settings.facingMode === 'environment' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300'}`}
                    onClick={() => setSettings({ ...settings, facingMode: settings.facingMode === 'user' ? 'environment' : 'user' })}
                    disabled={isCapturing}
                  >
                    <div className={`p-4 rounded-2xl ${settings.facingMode === 'environment' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                      <SwitchCamera className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold">Switch Lens</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`py-6 px-4 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-2 ${settings.enableFlash ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300'}`}
                    onClick={() => setSettings({ ...settings, enableFlash: !settings.enableFlash })}
                    disabled={isCapturing}
                  >
                    <div className={`p-4 rounded-2xl ${settings.enableFlash ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-400'}`}>
                      {settings.enableFlash ? <Zap className="w-7 h-7 fill-current" /> : <ZapOff className="w-7 h-7" />}
                    </div>
                    <span className="text-sm font-bold">Studio Flash</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* ASPECT RATIO */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`py-6 px-4 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-2 ${settings.aspectRatio === 'portrait' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300'}`}
                    onClick={() => setSettings({ ...settings, aspectRatio: 'portrait' })}
                    disabled={isCapturing}
                  >
                    <div className={`p-4 rounded-2xl ${settings.aspectRatio === 'portrait' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <div className="w-5 h-7 border-[3px] border-current rounded-md"></div>
                    </div>
                    <span className="text-sm font-bold">Portrait</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`py-6 px-4 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all border-2 ${settings.aspectRatio === 'landscape' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300'}`}
                    onClick={() => setSettings({ ...settings, aspectRatio: 'landscape' })}
                    disabled={isCapturing}
                  >
                    <div className={`p-4 rounded-2xl ${settings.aspectRatio === 'landscape' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <div className="w-7 h-5 border-[3px] border-current rounded-md"></div>
                    </div>
                    <span className="text-sm font-bold">Landscape</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* IMAGE ORIENTATION */}
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase">Image Orientation</label>
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
                  <motion.button
                    className="w-full py-5 px-6 flex items-center justify-between transition-colors hover:bg-slate-50 active:bg-slate-100"
                    onClick={() => setSettings({ ...settings, isMirrored: !settings.isMirrored })}
                    disabled={isCapturing}
                  >
                    <span className="flex items-center gap-4 font-bold text-slate-700">
                      <div className={`p-2 rounded-xl ${settings.isMirrored ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><FlipHorizontal className="w-5 h-5" /></div>
                      Mirror Selfie
                    </span>
                    <div className={`flex w-12 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.isMirrored ? 'bg-blue-500' : 'bg-slate-200'}`} style={{ justifyContent: settings.isMirrored ? 'flex-end' : 'flex-start' }}>
                      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                  </motion.button>
                  <div className="px-6 pb-5 pt-1">
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      When enabled, the final photo will match exactly what you see in the mirror preview. 
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* FILTERS TAB */}
          {activeTab === 'filters' && (
            <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
              <FilterSelector
                filters={filters}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                isCapturing={isCapturing}
                contrast={contrast}
                setContrast={setContrast}
                brightness={brightness}
                setBrightness={setBrightness}
                saturation={saturation}
                setSaturation={setSaturation}
                resetAdvancedSettings={resetAdvancedSettings}
                videoRef={videoRef}
                isMirrored={settings.isMirrored}
              />
            </div>
          )}

          {/* AR TAB */}
          {activeTab === 'ar' && (
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-6"
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}>
                <label className="block text-slate-400 font-black mb-3 text-[11px] tracking-[0.15em] uppercase flex items-center justify-between">
                  <span>AR Filters</span>
                  {settings.selectedARFilter !== 'none' && !isModelLoaded && <span className="text-[10px] text-sky-500 animate-pulse bg-sky-50 px-2 py-0.5 rounded-full">Loading AI...</span>}
                </label>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 mb-6 text-sm font-bold rounded-2xl transition-colors border-2 ${settings.selectedARFilter === 'none' ? 'bg-blue-500 text-white border-blue-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  onClick={() => setSettings({ ...settings, selectedARFilter: 'none' })}
                  disabled={isCapturing}
                >
                  No Filter
                </motion.button>
              </motion.div>

              <div className="space-y-4">
                {[
                  {
                    name: "Headwear",
                    items: [
                      { id: "cat_ears", name: "Cat Ears", icon: Smile },
                      { id: "crown", name: "Crown", icon: Crown },
                      { id: "angel_halo", name: "Angel Halo", icon: Sparkles },
                      { id: "star_halo", name: "Star Halo", icon: Star },
                      { id: "devil_horns", name: "Devil Horns", icon: Flame },
                      { id: "frog_hat", name: "Frog Hat", icon: Smile },
                      { id: "sprout", name: "Sprout", icon: Leaf },
                      { id: "bday_hat", name: "Party Hat", icon: PartyPopper },
                      { id: "bunny_ears", name: "Bunny Ears", icon: Smile }
                    ]
                  },
                  {
                    name: "Eyewear",
                    items: [
                      { id: "thug_life", name: "Thug Life", icon: Glasses },
                      { id: "harry_potter", name: "Wizard Glasses", icon: Glasses },
                      { id: "star_glasses", name: "Star Glasses", icon: Star },
                      { id: "heart_eyes", name: "Heart Eyes", icon: Heart },
                      { id: "nerd_glasses", name: "Nerd Glasses", icon: Glasses }
                    ]
                  },
                  {
                    name: "Face & Makeup",
                    items: [
                      { id: "pirate_patch", name: "Pirate Patch", icon: EyeOff },
                      { id: "mustache", name: "Mustache", icon: Scissors },
                      { id: "cat_whiskers", name: "Cat Whiskers", icon: Smile },
                      { id: "blush", name: "Anime Blush", icon: Sparkles },
                      { id: "freckles", name: "Freckles", icon: LayoutGrid }
                    ]
                  },
                  {
                    name: "Frames",
                    items: [
                      { id: "frame_camcorder", name: "Camcorder", icon: Video },
                      { id: "frame_polaroid", name: "Polaroid", icon: ImageIcon },
                      { id: "frame_y2k", name: "Y2K Stars", icon: Sparkles }
                    ]
                  }
                ].map((category) => (
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' } } }}
                    key={category.name} 
                    className={`rounded-3xl border-2 overflow-hidden bg-white shadow-sm transition-colors ${expandedARCategory === category.name ? 'border-slate-300' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <button 
                      className="w-full flex items-center justify-between p-5"
                      onClick={() => setExpandedARCategory(expandedARCategory === category.name ? '' : category.name)}
                    >
                      <h4 className={`font-black text-[11px] tracking-[0.2em] uppercase transition-colors ${expandedARCategory === category.name ? 'text-slate-800' : 'text-slate-500'}`}>
                        {category.name}
                      </h4>
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${expandedARCategory === category.name ? 'bg-slate-100 text-slate-600' : 'bg-slate-200/50 text-slate-400'}`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expandedARCategory === category.name ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {expandedARCategory === category.name && (
                        <motion.div 
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                          }}
                          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        >
                          <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-1">
                            {category.items.map((f) => {
                              const Icon = f.icon;
                              const isActive = settings.selectedARFilter === f.id;
                              return (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  key={f.id}
                                  className={`py-4 px-3 flex flex-col items-center justify-center gap-3 text-xs font-bold rounded-2xl border-2 transition-colors ${isActive ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                                  onClick={() => setSettings({ ...settings, selectedARFilter: f.id })}
                                  disabled={isCapturing}
                                >
                                  <Icon className={`w-6 h-6 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} strokeWidth={1.75} />
                                  <span className="text-center">{f.name}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* BACKGROUNDS TAB */}
          {activeTab === 'backgrounds' && (
            <div className="flex-1 overflow-y-auto p-6 hide-scrollbar space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="text-slate-400 font-bold mb-3 text-xs tracking-widest uppercase flex items-center justify-between">
                  <span>Virtual Background</span>
                  {settings.virtualBackground !== 'none' && !isSegmenterLoaded && <span className="text-[10px] text-sky-500 animate-pulse bg-sky-50 px-2 py-0.5 rounded-full">Loading AI...</span>}
                </label>
                <button
                  className={`w-full py-3 mb-6 text-sm font-bold ${settings.virtualBackground === 'none' ? 'theme-btn shadow-sm' : 'theme-btn-secondary'}`}
                  onClick={() => setSettings({ ...settings, virtualBackground: 'none' })}
                  disabled={isCapturing}
                >
                  No Background
                </button>

                <div className="grid grid-cols-2 gap-3 pb-4">
                  {[
                    { id: 'bg_white', name: 'Studio White', color: '#ffffff' },
                    { id: 'bg_black', name: 'Studio Black', color: '#111111', textColor: 'text-white' },
                    { id: 'bg_pink', name: 'Pastel Pink', color: '#fdf2f8' },
                    { id: 'bg_blue', name: 'Sky Blue', color: '#f0f9ff' },
                    { id: 'bg_green', name: 'Chroma Green', color: '#00ff00' },
                    { id: 'bg_y2k', name: 'Y2K Gradient', class: 'bg-gradient-to-tr from-fuchsia-300 via-purple-300 to-cyan-300' },
                    { id: 'bg_checkers', name: 'Checkers', class: 'bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0iI2YxZjVmOSIvPjxwYXRoIGQ9Ik0yMCAyMGgyMHYyMEgyMHoiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zz4=\')]' },
                    { id: 'bg_grid', name: 'Retro Grid', class: 'bg-blue-600 bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDIwaDIwVjBoLTIwdjIweiIgc3Ryb2tlPSIjMjU2M2ViIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=\')]', textColor: 'text-white' },
                    // Custom image backgrounds
                    ...Array.from({ length: 11 }, (_, i) => ({
                      id: `custom_bg (${i + 1})`,
                      name: `Theme ${i + 1}`,
                      image: `/segment_bg/custom_bg (${i + 1}).jpg`,
                      textColor: 'text-white drop-shadow-md'
                    }))
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      className={`relative overflow-hidden h-24 rounded-2xl border-4 transition-all ${settings.virtualBackground === bg.id ? 'border-emerald-500 shadow-lg scale-[1.02]' : 'border-slate-200 hover:border-emerald-300'} ${bg.class || ''}`}
                      style={{
                        ...(bg.color ? { backgroundColor: bg.color } : {}),
                        ...(bg.image ? { backgroundImage: `url('${bg.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
                      }}
                      onClick={() => setSettings({ ...settings, virtualBackground: bg.id })}
                      disabled={isCapturing}
                    >
                      <div className={`absolute inset-0 flex items-center justify-center font-black text-xs ${bg.textColor || 'text-slate-800'}`}>
                        {bg.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}



        </div>
        
        {/* Bleed element to cover gap when dragging up on mobile */}
        <div className="absolute top-full left-0 right-0 h-[50vh] bg-white/95 backdrop-blur-3xl lg:hidden" />
      </motion.div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Render Store Modal */}
      {/* AR Filters are now fully built-in, no store modal needed */}
    </motion.div>
  );
};

export default CameraView;
