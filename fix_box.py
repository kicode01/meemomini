import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix decorate-view parent classes
text = text.replace('className="absolute inset-0 max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8 pt-12 lg:pt-0"', 'className="absolute inset-0 max-w-6xl mx-auto w-full h-full min-h-0 min-w-0 flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-8 pt-12 lg:pt-0"')

# Remove boxSizing: 'content-box' from preview container
text = text.replace("style={{ aspectRatio: settings.aspectRatio === 'portrait' ? '3/4' : '4/3', maxHeight: '100%', maxWidth: '100%', boxSizing: 'content-box' }}", "style={{ aspectRatio: settings.aspectRatio === 'portrait' ? '3/4' : '4/3', maxHeight: '100%', maxWidth: '100%' }}")

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
