import { create } from 'zustand';
import { CapturedPhoto, PhotoSettings } from '../pages/Index';

type AppState = 'welcome' | 'camera' | 'studio' | 'gallery';
type Theme = 'cartoony' | 'glass';

interface StoreState {
  appState: AppState;
  theme: Theme;
  settings: PhotoSettings;
  capturedPhotos: CapturedPhoto[];
  retakeIndex: number | null;
  isMobilePanelOpen: boolean;
  
  // Actions
  setAppState: (state: AppState) => void;
  setTheme: (theme: Theme) => void;
  setSettings: (settings: PhotoSettings) => void;
  setCapturedPhotos: (photos: CapturedPhoto[]) => void;
  setRetakeIndex: (index: number | null) => void;
  replacePhoto: (index: number, newPhoto: CapturedPhoto) => void;
  setIsMobilePanelOpen: (isOpen: boolean) => void;
  resetSession: () => void;
}

const defaultSettings: PhotoSettings = {
  layout: 'strip',
  photoCount: 2,
  frameColor: 'none',
  frameStyle: 'standard',
  patternColor: '#000000',
  stripBg: '#ffffff',
  countdownDuration: 2,
  selectedFilter: 'none',
  enableAudio: true,
  enableGrid: false,
  framePattern: 'none',
  captureMode: 'classic',
  facingMode: 'user',
  isMirrored: true,
  hasUserSelectedLayout: false,
  enableFlash: false,
  selectedARFilter: 'none',
  virtualBackground: 'none',
  beautificationIntensity: 1.0,
  customGltfUrl: '',
  enableBeautyMode: false,
  exportQuality: 'hd',
  aspectRatio: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'portrait' : 'landscape',
  showDate: false,
  showCaption: false,
  customCaption: '',
  captionFont: 'font-sans',
  captionSize: 1.0,
  captionColor: 'black',
  showWatermark: true,
  watermarkPlacement: 'center',
  watermarkColor: 'black',
  activeStudioTab: 'decorate',
};

export const useStore = create<StoreState>((set) => ({
  appState: 'welcome',
  theme: 'cartoony', // default theme
  settings: defaultSettings,
  capturedPhotos: [],
  retakeIndex: null,
  isMobilePanelOpen: false,
  
  setAppState: (state) => set({ appState: state }),
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  },
  setSettings: (newSettings) => set((state) => {
    const isChangingLayout = newSettings.layout !== state.settings.layout;
    const isChangingPhotoCount = newSettings.photoCount !== state.settings.photoCount;
    
    let finalSettings = { ...newSettings };
    
    // If layout is explicitly changed, mark it as user selected
    if (isChangingLayout) {
      finalSettings.hasUserSelectedLayout = true;
    }
    
    // If photo count changes and user hasn't explicitly set layout, auto-update layout
    if (isChangingPhotoCount && !finalSettings.hasUserSelectedLayout) {
      finalSettings.layout = newSettings.photoCount >= 4 ? 'grid' : 'strip';
    }
    
    return { settings: finalSettings };
  }),
  setCapturedPhotos: (photos) => set({ capturedPhotos: photos }),
  setRetakeIndex: (index) => set({ retakeIndex: index }),
  setIsMobilePanelOpen: (isOpen) => set({ isMobilePanelOpen: isOpen }),
  replacePhoto: (index, newPhoto) => set((state) => {
    const newPhotos = [...state.capturedPhotos];
    newPhotos[index] = newPhoto;
    return { capturedPhotos: newPhotos };
  }),
  resetSession: () => set({ 
    appState: 'camera',
    capturedPhotos: [],
    retakeIndex: null,
    // We intentionally don't reset settings so they persist between sessions!
  }),
}));
