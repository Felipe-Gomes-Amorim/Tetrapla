import { BOOKS, isApocryphal } from '../db/database';
import type { OtOrder } from '../contexts/SettingsContext';

export type { OtOrder };

export interface BookGroup {
  key: string;
  title: string;
  codes: string[];
}

const DEUTERO: BookGroup = {
  key: 'deutero',
  title: 'Deuterocanônicos',
  codes: ['TOB', 'JDT', 'WIS', 'SIR', 'BAR', '1MA', '2MA'],
};

const OT_CHRISTIAN: BookGroup[] = [
  { key: 'pentateuco', title: 'Pentateuco', codes: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'] },
  {
    key: 'historicos',
    title: 'Livros Históricos',
    codes: ['JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'],
  },
  { key: 'poeticos', title: 'Sapienciais/Poéticos', codes: ['JOB', 'PSA', 'PRO', 'ECC', 'SNG'] },
  {
    key: 'profetas',
    title: 'Profetas',
    codes: ['ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'],
  },
];

const OT_JEWISH: BookGroup[] = [
  { key: 'tora', title: 'Torá', codes: ['GEN', 'EXO', 'LEV', 'NUM', 'DEU'] },
  {
    key: 'neviim',
    title: 'Neviim (Profetas)',
    codes: ['JOS', 'JDG', '1SA', '2SA', '1KI', '2KI', 'ISA', 'JER', 'EZK', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAH', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'],
  },
  {
    key: 'ketuvim',
    title: 'Ketuvim (Escritos)',
    codes: ['PSA', 'JOB', 'PRO', 'RUT', 'SNG', 'ECC', 'LAM', 'EST', 'DAN', 'EZR', 'NEH', '1CH', '2CH'],
  },
];

const NT: BookGroup[] = [
  { key: 'evangelhos', title: 'Evangelhos', codes: ['MAT', 'MRK', 'LUK', 'JHN'] },
  { key: 'atos', title: 'Atos', codes: ['ACT'] },
  {
    key: 'paulinas',
    title: 'Cartas Paulinas',
    codes: ['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB'],
  },
  { key: 'catolicas', title: 'Cartas Católicas (Gerais)', codes: ['JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'] },
  { key: 'apocalipse', title: 'Apocalipse', codes: ['REV'] },
];

export function getBookGroups(otOrder: OtOrder, showDeuterocanonical: boolean): BookGroup[] {
  const ot = otOrder === 'jewish' ? OT_JEWISH : OT_CHRISTIAN;
  return [...ot, ...(showDeuterocanonical ? [DEUTERO] : []), ...NT];
}

type Book = (typeof BOOKS)[number];

export type BookListRow =
  | { type: 'header'; key: string; title: string }
  | { type: 'book'; key: string; book: Book };

// Achata os grupos em linhas (cabeçalho + livros), já aplicando o filtro; grupos vazios são omitidos.
export function buildGroupedRows(
  otOrder: OtOrder,
  showDeuterocanonical: boolean,
  filter: (book: Book) => boolean
): BookListRow[] {
  const byCode = new Map(BOOKS.map(b => [b.code, b]));
  const rows: BookListRow[] = [];
  for (const g of getBookGroups(otOrder, showDeuterocanonical)) {
    const books = g.codes
      .map(c => byCode.get(c))
      .filter((b): b is Book => !!b && (showDeuterocanonical || !isApocryphal(b.code)) && filter(b));
    if (books.length === 0) continue;
    rows.push({ type: 'header', key: `h-${g.key}`, title: g.title });
    for (const b of books) rows.push({ type: 'book', key: b.code, book: b });
  }
  return rows;
}
