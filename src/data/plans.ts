// Metas de leitura: cada uma tem nome, cor e progresso próprio (pasta própria de capítulos lidos).
// A meta "Padrão" sempre existe, usa o verde original e guarda o progresso na pasta read_chapters/ de antes.
export interface ReadingPlan {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_PLAN_ID = 'default';
export const DEFAULT_PLAN_NAME = 'Padrão';

// Cores oferecidas ao criar/editar uma meta (o verde padrão fica de fora)
export const PLAN_COLORS = [
  '#E53935', '#F4511E', '#FB8C00', '#C0A000', '#7CB342',
  '#00897B', '#00ACC1', '#3949AB', '#8E24AA', '#D81B60',
  '#6D4C41', '#546E7A',
];

export interface StoredPlans {
  activePlanId: string;
  plans: ReadingPlan[];
}

export const EMPTY_PLANS: StoredPlans = { activePlanId: DEFAULT_PLAN_ID, plans: [] };

// Valida o conteúdo lido do disco (campos inválidos são descartados)
export function sanitizePlans(raw: any): StoredPlans {
  const plans: ReadingPlan[] = [];
  const seen = new Set<string>([DEFAULT_PLAN_ID]);
  if (Array.isArray(raw?.plans)) {
    for (const p of raw.plans) {
      if (p && typeof p.id === 'string' && typeof p.name === 'string' && /^#[0-9a-fA-F]{6}$/.test(p.color ?? '') && !seen.has(p.id)) {
        seen.add(p.id);
        plans.push({ id: p.id, name: p.name, color: p.color });
      }
    }
  }
  const active = typeof raw?.activePlanId === 'string' && seen.has(raw.activePlanId) ? raw.activePlanId : DEFAULT_PLAN_ID;
  return { activePlanId: active, plans };
}

export function newPlanId(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
