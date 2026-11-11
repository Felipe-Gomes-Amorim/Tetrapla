import * as FileSystem from 'expo-file-system/legacy';

// Tamanho da fonte dos leitores (Bíblia e Pais): lido do disco uma vez e guardado em memória,
// para os leitores já abrirem com o tamanho certo (sem renderizar duas vezes).
const FILE = `${FileSystem.documentDirectory}fontsize.txt`;
const DEFAULT_SIZE = 16;

let cached: number | null = null;
let loading: Promise<number> | null = null;

export function getCachedFontSize(): number {
  return cached ?? DEFAULT_SIZE;
}

export function loadFontSize(): Promise<number> {
  if (cached !== null) return Promise.resolve(cached);
  if (!loading) {
    loading = FileSystem.readAsStringAsync(FILE)
      .then(content => {
        const size = parseInt(content, 10);
        cached = size > 0 ? size : DEFAULT_SIZE;
        return cached;
      })
      .catch(() => {
        cached = DEFAULT_SIZE; // sem preferência salva
        return cached;
      })
      .finally(() => { loading = null; });
  }
  return loading;
}

export async function saveFontSize(size: number): Promise<void> {
  cached = size;
  try {
    await FileSystem.writeAsStringAsync(FILE, String(size));
  } catch (e) {
    console.error('Erro ao salvar fontSize:', e);
  }
}
