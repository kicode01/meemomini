import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove initial/animate/exit from decorate-view
dec_target = """              <motion.div 
                key="decorate-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 max-w-6xl mx-auto w-full h-full min-h-0 min-w-0 flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8 pt-12 lg:pt-0"
              >"""
dec_replace = """              <motion.div 
                key="decorate-view"
                className="absolute inset-0 max-w-6xl mx-auto w-full h-full min-h-0 min-w-0 flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8 pt-12 lg:pt-0"
              >"""
text = text.replace(dec_target, dec_replace)

# 2. Remove initial/animate/exit from layout-view
lay_target = """              <motion.div 
                key="layout-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center overflow-hidden px-4"
              >"""
lay_replace = """              <motion.div 
                key="layout-view"
                className="absolute inset-0 flex flex-col items-center overflow-hidden px-4"
              >"""
text = text.replace(lay_target, lay_replace)

# 3. Rename thumbnail layoutIds to match photo layoutIds
text = text.replace('layoutId={`thumbnail-wrapper-${p.id}`}', 'layoutId={`photo-wrapper-${p.id}`}')
text = text.replace('layoutId={`thumbnail-img-${p.id}`}', 'layoutId={`photo-img-${p.id}`}')

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied fix_animations.py")
