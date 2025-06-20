import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    neutral0: string;
    neutral100: string;
    neutral900: string;
    notification: string;
    success: string;
    error: string;
    warning: string;
    // Legacy compatibility
    backgroundSecondary: string;
    surface: string;
    shadow: string;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: "#E0DDD1",
    primaryLight: "#F0EEE5",
    primaryDark: "#D4CEC4",
    secondary: "#544F45",
    secondaryLight: "#655F52",
    secondaryDark: "#322E26",
    accent: "#D85E58",
    accentLight: "#E57B76",
    accentDark: "#B94C46",
    background: "#E0DDD1",
    card: "#E9E6DD",
    text: "#322E26",
    textSecondary: "#655F52",
    textTertiary: "#8A8984",
    border: "#D4CEC4",
    neutral0: "#FFFFFF",
    neutral100: "#F9F8F0",
    neutral900: "#322E26",
    notification: "#BF4A40",
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FFC107",
    // Legacy compatibility
    backgroundSecondary: "#E9E6DD",
    surface: "#E9E6DD",
    shadow: "rgba(50, 46, 38, 0.1)",
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: "#D85E58",
    primaryLight: "#E28783",
    primaryDark: "#B94C46",
    secondary: "#322E26",
    secondaryLight: "#655F52",
    secondaryDark: "#544F45",
    accent: "#D85E58",
    accentLight: "#E57B76",
    accentDark: "#B94C46",
    background: "#322E26",
    card: "#706B58",
    text: "#F9F8F0",
    textSecondary: "#E0DDD1",
    textTertiary: "#D4CEC4",
    border: "#8A8984",
    neutral0: "#FFFFFF",
    neutral100: "#F9F8F0",
    neutral900: "#322E26",
    notification: "#BF4A40",
    success: "#4CAF50",
    error: "#F44336",
    warning: "#FFC107",
    // Legacy compatibility
    backgroundSecondary: "#706B58",
    surface: "#706B58",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const colorScheme = Appearance.getColorScheme();
    setIsDark(colorScheme === 'dark');

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription?.remove();
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}