import React, { useState, useEffect } from 'react';
import {
  View, Text, SectionList, FlatList, TouchableOpacity, StyleSheet,
  BackHandler, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFatherGroups, FatherWork } from '../data/fathers';
import { getWorkChapters, ParsedWork, INTRO_N, NOTES_N } from '../data/fatherChapters';
import { getReadChapters, getTotalProgress } from '../data/fatherProgress';
import ProgressRing from '../components/ProgressRing';
import OutlinedIcon from '../components/OutlinedIcon';
import { subFont } from '../theme/fonts';

const sections = getFatherGroups().map(g => ({ title: g.group, data: g.works }));

function formatSize(kb: number) {
  return kb >= 1000 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${kb} KB`;
}

export default function FathersListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const [selectedWork, setSelectedWork] = useState<FatherWork | null>(null);
  const [parsed, setParsed] = useState<ParsedWork | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());
  const [totalPercent, setTotalPercent] = useState(0);

  // Recarrega progresso quando a aba/tela volta ao foco (o leitor é uma tela do Stack pai)
  useFocusEffect(
    React.useCallback(() => {
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
    if (!selectedWork || !isFocused) return;
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedWork(null);
      return true;
    });
    return () => sub.remove();
  }, [selectedWork, isFocused]);

  const openChapter = (work: FatherWork, chapter: number) =>
    navigation.navigate('FatherReader', { id: work.id, chapter });

  const topButtons = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity style={styles.topBtn} onPress={() => navigation.navigate('FatherProgress')}>
        <ProgressRing progress={totalPercent} size={26} strokeWidth={3} backgroundColor="transparent" fillColor={colors.accentColor} outlineColor={colors.accentColor} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.topBtn} onPress={() => navigation.navigate('FatherSearch', {})}>
        <OutlinedIcon name="search" size={24} outlineColor={colors.accentColor} fillColor={colors.background} />
      </TouchableOpacity>
    </View>
  );

  // Grade de capítulos do escrito escolhido
  if (selectedWork) {
    const readBg = colors.isDark ? '#1a3a1a' : '#E8F5E9';
    const chapters = parsed?.chapters ?? [];
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chapterBtn, { backgroundColor: readChapters.has(item.n) ? readBg : colors.cardBackground }]}
                onPress={() => openChapter(selectedWork, item.n)}
              >
                <Text
                  style={[styles.chapterText, { color: colors.text }, item.label.length > 5 && styles.chapterTextSmall]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Lista de escritos, agrupada
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
        renderItem={({ item }: { item: FatherWork }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.borderColor }]}
            onPress={() => setSelectedWork(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.workTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.workMeta, { color: colors.textSecondary }]}>
                {item.author} · {item.chapterCount} cap. · {formatSize(item.sizeKB)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  chapterTextSmall: { fontSize: 12 },
  introBtn: {
    margin: 4, marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  introText: { fontSize: 18, textAlign: 'center' },
});
