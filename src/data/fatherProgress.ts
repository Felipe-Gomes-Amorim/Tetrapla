// STUB temporário (T3): o T2 entrega a versão real com estas assinaturas; no merge o arquivo do T2 vence.
export interface WorkProgress {
  id: string;
  title: string;
  author: string;
  group: string;
  read: number;
  total: number;
}

export async function getTotalProgress(): Promise<{ read: number; total: number; percent: number }> {
  return { read: 0, total: 0, percent: 0 };
}

export async function getWorksProgress(): Promise<WorkProgress[]> {
  return [];
}
