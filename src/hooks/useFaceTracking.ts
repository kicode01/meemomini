import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { PhotoSettings } from '@/pages/Index';

// Pre-define our SVG AR props so we don't need to load external images
const AR_PROPS: Record<string, HTMLImageElement> = {};

const createPropImage = (svgString: string) => {
  const img = new window.Image();
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  return img;
};

// 1. Thug Life Glasses (pixelated sunglasses)
AR_PROPS['thug_life'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30">
    <rect x="0" y="5" width="10" height="5" fill="#000" />
    <rect x="10" y="5" width="30" height="15" fill="#000" />
    <rect x="20" y="20" width="10" height="5" fill="#000" />
    <rect x="40" y="5" width="20" height="5" fill="#000" />
    <rect x="60" y="5" width="30" height="15" fill="#000" />
    <rect x="70" y="20" width="10" height="5" fill="#000" />
    <rect x="90" y="5" width="10" height="5" fill="#000" />
    <rect x="15" y="5" width="5" height="5" fill="#fff" opacity="0.8"/>
    <rect x="65" y="5" width="5" height="5" fill="#fff" opacity="0.8"/>
  </svg>
`);

// 2. Cat Ears
AR_PROPS['cat_ears'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <polygon points="10,40 30,40 20,0" fill="#111" />
    <polygon points="15,35 25,35 20,15" fill="#f472b6" />
    <polygon points="70,40 90,40 80,0" fill="#111" />
    <polygon points="75,35 85,35 80,15" fill="#f472b6" />
  </svg>
`);

// 3. Royal Crown
AR_PROPS['crown'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60">
    <path d="M10,60 L90,60 L100,20 L75,40 L50,10 L25,40 L0,20 Z" fill="#fbbf24" />
    <circle cx="0" cy="15" r="5" fill="#ef4444" />
    <circle cx="25" cy="35" r="4" fill="#3b82f6" />
    <circle cx="50" cy="5" r="6" fill="#ef4444" />
    <circle cx="75" cy="35" r="4" fill="#3b82f6" />
    <circle cx="100" cy="15" r="5" fill="#ef4444" />
    <rect x="15" y="50" width="70" height="5" fill="#f59e0b" />
  </svg>
`);

// 4. Angel Halo
AR_PROPS['angel_halo'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <ellipse cx="50" cy="20" rx="40" ry="10" fill="none" stroke="#fbbf24" stroke-width="6" opacity="0.9" />
    <ellipse cx="50" cy="20" rx="36" ry="6" fill="none" stroke="#fff" stroke-width="2" opacity="0.8" />
  </svg>
`);

// 5. Devil Horns
AR_PROPS['devil_horns'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <path d="M20,40 Q10,10 30,0 Q25,20 35,40 Z" fill="#ef4444" />
    <path d="M80,40 Q90,10 70,0 Q75,20 65,40 Z" fill="#ef4444" />
  </svg>
`);

// 8. Wizard Glasses
AR_PROPS['harry_potter'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <circle cx="25" cy="20" r="18" fill="none" stroke="#111" stroke-width="4" />
    <circle cx="75" cy="20" r="18" fill="none" stroke="#111" stroke-width="4" />
    <line x1="43" y1="20" x2="57" y2="20" stroke="#111" stroke-width="4" />
  </svg>
`);

// 9. Bunny Ears
AR_PROPS['bunny_ears'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80">
    <path d="M20,80 C10,40 20,0 35,0 C45,0 40,40 40,80 Z" fill="#fff" stroke="#ddd" stroke-width="2"/>
    <path d="M25,75 C18,45 25,10 33,10 C38,10 35,45 35,75 Z" fill="#fbcfe8" />
    
    <path d="M80,80 C90,40 80,0 65,0 C55,0 60,40 60,80 Z" fill="#fff" stroke="#ddd" stroke-width="2"/>
    <path d="M75,75 C82,45 75,10 67,10 C62,10 65,45 65,75 Z" fill="#fbcfe8" />
  </svg>
`);

// 10. Heart Eyes
AR_PROPS['heart_eyes'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <path d="M30,28 L20,15 A6,6 0 0,1 30,8 A6,6 0 0,1 40,15 Z" fill="#ef4444" />
    <path d="M70,28 L60,15 A6,6 0 0,1 70,8 A6,6 0 0,1 80,15 Z" fill="#ef4444" />
  </svg>
`);

