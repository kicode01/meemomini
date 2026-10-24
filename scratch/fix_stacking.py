import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_start = """                        <Reorder.Group 
                          values={photos}
                          onReorder={(newOrder) => useStore.getState().setCapturedPhotos(newOrder)}
                          className="grid grid-cols-2 gap-4 pb-8 max-w-[400px] w-full mx-auto px-4"
                        >"""

target_end = """                        </Reorder.Group>"""

# Find the start and end indices of the block to replace
start_idx = text.find(target_start)
end_idx = text.find(target_end, start_idx) + len(target_end)

if start_idx == -1 or end_idx == -1:
    print("Could not find the target block")
    exit(1)

inner_block = text[start_idx:end_idx]

replacement = """                        {currentTab === 'layout' ? (
                          <Reorder.Group 
                            values={photos}
                            onReorder={(newOrder) => useStore.getState().setCapturedPhotos(newOrder)}
                            className="grid grid-cols-2 gap-4 pb-8 max-w-[400px] w-full mx-auto px-4"
                          >
                            {photos.map((p, idx) => (
                              <Reorder.Item 
                                value={p}
                                layoutId={`photo-wrapper-${p.id}`}
                                key={p.id} 
                                className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl aspect-[4/3] relative group ring-1 ring-black/5 cursor-grab active:cursor-grabbing"
                              >
                                {p.videoUrl && (
                                  <motion.video 
                                    src={p.videoUrl} 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    preload="none"
                                    style={{
                                      transform: settings.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  />
                                )}
                                <motion.img 
                                  layoutId={`photo-img-${p.id}`}
                                  src={p.dataUrl} 
                                  className={`object-cover w-full h-full pointer-events-none ${p.videoUrl ? 'absolute inset-0' : ''}`} 
                                  alt={`Clip ${idx + 1}`} 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: (p.videoUrl && isStripBackgroundVisible) ? 0 : 1 }}
                                  transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none" />
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md"
                                >
                                  {idx + 1}
                                </motion.div>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 pb-8 max-w-[400px] w-full mx-auto px-4">
                            {photos.map((p, idx) => (
                              <motion.div 
                                layoutId={`photo-wrapper-${p.id}`}
                                key={p.id} 
                                className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl aspect-[4/3] relative group ring-1 ring-black/5"
                              >
                                {p.videoUrl && (
                                  <motion.video 
                                    src={p.videoUrl} 
                                    className="w-full h-full object-cover" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    preload="none"
                                    style={{
                                      transform: settings.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                  />
                                )}
                                <motion.img 
                                  layoutId={`photo-img-${p.id}`}
                                  src={p.dataUrl} 
                                  className={`object-cover w-full h-full pointer-events-none ${p.videoUrl ? 'absolute inset-0' : ''}`} 
                                  alt={`Clip ${idx + 1}`} 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: (p.videoUrl && isStripBackgroundVisible) ? 0 : 1 }}
                                  transition={{ duration: 0.3 }}
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none" />
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: isStripBackgroundVisible ? 1 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md"
                                >
                                  {idx + 1}
                                </motion.div>
                              </motion.div>
                            ))}
                          </div>
                        )}"""

text = text[:start_idx] + replacement + text[end_idx:]

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied fix_stacking.py successfully")
