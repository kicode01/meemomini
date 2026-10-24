import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Smile, Laugh, Meh, Annoyed, Frown, Angry, Sparkles, Star, Heart, 
  Aperture, Focus, Zap, PartyPopper, Crown, Glasses, Ticket, Scissors, 
  Image as ImageIcon, Clapperboard, Palette, Gem, Gift, Music, Wand, 
  Cat, Dog, Rabbit, Moon, Sun, Cloud, Flame, Bomb
} from "lucide-react";

interface CaptureButtonProps {
  onClick: () => void;
  isCapturing: boolean;
  disabled: boolean;
}

const ICONS = [
  Smile, Laugh, Meh, Annoyed, Frown, Angry, Sparkles, Star, Heart, 
  Aperture, Focus, Zap, PartyPopper, Crown, Glasses, Ticket, Scissors, 
  ImageIcon, Clapperboard, Palette, Gem, Gift, Music, Wand, 
  Cat, Dog, Rabbit, Moon, Sun, Cloud, Flame, Bomb
];

const CaptureButton = ({
  onClick,
  isCapturing,
  disabled,
}: CaptureButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    if (isHovered && !isCapturing && !disabled) {
      const interval = setInterval(() => {
        setIconIndex(prev => {
          let next = Math.floor(Math.random() * ICONS.length);
          if (next === prev) next = (next + 1) % ICONS.length;
          return next;
        });
      }, 80); // Extremely fast for that chaotic, explosive feel
      return () => clearInterval(interval);
    }
  }, [isHovered, isCapturing, disabled]);

  return (
    <motion.button
      layout
      onPointerDown={(e) => {
        if (!disabled) onClick();
      }}
      disabled={disabled}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={false}
      animate={{
        width: isCapturing ? 200 : 64,
        height: 64,
        scale: isCapturing ? 1 : (isHovered && !disabled ? 1.25 : 1),
      }}
      transition={{
        layout: { type: "spring", bounce: 0.2, duration: 0.6 },
        scale: isHovered && !disabled && !isCapturing 
          ? { ease: "linear", duration: 5 }
          : { type: "spring", bounce: 0.4, duration: 0.4 }
      }}
      className={`relative overflow-hidden shadow-2xl border border-white/30 backdrop-blur-xl flex items-center justify-center bg-black/50 text-white disabled:pointer-events-none rounded-full ${
        disabled && !isCapturing ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Gradient background that fades in on hover AND stays during capture */}
      <motion.div 
        initial={false}
        animate={{ opacity: (isHovered || isCapturing) && !disabled ? 1 : 0 }}
        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 z-0" 
      />
      
      {/* Flashing Emojis - Absolutely positioned over the camera icon, visible on hover */}
      <motion.div 
        animate={{ 
          opacity: isHovered && !isCapturing && !disabled ? 1 : 0,
          scale: isHovered && !isCapturing && !disabled ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      >
        {(() => {
          const ActiveIcon = ICONS[iconIndex];
          return <ActiveIcon className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] text-white origin-center scale-110" />;
        })()}
      </motion.div>

      {/* Main Content Container (Camera Icon + Text) */}
      <motion.div layout className="relative z-20 flex items-center justify-center gap-3">
        {/* Camera Icon - Fades out on hover OR during capture */}
        <AnimatePresence>
          {!isCapturing && (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.5, width: 0 }}
              animate={{ 
                opacity: isHovered && !disabled ? 0 : 1,
                scale: isHovered && !disabled ? 0.5 : 1,
                width: "auto"
              }}
              exit={{ opacity: 0, scale: 0.5, width: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center overflow-hidden"
            >
              <Camera className="w-8 h-8 text-white flex-shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capturing Text - Expands out smoothly next to the camera icon */}
        <AnimatePresence>
          {isCapturing && (
            <motion.span 
              layout
              initial={{ opacity: 0, width: 0, scale: 0.8 }}
              animate={{ opacity: 1, width: "auto", scale: 1 }}
              exit={{ opacity: 0, width: 0, scale: 0.8 }}
              className="font-black tracking-widest lowercase text-base md:text-lg text-white whitespace-nowrap overflow-hidden animate-pulse"
            >
              capturing...
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
};

export default CaptureButton;
