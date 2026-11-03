import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { subFont } from '../theme/fonts';
import { searchFathers, FatherSearchResult } from '../data/fatherSearch';

const PAGE_SIZE = 50;
// Se a primeira busca passar disso, avisamos que o índice está sendo montado
const INDEX_NOTICE_DELAY_MS = 700;

export default function FatherSearchScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<FatherSearchResult[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [preparing, setPreparing] = useState(false);
  // Identifica a busca atual: respostas de buscas antigas são ignoradas
  const searchId = useRef(0);
  const firstSearchDone = useRef(false);

  useEffect(() => {
    const id = ++searchId.current;
    setPreparing(false);
    if (searchText.trim().length < 2) {
      setResults([]);
      setTotal(null);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    const perform = async () => {
      setLoading(true);
      setLoadingMore(false);
      if (!firstSearchDone.current) {
        noticeTimer = setTimeout(() => {
          if (id === searchId.current) setPreparing(true);
        }, INDEX_NOTICE_DELAY_MS);
      }
      try {
        const res = await searchFathers(searchText, PAGE_SIZE, 0);
        if (id !== searchId.current) return;
        firstSearchDone.current = true;
        setResults(res.results);
        setTotal(res.total);
      } catch (e) {
        console.error('Erro ao buscar nos Pais:', e);
      } finally {
        if (noticeTimer) clearTimeout(noticeTimer);
        if (id === searchId.current) {
          setLoading(false);
          setPreparing(false);
        }
      }
    };

    const timer = setTimeout(perform, 300);
    return () => {
      clearTimeout(timer);
      if (noticeTimer) clearTimeout(noticeTimer);
    };
  }, [searchText]);

  const loadMore = async () => {
    if (loading || loadingMore || total === null || results.length >= total) return;
    const id = searchId.current;
    setLoadingMore(true);
    try {
      const res = await searchFathers(searchText, PAGE_SIZE, results.length);
      if (id !== searchId.current) return;
      setResults(prev => [...prev, ...res.results]);
    } catch (e) {
      console.error('Erro ao carregar mais resultados:', e);
    } finally {
      if (id === searchId.current) setLoadingMore(false);
    }
  };

  const renderSnippet = (text: string, highlight: string) => {
    const term = highlight.trim();
    if (!term) return <Text style={[styles.snippet, { color: colors.textSecondary }]} numberOfLines={3}>{text}</Text>;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <Text style={[styles.snippet, { color: colors.textSecondary }]} numberOfLines={3}>
        {parts.map((part, idx) =>
          part.toLowerCase() === term.toLowerCase() ? (
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

  const active = searchText.trim().length >= 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }, subFont()]}>Buscar nos Pais</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
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
          {preparing && <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Preparando índice…</Text>}
        </View>
      )}

      {!loading && !active && (
        <View style={styles.center}>
          <Ionicons name="search" size={48} color={colors.borderColor} />
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Digite para buscar...</Text>
        </View>
      )}

      {!loading && active && total !== null && total > 0 && (
        <Text style={[styles.totalText, { color: colors.textSecondary, borderBottomColor: colors.borderColor }]}>
          {total.toLocaleString('pt-BR')} {total === 1 ? 'trecho encontrado' : 'trechos encontrados'}
        </Text>
      )}

      {!loading && active && total === 0 && (
        <View style={styles.center}>
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Nenhum resultado</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.workId}-${item.chapter}-${item.matchIndex}-${idx}`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.accentColor} /> : undefined
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.resultRow, { borderBottomColor: colors.borderColor }]}
            onPress={() =>
              navigation.navigate('FatherReader', { id: item.workId, chapter: item.chapter, highlight: searchText })
            }
          >
            <View style={styles.resultContent}>
              <Text style={[styles.resultRef, { color: colors.accentColor }]}>
                {item.workTitle} · {item.chapterLabel}
              </Text>
              {renderSnippet(item.snippet, searchText)}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.borderColor} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 8,
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16, marginTop: 12 },
  totalText: { fontSize: 13, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  footerLoader: { paddingVertical: 16 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultContent: { flex: 1 },
  resultRef: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  snippet: { fontSize: 13, lineHeight: 18 },
});
