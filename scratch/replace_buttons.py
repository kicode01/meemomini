import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the sidebar buttons to use highlightTab instead of currentTab
text = text.replace("currentTab === 'decorate' ? (isMobilePanelOpen", "highlightTab === 'decorate' ? (isMobilePanelOpen")
text = text.replace("currentTab === 'layout' ? (isMobilePanelOpen", "highlightTab === 'layout' ? (isMobilePanelOpen")
text = text.replace("currentTab === 'export' ? (isMobilePanelOpen", "highlightTab === 'export' ? (isMobilePanelOpen")

# 2. Update the text transitions
text = text.replace("currentTab === 'decorate' ? (isMobilePanelOpen ? 'max-w-[100px]", "highlightTab === 'decorate' ? (isMobilePanelOpen ? 'max-w-[100px]")
text = text.replace("currentTab === 'layout' ? (isMobilePanelOpen ? 'max-w-[100px]", "highlightTab === 'layout' ? (isMobilePanelOpen ? 'max-w-[100px]")
text = text.replace("currentTab === 'export' ? (isMobilePanelOpen ? 'max-w-[100px]", "highlightTab === 'export' ? (isMobilePanelOpen ? 'max-w-[100px]")

# 3. Fix the side tools panels to use highlightTab so the tools update instantly!
text = text.replace("{currentTab === 'decorate' && (", "{highlightTab === 'decorate' && (")
text = text.replace("{currentTab === 'layout' && (", "{highlightTab === 'layout' && (")
text = text.replace("{currentTab === 'export' && (", "{highlightTab === 'export' && (")

# 4. Also fix the check inside StudioScreen for layout constraints
text = text.replace("{(currentTab === 'export' || currentTab === 'layout') && settings.captureMode !== 'boomerang' && (", "{(highlightTab === 'export' || highlightTab === 'layout') && settings.captureMode !== 'boomerang' && (")

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
