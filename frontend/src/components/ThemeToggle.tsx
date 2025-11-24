import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

const ThemeToggle :React.FC = () => {
  const { themeMode, setTheme } = useTheme();
  const colors = useThemeColors();

  const themes = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-2 p-1 rounded-lg" style={{ backgroundColor: colors.infoBg }}>
      {themes.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setTheme(mode as typeof themeMode)}
          className="flex items-center gap-2 px-3 py-2 rounded-md transition-all"
          style={themeMode === mode 
            ? { backgroundColor: colors.surface, color: colors.primary, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }
            : { color: colors.textLight }}
          title={label}
        >
          <Icon size={18} />
          <span className="text-sm font-medium hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
