import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure the border motion.div doesn't fade out and turns white when leaving decorate!
old_border_div = r'''                        <motion.div 
                          animate={{ 
                            opacity: isThumbnailDecoratorsVisible ? 1 : 0 
                          }}
                          className="absolute inset-0 border-[3px] border-white pointer-events-none rounded-2xl"
                          style={{
                            borderColor: isThumbnailDecoratorsVisible ? (activePhotoIdx === i ? '#3b82f6' : 'rgba(0,0,0,0)') : 'transparent',
                          }}
                        />'''
new_border_div = r'''                        <motion.div 
                          animate={{ 
                            opacity: 1 
                          }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 border-[3px] pointer-events-none rounded-2xl"
                          style={{
                            borderColor: isThumbnailDecoratorsVisible ? (activePhotoIdx === i ? '#3b82f6' : 'rgba(0,0,0,0)') : '#ffffff',
                          }}
                        />'''
text = text.replace(old_border_div, new_border_div)

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
