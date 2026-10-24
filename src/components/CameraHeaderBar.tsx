
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CameraHeaderBarProps {
  onBack: () => void;
  currentPhotoIndex: number;
  totalPhotos: number;
}

const CameraHeaderBar = ({
  onBack,
  currentPhotoIndex,
  totalPhotos,
}: CameraHeaderBarProps) => (
  <div className="flex w-full items-center justify-between lg:justify-start lg:gap-8 mb-1">
    {/* Left Column (Matches Thumbnails Width) / Back Button */}
    <div className="lg:w-28 flex-shrink-0 flex items-center">
      <button
        onClick={onBack}
        className="theme-btn p-3 lg:px-4 lg:py-2 text-sm flex items-center shadow-md rounded-full lg:rounded-2xl"
      >
        <ArrowLeft className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
        <span className="hidden lg:inline">Back</span>
      </button>
    </div>
    
    {/* Center Column (Matches Camera Preview Width) / Photo Counter */}
    <div className="flex-shrink-0 lg:flex-1 flex items-center justify-center">
      <div className="font-extrabold text-sm lg:text-xl uppercase tracking-wider theme-card px-4 py-2 bg-white/90 backdrop-blur-sm whitespace-nowrap shadow-md">
        <span className="hidden lg:inline">Photo </span>{currentPhotoIndex + 1} / {totalPhotos}
      </div>
    </div>
  </div>
);

export default CameraHeaderBar;
