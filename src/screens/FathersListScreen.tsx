import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, SectionList, FlatList, TouchableOpacity, StyleSheet,
  BackHandler, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFathersTheme } from '../contexts/ThemeContext';
import { getFatherGroups, FatherWork } from '../data/fathers';
import { getWorkChapters, ParsedWork, INTRO_N, NOTES_N } from '../data/fatherChapters';
import { getReadChapters, getTotalProgress, getFatherProgressVersion } from '../data/fatherProgress';
import FadeInView from '../components/FadeInView';
import OutlinedIcon from '../components/OutlinedIcon';
import { subFont } from '../theme/fonts';

const sections = getFatherGroups().map(g => ({ title: g.group, data: g.works }));

const WorkRow = React.memo(function WorkRow({
  work, colors, onSelect,
}: {
  work: FatherWork; colors: any; onSelect: (work: FatherWork) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.borderColor }]}
      onPress={() => onSelect(work)}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.workTitle, { color: colors.text }]}>{work.title}</Text>
        <Text style={[styles.workMeta, { color: colors.textSecondary }]} numberOfLines={1}>{work.author}</Text>
      </View>
      <Text style={[styles.workChapters, { color: colors.textSecondary }]}>{work.chapterCount} cap.</Text>
    </TouchableOpacity>
  );
});

// Tamanho da fonte do rótulo calculado pelo comprimento (evita adjustsFontSizeToFit, que mede cada célula)
function chapterLabelSize(label: string): number {
  if (label.length <= 3) return 16;
  if (label.length <= 5) return 13;
  return 10;
}

