import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Change currentTab to activeStudioTab so views don't unmount prematurely!
old_currentTab = r'''  const currentTab = targetTabState || activeStudioTab;'''
new_currentTab = r'''  const currentTab = activeStudioTab;
  const highlightTab = targetTabState || activeStudioTab;'''
text = text.replace(old_currentTab, new_currentTab)

# 2. Update the sidebar buttons to use highlightTab instead of currentTab
old_decorate_btn = r'''currentTab === 'decorate' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-blue-500 text-white border-blue-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-blue-500 lg:text-white lg:border-blue-700 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500')'''
new_decorate_btn = old_decorate_btn.replace("currentTab === 'decorate'", "highlightTab === 'decorate'")
text = text.replace(old_decorate_btn, new_decorate_btn)

old_decorate_text = r'''currentTab === 'decorate' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0''''
new_decorate_text = old_decorate_text.replace("currentTab === 'decorate'", "highlightTab === 'decorate'")
text = text.replace(old_decorate_text, new_decorate_text)

old_layout_btn = r'''currentTab === 'layout' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-pink-500 text-white border-pink-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-pink-500 lg:text-white lg:border-pink-700 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500')'''
new_layout_btn = old_layout_btn.replace("currentTab === 'layout'", "highlightTab === 'layout'")
text = text.replace(old_layout_btn, new_layout_btn)

old_layout_text = r'''currentTab === 'layout' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0''''
new_layout_text = old_layout_text.replace("currentTab === 'layout'", "highlightTab === 'layout'")
text = text.replace(old_layout_text, new_layout_text)

old_export_btn = r'''currentTab === 'export' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-yellow-400 text-yellow-900 border-yellow-600 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-yellow-400 lg:text-yellow-900 lg:border-yellow-600 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600')'''
new_export_btn = old_export_btn.replace("currentTab === 'export'", "highlightTab === 'export'")
text = text.replace(old_export_btn, new_export_btn)

old_export_text = r'''currentTab === 'export' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0''''
new_export_text = old_export_text.replace("currentTab === 'export'", "highlightTab === 'export'")
text = text.replace(old_export_text, new_export_text)

# Fix the side tools panels to use highlightTab so the tools update instantly!
old_tools_dec = r'''          {currentTab === 'decorate' && ('''
new_tools_dec = r'''          {highlightTab === 'decorate' && ('''
text = text.replace(old_tools_dec, new_tools_dec)

old_tools_lay = r'''          {currentTab === 'layout' && ('''
new_tools_lay = r'''          {highlightTab === 'layout' && ('''
text = text.replace(old_tools_lay, new_tools_lay)

old_tools_exp = r'''          {currentTab === 'export' && ('''
new_tools_exp = r'''          {highlightTab === 'export' && ('''
text = text.replace(old_tools_exp, new_tools_exp)

# Also fix the check inside StudioScreen for layout constraints
old_layout_check = r'''{(currentTab === 'export' || currentTab === 'layout') && settings.captureMode !== 'boomerang' && ('''
new_layout_check = r'''{(highlightTab === 'export' || highlightTab === 'layout') && settings.captureMode !== 'boomerang' && ('''
text = text.replace(old_layout_check, new_layout_check)

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
