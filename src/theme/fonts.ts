export const BRAND_FONT_NAME = 'AlfaSlabOne';

let brandFontLoaded = false;

export function setBrandFontLoaded(loaded: boolean) {
  brandFontLoaded = loaded;
}

// Retorna o estilo da fonte da marca; vazio se a fonte falhou ao carregar (cai na fonte do sistema).
export function brandFont() {
  return brandFontLoaded ? { fontFamily: BRAND_FONT_NAME, fontWeight: 'normal' as const } : {};
}

export const SUB_FONT_NAME = 'Bevan';

let subFontLoaded = false;

export function setSubFontLoaded(loaded: boolean) {
  subFontLoaded = loaded;
}

// Fonte dos subtítulos (prefácios, nomes dos pais da Igreja); vazio se falhou ao carregar.
export function subFont() {
  return subFontLoaded ? { fontFamily: SUB_FONT_NAME, fontWeight: 'normal' as const } : {};
}

export const READING_FONT_NAME = 'Lora';

let readingFontLoaded = false;

export function setReadingFontLoaded(loaded: boolean) {
  readingFontLoaded = loaded;
}

// Fonte serifada dos versículos; vazio se falhou ao carregar. A Lora não tem grego nem hebraico,
// então só use em pt/lat (veja ReaderScreen).
export function readingFont() {
  return readingFontLoaded ? { fontFamily: READING_FONT_NAME, fontWeight: 'normal' as const } : {};
}
