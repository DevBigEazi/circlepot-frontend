import { useTheme } from '../context/ThemeContext';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  border: string;
  gradient: string;
  // Info box backgrounds
  infoBg: string;
  successBg: string;
  warningBg: string;
  errorBg: string;
  accentBg: string;
  // Info box borders
  successBorder: string;
  warningBorder: string;
  errorBorder: string;
  accentBorder: string;
  // Hover states
  hoverBg: string;
}

export const useThemeColors = (): ThemeColors => {
  const { appliedTheme } = useTheme();

  const lightColors: ThemeColors = {
    primary: '#35D07F',
    secondary: '#FBCC5C',
    accent: '#2E3338',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#2E3338',
    textLight: '#6B7280',
    border: '#E5E7EB',
    gradient: 'linear-gradient(135deg, #35D07F 0%, #2BB673 100%)',
    // Info box backgrounds
    infoBg: '#F9FAFB',
    successBg: '#ECFDF5',
    warningBg: '#FEF9C3',
    errorBg: '#FEE2E2',
    accentBg: '#EFF6FF',
    // Info box borders
    successBorder: '#A7F3D0',
    warningBorder: '#FDE047',
    errorBorder: '#FECACA',
    accentBorder: '#BFDBFE',
    // Hover states
    hoverBg: '#F3F4F6'
  };

  const darkColors: ThemeColors = {
    primary: '#35D07F',
    secondary: '#FBCC5C',
    accent: '#E5E7EB',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textLight: '#94A3B8',
    border: '#334155',
    gradient: 'linear-gradient(135deg, #35D07F 0%, #2BB673 100%)',
    // Info box backgrounds (darker versions)
    infoBg: '#1E293B',
    successBg: '#022C22',
    warningBg: '#422006',
    errorBg: '#450A0A',
    accentBg: '#172554',
    // Info box borders (darker versions)
    successBorder: '#14532D',
    warningBorder: '#713F12',
    errorBorder: '#7F1D1D',
    accentBorder: '#1E3A8A',
    // Hover states
    hoverBg: '#334155'
  };

  return appliedTheme === 'dark' ? darkColors : lightColors;
};