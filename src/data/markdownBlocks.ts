// Divide um texto Markdown em blocos independentes para renderizar em FlatList.
// Mantém listas, citações, tabelas e blocos de código inteiros e agrupa parágrafos
// pequenos; notas de rodapé ([^id]) viram sobrescritos com a nota logo após o bloco.

export interface MdBlock {
  key: string;
  kind: 'md' | 'note';
  text: string;
}

const MAX_BLOCK_CHARS = 2000;
const SUPERSCRIPT = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

function toSuperscript(n: number): string {
  return String(n).split('').map(d => SUPERSCRIPT[Number(d)]).join('');
}

const isListStart = (c: string) => /^\s{0,3}([-*+]|\d+[.)])\s/.test(c);
const isHeading = (c: string) => /^#{1,6}\s/.test(c);

export function splitMarkdown(source: string): MdBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');

  // 1) Separa as definições de notas de rodapé do corpo
  const notes = new Map<string, string>();
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
    notes.set(m[1], text);
  }

  // 2) Chunks separados por linha em branco (respeitando cercas de código)
  const chunks: string[] = [];
  let cur: string[] = [];
  let inFence = false;
  for (const line of body) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === '') {
      if (cur.length) chunks.push(cur.join('\n'));
      cur = [];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) chunks.push(cur.join('\n'));

  // 3) Junta continuações de lista (itens separados por linha em branco / recuados)
  const merged: string[] = [];
  for (const c of chunks) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && isListStart(prev.split('\n')[0]) && (/^\s{2,}\S/.test(c) || isListStart(c))) {
      merged[merged.length - 1] = prev + '\n\n' + c;
    } else {
      merged.push(c);
    }
  }

  // 4) Agrupa em blocos; cabeçalho começa bloco novo e fica junto do que vem depois
  const groups: string[] = [];
  let buf = '';
  let bufEndsHeading = false;
  for (const c of merged) {
    const heading = isHeading(c);
    if (buf && !bufEndsHeading && (heading || buf.length + c.length > MAX_BLOCK_CHARS)) {
      groups.push(buf);
      buf = '';
    }
    buf = buf ? buf + '\n\n' + c : c;
    bufEndsHeading = heading;
  }
  if (buf) groups.push(buf);

  // 5) Notas de rodapé: referência vira sobrescrito; nota entra após o bloco
  const numbers = new Map<string, number>();
  const blocks: MdBlock[] = [];
  groups.forEach((g, i) => {
    const used: string[] = [];
    const text = g.replace(/\[\^([^\]]+)\]/g, (whole, id: string) => {
      if (!notes.has(id)) return whole;
      if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
      if (!used.includes(id)) used.push(id);
      return toSuperscript(numbers.get(id)!);
    });
    blocks.push({ key: `b${i}`, kind: 'md', text });
    used.forEach(id => {
      blocks.push({ key: `b${i}-n${id}`, kind: 'note', text: `${toSuperscript(numbers.get(id)!)} ${notes.get(id)}` });
    });
  });
  return blocks;
}
