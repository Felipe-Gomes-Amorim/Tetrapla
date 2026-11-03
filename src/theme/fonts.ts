export const BRAND_FONT_NAME = 'AlfaSlabOne';

let brandFontLoaded = false;

export function setBrandFontLoaded(loaded: boolean) {
  brandFontLoaded = loaded;
}

// Retorna o estilo da fonte da marca; vazio se a fonte falhou ao carregar (cai na fonte do sistema).
export function brandFont() {
  return brandFontLoaded ? { fontFamily: BRAND_FONT_NAME, fontWeight: 'normal' as const } : {};
}
