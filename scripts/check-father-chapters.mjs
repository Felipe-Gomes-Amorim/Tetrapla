// Confere o chapterCount de src/data/fathers.ts com a divisão real dos .md em capítulos.
// Uso: node --experimental-strip-types scripts/check-father-chapters.mjs
import fs from 'node:fs';
import { parseFatherMarkdown } from '../src/data/fatherParse.ts';

const registry = fs.readFileSync('src/data/fathers.ts', 'utf8');
let bad = 0;
for (const m of registry.matchAll(/id: '([^']+)'.*?chapterCount: (\d+)/g)) {
  const [, id, declared] = m;
  const parsed = parseFatherMarkdown(fs.readFileSync(`assets/fathers/${id}.md`, 'utf8'));
  const real = parsed.chapters.length;
  const ok = real === Number(declared);
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'ERRO'} ${id.padEnd(40)} declarado=${declared} real=${real}${parsed.notes ? ' +notas' : ''}`);
}
process.exit(bad ? 1 : 0);
