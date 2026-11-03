// STUB temporário (T3): o T2 entrega a versão real com a mesma assinatura e substitui este arquivo no merge.
import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  showDeuterocanonical: boolean;
  setShowDeuterocanonical: (v: boolean) => void;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [showDeuterocanonical, setShowDeuterocanonical] = useState(false);
  return (
    <SettingsContext.Provider value={{ showDeuterocanonical, setShowDeuterocanonical, loaded: true }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return ctx;
}
