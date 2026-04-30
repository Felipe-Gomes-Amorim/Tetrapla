# 📱 Fluxo da Aplicação

## Tela 1: BookListScreen (Seleção)

```
┌─────────────────────────────────┐
│  Bíblia Políglota              │
├─────────────────────────────────┤
│ GEN    Gênesis         50 cap.  │
│ EXO    Êxodo           40 cap.  │
│ LEV    Levítico        27 cap.  │
│ NUM    Números         36 cap.  │
│ DEU    Deuteronômio    34 cap.  │
│ ...                            │
│ REV    Apocalipse      22 cap.  │
└─────────────────────────────────┘
        ↓ tap em livro
```

## Tela 1b: Capítulos (Grid)

```
┌─────────────────────────────────┐
│ ← Gênesis                       │
├─────────────────────────────────┤
│  1   2   3   4   5              │
│  6   7   8   9  10              │
│ 11  12  13  14  15              │
│ 16  17  18  19  20              │
│ 21  22  23  24  25              │
│ ...                             │
│ 50                              │
└─────────────────────────────────┘
        ↓ tap em capítulo
```

## Tela 2: ReaderScreen (Leitura)

```
┌─────────────────────────────────┐
│ Gênesis 1                       │
├─────────────────────────────────┤
│ [PT]  [LAT]  [GRC]  [HEB]       │  ← Abas de idioma
├─────────────────────────────────┤
│   1  No princípio criou Deus... │
│   2  A terra era informe...     │
│   3  Disse Deus: Haja luz...    │  ← Versículos
│   4  Viu Deus a luz que era...  │
│   5  ...                        │
│      ...                        │
│  30  ...                    [1] │  ← Badge = citação
├─────────────────────────────────┤
│ ← Cap. 1      1 / 50     Cap. 2 →│  ← Navegação
└─────────────────────────────────┘
        ↓ tap no badge [1]
```

## Tela 3: PatristicSheet (Bottom Sheet)

```
┌─────────────────────────────────┐
│ ≡  (drag indicator)             │
├─────────────────────────────────┤
│ Gênesis 1:3                     │
│ 1 referências patrísticas       │
├─────────────────────────────────┤
│                                 │
│ ┌───────────────────────────┐   │
│ │ Autor: Santo Agostinho    │   │
│ │ Obra: Comentário Gênesis  │   │
│ │                           │   │
│ │ "Haja luz significa o     │   │
│ │ surgimento da inteligência│   │
│ │ no ser criado..."         │   │
│ └───────────────────────────┘   │
│                                 │
│ ┌───────────────────────────┐   │
│ │ Autor: Tomás de Aquino    │   │
│ │ Obra: Summa Theologiae    │   │
│ │                           │   │
│ │ "A luminosidade espiritual│   │
│ │ precede a material..."    │   │
│ └───────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
         ↓ deslize para baixo = fecha
```

## Fluxo Completo

```
START
  ↓
┌─────────────────┐
│  BookListScreen │
│  (Lista livros) │
└────────┬────────┘
         ↓
    Seleciona livro
         ↓
┌─────────────────┐
│  Capítulos Grid │
│    (5x5)        │
└────────┬────────┘
         ↓
    Seleciona capítulo
         ↓
┌─────────────────────────────────┐
│      ReaderScreen               │
│  ┌──────────────────────────┐   │
│  │ [PT] [LAT] [GRC] [HEB]   │   │
│  ├──────────────────────────┤   │
│  │ Versículos (scrollável)  │   │
│  │   1  Texto...        [1] │   │
│  │   2  Texto...            │   │
│  │   3  Texto...        [2] │   │
│  │  ...                     │   │
│  ├──────────────────────────┤   │
│  │ ← Cap. X   X / Y   Cap. +→│   │
│  └──────────────────────────┘   │
│                                 │
│  ┌──────────────────────────┐   │
│  │ PatristicSheet           │   │
│  │ (Bottom, inicialmente    │   │
│  │  colapsada, expandida    │   │
│  │  ao tap badge)           │   │
│  └──────────────────────────┘   │
└──────────────────────────────────┘
         ↑ ↓
    Navegação capítulo
         ou
    Mudar idioma
         ou
    Tap badge → PatristicSheet
```

## Estados do App

### 1. BookListScreen
- **Estado**: `selectedBook` (null ou objeto)
- **Se null**: Mostra lista de 73 livros
- **Se setado**: Mostra grid de capítulos do livro

### 2. ReaderScreen
- **Estado**: `lang` ('pt' | 'lat' | 'grc' | 'heb')
- **Estado**: `verses[]` (dados do capítulo)
- **Estado**: `counts{}` (número de citações por versículo)
- **Estado**: `loading` (boolean)

### 3. PatristicSheet
- **Estado**: `sheetRefs[]` (citações do versículo)
- **Estado**: `sheetVerse` (referência textual)
- **Método**: `sheetRef.current?.expand()` (abre)
- **Método**: `enablePanDownToClose` (fecha deslizando)

## Banco de Dados

### Tabelas Usadas

```sql
-- Versículos (36.769 registros)
verses(book, chapter, verse, pt, lat, grc, heb, aram)

-- Referências patrísticas (vazio, implementar depois)
patristic_refs(book, chapter, verse, author, work, quote)

-- Prefácios (13 registros)
book_prefaces(book, author, title, content_eng)
```

## Cores & Tema

| Elemento | Cor |
|----------|-----|
| Primário (abas ativas, botões) | `#1D9E75` (verde) |
| Fundo geral | `#fff` (branco) |
| Texto principal | `#1a1a1a` (quase preto) |
| Texto secundário | `#888` (cinza) |
| Badge background | `#E1F5EE` (verde muito claro) |
| Badge text | `#0F6E56` (verde escuro) |
| Divisor | `#eee` (cinza muito claro) |

## Layout Responsivo

- **Verses**: Flex row com número + texto + badge
- **Capítulos**: Grid numColumns={5}
- **Bottom Sheet**: snapPoints=['40%', '85%']
- **FlatList**: Contentful scroll com paddingBottom 80 (evita overlap com nav)

---

Diagrama ASCII criado: 29/04/2026
