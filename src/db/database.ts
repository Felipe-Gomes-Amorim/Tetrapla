import * as SQLite from 'expo-sqlite';

export async function getVerses(db: SQLite.SQLiteDatabase, book: string, chapter: number) {
  return db.getAllAsync<{
    verse: number; pt: string; lat: string;
    grc: string; heb: string; aram: string;
  }>(
    `SELECT verse, pt, lat, grc, heb, aram
     FROM verses WHERE book = ? AND chapter = ?
     ORDER BY verse`,
    [book, chapter]
  );
}

export async function getPatristicRefs(
  db: SQLite.SQLiteDatabase,
  book: string, chapter: number, verse: number
) {
  return db.getAllAsync<{ id: number; author: string; work: string; quote: string }>(
    `SELECT id, author, work, quote
     FROM patristic_refs
     WHERE book = ? AND chapter = ? AND verse = ?
     ORDER BY author`,
    [book, chapter, verse]
  );
}

export async function getPatristicCountsForChapter(
  db: SQLite.SQLiteDatabase,
  book: string, chapter: number
): Promise<Record<number, number>> {
  console.log('🔍 Buscando counts:', book, chapter);
  const rows = await db.getAllAsync<{ verse: number; n: number }>(
    `SELECT verse, COUNT(*) as n
     FROM patristic_refs
     WHERE book = ? AND chapter = ?
     GROUP BY verse`,
    [book, chapter]
  );
  console.log('✅ Counts encontrados:', rows.length, 'versículos com referências');
  if (rows.length > 0) {
    console.log('   Amostra:', rows.slice(0, 3));
  }
  const counts: Record<number, number> = {};
  for (const row of rows) counts[row.verse] = row.n;
  return counts;
}

export async function getPreface(db: SQLite.SQLiteDatabase, book: string) {
  return db.getAllAsync<{ title: string; content_eng: string }>(
    `SELECT title, content_eng FROM book_prefaces WHERE book = ?`,
    [book]
  );
}

export async function searchVerses(db: SQLite.SQLiteDatabase, searchText: string) {
  return db.getAllAsync<{
    book: string; chapter: number; verse: number; pt: string;
  }>(
    `SELECT book, chapter, verse, pt
     FROM verses
     WHERE pt LIKE ?
     ORDER BY book, chapter, verse
     LIMIT 100`,
    [`%${searchText}%`]
  );
}

