
import React from "react";
import { PhotoSettings } from "@/pages/Index";
import { getFrameColor } from "@/utils/StripGenerator";
import { PATTERN_LIST, getPatternCss } from "@/utils/Patterns";

interface PhotoStripFrameProps {
  width?: number;
  children: React.ReactNode;
  captionArea?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  childrenClassName?: string;
  childrenStyle?: React.CSSProperties;
  settings?: PhotoSettings;
}

const FRAME_WIDTH = 320;
const BORDER_RADIUS = 20;
const BORDER_WIDTH = 6;

const PhotoStripFrame: React.FC<PhotoStripFrameProps> = ({
  width = FRAME_WIDTH,
  children,
  captionArea,
  style,
  className = "",
  childrenClassName = "flex flex-col items-center w-full z-10",
  childrenStyle = {},
  settings,
}) => {
  const bgColor = settings ? getFrameColor(settings.frameColor) : "#fff";
  const isFilm = settings?.frameStyle === 'film';
  return (
  <div
    className={`mx-auto relative border rounded-2xl shadow-2xl flex flex-col items-center ${className} ${isFilm ? 'text-white' : ''}`}
    style={{
      width: width,
      backgroundColor: isFilm ? '#18181b' : bgColor,
      backgroundImage: settings?.framePattern && settings.framePattern !== 'none' && !isFilm ? getPatternCss(settings.framePattern, settings.patternColor) : 'none',
      border: isFilm ? 'none' : `${BORDER_WIDTH}px solid #ccc`,
      borderRadius: BORDER_RADIUS,
      boxShadow: "0 6px 30px #0004",
      padding: "18px 0 0 0",
      ...style,
    }}
    data-testid="photo-strip-frame"
  >
    <div className={childrenClassName} style={childrenStyle}>{children}</div>
    {captionArea && (
      <div
        className="w-full flex flex-col items-center justify-center pb-2 pt-4 z-10"
        style={{ minHeight: 60 }}
      >
        {captionArea}
      </div>
    )}

    {/* Film Roll Sprocket Holes */}
    {isFilm && (
      <>
        <div className="absolute top-0 bottom-0 left-2 w-3 flex flex-col justify-around py-4 z-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`l-${i}`} className="w-2.5 h-3.5 bg-[#eaeaea] rounded-[2px] shadow-inner opacity-80" />
          ))}
        </div>
        <div className="absolute top-0 bottom-0 right-2 w-3 flex flex-col justify-around py-4 z-0">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={`r-${i}`} className="w-2.5 h-3.5 bg-[#eaeaea] rounded-[2px] shadow-inner opacity-80" />
          ))}
        </div>
      </>
    )}
  </div>
);
};

export default PhotoStripFrame;
