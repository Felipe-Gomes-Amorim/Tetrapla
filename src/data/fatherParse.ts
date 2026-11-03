// Divide o Markdown de um escrito em capítulos (cada '### '). Módulo puro (sem React Native),
// para poder rodar também em scripts Node (scripts/check-father-chapters.mjs).

export interface FatherChapter {
  // 0 = Introdução, -1 = Notas do tradutor, 1..N = capítulos (só estes contam no progresso)
  n: number;
  // Rótulo curto para a grade: 'Saudação', 'Prefácio', 'I', 'II'... ('Fragmento III' -> 'III')
  label: string;
  // Título completo: 'Capítulo I', 'Fragmento III', 'Saudação', 'Introdução'...
  title: string;
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

function shortLabel(title: string): string {
  const m = title.match(/^(?:Capítulo|Fragmento)\s+(.+)$/i);
  return m ? m[1] : title;
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
    .map((r, i) => ({
      n: i + 1,
      label: shortLabel(r.title),
      title: r.title,
      content: withFootnotes(r.lines),
    }));

  // 4) Notas do tradutor: lista de todas as notas, na ordem do arquivo
  let notes: FatherChapter | null = null;
  const notesRaw = raws.find(r => r.kind === 'notes');
  if (notesRaw && footnotes.size > 0) {
    const items = Array.from(footnotes.values()).map(t => `- ${t}`).join('\n');
    notes = {
      n: NOTES_N,
      label: 'Notas',
      title: 'Notas do tradutor',
      content: `## Notas do tradutor\n\n${items}`,
    };
  }

  return {
    intro: {
      n: INTRO_N,
      label: 'Introdução',
      title: 'Introdução',
      content: withFootnotes(intro.lines),
    },
    chapters,
    notes,
  };
}
