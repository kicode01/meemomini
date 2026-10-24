import React from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center">
      
      {/* Background that fades out */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        className="absolute inset-0 bg-slate-50"
      />

      <motion.div 
        layoutId="main-logo"
        className="absolute flex items-center gap-3 md:gap-4 lg:gap-6 z-10"
      >
        <img src="/meemomini_front.png" alt="logo" className="h-12 sm:h-16 md:h-24 lg:h-32 w-auto object-contain drop-shadow-sm" />
        <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-8xl font-outfit font-black tracking-tighter text-[#0b0c10] leading-none pt-1 md:pt-2">
          meemomini<span className="animate-rainbow-text">.</span>
        </h1>
      </motion.div>

      {/* Start Button that fades out */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="absolute mt-48 sm:mt-64 md:mt-80 lg:mt-[22rem] z-10"
      >
        <button 
          onClick={onComplete}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
          }}
          className="rainbow-btn py-5 px-12 md:px-16 text-xl md:text-2xl flex items-center justify-center group shadow-2xl shadow-pink-500/30 w-[240px] md:w-[280px]"
        >
          <div className="relative h-8 flex items-center justify-center w-full">
             <span className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-100 transform group-hover:-translate-y-4 group-hover:opacity-0 whitespace-nowrap">
               start photobooth
             </span>
             <span className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-0 transform translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 group-hover:animate-cheese whitespace-nowrap">
               say cheese!
             </span>
          </div>
        </button>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
