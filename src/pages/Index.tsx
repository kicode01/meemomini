import React, { useEffect, Suspense, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { AnimatePresence, motion } from 'framer-motion';
import WelcomeScreen from '@/components/WelcomeScreen';
import LayoutSelectScreen from '@/components/LayoutSelectScreen';
import CameraView from '@/components/CameraView';

const StudioScreen = React.lazy(() => import('@/components/StudioScreen'));
const Gallery = React.lazy(() => import('@/pages/Gallery'));

// Re-export these types so that existing components don't break until we refactor them
export type PhotoSettings = {
  layout: 'strip' | 'grid' | 'strip-horizontal';
  photoCount: number;
  frameColor: string;
  frameStyle: string;
  countdownDuration: number;
  selectedFilter: string;
  enableAudio: boolean;
  enableGrid: boolean;
  framePattern: string;
  patternColor: string;
  stripBg: string;
  captureMode: 'classic' | 'boomerang';
  facingMode: 'user' | 'environment';
  isMirrored: boolean;
  enableFlash: boolean;
  enableBeautyMode: boolean;
  virtualBackground: string;
  selectedARFilter: string;
  beautificationIntensity: number;
  customGltfUrl: string;
  exportQuality?: 'hd' | 'fast';
  aspectRatio: 'landscape' | 'portrait';
  showDate?: boolean;
  showCaption?: boolean;
  customCaption?: string;
  captionFont?: string;
  captionSize?: number;
  captionColor?: 'black' | 'white';
  showWatermark?: boolean;
  watermarkPlacement?: 'left' | 'center' | 'right';
  watermarkColor?: 'black' | 'white';
  activeStudioTab?: 'decorate' | 'layout' | 'export';
  hasUserSelectedLayout?: boolean;
};

export type CapturedPhoto = {
  id: string;
  dataUrl: string;
  timestamp: number;
  videoUrl?: string;
  overlayUrl?: string; // transparent PNG containing user-drawn stickers/drawings
  isBoomerang?: boolean;
  frames?: string[]; // array of data URLs for the boomerang animation
};

const Index = () => {
  const appState = useStore(state => state.appState) as 'welcome' | 'camera' | 'studio' | 'gallery';
  const theme = useStore((state) => state.theme);
  const setAppState = useStore((state) => state.setAppState);
  const isMobilePanelOpen = useStore((state) => state.isMobilePanelOpen);
  const returnStateRef = useRef(appState);

  // Track the previous state to know where to return from the gallery
  useEffect(() => {
    if (appState !== 'gallery') {
      returnStateRef.current = appState;
    }
  }, [appState]);

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen relative">
      <AnimatePresence>
        {appState !== 'welcome' && (
          <motion.div 
            layoutId="main-logo" 
            exit={{ opacity: 0, transition: { duration: 0.01, delay: 0.6 } }}
            className="absolute top-4 left-4 lg:top-8 lg:left-8 z-[100] flex items-center gap-2 lg:gap-3 pointer-events-none"
          >
            <img src="/meemomini_front.png" alt="logo" className="h-8 lg:h-10 w-auto object-contain pointer-events-auto" />
            <h1 className="text-2xl lg:text-3xl font-black tracking-tighter text-[#0b0c10] leading-none pt-1 pointer-events-auto">
              meemomini<span className="animate-rainbow-text">.</span>
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}>
        <AnimatePresence mode="wait">
          {appState === 'welcome' && (
            <WelcomeScreen key="welcome" onComplete={() => setAppState('camera')} />
          )}
          {appState === 'camera' && <CameraView key="camera" />}
          {appState === 'studio' && <StudioScreen key="studio" />}
          {appState === 'gallery' && <Gallery key="gallery" onBack={() => setAppState(returnStateRef.current === 'welcome' ? 'camera' : returnStateRef.current)} />}
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

export default Index;
