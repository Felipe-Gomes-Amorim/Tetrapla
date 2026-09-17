import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, BackHandler } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSQLiteContext } from 'expo-sqlite';
import { getVerses, getPatristicCountsForChapter, getPatristicRefs, markChapterAsRead, unmarkChapterAsRead, isChapterRead, getPreface } from '../db/database';
import PatristicSheet from '../components/PatristicSheet';
import CustomAlert from '../components/CustomAlert';
import FontSizeModal from '../components/FontSizeModal';
import { Ionicons } from '@expo/vector-icons';
import { checkAchievementsForChapter, checkAchievementsForProgress } from '../db/achievementsDb';
import { getTotalReadProgress } from '../db/database';
import { getAchievementById } from '../data/achievements';
import AchievementToast from '../components/AchievementToast';
import { useTheme } from '../contexts/ThemeContext';

type Lang = 'pt' | 'lat' | 'grc' | 'heb';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'pt', label: 'PT' },
  { key: 'lat', label: 'LAT' },
  { key: 'grc', label: 'GRC' },
  { key: 'heb', label: 'HEB' },
];

export default function ReaderScreen({ route, navigation }: any) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { book, bookName, chapter, totalChapters, scrollToVerse } = route.params;
  const [lang, setLang] = useState<Lang>('pt');
  const [verses, setVerses] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [sheetRefs, setSheetRefs] = useState<any[]>([]);
  const [sheetVerse, setSheetVerse] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [chapterRead, setChapterRead] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastAchievement, setToastAchievement] = useState<{ name: string; icon: string } | null>(null);
  const [prefaceData, setPrefaceData] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Carregar tamanho de fonte salvo ao montar
  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const path = FileSystem.documentDirectory + 'fontsize.txt';
      const content = await FileSystem.readAsStringAsync(path);
      const size = parseInt(content);
      if (size > 0) setFontSize(size);
    } catch (e) {
      // Arquivo não existe ainda, mantém valor padrão
    }
  };

  const saveFontSize = async (size: number) => {
    try {
      const path = FileSystem.documentDirectory + 'fontsize.txt';
      await FileSystem.writeAsStringAsync(path, String(size));
      setFontSize(size);
    } catch (e) {
      console.error('Erro ao salvar fontSize:', e);
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 32) {
      saveFontSize(fontSize + 2);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      saveFontSize(fontSize - 2);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: `${bookName} ${chapter}`,
      headerStyle: {
        backgroundColor: colors.headerBackground,
      },
      headerTintColor: colors.accentColor,
      headerTitleStyle: {
        color: colors.text,
      },
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12, gap: 12 }}>
          <TouchableOpacity
            onPress={() => setFontSizeModalVisible(true)}
          >
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.accentColor }}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={24} color={colors.accentColor} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, bookName, chapter, colors]);

  useEffect(() => {
    loadChapter();
  }, [book, chapter]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBack = () => {
      navigation.goBack();
      return true; // impede comportamento padrão
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, [navigation]);

  useEffect(() => {
    if (!loading && scrollToVerse && flatListRef.current && verses.length > 0) {
      const index = verses.findIndex(v => v.verse === scrollToVerse);
      if (index >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0, // posiciona no topo da tela
          });
        }, 100);
      }
    }
  }, [loading, scrollToVerse, verses]);

  async function loadChapter() {
    setLoading(true);
    try {
      const rows = await getVerses(db, book, chapter);
      setVerses(rows);
      const c = await getPatristicCountsForChapter(db, book, chapter);
      setCounts(c);

      // Carregar estado do capítulo
      const isRead = await isChapterRead(book, chapter);
      setChapterRead(isRead);

      // Carregar prefácio do livro (se houver)
      try {
        const prefaceRows = await getPreface(db, book);
        if (prefaceRows && prefaceRows.length > 0) {
          setPrefaceData(prefaceRows[0]);
        } else {
          setPrefaceData(null);
        }
      } catch (e) {
        console.log('Prefácio não disponível para', book);
        setPrefaceData(null);
      }
    } catch (e) {
      console.error('Erro ao carregar capítulo:', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleChapterRead() {
    try {
      if (chapterRead) {
        // Desmarcar como lido
        await unmarkChapterAsRead(book, chapter);
        setChapterRead(false);
      } else {
        // Marcar como lido
        await markChapterAsRead(book, chapter);
        setChapterRead(true);

        // Checar achievements
        const chapAchievements = await checkAchievementsForChapter(book, chapter);
        const progress = await getTotalReadProgress();
        const progressAchievements = await checkAchievementsForProgress(progress);

        const allUnlocked = [...chapAchievements, ...progressAchievements];

        if (allUnlocked.length > 0) {
          // Mostrar o primeiro achievement (geralmente há só um por ação)
          const first = allUnlocked[0];
          setToastAchievement({
            name: first.name,
            icon: first.icon,
          });
          setToastVisible(true);

          setTimeout(() => {
            setToastVisible(false);
          }, 4000);
        }
      }
    } catch (e) {
      console.error('Erro ao marcar capítulo:', e);
    }
  }

  async function openSheet(verse: number) {
    const refs = await getPatristicRefs(db, book, chapter, verse);
    setSheetRefs(refs);
    setSheetVerse(`${bookName} ${chapter}:${verse}`);
    setSheetVisible(true);
  }


  const goChapter = (delta: number) => {
    const next = chapter + delta;
    if (next < 1 || next > totalChapters) return;
    navigation.replace('Reader', {
      book,
      bookName,
      chapter: next,
      totalChapters,
      direction: delta > 0 ? 'next' : 'prev',
    });
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accentColor} />
    </View>
  );

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    langBar: { borderBottomColor: colors.borderColor },
    langBtn: { backgroundColor: colors.cardBackground },
    langBtnActive: { backgroundColor: colors.accentColor },
    langText: { color: colors.textSecondary },
    langTextActive: { color: '#fff' },
    verseText: { color: colors.text },
    verseNum: { color: colors.textSecondary },
    navBar: { borderTopColor: colors.borderColor, backgroundColor: colors.background },
    navText: { color: colors.accentColor },
    chapterMarkBtn: { backgroundColor: colors.cardBackground },
    chapterMarkBtnActive: { backgroundColor: colors.cardBackground },
    chapterMarkText: { color: colors.textSecondary },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['left', 'right', 'bottom']}>
      <View style={[styles.langBar, dynamicStyles.langBar]}>
        {LANGS.map(l => (
          <TouchableOpacity
            key={l.key}
            style={[styles.langBtn, dynamicStyles.langBtn, lang === l.key && dynamicStyles.langBtnActive]}
            onPress={() => setLang(l.key)}
          >
            <Text style={[styles.langText, dynamicStyles.langText, lang === l.key && dynamicStyles.langTextActive]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={verses}
        keyExtractor={v => String(v.verse)}
        contentContainerStyle={styles.verseList}
        onScrollToIndexFailed={() => {
          // Se falhar, apenas ignora (a altura dos itens é variável)
        }}
        renderItem={({ item }) => {
          const text = item[lang] ?? '—';
          const count = counts[item.verse] ?? 0;
          // Monta a edição
          let edition = '';
          if (lang === 'pt') edition = 'JFA';
          else if (lang === 'lat') edition = 'Vulgata';
          else if (lang === 'grc') edition = 'Grego';
          else if (lang === 'heb') edition = 'Hebraico';

          // Monta o texto para copiar
          let copyText = `${bookName} ${chapter}:${item.verse} (${edition})\n\n${text}`;
          // Se for hebraico e houver aramaico, inclui o aramaico também
          if (lang === 'heb' && item.aram && item.aram.trim() !== '') {
            copyText += `\n${item.aram}`;
          }

          return (
            <View style={styles.verseRow}>
              <Text style={[styles.verseNum, dynamicStyles.verseNum]}>{item.verse}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.verseText, dynamicStyles.verseText, { fontSize }]}

                  onLongPress={async () => {
                    await Clipboard.setStringAsync(copyText);
                    setAlertVisible(true);
                  }}
                >
                  {text}
                </Text>
                {/* Se for hebraico e houver aramaico, mostra o aramaico em vermelho */}
                {lang === 'heb' && item.aram && item.aram.trim() !== '' && (
                  <Text style={[styles.aramaicText, { fontSize: fontSize * 0.9 }]}>{item.aram}</Text>
                )}
              </View>
              {count > 0 && (
                <TouchableOpacity
                  style={styles.badge}
                  onPress={() => openSheet(item.verse)}
                >
                  <Text style={styles.badgeText}>{count}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      <View style={[styles.navBar, dynamicStyles.navBar]}>
        <TouchableOpacity
          style={[styles.navBtn, chapter <= 1 && styles.navBtnDisabled]}
          onPress={() => goChapter(-1)}
          disabled={chapter <= 1}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={18} color={colors.accentColor} />
            <Text style={[styles.navText, dynamicStyles.navText]}> Cap. {chapter - 1}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chapterMarkBtn,
            dynamicStyles.chapterMarkBtn,
            chapterRead && dynamicStyles.chapterMarkBtnActive,
          ]}
          onPress={toggleChapterRead}
        >
          <Ionicons
            name={chapterRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={chapterRead ? colors.accentColor : colors.textSecondary}
          />
          <Text
            style={[
              styles.chapterMarkText,
              dynamicStyles.chapterMarkText,
              chapterRead && styles.chapterMarkTextActive,
              chapterRead && { color: colors.accentColor },
            ]}
          >
            Marcar capítulo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, chapter >= totalChapters && styles.navBtnDisabled]}
          onPress={() => goChapter(1)}
          disabled={chapter >= totalChapters}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.navText, dynamicStyles.navText]}>Cap. {chapter + 1} </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.accentColor} />
          </View>
        </TouchableOpacity>
      </View>

      <PatristicSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        refs={sheetRefs}
        verseRef={sheetVerse}
      />

      <CustomAlert
        visible={alertVisible}
        title="Versículo copiado!"
        message="O texto foi copiado para a área de transferência."
        onClose={() => setAlertVisible(false)}
      />

      <FontSizeModal
        visible={fontSizeModalVisible}
        currentSize={fontSize}
        onClose={() => setFontSizeModalVisible(false)}
        onIncrease={increaseFontSize}
        onDecrease={decreaseFontSize}
        colors={{
          background: colors.background,
          text: colors.text,
          cardBackground: colors.cardBackground,
          accentColor: colors.accentColor,
          borderColor: colors.borderColor,
        }}
      />

      <AchievementToast
        visible={toastVisible}
        achievement={toastAchievement}
      />
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  langBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  langBtn: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  langBtnActive: { backgroundColor: '#1D9E75' },
  langText: { fontSize: 13, fontWeight: '500', color: '#555' },
  langTextActive: { color: '#fff' },
  verseList: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 80 },
  verseRow: {
    flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start',
  },
  verseNum: {
    width: 24, fontSize: 11, color: '#aaa',
    marginTop: 3, textAlign: 'right', marginRight: 4,
  },
  verseText: { flex: 1, lineHeight: 24, color: '#1a1a1a' },
  aramaicText: { fontSize: 16, lineHeight: 24, color: '#C62828', marginTop: 2, fontWeight: 'bold' },
  badge: {
    marginLeft: 8, marginTop: 3,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E1F5EE', alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#0F6E56' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0.3 },
  navText: { color: '#1D9E75', fontSize: 14 },
  navChapter: { fontSize: 13, color: '#aaa' },
  chapterMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    gap: 6,
  },
  chapterMarkBtnActive: {
    backgroundColor: '#E1F5EE',
  },
  chapterMarkText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  chapterMarkTextActive: {
    color: '#1D9E75',
  },
});