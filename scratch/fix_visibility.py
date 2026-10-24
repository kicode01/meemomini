import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fade out UI toggles in Layout view when isStripBackgroundVisible is false
mode_toggle = r'''                  {settings.captureMode !== 'boomerang' && (
                    <motion.div 
                      className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-200/50 backdrop-blur-md p-1.5 rounded-full flex gap-2 shadow-sm z-50"
                    >'''
mode_toggle_new = r'''                  {settings.captureMode !== 'boomerang' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-200/50 backdrop-blur-md p-1.5 rounded-full flex gap-2 shadow-sm z-50 pointer-events-none"
                      style={{ pointerEvents: isStripBackgroundVisible ? 'auto' : 'none' }}
                    >'''
text = text.replace(mode_toggle, mode_toggle_new)

# 2. Fix grid items background during flight
grid_item = r'''                                className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl aspect-[4/3] relative group ring-1 ring-black/5 cursor-grab active:cursor-grabbing"'''
grid_item_new = r'''                                className={`rounded-2xl overflow-hidden aspect-[4/3] relative group cursor-grab active:cursor-grabbing ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}'''
text = text.replace(grid_item, grid_item_new)

grid_item2 = r'''                                className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl aspect-[4/3] relative group ring-1 ring-black/5"'''
grid_item2_new = r'''                                className={`rounded-2xl overflow-hidden aspect-[4/3] relative group ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}'''
text = text.replace(grid_item2, grid_item2_new)

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)


with open('src/components/CaptureStripDisplay.tsx', 'r', encoding='utf-8') as f:
    text2 = f.read()

# 3. Fix photo slot background during flight
slot_bg = r'''              className="relative overflow-hidden w-full h-full print-container-photo-slot"
              style={{
                borderRadius: (isPolaroid || isFilm || isMinimalist) ? '2px' : '6px',
                aspectRatio: (settings as any).aspectRatio === 'portrait' ? '3/4' : ((settings as any).aspectRatio === 'square' ? '1/1' : '4/3'),
                boxShadow: isGallery ? 'inset 0 3px 6px rgba(0,0,0,0.15)' : (isVintage ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'),
                filter: isVintage ? 'sepia(0.4) contrast(1.05) brightness(0.95)' : 'none',
                background: '#fff'
              }}'''
slot_bg_new = r'''              className="relative overflow-hidden w-full h-full print-container-photo-slot"
              style={{
                borderRadius: (isPolaroid || isFilm || isMinimalist) ? '2px' : '6px',
                aspectRatio: (settings as any).aspectRatio === 'portrait' ? '3/4' : ((settings as any).aspectRatio === 'square' ? '1/1' : '4/3'),
                boxShadow: (!isStripBackgroundVisible || !isGallery) ? 'none' : 'inset 0 3px 6px rgba(0,0,0,0.15)',
                filter: (!isStripBackgroundVisible || !isVintage) ? 'none' : 'sepia(0.4) contrast(1.05) brightness(0.95)',
                background: isStripBackgroundVisible ? '#fff' : 'transparent'
              }}'''
text2 = text2.replace(slot_bg, slot_bg_new)

with open('src/components/CaptureStripDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text2)

print("Done")
