import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGalleryItemById, GalleryItem } from '@/hooks/useGallery';
import { motion, AnimatePresence } from 'framer-motion';
import { CaptureStripDisplay } from '@/components/CaptureStripDisplay';
import { ZoomContainer } from '@/components/ZoomContainer';

const Share = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'image-strip' | 'video-strip' | 'clips'>('image-strip');

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      const data = await getGalleryItemById(id);
      setItem(data);
      if (data) {
        if (data.sessionData || data.imageUrl) setActiveTab('image-strip');
        else if (data.videoUrl) setActiveTab('video-strip');
        else if (data.gifUrl) setActiveTab('clips');
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  const parsedSessionData = React.useMemo(() => {
    if (item?.sessionData) {
      try {
        return JSON.parse(item.sessionData);
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
    return null;
  }, [item]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-6">
        <h1 className="text-2xl font-black text-slate-800 mb-4">Media Not Found</h1>
        <p className="text-slate-500 mb-8 text-center">The memory you are looking for doesn't exist or has expired.</p>
        <Link to="/" className="bg-blue-500 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-blue-400">
          Go to Booth
        </Link>
      </div>
    );
  }

  const hasImage = !!parsedSessionData || !!item.imageUrl;
  const hasVideo = !!parsedSessionData || !!item.videoUrl;
  const hasClips = !!item.gifUrl;

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100 font-sans overflow-hidden">
      
      {/* Top Bar: Logo + Tabs inline */}
      <div className="shrink-0 flex flex-col items-center pt-3 pb-1 gap-1.5">
        <div className="flex items-center gap-2">
          <img src="/meemomini_front.png" alt="logo" className="h-6 w-auto object-contain" />
          <span className="text-lg font-black tracking-tighter text-[#0b0c10] leading-none">
            meemomini<span className="animate-rainbow-text">.</span>
          </span>
        </div>
        <div className="bg-black/5 backdrop-blur-md p-0.5 rounded-full flex gap-0.5">
          <button
            onClick={() => setActiveTab('image-strip')}
            disabled={!hasImage}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'image-strip' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : !hasImage ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            Image
          </button>
          <button
            onClick={() => setActiveTab('video-strip')}
            disabled={!hasVideo}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'video-strip' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : !hasVideo ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setActiveTab('clips')}
            disabled={!hasClips}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'clips' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : !hasClips ? 'opacity-30 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            Clips
          </button>
        </div>
      </div>

      {/* Media — fills all remaining space */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'image-strip' && parsedSessionData && (
            <motion.div
              key="dynamic-image"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full absolute inset-0 flex justify-center"
            >
              <ZoomContainer allowScaleUp>
              <CaptureStripDisplay
                photos={parsedSessionData.photos}
                settings={parsedSessionData.settings}
                showDate={parsedSessionData.showDate}
                showCaption={parsedSessionData.showCaption}
                customCaption={parsedSessionData.customCaption}
                captionFont={parsedSessionData.captionFont}
                nowStr={parsedSessionData.nowStr}
                stickers={parsedSessionData.stickers}
                previewMode="image-strip"
                isStripBackgroundVisible={true}
                isFlightActive={false}
                activeTab="export"
                showWatermark={parsedSessionData.showWatermark}
                watermarkPlacement={parsedSessionData.watermarkPlacement}
                onReorder={() => {}}
                restartAnimation={() => {}}
                fullyRevealed={true}
              />
              </ZoomContainer>
            </motion.div>
          )}

          {activeTab === 'image-strip' && !parsedSessionData && item.imageUrl && (
            <motion.div
              key="static-image"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              <img src={item.imageUrl} alt="Image Strip" className="max-h-full max-w-full object-contain rounded-xl shadow-lg" />
            </motion.div>
          )}

          {activeTab === 'video-strip' && parsedSessionData && (
            <motion.div
              key="dynamic-video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full absolute inset-0 flex justify-center"
            >
              <ZoomContainer allowScaleUp>
              <CaptureStripDisplay
                photos={parsedSessionData.photos}
                settings={parsedSessionData.settings}
                showDate={parsedSessionData.showDate}
                showCaption={parsedSessionData.showCaption}
                customCaption={parsedSessionData.customCaption}
                captionFont={parsedSessionData.captionFont}
                nowStr={parsedSessionData.nowStr}
                stickers={parsedSessionData.stickers}
                previewMode="video-strip"
                isStripBackgroundVisible={true}
                isFlightActive={false}
                activeTab="export"
                showWatermark={parsedSessionData.showWatermark}
                watermarkPlacement={parsedSessionData.watermarkPlacement}
                onReorder={() => {}}
                restartAnimation={() => {}}
                fullyRevealed={false}
              />
              </ZoomContainer>
            </motion.div>
          )}

          {activeTab === 'video-strip' && !parsedSessionData && item.videoUrl && (
            <motion.div
              key="static-video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              <video src={item.videoUrl} controls autoPlay loop playsInline className="max-h-full max-w-full object-contain rounded-xl shadow-lg bg-slate-900" />
            </motion.div>
          )}

          {activeTab === 'clips' && item.gifUrl && (
            <motion.div
              key="clips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full flex items-center justify-center p-4"
            >
              <img src={item.gifUrl} alt="Clips GIF" className="max-h-full max-w-full object-contain rounded-xl shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="shrink-0 flex items-center justify-center pb-4 pt-1">
        <Link
          to="/"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
          }}
          className="rainbow-btn py-2.5 px-8 text-sm flex items-center justify-center group shadow-lg shadow-pink-500/15 w-[200px]"
        >
          <div className="relative h-5 flex items-center justify-center w-full">
            <span className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-100 transform group-hover:-translate-y-3 group-hover:opacity-0 whitespace-nowrap">
              try meemomini<span className="animate-rainbow-text">.</span>
            </span>
            <span className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-0 transform translate-y-3 group-hover:translate-y-0 group-hover:opacity-100 group-hover:animate-cheese whitespace-nowrap">
              try meemomini!
            </span>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default Share;
