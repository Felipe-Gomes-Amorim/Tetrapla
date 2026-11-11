import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { usePlans } from './PlansContext';

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
  readBackground: string; // fundo de capítulo lido nas grades
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
  readBackground: '#E8F5E9',
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
  readBackground: '#1a3a1a',
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

  // Objetos estáveis: só mudam quando o tema muda (permite React.memo nas listas)
  // A cor da meta de leitura ativa troca o verde da Bíblia (a meta Padrão mantém o verde original)
  const { activePlan } = usePlans();
  const planColor = activePlan?.color ?? null;
  const colors = useMemo(() => {
    const base = mode === 'light' ? { ...LightColors, isDark: false } : { ...DarkColors, isDark: true };
    if (!planColor) return base;
    const accent = planAccent(planColor, base.isDark);
    return { ...base, accentColor: accent, readBackground: tintOf(accent, base.isDark) };
  }, [mode, planColor]);
  const isDark = mode === 'dark';

  const value: ThemeContextType = useMemo(
    () => ({ isDark, mode, colors, toggleTheme, setMode }),
    [isDark, mode, colors]
  );

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

// ---- Tema da seção Pais: o verde vira azul com a mesma saturação/luminosidade (hue ~210°)

const FATHERS_HUE = 210;

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

// Mantém S e L da cor e troca só o matiz
export function toFathersBlue(hex: string): string {
  const [, s, l] = hexToHsl(hex);
  return hslToHex(FATHERS_HUE, s, l);
}

// Cor da meta no tema atual: mantém o matiz escolhido e usa a saturação/luminosidade do verde do tema
export function planAccent(planColor: string, isDark: boolean): string {
  const [h] = hexToHsl(planColor);
  const [, s, l] = hexToHsl(isDark ? DarkColors.accentColor : LightColors.accentColor);
  return hslToHex(h, s, l);
}

// Fundo claro/escuro com o matiz da cor (equivale ao verde #E8F5E9 / #1a3a1a do tema padrão)
export function tintOf(hex: string, isDark: boolean): string {
  const [h] = hexToHsl(hex);
  return hslToHex(h, 0.39, isDark ? 0.17 : 0.94);
}

export interface FathersColors extends ThemeColors {
  noteBackground: string; // fundo da nota do tradutor/citações
  progressTrack: string;
}

export function useFathersTheme(): { colors: FathersColors } {
  const { colors, isDark } = useTheme();
  // O azul dos Pais parte sempre do verde padrão, sem acompanhar a cor da meta de leitura da Bíblia
  const baseAccent = isDark ? DarkColors.accentColor : LightColors.accentColor;
  return useMemo(
    () => ({
      colors: {
        ...colors,
        accentColor: toFathersBlue(baseAccent),
        readBackground: toFathersBlue(isDark ? '#1a3a1a' : '#E8F5E9'),
        noteBackground: toFathersBlue(isDark ? '#23302b' : '#eef6f2'),
        progressTrack: colors.cardBackground,
      },
    }),
    [colors, baseAccent, isDark]
  );
}
