import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  headerBackground: string;
  headerBorder: string;
  inputBackground: string;
  inputPlaceholder: string;
  buttonBackground: string;
  cardBackground: string;
  accentColor: string;
  borderColor: string;
  isDark?: boolean;
}

interface ThemeContextType {
  isDark: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const LightColors: ThemeColors = {
  background: '#fff',
  text: '#1a1a1a',
  textSecondary: '#666',
  headerBackground: '#fff',
  headerBorder: '#eee',
  inputBackground: '#f5f5f5',
  inputPlaceholder: '#aaa',
  buttonBackground: '#f5f5f5',
  cardBackground: '#f5f5f5',
  accentColor: '#1D9E75',
  borderColor: '#eee',
};

const DarkColors: ThemeColors = {
  background: '#121212',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  headerBackground: '#1e1e1e',
  headerBorder: '#2a2a2a',
  inputBackground: '#2a2a2a',
  inputPlaceholder: '#666',
  buttonBackground: '#2a2a2a',
  cardBackground: '#1e1e1e',
  accentColor: '#4CAF50',
  borderColor: '#2a2a2a',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const path = FileSystem.documentDirectory + 'theme.txt';
      const content = await FileSystem.readAsStringAsync(path);
      const savedMode = content.trim() as ThemeMode;
      if (savedMode === 'light' || savedMode === 'dark') {
        setModeState(savedMode);
      }
    } catch (e) {
      // Arquivo não existe, usar padrão (light)
      setModeState('light');
    }
  };

  const saveThemePreference = async (newMode: ThemeMode) => {
    try {
      const path = FileSystem.documentDirectory + 'theme.txt';
      await FileSystem.writeAsStringAsync(path, newMode);
    } catch (e) {
      console.error('Erro ao salvar preferência de tema:', e);
    }
  };

  const toggleTheme = async () => {
    const newMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setModeState(newMode);
    await saveThemePreference(newMode);
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await saveThemePreference(newMode);
  };

  const colors = mode === 'light' ? { ...LightColors, isDark: false } : { ...DarkColors, isDark: true };
  const isDark = mode === 'dark';

  const value: ThemeContextType = {
    isDark,
    mode,
    colors,
    toggleTheme,
    setMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