// 11. Pirate Patch
AR_PROPS['pirate_patch'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <path d="M-10,10 L110,30" stroke="#111" stroke-width="2" />
    <circle cx="70" cy="20" r="16" fill="#111" />
  </svg>
`);

// 12. Handlebar Mustache
AR_PROPS['mustache'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <path d="M20,20 Q40,0 50,15 Q60,0 80,20 Q95,35 80,35 Q60,35 50,25 Q40,35 20,35 Q5,35 20,20 Z" fill="#111" />
  </svg>
`);

// 13. Anime Blush
AR_PROPS['blush'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <ellipse cx="15" cy="25" rx="14" ry="8" fill="#f472b6" opacity="0.6" />
    <line x1="10" y1="22" x2="13" y2="28" stroke="#be185d" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    <line x1="15" y1="22" x2="18" y2="28" stroke="#be185d" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    <line x1="20" y1="22" x2="23" y2="28" stroke="#be185d" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    
    <ellipse cx="85" cy="25" rx="14" ry="8" fill="#f472b6" opacity="0.6" />
    <line x1="80" y1="22" x2="83" y2="28" stroke="#be185d" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    <line x1="85" y1="22" x2="88" y2="28" stroke="#be185d" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    <line x1="90" y1="22" x2="93" y2="28" stroke="#be185d" stroke-width="2" stroke-linecap="round" opacity="0.5" />
  </svg>
`);

// 14. Nerd Glasses
AR_PROPS['nerd_glasses'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <rect x="5" y="10" width="38" height="26" rx="4" fill="none" stroke="#111" stroke-width="6" />
    <rect x="57" y="10" width="38" height="26" rx="4" fill="none" stroke="#111" stroke-width="6" />
    <line x1="43" y1="20" x2="57" y2="20" stroke="#111" stroke-width="6" />
    <rect x="47" y="15" width="6" height="10" fill="#f8fafc" />
  </svg>
`);

// 15. Cat Whiskers
AR_PROPS['cat_whiskers'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <path d="M45,20 L55,20 L50,26 Z" fill="#f472b6" />
    <line x1="40" y1="20" x2="10" y2="15" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="23" x2="10" y2="23" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="26" x2="10" y2="31" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <line x1="60" y1="20" x2="90" y2="15" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <line x1="60" y1="23" x2="90" y2="23" stroke="#111" stroke-width="2" stroke-linecap="round"/>
    <line x1="60" y1="26" x2="90" y2="31" stroke="#111" stroke-width="2" stroke-linecap="round"/>
  </svg>
`);

// 14. Star Halo
AR_PROPS['star_halo'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60">
    <path d="M50,10 L52,18 L60,20 L52,22 L50,30 L48,22 L40,20 L48,18 Z" fill="#fbbf24" />
    <path d="M20,20 L21,25 L26,26 L21,27 L20,32 L19,27 L14,26 L19,25 Z" fill="#fef3c7" />
    <path d="M80,20 L81,25 L86,26 L81,27 L80,32 L79,27 L74,26 L79,25 Z" fill="#fef3c7" />
    <path d="M35,35 L36,40 L41,41 L36,42 L35,47 L34,42 L29,41 L34,40 Z" fill="#fcd34d" />
    <path d="M65,35 L66,40 L71,41 L66,42 L65,47 L64,42 L59,41 L64,40 Z" fill="#fcd34d" />
  </svg>
`);

