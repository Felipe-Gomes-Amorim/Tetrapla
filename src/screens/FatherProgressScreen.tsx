import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from '../components/ProgressRing';
import { useFathersTheme } from '../contexts/ThemeContext';
import { subFont } from '../theme/fonts';
import { getTotalProgress, getWorksProgress } from '../data/fatherProgress';

type WorkProgress = Awaited<ReturnType<typeof getWorksProgress>>[number];

type Row =
  | { type: 'author'; key: string; title: string }
  | { type: 'work'; key: string; work: WorkProgress };

// Agrupa por autor mantendo a ordem em que os escritos chegam
function buildRows(works: WorkProgress[]): Row[] {
  const rows: Row[] = [];
  let lastAuthor: string | null = null;
  for (const w of works) {
    if (w.author !== lastAuthor) {
      rows.push({ type: 'author', key: `a-${rows.length}-${w.author}`, title: w.author });
      lastAuthor = w.author;
    }
    rows.push({ type: 'work', key: w.id, work: w });
  }
  return rows;
}

export default function FatherProgressScreen({ navigation }: any) {
  const { colors } = useFathersTheme();
  const [total, setTotal] = useState({ read: 0, total: 0, percent: 0 });
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [t, works] = await Promise.all([getTotalProgress(), getWorksProgress()]);
          if (!active) return;
          setTotal(t);
          setRows(buildRows(works));
        } catch (e) {
          console.error('Erro ao carregar progresso dos Pais:', e);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }, subFont()]}>Progresso dos Pais</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accentColor} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => r.key}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.ringBox}>
              <View>
                <ProgressRing
                  progress={total.percent}
                  size={240}
                  strokeWidth={10}
                  backgroundColor={colors.cardBackground}
                  fillColor={colors.accentColor}
                />
                <View style={styles.ringCenter}>
                  <Text style={[styles.percent, { color: colors.accentColor }]}>{Math.round(total.percent)}%</Text>
                </View>
              </View>
              <Text style={[styles.count, { color: colors.textSecondary }]}>
                {total.read} de {total.total} capítulos lidos
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>Nenhum escrito disponível.</Text>
          }
          renderItem={({ item }) => {
            if (item.type === 'author') {
              return <Text style={[styles.author, { color: colors.accentColor }, subFont()]}>{item.title}</Text>;
            }
            const w = item.work;
            const pct = w.total > 0 ? Math.min(100, (w.read / w.total) * 100) : 0;
            const started = w.read > 0;
            return (
              <TouchableOpacity
                style={[
                  styles.workItem,
                  { backgroundColor: colors.cardBackground },
                  // Escritos com algo lido ganham destaque; os demais ficam mais discretos
                  started ? { borderLeftColor: colors.accentColor, borderLeftWidth: 3 } : { opacity: 0.7 },
                ]}
                onPress={() => navigation.navigate('FatherReader', { id: w.id, chapter: 1 })}
              >
                <View style={styles.workInfo}>
                  <Text style={[styles.workTitle, { color: colors.text }]} numberOfLines={2}>{w.title}</Text>
                  <Text style={[styles.workSub, { color: colors.textSecondary }]}>
                    {w.read} de {w.total} capítulos
                  </Text>
                </View>
                <View style={[styles.bar, { backgroundColor: colors.inputBackground }]}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors.accentColor }]} />
                </View>
                <Text style={[styles.pct, { color: started ? colors.accentColor : colors.textSecondary }]}>
                  {Math.round(pct)}%
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  ringBox: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  ringCenter: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  percent: { fontSize: 48, fontWeight: 'bold' },
  count: { fontSize: 15, marginTop: 16 },
  author: { fontSize: 15, marginTop: 16, marginBottom: 8 },
  workItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workInfo: { flex: 1 },
  workTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  workSub: { fontSize: 12 },
  bar: { width: 60, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%' },
  pct: { fontSize: 12, fontWeight: '600', width: 40, textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 15 },
});
