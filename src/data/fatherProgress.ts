import * as FileSystem from 'expo-file-system/legacy';
import { FATHER_WORKS, getFatherWork } from './fathers';
import { emitProgressChanged } from './progressEvents';

// Progresso de leitura dos Pais, separado do da Bíblia (read_chapters/):
// um JSON único { [workId]: number[] } com os capítulos lidos (1..N; Introdução e Notas não contam).
const PROGRESS_FILE = `${FileSystem.documentDirectory}father_progress.json`;

type ProgressMap = Record<string, number[]>;

let cache: ProgressMap | null = null;
let loading: Promise<ProgressMap> | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let progressVersion = 0;

// Muda a cada marcação/desmarcação: as telas usam para pular o refresh quando nada mudou
export function getFatherProgressVersion(): number {
  return progressVersion;
}

async function readFromDisk(): Promise<ProgressMap> {
  try {
    const info = await FileSystem.getInfoAsync(PROGRESS_FILE);
    if (!info.exists) return {};
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(PROGRESS_FILE));
    const result: ProgressMap = {};
    if (parsed && typeof parsed === 'object') {
      for (const [id, list] of Object.entries(parsed)) {
        if (Array.isArray(list)) {
          result[id] = Array.from(new Set(list.filter(n => Number.isInteger(n) && n >= 1))) as number[];
        }
      }
    }
    return result;
  } catch (e) {
    // Arquivo ausente ou corrompido: começa vazio
    return {};
  }
}

function load(): Promise<ProgressMap> {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = readFromDisk().then(map => {
      cache = map;
      loading = null;
      return map;
    });
  }
  return loading;
}

// Gravações em série, para duas marcações seguidas não se atropelarem
function persist(): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    try {
      await FileSystem.writeAsStringAsync(PROGRESS_FILE, JSON.stringify(cache ?? {}));
    } catch (e) {
      console.error('Erro ao salvar progresso dos Pais:', e);
    }
  });
  return writeQueue;
}

export async function getReadChapters(workId: string): Promise<Set<number>> {
  const map = await load();
  return new Set(map[workId] ?? []);
}

export async function isChapterRead(workId: string, n: number): Promise<boolean> {
  const map = await load();
  return (map[workId] ?? []).includes(n);
}

export async function markChapterRead(workId: string, n: number): Promise<void> {
  const map = await load();
  const list = map[workId] ?? [];
  if (list.includes(n)) return;
  map[workId] = [...list, n].sort((a, b) => a - b);
  progressVersion++;
  await persist();
  emitProgressChanged();
}

export async function unmarkChapterRead(workId: string, n: number): Promise<void> {
  const map = await load();
  const list = map[workId];
  if (!list || !list.includes(n)) return;
  map[workId] = list.filter(x => x !== n);
  progressVersion++;
  await persist();
  emitProgressChanged();
}

// Capítulos lidos que ainda existem no escrito (descarta números fora de 1..total)
function validReadCount(workId: string, total: number, map: ProgressMap): number {
  return (map[workId] ?? []).filter(n => n >= 1 && n <= total).length;
}

export async function getWorksProgress(): Promise<
  { id: string; title: string; author: string; group: string; read: number; total: number }[]
> {
  const map = await load();
  return FATHER_WORKS.map(w => ({
    id: w.id,
    title: w.title,
    author: w.author,
    group: w.group,
    read: validReadCount(w.id, w.chapterCount, map),
    total: w.chapterCount,
  }));
}

export async function getTotalProgress(): Promise<{ read: number; total: number; percent: number }> {
  const map = await load();
  let read = 0;
  let total = 0;
  for (const w of FATHER_WORKS) {
    total += w.chapterCount;
    read += validReadCount(w.id, w.chapterCount, map);
  }
  return { read, total, percent: total > 0 ? (read / total) * 100 : 0 };
}

export function getWorkChapterCount(workId: string): number {
  return getFatherWork(workId)?.chapterCount ?? 0;
}
