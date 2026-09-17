import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, BackHandler, Platform, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { BOOKS, getPreface, getTotalReadProgress, isApocryphal, isChapterRead, getBooksWithReadProgress } from '../db/database';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from '../components/ProgressRing';
import { useTheme } from '../contexts/ThemeContext';

export default function BookListScreen({ navigation }: any) {
  const { colors, toggleTheme } = useTheme();
  const db = useSQLiteContext();
  const [selectedBook, setSelectedBook] = useState<typeof BOOKS[0] | null>(null);
  const [hasPreface, setHasPreface] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const [readChapters, setReadChapters] = useState<Set<number>>(new Set());
  const [booksProgress, setBooksProgress] = useState<Map<string, { read: number; total: number }>>(new Map());

  // Carregar progresso quando a tela é focada
  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      // Se tem um livro selecionado, recarregar seus capítulos lidos
      if (selectedBook) {
        loadReadChapters(selectedBook);
      } else {
        // Se não tem livro selecionado, carregar progresso de todos
        loadAllBooksProgress();
      }
    }, [selectedBook])
  );

  async function loadAllBooksProgress() {
    try {
      const booksData = await getBooksWithReadProgress();
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
      const progress = await getTotalReadProgress();
      setReadProgress(progress);
    } catch (e) {
      console.error('Erro ao carregar progresso:', e);
    }
  }

  async function loadReadChapters(book: typeof BOOKS[0]) {
    try {
      const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
      const read = new Set<number>();
      for (const chapter of chapters) {
        const isRead = await isChapterRead(book.code, chapter);
        if (isRead) read.add(chapter);
      }
      setReadChapters(read);
    } catch (e) {
      console.error('Erro ao carregar capítulos lidos:', e);
      setReadChapters(new Set());
    }
  }

  const handleSelectBook = async (book: typeof BOOKS[0]) => {
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
  };

  useEffect(() => {
    if (!selectedBook) return;
    if (Platform.OS !== 'android') return;
    const onBack = () => {
      setSelectedBook(null);
      return true; // impede sair do app
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, [selectedBook]);

  if (selectedBook) {
    const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header com título */}
        <View style={[styles.chapterHeaderContainer, { borderBottomColor: colors.borderColor }]}>
          <TouchableOpacity onPress={() => {
            setSelectedBook(null);
          }} style={styles.chapterBackBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.accentColor} />
          </TouchableOpacity>
          <Text style={[styles.chapterHeaderTitle, { color: colors.text }]}>{selectedBook.name}</Text>
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
            <Text style={[styles.prefaceText, { color: colors.text }]}>Prefácio de São Jerônimo</Text>
          </TouchableOpacity>
        )}

        {/* Lista de capítulos */}
        <FlatList
          key="chapters"
          data={chapters}
          numColumns={5}
          keyExtractor={c => String(c)}
          contentContainerStyle={styles.chapterListContent}
          renderItem={({ item }) => {
            const isRead = readChapters.has(item);
            const readBgColor = colors.isDark ? '#1a3a1a' : '#E8F5E9';
            return (
            <TouchableOpacity
              style={[
                styles.chapterBtn,
                { backgroundColor: isRead ? readBgColor : colors.cardBackground },
              ]}
              onPress={() => navigation.navigate('Reader', {
                book: selectedBook.code,
                bookName: selectedBook.name,
                chapter: item,
                totalChapters: selectedBook.chapters,
              })}
            >
              <Text style={[styles.chapterText, { color: colors.text }]}>{item}</Text>
            </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    );
  }

  if (!selectedBook) {
    // Função para remover acentos
    const removeAccents = (text: string) =>
      text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Filtro de livros pelo texto de busca (case-insensitive e sem acentos)
    const filteredBooks = BOOKS.filter(b =>
      removeAccents(b.name.toLowerCase()).includes(
        removeAccents(searchText.toLowerCase())
      )
    );

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.titleBarContainer, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
          <TouchableOpacity onPress={toggleTheme}>
            <Text style={[styles.title, { color: colors.text }]}>Tetrapla</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Progress')}>
              <ProgressRing progress={readProgress} size={24} strokeWidth={3} backgroundColor={colors.cardBackground} fillColor={colors.accentColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
              <Ionicons name="star" size={24} color={colors.accentColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Ionicons name="search" size={24} color={colors.accentColor} />
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
          data={filteredBooks}
          keyExtractor={b => b.code}
          renderItem={({ item }) => {
            const progress = booksProgress.get(item.code);
            let progressPercent = 0;
            
            if (progress && progress.total > 0) {
              // Se completou todos os capítulos, garantir 100%
              if (progress.read >= progress.total) {
                progressPercent = 100;
              } else {
                progressPercent = (progress.read / progress.total) * 100;
              }
            }
            
            return (
              <TouchableOpacity
                style={[
                  styles.bookRow,
                  { borderBottomColor: colors.borderColor },
                  isApocryphal(item.code) && { backgroundColor: colors.isDark ? '#3a2a2a' : '#FFE8E8' },
                  progressPercent === 100 && { backgroundColor: colors.isDark ? '#2a3a2a' : '#C8E6C9' }
                ]}
                onPress={() => handleSelectBook(item)}
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
                
                <Text style={[styles.bookCode, { color: colors.textSecondary }]}>{item.code}</Text>
                <Text style={[styles.bookName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.bookChapters, { color: colors.textSecondary }]}>{item.chapters} cap.</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum livro encontrado</Text>}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  titleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: '600' },
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
  prefaceText: { fontSize: 16, fontWeight: '600', color: '#1D9E75', textAlign: 'center' },
});
