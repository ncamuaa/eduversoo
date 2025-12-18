import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const THEME_COLORS = {
  dark: {
    background: ["#151557", "#3c1aa0", "#7a33ff"],
    text: "#fff",
    subText: "rgba(255,255,255,0.75)",
    cardBg: "rgba(255,255,255,0.05)",
    inputBg: "rgba(255,255,255,0.1)",
    sidebar: "#12082b",
    overlay: "rgba(0,0,0,0.55)",
  },
  light: {
    background: ["#ffffff", "#e0e0e0", "#b0b0b0"],
    text: "#111",
    subText: "rgba(0,0,0,0.6)",
    cardBg: "rgba(0,0,0,0.05)",
    inputBg: "rgba(0,0,0,0.08)",
    sidebar: "#f0f0f0",
    overlay: "rgba(255,255,255,0.55)",
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    await AsyncStorage.setItem('theme', nextTheme);
  };

  const colors = THEME_COLORS[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
