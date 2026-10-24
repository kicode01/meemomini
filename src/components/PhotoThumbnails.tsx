import React, { memo } from 'react';
import { CapturedPhoto } from "@/pages/Index";

interface PhotoThumbnailsProps {
  capturedPhotos: CapturedPhoto[];
  direction?: "row" | "col";
}

const PhotoThumbnails = memo(({ capturedPhotos }: PhotoThumbnailsProps) => {
  return (
    <div className="flex items-center flex-row lg:flex-col gap-2 lg:gap-3 w-full lg:w-auto h-full lg:h-auto overflow-x-auto lg:overflow-visible px-2 lg:px-0">
      {capturedPhotos.map((p, i) => (
        <div key={p.id} className="relative group flex-shrink-0">
          <img
            src={p.dataUrl}
            alt=""
            className="w-14 h-14 md:w-16 md:h-16 lg:w-24 lg:h-auto object-cover rounded-xl border-2 border-white shadow-md transform lg:group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-300 cursor-pointer"
          />
          <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
});

export default PhotoThumbnails;
