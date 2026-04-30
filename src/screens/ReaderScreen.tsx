import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, BackHandler } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSQLiteContext } from 'expo-sqlite';
import { getVerses, getPatristicCountsForChapter, getPatristicRefs } from '../db/database';
import PatristicSheet from '../components/PatristicSheet';
import CustomAlert from '../components/CustomAlert';
import FontSizeModal from '../components/FontSizeModal';
import { Ionicons } from '@expo/vector-icons';

type Lang = 'pt' | 'lat' | 'grc' | 'heb';
const LANGS: { key: Lang; label: string }[] = [
  { key: 'pt', label: 'PT' },
  { key: 'lat', label: 'LAT' },
  { key: 'grc', label: 'GRC' },
  { key: 'heb', label: 'HEB' },
];

export default function ReaderScreen({ route, navigation }: any) {
  const db = useSQLiteContext();
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
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12 }}>
          <TouchableOpacity
            onPress={() => setFontSizeModalVisible(true)}
            style={{ marginRight: 16 }}
          >
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1D9E75' }}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={24} color="#1D9E75" />
          </TouchableOpacity>
        </View>
      ),
    });
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
    } catch (e) {
      console.error('Erro ao carregar capítulo:', e);
    } finally {
      setLoading(false);
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
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1D9E75" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.langBar}>
        {LANGS.map(l => (
          <TouchableOpacity
            key={l.key}
            style={[styles.langBtn, lang === l.key && styles.langBtnActive]}
            onPress={() => setLang(l.key)}
          >
            <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>
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
              <Text style={styles.verseNum}>{item.verse}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.verseText, { fontSize }]}

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

      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, chapter <= 1 && styles.navBtnDisabled]}
          onPress={() => goChapter(-1)}
          disabled={chapter <= 1}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={18} color="#1D9E75" />
            <Text style={styles.navText}> Cap. {chapter - 1}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.navChapter}>{chapter} / {totalChapters}</Text>
        <TouchableOpacity
          style={[styles.navBtn, chapter >= totalChapters && styles.navBtnDisabled]}
          onPress={() => goChapter(1)}
          disabled={chapter >= totalChapters}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.navText}>Cap. {chapter + 1} </Text>
            <Ionicons name="chevron-forward" size={18} color="#1D9E75" />
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
});