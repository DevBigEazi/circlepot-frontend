import { useTheme } from "../contexts/ThemeContext";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textLight: string;
  border: string;
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
    primary: "#5C6F2B", // Vibrant Circlepot Sage
    secondary: "#DE802B",
    accent: "#2E3338",
    background: "#F8F9FA",
    surface: "#F1F5F1",
    text: "#2E3338",
    textLight: "#6B7280",
    border: "#E5E7EB",
    // Info box backgrounds
    infoBg: "#F9FAFB",
    successBg: "#ECFDF5",
    warningBg: "#FEF9C3",
    errorBg: "#FEE2E2",
    accentBg: "#EFF6FF",
    // Info box borders
    successBorder: "#A7F3D0",
    warningBorder: "#FDE047",
    errorBorder: "#FECACA",
    accentBorder: "#BFDBFE",
    // Hover states
    hoverBg: "#F3F4F6",
  };

  const darkColors: ThemeColors = {
    primary: "#5C6F2B", // Vibrant Circlepot Green
    secondary: "#DE802B", // Warm Gold
    accent: "#E5E7EB",
    background: "#0F0F11",
    surface: "#161618",
    text: "#F1F5F9",
    textLight: "#94A3B8",
    border: "#334155",
    // Info box backgrounds (darker versions)
    infoBg: "#1E293B",
    successBg: "#022C22",
    warningBg: "#422006",
    errorBg: "#450A0A",
    accentBg: "#172554",
    // Info box borders (darker versions)
    successBorder: "#14532D",
    warningBorder: "#713F12",
    errorBorder: "#7F1D1D",
    accentBorder: "#1E3A8A",
    // Hover states
    hoverBg: "#334155",
  };

  return appliedTheme === "dark" ? darkColors : lightColors;
};