// 15. Frog Hat
AR_PROPS['frog_hat'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60">
    <path d="M10,60 C10,30 90,30 90,60" fill="#4ade80" />
    <circle cx="30" cy="35" r="15" fill="#4ade80" />
    <circle cx="30" cy="35" r="12" fill="#fff" />
    <circle cx="30" cy="35" r="5" fill="#111" />
    <circle cx="70" cy="35" r="15" fill="#4ade80" />
    <circle cx="70" cy="35" r="12" fill="#fff" />
    <circle cx="70" cy="35" r="5" fill="#111" />
  </svg>
`);

// 16. Sprout (Plant on Head)
AR_PROPS['sprout'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <path d="M20,40 Q20,20 25,10" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
    <path d="M25,10 C15,0 5,10 20,25" fill="#4ade80" />
    <path d="M25,10 C35,0 45,10 30,25" fill="#22c55e" />
  </svg>
`);

// 17. Birthday Hat
AR_PROPS['bday_hat'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80" width="60" height="80">
    <path d="M10,80 L50,80 L30,20 Z" fill="#f472b6" />
    <path d="M20,60 L40,40 M15,70 L35,50" stroke="#fbcfe8" stroke-width="4" stroke-linecap="round" />
    <circle cx="30" cy="15" r="10" fill="#fcd34d" />
  </svg>
`);

// 18. Star Glasses
AR_PROPS['star_glasses'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
    <!-- Frame line -->
    <path d="M10,20 L90,20" stroke="#fbbf24" stroke-width="4" />
    <!-- Left Star -->
    <path d="M30,5 L33,15 L43,15 L35,21 L38,30 L30,25 L22,30 L25,21 L17,15 L27,15 Z" fill="#fef08a" stroke="#fbbf24" stroke-width="3" />
    <!-- Right Star -->
    <path d="M70,5 L73,15 L83,15 L75,21 L78,30 L70,25 L62,30 L65,21 L57,15 L67,15 Z" fill="#fef08a" stroke="#fbbf24" stroke-width="3" />
  </svg>
`);



