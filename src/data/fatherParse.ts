// Divide o Markdown de um escrito em capítulos (cada '### '). Módulo puro (sem React Native),
// para poder rodar também em scripts Node (scripts/check-father-chapters.mjs).

export interface FatherChapter {
  // 0 = Introdução, -1 = Notas do tradutor, 1..N = capítulos (só estes contam no progresso)
  n: number;
  // Rótulo curto para a grade: 'Saudação', 'Prefácio', 'I', 'II'... ('Fragmento III' -> 'III')
  label: string;
  // Título completo: 'Capítulo 1', 'Fragmento 3', 'Saudação', 'Introdução'...
  title: string;
  // Subtítulo em itálico que abre o capítulo (sem os asteriscos); sai do conteúdo e vira destaque no leitor
  subtitle: string | null;
  // Markdown do capítulo, já com as definições [^id]: das notas que ele cita
  content: string;
}

export interface ParsedWork {
  intro: FatherChapter;
  chapters: FatherChapter[];
  notes: FatherChapter | null;
}

export const INTRO_N = 0;
export const NOTES_N = -1;

const NOTES_HEADING = /^##\s+Notas do tradutor\s*$/i;

const ROMAN = /^[IVXLCDM]+$/;
const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

// 'XIV' -> 14 (o app usa algarismos arábicos, como na seção da Bíblia)
function romanToArabic(roman: string): number {
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const v = ROMAN_VALUES[roman[i]];
    const next = ROMAN_VALUES[roman[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

// 'Capítulo IV' -> 'Capítulo 4'; 'Livro II' -> 'Livro 2'; demais títulos ficam como estão
export function arabicTitle(title: string): string {
  return title.replace(/^(Capítulo|Fragmento|Livro)\s+([IVXLCDM]+)$/i, (_m, word, num) =>
    ROMAN.test(num) ? `${word} ${romanToArabic(num)}` : _m);
}

function shortLabel(title: string): string {
  const m = title.match(/^(?:Capítulo|Fragmento)\s+(.+)$/i);
  return m ? m[1] : title;
}

// Título de capítulo numerado: o leitor não o repete no corpo
const NUMBERED_TITLE = /^(Capítulo|Fragmento)\s/i;
const SUBTITLE_LINE = /^\*([^*].*?)\*((?:\[\^[^\]]+\])*)$/;

// Separa o subtítulo em itálico (primeira linha de texto depois do título) do restante
function splitChapterBody(rawLines: string[], title: string): { subtitle: string | null; lines: string[] } {
  const numbered = NUMBERED_TITLE.test(title);
  const rest = rawLines.slice(1); // sem a linha '### ...'
  let i = 0;
  while (i < rest.length && rest[i].trim() === '') i++;
  // Só capítulos numerados têm o subtítulo destacado; Saudação, Prefácio e similares ficam como estão
  if (!numbered) return { subtitle: null, lines: rawLines };
  const m = i < rest.length ? rest[i].trim().match(SUBTITLE_LINE) : null;
  const subtitle = m ? m[1].trim() : null;
  // Nota de rodapé colada ao subtítulo passa para o começo do corpo, para não se perder
  const body = m ? [...(m[2] ? [m[2], ''] : []), ...rest.slice(i + 1)] : rest;
  return { subtitle, lines: body };
}

function trimBlock(lines: string[]): string[] {
  const out = lines.slice();
  const isEmptyOrRule = (l: string) => l.trim() === '' || /^-{3,}\s*$/.test(l.trim());
  while (out.length && isEmptyOrRule(out[out.length - 1])) out.pop();
  while (out.length && out[0].trim() === '') out.shift();
  return out;
}

export function parseFatherMarkdown(source: string): ParsedWork {
  const lines = source.replace(/\r\n/g, '\n').split('\n');

  // 1) Definições de notas de rodapé: saem do corpo e voltam só nos capítulos que as citam
  const footnotes = new Map<string, string>();
  const body: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
    if (!m) {
      body.push(lines[i]);
      continue;
    }
    let text = m[2];
    while (i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) {
      text += ' ' + lines[++i].trim();
    }
    footnotes.set(m[1], text);
  }

  // 2) Seções: introdução, capítulos ('### ') e notas finais ('## Notas do tradutor')
  type Raw = { kind: 'intro' | 'chapter' | 'notes'; title: string; lines: string[] };
  const intro: Raw = { kind: 'intro', title: 'Introdução', lines: [] };
  const raws: Raw[] = [];
  let current: Raw = intro;
  let inFence = false;
  for (const line of body) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && current.kind !== 'notes') {
      if (NOTES_HEADING.test(line)) {
        current = { kind: 'notes', title: 'Notas do tradutor', lines: [] };
        raws.push(current);
        continue;
      }
      const h = line.match(/^###\s+(.+?)\s*$/);
      if (h) {
        current = { kind: 'chapter', title: h[1], lines: [line] };
        raws.push(current);
        continue;
      }
    }
    current.lines.push(line);
  }

  // 3) Cada seção leva as definições das notas que cita
  const withFootnotes = (blockLines: string[]): string => {
    const text = trimBlock(blockLines).join('\n');
    const ids: string[] = [];
    for (const m of text.matchAll(/\[\^([^\]]+)\]/g)) {
      if (footnotes.has(m[1]) && !ids.includes(m[1])) ids.push(m[1]);
    }
    if (!ids.length) return text;
    return text + '\n\n' + ids.map(id => `[^${id}]: ${footnotes.get(id)}`).join('\n\n');
  };

  const chapters: FatherChapter[] = raws
    .filter(r => r.kind === 'chapter')
    .map((r, i) => {
      const { subtitle, lines } = splitChapterBody(r.lines, r.title);
      const title = arabicTitle(r.title);
      return {
        n: i + 1,
        label: shortLabel(title),
        title,
        subtitle,
        content: withFootnotes(lines),
      };
    });

  // 4) Notas do tradutor: lista de todas as notas, na ordem do arquivo
  let notes: FatherChapter | null = null;
  const notesRaw = raws.find(r => r.kind === 'notes');
  if (notesRaw && footnotes.size > 0) {
    const items = Array.from(footnotes.values()).map(t => `- ${t}`).join('\n');
    notes = {
      n: NOTES_N,
      label: 'Notas',
      title: 'Notas do tradutor',
      subtitle: null,
      content: `## Notas do tradutor\n\n${items}`,
    };
  }

  return {
    intro: {
      n: INTRO_N,
      label: 'Introdução',
      title: 'Introdução',
      subtitle: null,
      content: withFootnotes(intro.lines),
    },
    chapters,
    notes,
  };
}
