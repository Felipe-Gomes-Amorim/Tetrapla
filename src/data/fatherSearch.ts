import { FATHER_WORKS } from './fathers';
import { getWorkChapters } from './fatherChapters';

export interface FatherSearchResult {
  workId: string;
  workTitle: string;
  chapter: number;
  chapterLabel: string;
  snippet: string;
  matchIndex: number; // posição do acerto no texto simples do capítulo
}

interface IndexEntry {
  workId: string;
  workTitle: string;
  chapter: number;
  chapterLabel: string;
  plain: string;
  folded: string;
}

const SNIPPET_CHARS = 160;

// Remove acentos e caixa mantendo o mesmo comprimento (para os índices valerem no texto original)
export function foldText(text: string): string {
  const folded = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (folded.length === text.length) return folded;
  let out = '';
  for (const ch of text) {
    const f = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    out += f.length === ch.length ? f : ch.toLowerCase();
  }
  return out.length === text.length ? out : text.toLowerCase();
}

// Markdown -> texto simples (sem **, >, #, [^n] etc.)
function toPlain(markdown: string): string {
  return markdown
    .replace(/^\[\^[^\]]+\]:\s*/gm, '')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^-{3,}\s*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

let index: IndexEntry[] | null = null;
let indexing: Promise<IndexEntry[]> | null = null;

export function isFatherSearchReady(): boolean {
  return index !== null;
}

// Carrega e divide todos os escritos (uma vez). onProgress recebe (feitos, total) para a tela.
export function prepareFatherSearch(onProgress?: (done: number, total: number) => void): Promise<void> {
  if (index) {
    onProgress?.(FATHER_WORKS.length, FATHER_WORKS.length);
    return Promise.resolve();
  }
  if (!indexing) {
    indexing = (async () => {
      const entries: IndexEntry[] = [];
      let done = 0;
      for (const w of FATHER_WORKS) {
        const parsed = await getWorkChapters(w.id);
        for (const ch of parsed.chapters) {
          const plain = toPlain(ch.content);
          entries.push({
            workId: w.id,
            workTitle: w.title,
            chapter: ch.n,
            chapterLabel: ch.title,
            plain,
            folded: foldText(plain),
          });
        }
        onProgress?.(++done, FATHER_WORKS.length);
      }
      index = entries;
      return entries;
    })().finally(() => { indexing = null; });
  }
  return indexing.then(() => undefined);
}

function makeSnippet(plain: string, at: number, len: number): string {
  const half = Math.max(0, Math.floor((SNIPPET_CHARS - len) / 2));
  let start = Math.max(0, at - half);
  let end = Math.min(plain.length, at + len + half);
  // Não corta palavras no meio
  if (start > 0) {
    const sp = plain.indexOf(' ', start);
    if (sp !== -1 && sp < at) start = sp + 1;
  }
  if (end < plain.length) {
    const sp = plain.lastIndexOf(' ', end);
    if (sp > at + len) end = sp;
  }
  return (start > 0 ? '…' : '') + plain.slice(start, end) + (end < plain.length ? '…' : '');
}

// Última busca em memória, para paginar sem refazer
let lastQuery = '';
let lastMatches: { entry: IndexEntry; at: number }[] = [];

// Um resultado por capítulo (o primeiro acerto). Ordem: obras do registro, depois capítulos.
export async function searchFathers(
  query: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ total: number; results: FatherSearchResult[] }> {
  const q = foldText(query.trim());
  if (q.length === 0) return { total: 0, results: [] };

  await prepareFatherSearch();
  const entries = index ?? [];

  if (q !== lastQuery) {
    const matches: { entry: IndexEntry; at: number }[] = [];
    for (const entry of entries) {
      const at = entry.folded.indexOf(q);
      if (at !== -1) matches.push({ entry, at });
    }
    lastQuery = q;
    lastMatches = matches;
  }

  const results = lastMatches.slice(offset, offset + limit).map(({ entry, at }) => ({
    workId: entry.workId,
    workTitle: entry.workTitle,
    chapter: entry.chapter,
    chapterLabel: entry.chapterLabel,
    snippet: makeSnippet(entry.plain, at, q.length),
    matchIndex: at,
  }));
  return { total: lastMatches.length, results };
}
