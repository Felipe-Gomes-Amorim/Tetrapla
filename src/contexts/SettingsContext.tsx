import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

interface SettingsContextType {
  showDeuterocanonical: boolean;
  setShowDeuterocanonical: (v: boolean) => void;
  loaded: boolean;
}

const SETTINGS_FILE = `${FileSystem.documentDirectory}settings.json`;

interface StoredSettings {
  showDeuterocanonical: boolean;
}

const DEFAULTS: StoredSettings = { showDeuterocanonical: true };

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

async function readSettings(): Promise<StoredSettings> {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (!info.exists) return DEFAULTS;
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(SETTINGS_FILE));
    return {
      showDeuterocanonical:
        typeof parsed?.showDeuterocanonical === 'boolean'
          ? parsed.showDeuterocanonical
          : DEFAULTS.showDeuterocanonical,
    };
  } catch (e) {
    // Arquivo ausente/corrompido: usa os padrões
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    readSettings().then(s => {
      // Se o usuário já mudou algo antes da leitura terminar, não sobrescreve
      if (!touched.current) setSettings(s);
      setLoaded(true);
    });
  }, []);

  const setShowDeuterocanonical = useCallback((v: boolean) => {
    touched.current = true;
    const next = { ...settings, showDeuterocanonical: v };
    setSettings(next);
    FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(next)).catch(e =>
      console.error('Erro ao salvar configurações:', e)
    );
  }, [settings]);

  return (
    <SettingsContext.Provider
      value={{ showDeuterocanonical: settings.showDeuterocanonical, setShowDeuterocanonical, loaded }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return ctx;
}
