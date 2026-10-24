import re

with open('src/components/StudioScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace parent div
text = text.replace('<div className="flex p-4 gap-2 bg-white/50 backdrop-blur-md rounded-t-[3rem] lg:rounded-none border-b-2 border-slate-100/50">', '<div className="flex justify-around lg:justify-start p-4 gap-2 bg-white/50 backdrop-blur-md rounded-t-[3rem] lg:rounded-none border-b-2 border-slate-100/50">')

# Decorate button
text = text.replace(
    '''            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${currentTab === 'decorate' ? 'flex-1 px-5 gap-2 bg-blue-500 text-white border-blue-700 shadow-lg scale-[1.02]' : 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500'}`}''',
    '''            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${currentTab === 'decorate' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-blue-500 text-white border-blue-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-blue-500 lg:text-white lg:border-blue-700 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-500')}`}'''
)
text = text.replace(
    '''<span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${currentTab === 'decorate' ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>''',
    '''<span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${currentTab === 'decorate' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0'}`}>'''
)

# Layout button
text = text.replace(
    '''            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${currentTab === 'layout' ? 'flex-1 px-5 gap-2 bg-pink-500 text-white border-pink-700 shadow-lg scale-[1.02]' : 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500'}`}''',
    '''            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${currentTab === 'layout' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-pink-500 text-white border-pink-700 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-pink-500 lg:text-white lg:border-pink-700 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-pink-50 hover:text-pink-500')}`}'''
)
text = text.replace(
    '''<span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${currentTab === 'layout' ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>''',
    '''<span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${currentTab === 'layout' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0'}`}>'''
)

# Export button
text = text.replace(
    '''            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${currentTab === 'export' ? 'flex-1 px-5 gap-2 bg-yellow-400 text-yellow-900 border-yellow-600 shadow-lg scale-[1.02]' : 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600'}`}''',
    '''            className={`flex-shrink-0 py-3 text-xs md:text-sm font-black rounded-2xl transition-colors duration-300 flex items-center justify-center border-b-[4px] active:border-b-0 active:translate-y-[4px] ${currentTab === 'export' ? (isMobilePanelOpen ? 'flex-1 px-5 gap-2 bg-yellow-400 text-yellow-900 border-yellow-600 shadow-lg scale-[1.02]' : 'flex-1 bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600 lg:flex-1 lg:px-5 lg:gap-2 lg:bg-yellow-400 lg:text-yellow-900 lg:border-yellow-600 lg:shadow-lg lg:scale-[1.02]') : (isMobilePanelOpen ? 'w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600' : 'flex-1 lg:flex-none lg:w-[52px] bg-white text-slate-400 border-slate-200 hover:bg-yellow-50 hover:text-yellow-600')}`}'''
)
text = text.replace(
    '''<span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${currentTab === 'export' ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>''',
    '''<span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${currentTab === 'export' ? (isMobilePanelOpen ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[100px] lg:opacity-100') : 'max-w-0 opacity-0'}`}>'''
)

with open('src/components/StudioScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
