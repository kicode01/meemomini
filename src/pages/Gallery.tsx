import React, { useState } from "react";
import { useGallery, GalleryItem } from "@/hooks/useGallery";
import { motion } from "framer-motion";
import { isFirebaseConfigured } from "@/lib/firebase";

import { Camera, ArrowLeft, Images, AlertCircle, Play } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Gallery({ onBack }: { onBack: () => void }) {
  const { items, loading } = useGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative h-[100dvh] w-full flex flex-col overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-pink-50/30 z-0"
      />

      <div className="flex-1 relative flex flex-col p-4 lg:p-8 overflow-hidden h-full min-h-0 z-10">
        {/* Top Header - Matches CameraView/StudioScreen exactly */}
        <div className="flex items-center justify-end mb-2 lg:mb-4 h-8 lg:h-10">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-white/90 text-slate-700 rounded-full font-bold text-[11px] uppercase tracking-widest shadow-sm border border-black/5 transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-1 transition-transform duration-300" />
            BACK TO BOOTH
          </button>
        </div>

        <div className="text-center mb-6 lg:mb-10 shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-block"
          >
            <div className="font-extrabold text-xl lg:text-2xl uppercase tracking-wider theme-card px-8 py-3 bg-white text-slate-800">
              Event Gallery
            </div>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-sm lg:text-base font-semibold max-w-xl mx-auto mt-6"
          >
            All the magic moments captured today. Relive the memories, download your favorite snaps, and play back your boomerangs!
          </motion.p>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar w-full flex flex-col items-center pb-8 min-h-0">
          <div className="w-full max-w-7xl">

        {!isFirebaseConfigured() && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 max-w-2xl mx-auto p-4 bg-orange-500/10 backdrop-blur-md border border-orange-500/20 text-orange-700 font-bold text-center rounded-2xl shadow-sm flex items-center justify-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Firebase not configured. Showing locally saved photos.
          </motion.div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-6">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
            <div className="text-slate-400 font-bold text-xl animate-pulse">
              Curating your gallery...
            </div>
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-64 text-center mt-10"
          >
            <div className="w-32 h-32 mb-8 rounded-full bg-white shadow-xl shadow-blue-500/10 flex items-center justify-center">
              <Images className="w-16 h-16 text-blue-300" />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-2">It's a little quiet here</div>
            <div className="text-lg font-medium text-slate-400">Head back to the booth and take the first photo!</div>
          </motion.div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-8 space-y-8 pb-20"
          >
            {items.map((item) => {
              return (
              <motion.div 
                key={item.id} 
                variants={itemAnim}
                className="break-inside-avoid relative group mb-8"
              >
                {/* Sleek Polaroid Frame */}
                <div className="bg-white p-3 pb-8 md:p-4 md:pb-10 rounded-[1.5rem] shadow-sm border border-black/5 transform transition-all duration-500 hover:z-50 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10">
                  <div className="relative rounded-[1rem] overflow-hidden mb-4 bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.caption || "Photobooth moment"}
                      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Hover Overlay for Boomerang */}
                    {item.videoUrl && (
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-16 h-16 bg-white border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900 rounded-full flex items-center justify-center transform transition-transform hover:scale-110 active:translate-y-1 active:shadow-none"
                        >
                          <Play className="w-8 h-8 ml-1" fill="currentColor" />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Fallback Boomerang button for mobile without hover */}
                  {item.videoUrl && (
                    <div className="mt-5 lg:hidden">
                      <a
                         href={item.videoUrl}
                         target="_blank"
                         rel="noreferrer"
                         className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold bg-slate-800 text-white rounded-xl active:scale-95 transition-all"
                      >
                         <Play className="w-3.5 h-3.5" fill="currentColor" /> Play Video
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </motion.div>
        )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
