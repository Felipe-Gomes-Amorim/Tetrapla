// STUB temporário (T3): o T2 entrega a versão real com estas assinaturas; no merge o arquivo do T2 vence.
export interface FatherSearchResult {
  workId: string;
  workTitle: string;
  chapter: number;
  chapterLabel: string;
  snippet: string;
  matchIndex: number;
}

export async function searchFathers(
  query: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ total: number; results: FatherSearchResult[] }> {
  return { total: 0, results: [] };
}
