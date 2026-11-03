import { getFatherWork } from './fathers';
import { loadAssetText } from './fatherText';
import { parseFatherMarkdown, FatherChapter, ParsedWork, INTRO_N, NOTES_N } from './fatherParse';

export type { FatherChapter, ParsedWork };
export { INTRO_N, NOTES_N };

const workCache = new Map<string, ParsedWork>();
const pending = new Map<string, Promise<ParsedWork>>();

// Capítulos de um escrito (cache em memória; o texto é lido do asset na primeira vez)
export function getWorkChapters(workId: string): Promise<ParsedWork> {
  const cached = workCache.get(workId);
  if (cached) return Promise.resolve(cached);
  const inflight = pending.get(workId);
  if (inflight) return inflight;

  const work = getFatherWork(workId);
  if (!work) return Promise.reject(new Error(`Escrito desconhecido: ${workId}`));
  const p = loadAssetText(work.asset)
    .then(text => {
      const parsed = parseFatherMarkdown(text);
      workCache.set(workId, parsed);
      return parsed;
    })
    .finally(() => pending.delete(workId));
  pending.set(workId, p);
  return p;
}

// n: 0 = Introdução, -1 = Notas do tradutor, 1..N = capítulos
export async function getChapter(workId: string, n: number): Promise<FatherChapter | null> {
  const parsed = await getWorkChapters(workId);
  if (n === INTRO_N) return parsed.intro;
  if (n === NOTES_N) return parsed.notes;
  return parsed.chapters[n - 1] ?? null;
}

// Capítulo vizinho na ordem de leitura: Introdução -> 1..N -> Notas do tradutor
export function neighborChapter(parsed: ParsedWork, n: number, delta: 1 | -1): number | null {
  const count = parsed.chapters.length;
  if (delta === 1) {
    if (n === INTRO_N) return count > 0 ? 1 : parsed.notes ? NOTES_N : null;
    if (n === NOTES_N) return null;
    if (n < count) return n + 1;
    return parsed.notes ? NOTES_N : null;
  }
  if (n === INTRO_N) return null;
  if (n === NOTES_N) return count > 0 ? count : INTRO_N;
  return n > 1 ? n - 1 : INTRO_N;
}
