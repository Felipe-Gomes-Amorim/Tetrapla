import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTotalReadProgress, getBooksWithReadProgress, BOOKS } from '../db/database';
import ProgressRing from '../components/ProgressRing';
import { getTitleAndBadge } from '../data/titles';
import { useTheme } from '../contexts/ThemeContext';

interface BookProgress {
  code: string;
  name: string;
  readChapters: number;
  totalChapters: number;
}

export default function ProgressScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState<string | null>(null);
  const [badge, setBadge] = useState<string | null>(null);
  const [tierColor, setTierColor] = useState('#a0a0a0');
  const [books, setBooks] = useState<BookProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
    }, [])
  );

  async function loadProgress() {
    try {
      setLoading(true);
      const prog = await getTotalReadProgress();
      setProgress(prog);

      const titleInfo = getTitleAndBadge(prog);
      setTitle(titleInfo.title);
      setBadge(titleInfo.badge);
      setTierColor(titleInfo.tierColor);

      const booksData = await getBooksWithReadProgress();
      // Filtrar apenas livros que foram lidos (readChapters > 0)
      const readBooks = booksData.filter(b => b.readChapters > 0);
      setBooks(readBooks);
    } catch (e) {
      console.error('Erro ao carregar progresso:', e);
    } finally {
      setLoading(false);
    }
  }

  const completedBooks = books.filter(b => b.readChapters === b.totalChapters).length;
  const initiatedBooks = books.filter(b => b.readChapters > 0).length;
  const totalChaptersRead = books.reduce((sum, b) => sum + b.readChapters, 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Header com botão voltar */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Progresso de Leitura</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentColor} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => item.code}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <>
              {/* Circle com porcentagem */}
              <View style={styles.circleContainer}>
                <ProgressRing
                  progress={progress}
                  size={240}
                  strokeWidth={10}
                  backgroundColor={colors.cardBackground}
                  fillColor={colors.accentColor}
                />
                <View style={styles.percentageContainer}>
                  <Text style={[styles.percentageText, { color: colors.accentColor }]}>{Math.round(progress)}%</Text>
                </View>
              </View>

              {/* Título e Badge */}
              {title ? (
                <View style={styles.titleBadgeContainer}>
                  <Text style={[styles.title, { color: tierColor }]}>{title}</Text>
                  <Text style={[styles.badge, { color: colors.textSecondary }]}>{badge}</Text>
                </View>
              ) : (
                <View style={styles.titleBadgeContainer}>
                  <Text style={[styles.encouragement, { color: colors.textSecondary }]}>
                    Continue lendo para desbloquear títulos! 
                  </Text>
                </View>
              )}

              {/* Statistics */}
              <View style={[styles.statisticsContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{completedBooks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Livros Completos</Text>
                </View>
                <View style={[styles.divider, { borderRightColor: colors.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{initiatedBooks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Livros Iniciados</Text>
                </View>
                <View style={[styles.divider, { borderRightColor: colors.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{totalChaptersRead}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Capítulos Lidos</Text>
                </View>
              </View>

              {books.length > 0 && (
                <Text style={[styles.booksTitle, { color: colors.text }]}>Progresso por Livro</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum livro iniciado ainda. Comece a ler!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bookItem, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderColor }]}>
              <View style={styles.bookInfo}>
                <Text style={[styles.bookName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.bookProgress, { color: colors.textSecondary }]}>
                  {item.readChapters} de {item.totalChapters} capítulos
                </Text>
              </View>
              <View style={[styles.bookProgressBar, { backgroundColor: colors.inputBackground }]}>
                <View
                  style={[
                    styles.bookProgressFill,
                    {
                      width: `${(item.readChapters / item.totalChapters) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.bookPercentage, { color: colors.textSecondary }]}>
                {Math.round((item.readChapters / item.totalChapters) * 100)}%
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  circleContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: '#1D9E75',
    fontSize: 48,
    fontWeight: 'bold',
  },
  titleBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  badge: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  encouragement: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  statisticsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#1D9E75',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#ddd',
  },
  booksTitle: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  bookItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookProgress: {
    color: '#666',
    fontSize: 12,
  },
  bookProgressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bookProgressFill: {
    height: '100%',
    backgroundColor: '#1D9E75',
  },
  bookPercentage: {
    color: '#1D9E75',
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
