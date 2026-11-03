import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../contexts/ThemeContext';
import { getFatherWork } from '../data/fathers';
import { loadAssetText } from '../data/fatherText';
import { splitMarkdown, MdBlock } from '../data/markdownBlocks';
import { readingFont, subFont } from '../theme/fonts';
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

export default function FatherReaderScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const id: string = route.params?.id;
  const work = getFatherWork(id);
  const [blocks, setBlocks] = useState<MdBlock[] | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [fontSize, setFontSize] = useState(16);

  // Cabeçalho com o título do escrito e as cores do tema
  useEffect(() => {
    navigation.setOptions({
      title: work?.title ?? 'Pais da Igreja',
      headerStyle: { backgroundColor: colors.headerBackground },
      headerTintColor: colors.accentColor,
      headerTitleStyle: { color: colors.text, ...subFont(), fontSize: 16 },
    });
  }, [navigation, work, colors]);

  // Usa o mesmo tamanho de fonte salvo pelo leitor da Bíblia, se existir
  useEffect(() => {
    FileSystem.readAsStringAsync(FileSystem.documentDirectory + 'fontsize.txt')
      .then(content => {
        const size = parseInt(content, 10);
        if (size >= 12 && size <= 40) setFontSize(size);
      })
      .catch(() => { /* sem preferência salva */ });
  }, []);

  useEffect(() => {
    let active = true;
    setBlocks(null);
    setError(false);
    if (!work) {
      setError(true);
      return;
    }
    loadAssetText(work.asset)
      .then(text => {
        if (active) setBlocks(splitMarkdown(text));
      })
      .catch(e => {
        console.error('Erro ao carregar escrito:', e);
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [id, reloadKey]);

  const mdStyles = useMemo(() => buildMarkdownStyles(colors, fontSize), [colors, fontSize]);
  const noteStyles = useMemo(() => buildNoteStyles(colors, fontSize), [colors, fontSize]);

  const renderItem = useCallback(
    ({ item }: { item: MdBlock }) => (
      <BlockView block={item} mdStyles={mdStyles} noteStyles={noteStyles} noteBorder={colors.borderColor} />
    ),
    [mdStyles, noteStyles, colors.borderColor]
  );

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {work ? 'Não foi possível carregar este escrito.' : 'Escrito não encontrado.'}
        </Text>
        {work && (
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.cardBackground }]} onPress={() => setReloadKey(k => k + 1)}>
            <Text style={{ color: colors.accentColor }}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!blocks) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={blocks}
        keyExtractor={b => b.key}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 48 },
  note: { borderLeftWidth: 2, paddingLeft: 10, marginTop: -4, marginBottom: 12, marginLeft: 4 },
  errorText: { fontSize: 15, marginBottom: 12, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
});
