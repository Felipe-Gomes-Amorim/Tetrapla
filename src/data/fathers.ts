// Registro dos escritos dos Pais da Igreja (ANF vol. 1, em português) em assets/fathers/*.md
export interface FatherWork {
  id: string;
  title: string;
  author: string;
  group: string;
  sizeKB: number; // tamanho aproximado do arquivo
  chapterCount: number; // número de '### ' (conferido por scripts/check-father-chapters.mjs)
  asset: number; // resultado do require() do .md
}

const IRENEU = 'Ireneu de Lião';
const APOSTOLICOS = 'Pais Apostólicos';

export const FATHER_WORKS: FatherWork[] = [
  { id: 'primeira-epistola-de-clemente', title: 'Primeira Epístola aos Coríntios', author: 'Clemente de Roma', group: APOSTOLICOS, sizeKB: 77, chapterCount: 59, asset: require('../../assets/fathers/primeira-epistola-de-clemente.md') },
  { id: 'epistola-a-diogneto', title: 'Epístola a Diogneto', author: 'Autor desconhecido ("Mathetes")', group: APOSTOLICOS, sizeKB: 26, chapterCount: 12, asset: require('../../assets/fathers/epistola-a-diogneto.md') },
  { id: 'epistola-de-policarpo-aos-filipenses', title: 'Epístola aos Filipenses', author: 'Policarpo de Esmirna', group: APOSTOLICOS, sizeKB: 17, chapterCount: 15, asset: require('../../assets/fathers/epistola-de-policarpo-aos-filipenses.md') },
  { id: 'martirio-de-policarpo', title: 'Martírio de Policarpo', author: 'Igreja de Esmirna', group: APOSTOLICOS, sizeKB: 25, chapterCount: 23, asset: require('../../assets/fathers/martirio-de-policarpo.md') },
  { id: 'inacio-aos-efesios', title: 'Epístola aos Efésios', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 18, chapterCount: 22, asset: require('../../assets/fathers/inacio-aos-efesios.md') },
  { id: 'inacio-aos-magnesios', title: 'Epístola aos Magnésios', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 12, chapterCount: 16, asset: require('../../assets/fathers/inacio-aos-magnesios.md') },
  { id: 'inacio-aos-tralianos', title: 'Epístola aos Tralianos', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 10, chapterCount: 14, asset: require('../../assets/fathers/inacio-aos-tralianos.md') },
  { id: 'inacio-aos-romanos', title: 'Epístola aos Romanos', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 11, chapterCount: 11, asset: require('../../assets/fathers/inacio-aos-romanos.md') },
  { id: 'inacio-aos-filadelfos', title: 'Epístola aos Filadelfos', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 11, chapterCount: 12, asset: require('../../assets/fathers/inacio-aos-filadelfos.md') },
  { id: 'inacio-aos-esmirnenses', title: 'Epístola aos Esmirnenses', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 12, chapterCount: 14, asset: require('../../assets/fathers/inacio-aos-esmirnenses.md') },
  { id: 'inacio-a-policarpo', title: 'Epístola a Policarpo', author: 'Inácio de Antioquia', group: APOSTOLICOS, sizeKB: 9, chapterCount: 9, asset: require('../../assets/fathers/inacio-a-policarpo.md') },
  { id: 'epistola-de-barnabe', title: 'Epístola de Barnabé', author: 'Atribuída a Barnabé', group: APOSTOLICOS, sizeKB: 57, chapterCount: 21, asset: require('../../assets/fathers/epistola-de-barnabe.md') },
  { id: 'fragmentos-de-papias', title: 'Fragmentos de Papias', author: 'Papias de Hierápolis', group: APOSTOLICOS, sizeKB: 16, chapterCount: 10, asset: require('../../assets/fathers/fragmentos-de-papias.md') },
  { id: 'contra-as-heresias-livro-1', title: 'Contra as Heresias, Livro I', author: IRENEU, group: IRENEU, sizeKB: 204, chapterCount: 32, asset: require('../../assets/fathers/contra-as-heresias-livro-1.md') },
  { id: 'contra-as-heresias-livro-2', title: 'Contra as Heresias, Livro II', author: IRENEU, group: IRENEU, sizeKB: 267, chapterCount: 36, asset: require('../../assets/fathers/contra-as-heresias-livro-2.md') },
  { id: 'contra-as-heresias-livro-3', title: 'Contra as Heresias, Livro III', author: IRENEU, group: IRENEU, sizeKB: 223, chapterCount: 26, asset: require('../../assets/fathers/contra-as-heresias-livro-3.md') },
  { id: 'contra-as-heresias-livro-4', title: 'Contra as Heresias, Livro IV', author: IRENEU, group: IRENEU, sizeKB: 307, chapterCount: 42, asset: require('../../assets/fathers/contra-as-heresias-livro-4.md') },
  { id: 'contra-as-heresias-livro-5', title: 'Contra as Heresias, Livro V', author: IRENEU, group: IRENEU, sizeKB: 209, chapterCount: 37, asset: require('../../assets/fathers/contra-as-heresias-livro-5.md') },
];

export function getFatherWork(id: string): FatherWork | undefined {
  return FATHER_WORKS.find(w => w.id === id);
}

// Grupos na ordem de aparição
export function getFatherGroups(): { group: string; works: FatherWork[] }[] {
  const groups: { group: string; works: FatherWork[] }[] = [];
  for (const w of FATHER_WORKS) {
    let g = groups.find(x => x.group === w.group);
    if (!g) groups.push((g = { group: w.group, works: [] }));
    g.works.push(w);
  }
  return groups;
}
