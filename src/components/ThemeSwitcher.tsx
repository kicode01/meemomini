import { Palette } from 'lucide-react';
import { useStore } from '../store/useStore';

const ThemeSwitcher = () => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const toggleTheme = () => {
    setTheme(theme === 'cartoony' ? 'glass' : 'cartoony');
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 theme-btn-secondary flex items-center gap-2 text-sm md:text-base border-2"
      title="Toggle Theme"
    >
      <Palette className="w-5 h-5" />
      <span className="hidden md:inline">
        {theme === 'cartoony' ? 'Glass Theme' : 'Cartoony Theme'}
      </span>
    </button>
  );
};

export default ThemeSwitcher;
