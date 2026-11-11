import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, BackHandler, Platform, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { BOOKS, getPreface, getTotalReadProgress, isApocryphal, getReadChaptersForBook, getBooksWithReadProgress, getReadProgressVersion } from '../db/database';
import { useSettings } from '../contexts/SettingsContext';
import { usePlans } from '../contexts/PlansContext';
import FadeInView from '../components/FadeInView';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import OutlinedIcon from '../components/OutlinedIcon';
import { useTheme } from '../contexts/ThemeContext';
import { brandFont, subFont } from '../theme/fonts';
import { buildGroupedRows, BookListRow } from '../data/bookGroups';

const removeAccents = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Nomes já sem acento/caixa, calculados uma vez (usados no filtro de busca)
const FOLDED_NAMES = new Map(BOOKS.map(b => [b.code, removeAccents(b.name.toLowerCase())]));

type BookItem = typeof BOOKS[0];

const GroupHeader = React.memo(function GroupHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={[styles.groupHeader, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
      <Text style={[styles.groupHeaderText, { color: colors.accentColor }, subFont()]}>{title}</Text>
    </View>
  );
});

const BookRow = React.memo(function BookRow({
  book, read, total, colors, onSelect,
}: {
  book: BookItem; read: number; total: number; colors: any; onSelect: (book: BookItem) => void;
}) {
  let progressPercent = 0;
  if (total > 0) {
    // Se completou todos os capítulos, garantir 100%
    progressPercent = read >= total ? 100 : (read / total) * 100;
  }
  return (
    <TouchableOpacity
      style={[
        styles.bookRow,
        { borderBottomColor: colors.borderColor },
        isApocryphal(book.code) && { backgroundColor: colors.isDark ? '#3a2a2a' : '#FFE8E8' },
        progressPercent === 100 && { backgroundColor: colors.isDark ? '#2a3a2a' : '#C8E6C9' }
      ]}
      onPress={() => onSelect(book)}
    >
      {/* Overlay de progresso (apenas para progresso parcial) */}
      {progressPercent > 0 && progressPercent < 100 && (
        <View
          style={[
            styles.bookProgressOverlay,
            {
              width: `${progressPercent}%`,
              backgroundColor: colors.isDark ? '#2a5a2a' : '#C8E6C9'
            }
          ]}
        />
      )}

      <Text style={[styles.bookCode, { color: colors.textSecondary }]}>{book.code}</Text>
      <Text style={[styles.bookName, { color: colors.text }]}>{book.name}</Text>
      {isApocryphal(book.code) && (
        <Text style={[styles.bookLangTag, { color: colors.textSecondary, borderColor: colors.borderColor }]}>Latim</Text>
      )}
      <Text style={[styles.bookChapters, { color: colors.textSecondary }]}>{book.chapters} cap.</Text>
    </TouchableOpacity>
  );
});

const ChapterButton = React.memo(function ChapterButton({
  chapter, isRead, colors, onOpen,
}: {
  chapter: number; isRead: boolean; colors: any; onOpen: (chapter: number) => void;
}) {
  const readBgColor = colors.readBackground;
  return (
    <TouchableOpacity
      style={[styles.chapterBtn, { backgroundColor: isRead ? readBgColor : colors.cardBackground }]}
      onPress={() => onOpen(chapter)}
    >
      <Text style={[styles.chapterText, { color: colors.text }]}>{chapter}</Text>
    </TouchableOpacity>
  );
});