export const BOOKS = [
  { code: 'GEN', name: 'Gênesis', chapters: 50 },
  { code: 'EXO', name: 'Êxodo', chapters: 40 },
  { code: 'LEV', name: 'Levítico', chapters: 27 },
  { code: 'NUM', name: 'Números', chapters: 36 },
  { code: 'DEU', name: 'Deuteronômio', chapters: 34 },
  { code: 'JOS', name: 'Josué', chapters: 24 },
  { code: 'JDG', name: 'Juízes', chapters: 21 },
  { code: 'RUT', name: 'Rute', chapters: 4 },
  { code: '1SA', name: '1 Samuel', chapters: 31 },
  { code: '2SA', name: '2 Samuel', chapters: 24 },
  { code: '1KI', name: '1 Reis', chapters: 22 },
  { code: '2KI', name: '2 Reis', chapters: 25 },
  { code: '1CH', name: '1 Crônicas', chapters: 29 },
  { code: '2CH', name: '2 Crônicas', chapters: 36 },
  { code: 'EZR', name: 'Esdras', chapters: 10 },
  { code: 'NEH', name: 'Neemias', chapters: 13 },
  { code: 'TOB', name: 'Tobias', chapters: 14 },
  { code: 'JDT', name: 'Judite', chapters: 16 },
  { code: 'EST', name: 'Ester', chapters: 10 },
  { code: '1MA', name: '1 Macabeus', chapters: 16 },
  { code: '2MA', name: '2 Macabeus', chapters: 15 },
  { code: 'JOB', name: 'Jó', chapters: 42 },
  { code: 'PSA', name: 'Salmos', chapters: 150 },
  { code: 'PRO', name: 'Provérbios', chapters: 31 },
  { code: 'ECC', name: 'Eclesiastes', chapters: 12 },
  { code: 'SNG', name: 'Cânticos', chapters: 8 },
  { code: 'WIS', name: 'Sabedoria', chapters: 19 },
  { code: 'SIR', name: 'Eclesiástico', chapters: 51 },
  { code: 'ISA', name: 'Isaías', chapters: 66 },
  { code: 'JER', name: 'Jeremias', chapters: 52 },
  { code: 'LAM', name: 'Lamentações', chapters: 5 },
  { code: 'BAR', name: 'Baruc', chapters: 6 },
  { code: 'EZK', name: 'Ezequiel', chapters: 48 },
  { code: 'DAN', name: 'Daniel', chapters: 14 },
  { code: 'HOS', name: 'Oséias', chapters: 14 },
  { code: 'JOL', name: 'Joel', chapters: 3 },
  { code: 'AMO', name: 'Amós', chapters: 9 },
  { code: 'OBA', name: 'Obadias', chapters: 1 },
  { code: 'JON', name: 'Jonas', chapters: 4 },
  { code: 'MIC', name: 'Miquéias', chapters: 7 },
  { code: 'NAH', name: 'Naum', chapters: 3 },
  { code: 'HAB', name: 'Habacuc', chapters: 3 },
  { code: 'ZEP', name: 'Sofonias', chapters: 3 },
  { code: 'HAG', name: 'Ageu', chapters: 2 },
  { code: 'ZEC', name: 'Zacarias', chapters: 14 },
  { code: 'MAL', name: 'Malaquias', chapters: 4 },
  { code: 'MAT', name: 'Mateus', chapters: 28 },
  { code: 'MRK', name: 'Marcos', chapters: 16 },
  { code: 'LUK', name: 'Lucas', chapters: 24 },
  { code: 'JHN', name: 'João', chapters: 21 },
  { code: 'ACT', name: 'Atos', chapters: 28 },
  { code: 'ROM', name: 'Romanos', chapters: 16 },
  { code: '1CO', name: '1 Coríntios', chapters: 16 },
  { code: '2CO', name: '2 Coríntios', chapters: 13 },
  { code: 'GAL', name: 'Gálatas', chapters: 6 },
  { code: 'EPH', name: 'Efésios', chapters: 6 },
  { code: 'PHP', name: 'Filipenses', chapters: 4 },
  { code: 'COL', name: 'Colossenses', chapters: 4 },
  { code: '1TH', name: '1 Tessalonicenses', chapters: 5 },
  { code: '2TH', name: '2 Tessalonicenses', chapters: 3 },
  { code: '1TI', name: '1 Timóteo', chapters: 6 },
  { code: '2TI', name: '2 Timóteo', chapters: 4 },
  { code: 'TIT', name: 'Tito', chapters: 3 },
  { code: 'PHM', name: 'Filemon', chapters: 1 },
  { code: 'HEB', name: 'Hebreus', chapters: 13 },
  { code: 'JAS', name: 'Tiago', chapters: 5 },
  { code: '1PE', name: '1 Pedro', chapters: 5 },
  { code: '2PE', name: '2 Pedro', chapters: 3 },
  { code: '1JN', name: '1 João', chapters: 5 },
  { code: '2JN', name: '2 João', chapters: 1 },
  { code: '3JN', name: '3 João', chapters: 1 },
  { code: 'JUD', name: 'Judas', chapters: 1 },
  { code: 'REV', name: 'Apocalipse', chapters: 22 },
];

// Livros do Antigo Testamento (para diferenciar LXX de SBLGNT)
export const OLD_TESTAMENT_BOOKS = new Set([
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'TOB', 'JDT', 'EST', '1MA', '2MA',
  'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'WIS', 'SIR', 'ISA', 'JER', 'LAM',
  'BAR', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAH',
  'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'
]);

// Livros Apócrifos (só têm em latim e grego, não em português)
export const APOCRYPHAL_BOOKS = new Set(['TOB', 'JDT', '1MA', '2MA', 'WIS', 'SIR', 'BAR']);

export function isOldTestament(bookCode: string): boolean {
  return OLD_TESTAMENT_BOOKS.has(bookCode);
}

export function isApocryphal(bookCode: string): boolean {
  return APOCRYPHAL_BOOKS.has(bookCode);
}

// ===== PROGRESSO DE LEITURA (FileSystem) =====
import * as FileSystem from 'expo-file-system/legacy';

const READ_CHAPTERS_DIR = `${FileSystem.documentDirectory}read_chapters/`;

