import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { setReadPlan, deleteReadPlanData } from '../db/database';
import { emitProgressChanged } from '../data/progressEvents';
import {
  ReadingPlan, StoredPlans, EMPTY_PLANS, DEFAULT_PLAN_ID, DEFAULT_PLAN_NAME, sanitizePlans, newPlanId,
} from '../data/plans';

interface PlansContextType {
  // Metas criadas pelo usuário (a Padrão não entra aqui)
  plans: ReadingPlan[];
  activePlanId: string;
  // null = Padrão (usa o verde do tema)
  activePlan: ReadingPlan | null;
  activePlanName: string;
  setActivePlan: (id: string) => void;
  addPlan: (name: string, color: string) => void;
  updatePlan: (id: string, patch: { name?: string; color?: string }) => void;
  removePlan: (id: string) => void;
}

const PLANS_FILE = `${FileSystem.documentDirectory}plans.json`;

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export function PlansProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredPlans>(EMPTY_PLANS);
  const [loaded, setLoaded] = useState(false);
  const current = useRef<StoredPlans>(EMPTY_PLANS);

  // As telas só montam depois de ler as metas, para já abrirem na meta ativa (sem piscar de cor)
  useEffect(() => {
    (async () => {
      let stored = EMPTY_PLANS;
      try {
        const info = await FileSystem.getInfoAsync(PLANS_FILE);
        if (info.exists) stored = sanitizePlans(JSON.parse(await FileSystem.readAsStringAsync(PLANS_FILE)));
      } catch (e) {
        // Arquivo ausente/corrompido: só a Padrão
      }
      setReadPlan(stored.activePlanId);
      current.current = stored;
      setState(stored);
      setLoaded(true);
    })();
  }, []);

  const commit = useCallback((next: StoredPlans) => {
    current.current = next;
    setState(next);
    FileSystem.writeAsStringAsync(PLANS_FILE, JSON.stringify(next)).catch(e =>
      console.error('Erro ao salvar metas:', e)
    );
  }, []);

  const setActivePlan = useCallback((id: string) => {
    const cur = current.current;
    if (id === cur.activePlanId) return;
    if (id !== DEFAULT_PLAN_ID && !cur.plans.some(p => p.id === id)) return;
    setReadPlan(id); // troca a pasta de progresso e invalida o cache
    commit({ ...cur, activePlanId: id });
    emitProgressChanged(); // botão central da navbar e telas recarregam o progresso
  }, [commit]);

  const addPlan = useCallback((name: string, color: string) => {
    const cur = current.current;
    const plan: ReadingPlan = { id: newPlanId(), name: name.trim() || 'Nova meta', color };
    setReadPlan(plan.id);
    commit({ activePlanId: plan.id, plans: [...cur.plans, plan] }); // a meta nova já fica selecionada
    emitProgressChanged();
  }, [commit]);

  const updatePlan = useCallback((id: string, patch: { name?: string; color?: string }) => {
    const cur = current.current;
    commit({
      ...cur,
      plans: cur.plans.map(p =>
        p.id === id
          ? { ...p, name: patch.name !== undefined ? patch.name.trim() || p.name : p.name, color: patch.color ?? p.color }
          : p
      ),
    });
  }, [commit]);

  const removePlan = useCallback((id: string) => {
    const cur = current.current;
    if (!cur.plans.some(p => p.id === id)) return;
    const wasActive = cur.activePlanId === id;
    if (wasActive) setReadPlan(DEFAULT_PLAN_ID);
    commit({ activePlanId: wasActive ? DEFAULT_PLAN_ID : cur.activePlanId, plans: cur.plans.filter(p => p.id !== id) });
    deleteReadPlanData(id);
    if (wasActive) emitProgressChanged();
  }, [commit]);

  const value = useMemo<PlansContextType>(() => {
    const activePlan = state.plans.find(p => p.id === state.activePlanId) ?? null;
    return {
      plans: state.plans,
      activePlanId: state.activePlanId,
      activePlan,
      activePlanName: activePlan?.name ?? DEFAULT_PLAN_NAME,
      setActivePlan, addPlan, updatePlan, removePlan,
    };
  }, [state, setActivePlan, addPlan, updatePlan, removePlan]);

  if (!loaded) return null;
  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
}

export function usePlans(): PlansContextType {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error('usePlans deve ser usado dentro de PlansProvider');
  return ctx;
}
