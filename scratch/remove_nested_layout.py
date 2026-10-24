import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove layoutId from all photo-img in StudioScreen
text = re.sub(r'\s*layoutId={`photo-img-\$\{p\.id\}`}', '', text)

# 2. Fix thumbnail width (move w-20 lg:w-24 from img to button)
old_button = r'''className={`relative snap-start flex-shrink-0 rounded-2xl overflow-hidden group ${'''
new_button = r'''className={`w-20 lg:w-24 relative snap-start flex-shrink-0 rounded-2xl overflow-hidden group ${'''
text = text.replace(old_button, new_button)

old_img_class = r'''className="w-20 lg:w-24 h-auto object-cover"'''
new_img_class = r'''className="w-full h-full object-cover"'''
text = text.replace(old_img_class, new_img_class)

# 3. Fix the motion.div wrapping the img in thumbnail so it expands
old_div = r'''<motion.div 
                        animate={{ scale: (activePhotoIdx === i && isThumbnailDecoratorsVisible && !hasFrame) ? 1.05 : 1 }}'''
new_div = r'''<motion.div 
                        className="w-full h-full"
                        animate={{ scale: (activePhotoIdx === i && isThumbnailDecoratorsVisible && !hasFrame) ? 1.05 : 1 }}'''
text = text.replace(old_div, new_div)

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)


with open('src/components/CaptureStripDisplay.tsx', 'r', encoding='utf-8') as f:
    text2 = f.read()

# Remove layoutId from photo-img in CaptureStripDisplay
text2 = re.sub(r'\s*layoutId={`photo-img-\$\{photo\.id\}`}', '', text2)

with open('src/components/CaptureStripDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text2)

print("Done")
