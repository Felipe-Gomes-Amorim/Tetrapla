import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { searchVerses, BOOKS } from '../db/database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function SearchScreen({ navigation }: any) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchText.trim().length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const rows = await searchVerses(db, searchText);
        setResults(rows);
      } catch (e) {
        console.error('Erro ao buscar versículos:', e);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Função para encontrar o nome do livro pelo código
  const getBookName = (code: string) => {
    const book = BOOKS.find(b => b.code === code);
    return book?.name || code;
  };

  // Função para renderizar o texto com a busca em negrito
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <Text style={[styles.resultText, { color: colors.textSecondary }]} numberOfLines={2}>
        {parts.map((part, idx) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <Text key={idx} style={{ fontWeight: 'bold', color: colors.text }}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Buscar Versículos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.searchBarContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={colors.inputPlaceholder} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Digite palavras..."
          placeholderTextColor={colors.inputPlaceholder}
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={colors.inputPlaceholder} />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentColor} />
        </View>
      )}

      {!loading && searchText.trim().length < 2 && (
        <View style={styles.center}>
          <Ionicons name="search" size={48} color={colors.borderColor} />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Digite para buscar...</Text>
        </View>
      )}

      {!loading && searchText.trim().length >= 2 && results.length === 0 && (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum versículo encontrado</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.book}-${item.chapter}-${item.verse}-${idx}`}
        contentContainerStyle={styles.resultsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.resultRow, { borderBottomColor: colors.borderColor }]}
            onPress={() => {
              navigation.navigate('Reader', {
                book: item.book,
                bookName: getBookName(item.book),
                chapter: item.chapter,
                totalChapters: BOOKS.find(b => b.code === item.book)?.chapters || 1,
                scrollToVerse: item.verse,
              });
            }}
          >
            <View style={styles.resultContent}>
              <Text style={[styles.resultRef, { color: colors.accentColor }]}>
                {getBookName(item.book)} {item.chapter}:{item.verse}
              </Text>
              {renderHighlightedText(item.pt, searchText)}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.borderColor} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#222' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  resultsList: {
    paddingHorizontal: 0,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  resultContent: {
    flex: 1,
  },
  resultRef: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D9E75',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
});