// 20. Freckles
AR_PROPS['freckles'] = createPropImage(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" width="100" height="30">
    <!-- Left cheek -->
    <circle cx="20" cy="15" r="1.5" fill="#92400e" opacity="0.6"/>
    <circle cx="25" cy="10" r="1" fill="#92400e" opacity="0.5"/>
    <circle cx="30" cy="18" r="1.5" fill="#92400e" opacity="0.6"/>
    <circle cx="35" cy="12" r="2" fill="#92400e" opacity="0.7"/>
    <circle cx="40" cy="16" r="1" fill="#92400e" opacity="0.5"/>
    <!-- Right cheek -->
    <circle cx="60" cy="16" r="1" fill="#92400e" opacity="0.5"/>
    <circle cx="65" cy="12" r="2" fill="#92400e" opacity="0.7"/>
    <circle cx="70" cy="18" r="1.5" fill="#92400e" opacity="0.6"/>
    <circle cx="75" cy="10" r="1" fill="#92400e" opacity="0.5"/>
    <circle cx="80" cy="15" r="1.5" fill="#92400e" opacity="0.6"/>
  </svg>
`);



export const useFaceTracking = (
  videoRef: React.RefObject<HTMLVideoElement>,
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>,
  settings: PhotoSettings
) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>();

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    const mediapipeFilters = Object.keys(AR_PROPS);
    if (!mediapipeFilters.includes(settings.selectedARFilter)) {
      return;
    }
    if (faceLandmarkerRef.current) return;

    let isMounted = true;
    
    const initModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 4
        });
        
        if (isMounted) {
          faceLandmarkerRef.current = faceLandmarker;
          setIsModelLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load face tracking model:", err);
      }
    };

    initModel();

    return () => {
      isMounted = false;
    };
  }, [settings.selectedARFilter]);

  // Animation Loop for tracking
  useEffect(() => {
    if (!isModelLoaded || !videoRef.current || !overlayCanvasRef.current || settings.selectedARFilter === 'none') {
      // Clear canvas if filter is off
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastVideoTime = -1;

    const renderLoop = async () => {
      if (video.currentTime !== lastVideoTime && faceLandmarkerRef.current) {
        lastVideoTime = video.currentTime;
        
        // Ensure canvas matches video size
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
        
        const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceLandmarks) {
          for (const landmarks of results.faceLandmarks) {
            ctx.save();
            
            const prop = AR_PROPS[settings.selectedARFilter];
            if (!prop) {
              ctx.restore();
              continue;
            }

            // Left and Right Eye centers in normalized coordinates [0, 1]
            // Note: Left eye for MediaPipe is right on screen due to mirroring
            const leftEye = landmarks[159]; 
            const rightEye = landmarks[386]; 
            const forehead = landmarks[10];
            const noseTip = landmarks[4];
            
            // Convert normalized coordinates to pixel coordinates
            const lx = leftEye.x * canvas.width;
            const ly = leftEye.y * canvas.height;
            const rx = rightEye.x * canvas.width;
            const ry = rightEye.y * canvas.height;
            const fx = forehead.x * canvas.width;
            const fy = forehead.y * canvas.height;
            const nx = noseTip.x * canvas.width;
            const ny = noseTip.y * canvas.height;
            
            const dx = rx - lx;
            const dy = ry - ly;
            const distance = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx);
            
            if (['thug_life', 'nerd_glasses', 'harry_potter', 'heart_eyes', 'pirate_patch', 'star_glasses'].includes(settings.selectedARFilter)) {
              const centerX = (lx + rx) / 2;
              const centerY = (ly + ry) / 2;
              
              const scale = (distance * 2.5) / prop.width; 
              
              ctx.translate(centerX, centerY);
              ctx.rotate(angle);
              ctx.scale(scale, scale);
              ctx.drawImage(prop, -prop.width / 2, -prop.height / 2);
              
            } else if (['cat_ears', 'crown', 'bunny_ears', 'angel_halo', 'devil_horns', 'star_halo', 'frog_hat', 'sprout', 'bday_hat'].includes(settings.selectedARFilter)) {
              const centerX = fx;
              let centerY = fy - (distance * 0.5); 
              
              if (settings.selectedARFilter === 'sprout') {
                centerY = fy - (distance * 0.8);
              }
              
              // Some hats need to be bigger
              let scaleMultiplier = settings.selectedARFilter === 'angel_halo' ? 4 : 3;
              if (settings.selectedARFilter === 'sprout') scaleMultiplier = 1.5;
              if (settings.selectedARFilter === 'bday_hat') scaleMultiplier = 2;
              if (settings.selectedARFilter === 'frog_hat') scaleMultiplier = 3.5;
              
              const scale = (distance * scaleMultiplier) / prop.width; 
              
              ctx.translate(centerX, centerY);
              ctx.rotate(angle);
              ctx.scale(scale, scale);
              ctx.drawImage(prop, -prop.width / 2, -prop.height); 
              
            } else if (['mustache', 'cat_whiskers', 'blush', 'freckles'].includes(settings.selectedARFilter)) {
              const centerX = (lx + rx) / 2;
              
              // Push it down below the eyes using the eye distance
              let dropAmount = distance * 0.7; // default for cat_whiskers
              if (settings.selectedARFilter === 'mustache') {
                dropAmount = distance * 0.9; // push down below nose
              } else if (settings.selectedARFilter === 'blush' || settings.selectedARFilter === 'freckles') {
                dropAmount = distance * 0.4;
              }
              
              const centerY = ((ly + ry) / 2) + dropAmount; 
              
              let scaleMultiplier = 2;
              if (settings.selectedARFilter === 'freckles') scaleMultiplier = 2.5;
              
              const scale = (distance * scaleMultiplier) / prop.width; 
              
              ctx.translate(centerX, centerY);
              ctx.rotate(angle);
              ctx.scale(scale, scale);
              ctx.drawImage(prop, -prop.width / 2, -prop.height / 2);
            }
            
            ctx.restore();
          }
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    };

    if (video.readyState >= 2 && !video.paused) {
      renderLoop();
    } else {
      video.addEventListener('play', renderLoop, { once: true });
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      video.removeEventListener('play', renderLoop);
    };
  }, [isModelLoaded, settings.selectedARFilter]);

  return { isModelLoaded };
};