export async function ensureReadChaptersDir() {
  const dirInfo = await FileSystem.getInfoAsync(READ_CHAPTERS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(READ_CHAPTERS_DIR, { intermediates: true });
  }
}

export async function markChapterAsRead(bookCode: string, chapter: number) {
  try {
    await ensureReadChaptersDir();
    const filePath = `${READ_CHAPTERS_DIR}${bookCode}_${chapter}.txt`;
    await FileSystem.writeAsStringAsync(filePath, 'read');
  } catch (e) {
    console.error(`Erro ao marcar ${bookCode}_${chapter} como lido:`, e);
  }
}

export async function unmarkChapterAsRead(bookCode: string, chapter: number) {
  try {
    const filePath = `${READ_CHAPTERS_DIR}${bookCode}_${chapter}.txt`;
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch (e) {
    console.error(`Erro ao desmarcar ${bookCode}_${chapter}:`, e);
  }
}

export async function isChapterRead(bookCode: string, chapter: number): Promise<boolean> {
  try {
    const filePath = `${READ_CHAPTERS_DIR}${bookCode}_${chapter}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  } catch (e) {
    console.error(`Erro ao verificar se ${bookCode}_${chapter} foi lido:`, e);
    return false;
  }
}

export async function getTotalReadProgress(): Promise<number> {
  try {
    let totalChapters = 0;
    for (const book of BOOKS) {
      totalChapters += book.chapters;
    }

    // Contar capítulos lidos
    let readChapters = 0;
    try {
      await ensureReadChaptersDir();
      const files = await FileSystem.readDirectoryAsync(READ_CHAPTERS_DIR);
      readChapters = files.length;
    } catch (e) {
      // Diretório vazio
    }

    return (readChapters / totalChapters) * 100;
  } catch (e) {
    console.error('Erro ao calcular progresso total:', e);
    return 0;
  }
}

export async function getBooksWithReadProgress() {
  try {
    let readFiles: string[] = [];
    try {
      await ensureReadChaptersDir();
      readFiles = await FileSystem.readDirectoryAsync(READ_CHAPTERS_DIR);
    } catch (e) {
      // Diretório vazio
    }

    // Parsear arquivos para um mapa {book: set(chapters)}
    const readMap: Record<string, Set<number>> = {};
    for (const file of readFiles) {
      const match = file.match(/^([A-Z0-9]+)_(\d+)\.txt$/);
      if (match) {
        const bookCode = match[1];
        const chapter = parseInt(match[2], 10);
        if (!readMap[bookCode]) readMap[bookCode] = new Set();
        readMap[bookCode].add(chapter);
      }
    }

    // Mapear para resultado
    const result = BOOKS.map(book => ({
      code: book.code,
      name: book.name,
      totalChapters: book.chapters,
      readChapters: readMap[book.code]?.size ?? 0,
    }));

    return result;
  } catch (e) {
    console.error('Erro ao obter progresso por livro:', e);
    return BOOKS.map(book => ({
      code: book.code,
      name: book.name,
      totalChapters: book.chapters,
      readChapters: 0,
    }));
  }
}

// ===== INICIALIZAÇÃO DO BANCO =====
export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  try {
    // Criar tabela patristic_refs se não existir
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS patristic_refs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        author TEXT NOT NULL,
        work TEXT NOT NULL,
        quote TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_patristic_refs ON patristic_refs(book, chapter, verse);
    `);

    // Criar tabela book_prefaces se não existir
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS book_prefaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book TEXT NOT NULL UNIQUE,
        title TEXT,
        content_eng TEXT
      );
    `);

    // Verificar quantos dados existem
    const refCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM patristic_refs'
    );
    const prefaceCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM book_prefaces'
    );

    console.log('✅ Tabelas de referências patrísticas e prefácios criadas/verificadas');
    console.log(`   📚 Referências patrísticas: ${refCount?.count || 0} registros`);
    console.log(`   📖 Prefácios de livros: ${prefaceCount?.count || 0} registros`);

    if ((refCount?.count || 0) === 0) {
      console.warn('⚠️  AVISO: Nenhuma referência patrística encontrada no banco!');
    }
    if ((prefaceCount?.count || 0) === 0) {
      console.warn('⚠️  AVISO: Nenhum prefácio encontrado no banco!');
    }
  } catch (e) {
    console.error('❌ Erro ao criar tabelas:', e);
  }
}