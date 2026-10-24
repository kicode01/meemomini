import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the thumbnail border animation
old_thumbnail_border = r'''                        <motion.div 
                          animate={{ 
                            opacity: 1 
                          }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 border-[3px] pointer-events-none rounded-2xl"
                          style={{
                            borderColor: isThumbnailDecoratorsVisible ? (activePhotoIdx === i ? '#3b82f6' : 'rgba(0,0,0,0)') : '#ffffff',
                          }}
                        />'''
new_thumbnail_border = r'''                        <motion.div 
                          animate={{ 
                            borderColor: isThumbnailDecoratorsVisible 
                              ? (activePhotoIdx === i ? '#3b82f6' : 'rgba(0,0,0,0)') 
                              : (animState === 'leaving-decorate' ? 'rgba(0,0,0,0)' : '#ffffff')
                          }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 border-[3px] pointer-events-none rounded-2xl"
                        />'''
text = text.replace(old_thumbnail_border, new_thumbnail_border)

# 2. Add transition to StudioScreen grid items
old_grid_item = r'''className={`rounded-2xl overflow-hidden aspect-[4/3] relative group cursor-grab active:cursor-grabbing ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}'''
new_grid_item = r'''className={`transition-all duration-300 rounded-2xl overflow-hidden aspect-[4/3] relative group cursor-grab active:cursor-grabbing ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}'''
text = text.replace(old_grid_item, new_grid_item)

old_grid_item2 = r'''className={`rounded-2xl overflow-hidden aspect-[4/3] relative group ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}'''
new_grid_item2 = r'''className={`transition-all duration-300 rounded-2xl overflow-hidden aspect-[4/3] relative group ${isStripBackgroundVisible ? 'bg-slate-900 shadow-xl ring-1 ring-black/5' : 'bg-transparent shadow-none ring-0'}`}'''
text = text.replace(old_grid_item2, new_grid_item2)

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)


with open('src/components/CaptureStripDisplay.tsx', 'r', encoding='utf-8') as f:
    text2 = f.read()

# 3. Add transition to CaptureStripDisplay slots
old_slot_bg = r'''              className="relative overflow-hidden w-full h-full print-container-photo-slot"
              style={{
                borderRadius: (isPolaroid || isFilm || isMinimalist) ? '2px' : '6px',
                aspectRatio: (settings as any).aspectRatio === 'portrait' ? '3/4' : ((settings as any).aspectRatio === 'square' ? '1/1' : '4/3'),
                boxShadow: (!isStripBackgroundVisible || !isGallery) ? 'none' : 'inset 0 3px 6px rgba(0,0,0,0.15)',
                filter: (!isStripBackgroundVisible || !isVintage) ? 'none' : 'sepia(0.4) contrast(1.05) brightness(0.95)',
                background: isStripBackgroundVisible ? '#fff' : 'transparent'
              }}'''
new_slot_bg = r'''              className="relative overflow-hidden w-full h-full print-container-photo-slot"
              style={{
                borderRadius: (isPolaroid || isFilm || isMinimalist) ? '2px' : '6px',
                aspectRatio: (settings as any).aspectRatio === 'portrait' ? '3/4' : ((settings as any).aspectRatio === 'square' ? '1/1' : '4/3'),
                boxShadow: (!isStripBackgroundVisible || !isGallery) ? 'none' : 'inset 0 3px 6px rgba(0,0,0,0.15)',
                filter: (!isStripBackgroundVisible || !isVintage) ? 'none' : 'sepia(0.4) contrast(1.05) brightness(0.95)',
                background: isStripBackgroundVisible ? '#fff' : 'transparent',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease'
              }}'''
text2 = text2.replace(old_slot_bg, new_slot_bg)

with open('src/components/CaptureStripDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text2)

print("Done")
