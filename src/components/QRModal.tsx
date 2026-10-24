import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function QRModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isLocal = !isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full p-8 border-2 border-slate-200 rounded-2xl shadow-xl relative transform transition-all">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white border border-slate-200 text-slate-500 w-10 h-10 rounded-full font-bold text-xl hover:bg-slate-100 hover:scale-110 transition-transform flex items-center justify-center shadow-sm"
        >
          X
        </button>
        
        <h2 className="text-3xl font-extrabold theme-title text-center uppercase mb-6">
          {isLocal ? "Local Test Mode" : "Scan Me!"}
        </h2>
        
        <div className="flex flex-col items-center justify-center bg-gray-100 p-6 rounded-xl border-4 border-gray-300">
          <QRCodeSVG value={url} size={256} level="H" />
        </div>
        
        {isLocal ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-center font-bold text-sm text-amber-600">
              Firebase is not configured. This QR code points to localhost and won't work on your phone.
            </p>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="bg-blue-500 text-white px-6 py-3 rounded-full font-black uppercase tracking-wider text-sm shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-[4px] transition-all text-center w-full block"
            >
              Open Share Page Locally
            </a>
          </div>
        ) : (
          <p className="text-center font-bold mt-6 text-lg text-gray-700">
            Point your phone's camera here to download your memory!
          </p>
        )}
      </div>
    </div>
  );
}