const ChapterCell = React.memo(function ChapterCell({
  work, chapter, label, isRead, colors, onOpen,
}: {
  work: FatherWork; chapter: number; label: string; isRead: boolean; colors: any;
  onOpen: (work: FatherWork, chapter: number) => void;
}) {
  const readBg = colors.readBackground;
  return (
    <TouchableOpacity
      style={[styles.chapterBtn, { backgroundColor: isRead ? readBg : colors.cardBackground }]}
      onPress={() => onOpen(work, chapter)}
    >
      <Text style={[styles.chapterText, { color: colors.text, fontSize: chapterLabelSize(label) }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

export default function FathersListScreen({ navigation }: any) {
  const { colors } = useFathersTheme();
  const [selectedWork, setSelectedWork] = useState<FatherWork | null>(null);
  const [parsed, setParsed] = useState<ParsedWork | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());
  const [totalPercent, setTotalPercent] = useState(0);

  // Recarrega progresso quando a aba/tela volta ao foco (o leitor é uma tela do Stack pai)
  // (pula se nada foi marcado/desmarcado desde a última carga)
  const lastLoad = useRef<{ version: number; work: string | null } | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      const current = { version: getFatherProgressVersion(), work: selectedWork?.id ?? null };
      const last = lastLoad.current;
      if (last && last.version === current.version && last.work === current.work) return;
      lastLoad.current = current;
      getTotalProgress().then(p => setTotalPercent(p.percent)).catch(() => {});
      if (selectedWork) {
        getReadChapters(selectedWork.id).then(setReadChapters).catch(() => setReadChapters(new Set()));
      }
    }, [selectedWork])
  );

  // Carrega os capítulos do escrito escolhido
  useEffect(() => {
    if (!selectedWork) {
      setParsed(null);
      setLoadError(false);
      return;
    }
    let active = true;
    setParsed(null);
    setLoadError(false);
    getWorkChapters(selectedWork.id)
      .then(p => { if (active) setParsed(p); })
      .catch(e => {
        console.error('Erro ao carregar capítulos:', e);
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [selectedWork]);

  // Voltar do Android: da grade de capítulos para a lista (só com esta aba em foco)
  useEffect(() => {
    if (!selectedWork) return;
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Consulta o foco na hora do toque (sem re-renderizar a tela a cada troca de aba)
      if (!navigation.isFocused()) return false;
      setSelectedWork(null);
      return true;
    });
    return () => sub.remove();
  }, [selectedWork, navigation]);

  const openChapter = useCallback((work: FatherWork, chapter: number) =>
    navigation.navigate('FatherReader', { id: work.id, chapter }), [navigation]);

  const renderChapterCell = useCallback(({ item }: { item: { n: number; label: string } }) => (
    <ChapterCell
      work={selectedWork!}
      chapter={item.n}
      label={item.label}
      isRead={readChapters.has(item.n)}
      colors={colors}
      onOpen={openChapter}
    />
  ), [selectedWork, readChapters, colors, openChapter]);

  const renderWork = useCallback(({ item }: { item: FatherWork }) => (
    <WorkRow work={item} colors={colors} onSelect={setSelectedWork} />
  ), [colors]);

  const topButtons = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity style={styles.topBtn} onPress={() => navigation.navigate('FatherSearch', {})}>
        <OutlinedIcon name="search" size={24} outlineColor={colors.accentColor} fillColor={colors.background} />
      </TouchableOpacity>
    </View>
  );

  // Grade de capítulos do escrito escolhido
  // (a lista de escritos fica montada, só oculta, para manter o scroll ao voltar)
  let chaptersView: React.ReactNode = null;
  if (selectedWork) {
    const chapters = parsed?.chapters ?? [];
    chaptersView = (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <FadeInView trigger={selectedWork.id}>
        <View style={[styles.chapterHeader, { borderBottomColor: colors.borderColor }]}>
          <TouchableOpacity onPress={() => setSelectedWork(null)} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.accentColor} />
          </TouchableOpacity>
          <Text style={[styles.chapterHeaderTitle, { color: colors.text }, subFont()]} numberOfLines={2}>
            {selectedWork.title}
          </Text>
          <View style={styles.headerBtn} />
        </View>

        {!parsed && !loadError && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accentColor} />
          </View>
        )}

        {loadError && (
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>Não foi possível carregar este escrito.</Text>
          </View>
        )}

        {parsed && (
          <FlatList
            key="chapters"
            data={chapters}
            numColumns={5}
            keyExtractor={c => String(c.n)}
            contentContainerStyle={styles.chapterListContent}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.introBtn, { backgroundColor: colors.cardBackground }]}
                onPress={() => openChapter(selectedWork, INTRO_N)}
              >
                <Text style={[styles.introText, { color: colors.text }, subFont()]}>Introdução</Text>
              </TouchableOpacity>
            }
            ListFooterComponent={
              parsed.notes ? (
                <TouchableOpacity
                  style={[styles.introBtn, { backgroundColor: colors.cardBackground }]}
                  onPress={() => openChapter(selectedWork, NOTES_N)}
                >
                  <Text style={[styles.introText, { color: colors.text }, subFont()]}>Notas do tradutor</Text>
                </TouchableOpacity>
              ) : undefined
            }
            renderItem={renderChapterCell}
            extraData={readChapters}
            initialNumToRender={30}
            windowSize={7}
            removeClippedSubviews
          />
        )}
        </FadeInView>
      </SafeAreaView>
    );
  }

  // Lista de escritos, agrupada
  return (
    <>
    {chaptersView}
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }, selectedWork && styles.hidden]}
      edges={['top', 'left', 'right']}
    >
      <FadeInView trigger={selectedWork === null}>
      <View style={[styles.titleBar, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.title, { color: colors.text }, subFont()]}>Pais da Igreja</Text>
        {topButtons}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(w: FatherWork) => w.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.accentColor }, subFont()]}>{section.title}</Text>
        )}
        renderItem={renderWork}
        initialNumToRender={20}
      />
      </FadeInView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hidden: { display: 'none' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 22 },
  topBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 24 },
  sectionTitle: { fontSize: 16, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  workTitle: { fontSize: 16, marginBottom: 2 },
  workMeta: { fontSize: 12 },
  workChapters: { fontSize: 12, marginLeft: 12 },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8, width: 40 },
  chapterHeaderTitle: { fontSize: 18, flex: 1, textAlign: 'center' },
  chapterListContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 },
  chapterBtn: {
    flex: 1, margin: 4, aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  chapterText: { fontSize: 16 },
  introBtn: {
    margin: 4, marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  introText: { fontSize: 18, textAlign: 'center' },
});