export default function BookListScreen({ navigation }: any) {
  const { colors, toggleTheme } = useTheme();
  const db = useSQLiteContext();
  const { showDeuterocanonical, groupBooks, otOrder } = useSettings();
  const { activePlanId } = usePlans();
  const [selectedBook, setSelectedBook] = useState<typeof BOOKS[0] | null>(null);
  const [hasPreface, setHasPreface] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());
  const [booksProgress, setBooksProgress] = useState<Map<string, { read: number; total: number }>>(new Map());

  // Carregar progresso quando a tela é focada; só refaz se algo mudou desde a última carga
  // (capítulo marcado/desmarcado, configuração de deuterocanônicos ou livro selecionado)
  const lastLoad = useRef<{ version: number; deutero: boolean; book: string | null } | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      const current = {
        version: getReadProgressVersion(),
        deutero: showDeuterocanonical,
        book: selectedBook?.code ?? null,
      };
      const last = lastLoad.current;
      if (last && last.version === current.version && last.deutero === current.deutero && last.book === current.book) {
        return;
      }
      lastLoad.current = current;
      loadProgress();
      // Se tem um livro selecionado, recarregar seus capítulos lidos
      if (selectedBook) {
        loadReadChapters(selectedBook);
      } else {
        // Se não tem livro selecionado, carregar progresso de todos
        loadAllBooksProgress();
      }
    }, [selectedBook, showDeuterocanonical, activePlanId])
  );

  async function loadAllBooksProgress() {
    try {
      const booksData = await getBooksWithReadProgress(showDeuterocanonical);
      const progressMap = new Map<string, { read: number; total: number }>();
      
      for (const book of booksData) {
        progressMap.set(book.code, {
          read: book.readChapters,
          total: book.totalChapters,
        });
      }
      
      setBooksProgress(progressMap);
    } catch (e) {
      console.error('Erro ao carregar progresso dos livros:', e);
      setBooksProgress(new Map());
    }
  }

  async function loadProgress() {
    try {
      const progress = await getTotalReadProgress(showDeuterocanonical);
      setReadProgress(progress);
    } catch (e) {
      console.error('Erro ao carregar progresso:', e);
    }
  }

  async function loadReadChapters(book: typeof BOOKS[0]) {
    try {
      setReadChapters(await getReadChaptersForBook(book.code));
    } catch (e) {
      console.error('Erro ao carregar capítulos lidos:', e);
      setReadChapters(new Set());
    }
  }

  const handleSelectBook = useCallback(async (book: typeof BOOKS[0]) => {
    setSelectedBook(book);
    // Verificar se tem prefácio
    try {
      const prefaceData = await getPreface(db, book.code);
      setHasPreface(prefaceData.length > 0);
      
      // Carregar capítulos lidos deste livro
      await loadReadChapters(book);
    } catch (e) {
      console.error('Erro ao verificar prefácio:', e);
      setHasPreface(false);
      setReadChapters(new Set());
    }
  }, [db]);

  useEffect(() => {
    // Só intercepta o voltar enquanto esta aba está em foco (a aba Pais fica montada em segundo plano)
    if (!selectedBook) return;
    if (Platform.OS !== 'android') return;
    const onBack = () => {
      // Consulta o foco na hora do toque (sem re-renderizar a tela a cada troca de aba)
      if (!navigation.isFocused()) return false;
      setSelectedBook(null);
      return true; // impede sair do app
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, [selectedBook, navigation]);

  // Lista de linhas (cabeçalhos + livros): recalculada só quando filtro/configuração mudam
  const rows: BookListRow[] = useMemo(() => {
    const needle = removeAccents(searchText.toLowerCase());
    const matchesSearch = (b: typeof BOOKS[0]) => (FOLDED_NAMES.get(b.code) ?? '').includes(needle);
    return groupBooks
      ? buildGroupedRows(otOrder, showDeuterocanonical, matchesSearch)
      : BOOKS.filter(b => (showDeuterocanonical || !isApocryphal(b.code)) && matchesSearch(b))
          .map(book => ({ type: 'book' as const, key: book.code, book }));
  }, [groupBooks, otOrder, showDeuterocanonical, searchText]);

  const renderRow = useCallback(({ item: row }: { item: BookListRow }) => {
    if (row.type === 'header') {
      return <GroupHeader title={row.title} colors={colors} />;
    }
    const progress = booksProgress.get(row.book.code);
    return (
      <BookRow
        book={row.book}
        read={progress?.read ?? 0}
        total={progress?.total ?? 0}
        colors={colors}
        onSelect={handleSelectBook}
      />
    );
  }, [booksProgress, colors, handleSelectBook]);

  const chapterNumbers = useMemo(
    () => (selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) : []),
    [selectedBook]
  );

  const openChapter = useCallback((chapter: number) => {
    if (!selectedBook) return;
    navigation.navigate('Reader', {
      book: selectedBook.code,
      bookName: selectedBook.name,
      chapter,
      totalChapters: selectedBook.chapters,
    });
  }, [navigation, selectedBook]);

  const renderChapter = useCallback(({ item }: { item: number }) => (
    <ChapterButton chapter={item} isRead={readChapters.has(item)} colors={colors} onOpen={openChapter} />
  ), [readChapters, colors, openChapter]);

  // A lista de livros fica montada (só oculta) enquanto se vê a grade de capítulos,
  // assim o scroll e a busca são mantidos ao voltar
  const chaptersView = selectedBook ? (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <FadeInView trigger={selectedBook?.code}>
        {/* Header com título */}
        <View style={[styles.chapterHeaderContainer, { borderBottomColor: colors.borderColor }]}>
          <TouchableOpacity onPress={() => {
            setSelectedBook(null);
          }} style={styles.chapterBackBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.accentColor} />
          </TouchableOpacity>
          <Text style={[styles.chapterHeaderTitle, { color: colors.text }, brandFont()]}>{selectedBook.name}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search')}
            style={styles.chapterSearchBtn}
          >
            <Ionicons name="search" size={24} color={colors.accentColor} />
          </TouchableOpacity>
        </View>

        {/* Prefácio separado */}
        {hasPreface && (
          <TouchableOpacity
            style={[styles.prefaceBtn, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('Preface', {
              book: selectedBook.code,
              bookName: selectedBook.name,
            })}
          >
            <Text style={[styles.prefaceText, { color: colors.text }, subFont()]}>Prefácio de São Jerônimo</Text>
          </TouchableOpacity>
        )}

        {/* Lista de capítulos */}
        <FlatList
          key="chapters"
          data={chapterNumbers}
          numColumns={5}
          keyExtractor={c => String(c)}
          contentContainerStyle={styles.chapterListContent}
          renderItem={renderChapter}
          extraData={readChapters}
          initialNumToRender={30}
          windowSize={7}
          removeClippedSubviews
        />
        </FadeInView>
      </SafeAreaView>
  ) : null;

  return (
    <>
      {chaptersView}
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }, selectedBook && styles.hidden]}
        edges={['top', 'left', 'right']}
      >
        <FadeInView trigger={selectedBook === null}>
        <View style={[styles.titleBarContainer, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
          <TouchableOpacity onPress={toggleTheme}>
            <Text style={[styles.title, { color: colors.text }, brandFont()]}>Tetrapla</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={styles.topBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={26} color={colors.accentColor} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBtn} onPress={() => navigation.navigate('Search')}>
              <OutlinedIcon name="search" size={24} outlineColor={colors.accentColor} fillColor={colors.background} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.searchBarContainer, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="search" size={20} color={colors.inputPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar livro..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <FlatList
          key="books"
          data={rows}
          keyExtractor={r => r.key}
          renderItem={renderRow}
          initialNumToRender={16}
          maxToRenderPerBatch={12}
          windowSize={9}
          removeClippedSubviews
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum livro encontrado</Text>}
        />
        </FadeInView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hidden: { display: 'none' },
  titleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600' },
  groupHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6, borderBottomWidth: 1 },
  groupHeaderText: { fontSize: 15 },
  chapterHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chapterBackBtn: {
    padding: 8,
  },
  chapterSearchBtn: {
    padding: 8,
  },
  chapterHeaderTitle: {
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  back: { padding: 16 },
  backText: { fontSize: 16, color: '#1D9E75' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
  bookRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
    position: 'relative',
    overflow: 'hidden',
  },
  bookRowApocryphal: {
    backgroundColor: '#FFE8E8',
  },
  bookRowCompleted: {
    backgroundColor: '#C8E6C9',
  },
  bookProgressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  bookCode: { width: 44, fontSize: 12, color: '#888', fontFamily: 'monospace', zIndex: 1 },
  bookName: { flex: 1, fontSize: 16, zIndex: 1 },
  bookLangTag: { fontSize: 10, marginRight: 8, paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderRadius: 8, zIndex: 1 },
  bookChapters: { fontSize: 12, color: '#aaa', zIndex: 1 },
  chapterListContent: { paddingHorizontal: 12, paddingTop: 8 },
  chapterBtn: {
    flex: 1, margin: 4, aspectRatio: 1,
    backgroundColor: '#f5f5f5', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  chapterText: { fontSize: 16 },
  prefaceBtn: {
    margin: 12, marginBottom: 0,
    backgroundColor: '#e8f5e9', borderRadius: 8,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  prefaceText: { fontSize: 18, fontWeight: '600', color: '#1D9E75', textAlign: 'center' },
});
