import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFatherWork, FatherWork } from '../data/fathers';
import { getWorkChapters, getCachedWork, neighborChapter, INTRO_N, NOTES_N, FatherChapter, ParsedWork } from '../data/fatherChapters';
import { isChapterRead, markChapterRead, unmarkChapterRead } from '../data/fatherProgress';
import { foldText } from '../data/fatherSearch';
import { splitMarkdown, MdBlock } from '../data/markdownBlocks';
import { brandFont, readingFont, subFont } from '../theme/fonts';
import FontSizeModal from '../components/FontSizeModal';
import type { ThemeColors } from '../contexts/ThemeContext';

// Estilos do Markdown derivados do tema e do tamanho da fonte do corpo
function buildMarkdownStyles(colors: ThemeColors, fontSize: number) {
  const body = readingFont();
  const lineHeight = Math.round(fontSize * 1.55);
  const headingBase = { color: colors.text, marginTop: 20, marginBottom: 8 };
  const noteBg = colors.isDark ? '#23302b' : '#eef6f2';
  return StyleSheet.create({
    body: { color: colors.text, backgroundColor: colors.background },
    text: { color: colors.text, fontSize, lineHeight, ...body },
    paragraph: { marginTop: 0, marginBottom: 10 },
    textgroup: { color: colors.text },
    strong: { fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    s: { textDecorationLine: 'line-through' },
    heading1: { ...headingBase, ...subFont(), fontSize: 26, lineHeight: 34, marginTop: 8 },
    heading2: { ...headingBase, ...subFont(), fontSize: 22, lineHeight: 30 },
    heading3: { ...headingBase, ...body, fontSize: 18, lineHeight: 26, fontWeight: 'bold', color: colors.accentColor },
    heading4: { ...headingBase, ...body, fontSize: 17, lineHeight: 24, fontWeight: 'bold' },
    heading5: { ...headingBase, ...body, fontSize: 16, fontWeight: 'bold' },
    heading6: { ...headingBase, ...body, fontSize: 15, fontWeight: 'bold' },
    hr: { backgroundColor: colors.borderColor, height: 1, marginVertical: 16 },
    // Citações (inclui a "Nota do tradutor"): barra lateral e fundo suave
    blockquote: {
      backgroundColor: noteBg,
      borderLeftColor: colors.accentColor,
      borderLeftWidth: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 0,
      marginVertical: 8,
      borderRadius: 4,
    },
    bullet_list: { marginBottom: 6 },
    ordered_list: { marginBottom: 6 },
    list_item: { marginVertical: 3 },
    bullet_list_icon: { color: colors.accentColor, fontSize, lineHeight, marginLeft: 6, marginRight: 8 },
    ordered_list_icon: { color: colors.accentColor, fontSize, lineHeight, marginLeft: 6, marginRight: 8 },
    link: { color: colors.accentColor, textDecorationLine: 'underline' },
    code_inline: { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor, borderRadius: 3 },
    code_block: { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor, padding: 10, borderRadius: 4 },
    fence: { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.borderColor, padding: 10, borderRadius: 4 },
    table: { borderWidth: 1, borderColor: colors.borderColor, borderRadius: 4, marginVertical: 8 },
    thead: { backgroundColor: colors.cardBackground },
    th: { padding: 6, fontWeight: 'bold' },
    tr: { borderBottomWidth: 1, borderColor: colors.borderColor, flexDirection: 'row' },
    td: { padding: 6 },
  });
}

function buildNoteStyles(colors: ThemeColors, fontSize: number) {
  const size = Math.max(12, fontSize - 3);
  return StyleSheet.create({
    body: { color: colors.textSecondary },
    text: { color: colors.textSecondary, fontSize: size, lineHeight: Math.round(size * 1.5), ...readingFont() },
    paragraph: { marginTop: 0, marginBottom: 0 },
    strong: { fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    link: { color: colors.accentColor },
  });
}

const BlockView = React.memo(function BlockView({
  block, mdStyles, noteStyles, noteBorder,
}: {
  block: MdBlock;
  mdStyles: ReturnType<typeof buildMarkdownStyles>;
  noteStyles: ReturnType<typeof buildNoteStyles>;
  noteBorder: string;
}) {
  if (block.kind === 'note') {
    return (
      <View style={[styles.note, { borderLeftColor: noteBorder }]}>
        <Markdown style={noteStyles}>{block.text}</Markdown>
      </View>
    );
  }
  return <Markdown style={mdStyles}>{block.text}</Markdown>;
});

// Cabeçalho curto, como o da Bíblia: 'Inác. Efésios 3', 'Ireneu 1.12'
function headerTitle(work: FatherWork | undefined, chapter: FatherChapter | null): string {
  if (!work) return 'Pais da Igreja';
  if (!chapter) return work.short;
  if (chapter.n >= 1 && /^\d+$/.test(chapter.label)) return `${work.short}${work.shortSep ?? ' '}${chapter.label}`;
  const abbrev: Record<string, string> = { 'Saudação': 'Saud.', 'Prefácio': 'Pref.', 'Introdução': 'Intro' };
  return `${work.short} ${abbrev[chapter.label] ?? chapter.label}`;
}

// Rótulo curto do capítulo vizinho para os botões de navegação
function neighborLabel(parsed: ParsedWork, n: number): string {
  if (n === INTRO_N) return 'Introdução';
  if (n === NOTES_N) return 'Notas';
  return parsed.chapters[n - 1]?.label ?? String(n);
}

export default function FatherReaderScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const id: string = route.params?.id;
  const chapterN: number = route.params?.chapter ?? 1;
  const highlight: string | undefined = route.params?.highlight;
  const work = getFatherWork(id);
  const [parsed, setParsed] = useState<ParsedWork | null>(getCachedWork(id) ?? null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chapter: FatherChapter | null = useMemo(() => {
    if (!parsed) return null;
    if (chapterN === INTRO_N) return parsed.intro;
    if (chapterN === NOTES_N) return parsed.notes;
    return parsed.chapters[chapterN - 1] ?? null;
  }, [parsed, chapterN]);

  const blocks = useMemo(() => (chapter ? splitMarkdown(chapter.content) : null), [chapter]);

  // Cabeçalho: nome do escrito + capítulo, com o botão de tamanho da fonte
  useEffect(() => {
    navigation.setOptions({
      title: headerTitle(work, chapter),
      headerStyle: { backgroundColor: colors.headerBackground },
      headerTintColor: colors.accentColor,
      headerTitleStyle: { color: colors.text, ...brandFont() },
      headerRight: () => (
        <TouchableOpacity style={styles.headerBtn} onPress={() => setFontSizeModalVisible(true)}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.accentColor }}>A</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, work, chapter, colors]);

  // Mesmo tamanho de fonte (fontsize.txt) do leitor da Bíblia
  useEffect(() => {
    FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'fontsize.txt')
      .then(content => {
        const size = parseInt(content, 10);
        if (size > 0) setFontSize(size);
      })
      .catch(() => { /* sem preferência salva */ });
  }, []);

  const saveFontSize = async (size: number) => {
    setFontSize(size);
    try {
      await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'fontsize.txt', String(size));
    } catch (e) {
      console.error('Erro ao salvar fontSize:', e);
    }
  };

  useEffect(() => {
    let active = true;
    setError(false);
    if (!work) {
      setError(true);
      return;
    }
    getWorkChapters(work.id)
      .then(p => { if (active) setParsed(p); })
      .catch(e => {
        console.error('Erro ao carregar escrito:', e);
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [id, reloadKey]);

  // Marcação de leitura (só capítulos 1..N contam)
  useEffect(() => {
    if (chapterN < 1) { setIsRead(false); return; }
    isChapterRead(id, chapterN).then(setIsRead).catch(() => setIsRead(false));
  }, [id, chapterN]);

  const toggleRead = async () => {
    if (chapterN < 1) return;
    const next = !isRead;
    setIsRead(next);
    if (next) await markChapterRead(id, chapterN);
    else await unmarkChapterRead(id, chapterN);
  };

  const goChapter = (target: number | null) => {
    if (target === null) return;
    navigation.replace('FatherReader', { id, chapter: target });
  };

  // Vindo da pesquisa: rola até o bloco com o termo
  const highlightIndex = useMemo(() => {
    if (!highlight || !blocks) return -1;
    const q = foldText(highlight.trim());
    if (!q) return -1;
    return blocks.findIndex(b => b.kind === 'md' && foldText(b.text).includes(q));
  }, [highlight, blocks]);

  useEffect(() => {
    if (highlightIndex <= 0) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: highlightIndex, animated: false, viewPosition: 0 });
    }, 300);
    return () => clearTimeout(t);
  }, [highlightIndex]);

  const mdStyles = useMemo(() => buildMarkdownStyles(colors, fontSize), [colors, fontSize]);
  const noteStyles = useMemo(() => buildNoteStyles(colors, fontSize), [colors, fontSize]);

  const renderItem = useCallback(
    ({ item }: { item: MdBlock }) => (
      <BlockView block={item} mdStyles={mdStyles} noteStyles={noteStyles} noteBorder={colors.borderColor} />
    ),
    [mdStyles, noteStyles, colors.borderColor]
  );

  if (error || (parsed && !chapter)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {work ? 'Não foi possível carregar este capítulo.' : 'Escrito não encontrado.'}
        </Text>
        {work && !parsed && (
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground }]} onPress={() => setReloadKey(k => k + 1)}>
            <Text style={{ color: colors.accentColor }}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!parsed || !blocks) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentColor} />
      </View>
    );
  }

  const prev = neighborChapter(parsed, chapterN, -1);
  const next = neighborChapter(parsed, chapterN, 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <FlatList
        ref={flatListRef}
        ListHeaderComponent={
          chapter?.subtitle ? (
            <Text style={[styles.subtitle, { color: colors.accentColor }, subFont()]}>{chapter.subtitle}</Text>
          ) : undefined
        }
        data={blocks}
        keyExtractor={b => b.key}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
        onScrollToIndexFailed={info => {
          // Alturas variáveis: vai até perto e tenta de novo
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
          }, 200);
        }}
      />

      <View style={[styles.navBar, { backgroundColor: colors.background, borderTopColor: colors.borderColor }]}>
        <TouchableOpacity
          style={[styles.navBtn, prev === null && styles.navBtnDisabled]}
          onPress={() => goChapter(prev)}
          disabled={prev === null}
        >
          <View style={styles.navRow}>
            <Ionicons name="chevron-back" size={18} color={colors.accentColor} />
            <Text style={[styles.navText, { color: colors.accentColor }]} numberOfLines={1}>
              {prev !== null ? ` ${neighborLabel(parsed, prev)}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        {chapterN >= 1 ? (
          <TouchableOpacity
            style={[styles.chapterMarkBtn, { backgroundColor: colors.cardBackground }]}
            onPress={toggleRead}
          >
            <Ionicons
              name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={isRead ? colors.accentColor : colors.textSecondary}
            />
            <Text style={[styles.chapterMarkText, { color: isRead ? colors.accentColor : colors.textSecondary }]}>
              Marcar capítulo
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markSpacer} />
        )}

        <TouchableOpacity
          style={[styles.navBtn, next === null && styles.navBtnDisabled]}
          onPress={() => goChapter(next)}
          disabled={next === null}
        >
          <View style={styles.navRow}>
            <Text style={[styles.navText, { color: colors.accentColor }]} numberOfLines={1}>
              {next !== null ? `${neighborLabel(parsed, next)} ` : ''}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.accentColor} />
          </View>
        </TouchableOpacity>
      </View>

      <FontSizeModal
        visible={fontSizeModalVisible}
        currentSize={fontSize}
        onClose={() => setFontSizeModalVisible(false)}
        onIncrease={() => fontSize < 32 && saveFontSize(fontSize + 2)}
        onDecrease={() => fontSize > 12 && saveFontSize(fontSize - 2)}
        colors={{
          background: colors.background,
          text: colors.text,
          cardBackground: colors.cardBackground,
          accentColor: colors.accentColor,
          borderColor: colors.borderColor,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
  subtitle: { fontSize: 18, lineHeight: 26, marginTop: 6, marginBottom: 14 },
  note: { borderLeftWidth: 2, paddingLeft: 10, marginTop: -4, marginBottom: 12, marginLeft: 4 },
  errorText: { fontSize: 15, marginBottom: 12, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  headerBtn: { paddingRight: 12 },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: 8, minWidth: 84 },
  navBtnDisabled: { opacity: 0.3 },
  navRow: { flexDirection: 'row', alignItems: 'center' },
  navText: { fontSize: 14, maxWidth: 70 },
  markSpacer: { flex: 1 },
  chapterMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  chapterMarkText: { fontSize: 12, fontWeight: '600' },
});
