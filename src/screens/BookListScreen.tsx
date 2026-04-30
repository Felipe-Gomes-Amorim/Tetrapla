import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, BackHandler, Platform, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { BOOKS, getPreface } from '../db/database';
import { Ionicons } from '@expo/vector-icons';

export default function BookListScreen({ navigation }: any) {
  const db = useSQLiteContext();
  const [selectedBook, setSelectedBook] = useState<typeof BOOKS[0] | null>(null);
  const [hasPreface, setHasPreface] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSelectBook = async (book: typeof BOOKS[0]) => {
    setSelectedBook(book);
    // Verificar se tem prefácio
    try {
      const prefaceData = await getPreface(db, book.code);
      setHasPreface(prefaceData.length > 0);
    } catch (e) {
      console.error('Erro ao verificar prefácio:', e);
      setHasPreface(false);
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
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <TouchableOpacity onPress={() => setSelectedBook(null)} style={styles.back}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={18} color="#1D9E75" />
            <Text style={styles.backText}> {selectedBook.name}</Text>
          </View>
        </TouchableOpacity>

        {/* Prefácio separado */}
        {hasPreface && (
          <TouchableOpacity
            style={styles.prefaceBtn}
            onPress={() => navigation.navigate('Preface', {
              book: selectedBook.code,
              bookName: selectedBook.name,
            })}
          >
            <Text style={styles.prefaceText}>Prefácio de São Jerônimo</Text>
          </TouchableOpacity>
        )}

        {/* Lista de capítulos */}
        <FlatList
          key="chapters"
          data={chapters}
          numColumns={5}
          keyExtractor={c => String(c)}
          contentContainerStyle={styles.chapterListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chapterBtn}
              onPress={() => navigation.navigate('Reader', {
                book: selectedBook.code,
                bookName: selectedBook.name,
                chapter: item,
                totalChapters: selectedBook.chapters,
              })}
            >
              <Text style={styles.chapterText}>{item}</Text>
            </TouchableOpacity>
          )}
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
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.titleBarContainer}>
          <Text style={styles.title}>Bíblia Políglota</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search" size={24} color="#1D9E75" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar livro..."
            placeholderTextColor="#aaa"
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookRow}
              onPress={() => handleSelectBook(item)}
            >
              <Text style={styles.bookCode}>{item.code}</Text>
              <Text style={styles.bookName}>{item.name}</Text>
              <Text style={styles.bookChapters}>{item.chapters} cap.</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum livro encontrado</Text>}
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
  back: { padding: 16 },
  backText: { fontSize: 16, color: '#1D9E75' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
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
  },
  bookCode: { width: 44, fontSize: 12, color: '#888', fontFamily: 'monospace' },
  bookName: { flex: 1, fontSize: 16 },
  bookChapters: { fontSize: 12, color: '#aaa' },
  chapterListContent: { paddingHorizontal: 12 },
  chapterBtn: {
    flex: 1, margin: 4, aspectRatio: 1,
    backgroundColor: '#f5f5f5', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  chapterText: { fontSize: 16 },
  prefaceBtn: {
    margin: 4, marginBottom: 12,
    backgroundColor: '#e8f5e9', borderRadius: 8,
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  prefaceText: { fontSize: 16, fontWeight: '600', color: '#1D9E75', textAlign: 'center' },
});
