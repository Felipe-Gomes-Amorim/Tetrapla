import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

export type OtOrder = 'christian' | 'jewish';

interface SettingsContextType {
  showDeuterocanonical: boolean;
  setShowDeuterocanonical: (v: boolean) => void;
  groupBooks: boolean;
  setGroupBooks: (v: boolean) => void;
  otOrder: OtOrder;
  setOtOrder: (v: OtOrder) => void;
  loaded: boolean;
}

const SETTINGS_FILE = `${FileSystem.documentDirectory}settings.json`;

interface StoredSettings {
  showDeuterocanonical: boolean;
  groupBooks: boolean;
  otOrder: OtOrder;
}

const DEFAULTS: StoredSettings = { showDeuterocanonical: true, groupBooks: false, otOrder: 'christian' };

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

async function readSettings(): Promise<StoredSettings> {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (!info.exists) return DEFAULTS;
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(SETTINGS_FILE));
    // Campos ausentes (settings.json antigo) caem no padrão
    return {
      showDeuterocanonical:
        typeof parsed?.showDeuterocanonical === 'boolean'
          ? parsed.showDeuterocanonical
          : DEFAULTS.showDeuterocanonical,
      groupBooks: typeof parsed?.groupBooks === 'boolean' ? parsed.groupBooks : DEFAULTS.groupBooks,
      otOrder: parsed?.otOrder === 'jewish' || parsed?.otOrder === 'christian' ? parsed.otOrder : DEFAULTS.otOrder,
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
  const current = useRef<StoredSettings>(DEFAULTS);

  useEffect(() => {
    readSettings().then(s => {
      // Se o usuário já mudou algo antes da leitura terminar, não sobrescreve
      if (!touched.current) {
        current.current = s;
        setSettings(s);
      }
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<StoredSettings>) => {
    touched.current = true;
    const next = { ...current.current, ...patch };
    current.current = next;
    setSettings(next);
    FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(next)).catch(e =>
      console.error('Erro ao salvar configurações:', e)
    );
  }, []);

  const setShowDeuterocanonical = useCallback((v: boolean) => update({ showDeuterocanonical: v }), [update]);
  const setGroupBooks = useCallback((v: boolean) => update({ groupBooks: v }), [update]);
  const setOtOrder = useCallback((v: OtOrder) => update({ otOrder: v }), [update]);

  return (
    <SettingsContext.Provider
      value={{
        showDeuterocanonical: settings.showDeuterocanonical,
        setShowDeuterocanonical,
        groupBooks: settings.groupBooks,
        setGroupBooks,
        otOrder: settings.otOrder,
        setOtOrder,
        loaded,
      }}
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
