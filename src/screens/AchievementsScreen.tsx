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
import { Ionicons } from '@expo/vector-icons';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievements';
import { getCompletedAchievements, isAchievementCompleted } from '../db/achievementsDb';
import { useTheme } from '../contexts/ThemeContext';

interface AchievementItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  isCompleted: boolean;
}

export default function AchievementsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      setLoading(true);
      const completed = await getCompletedAchievements();
      setCompletedCount(completed.length);

      const items: AchievementItem[] = await Promise.all(
        ACHIEVEMENTS.map(async (ach) => ({
          id: ach.id,
          name: ach.name,
          description: ach.description,
          icon: ach.icon,
          isCompleted: completed.includes(ach.id),
        }))
      );

      // Ordenar: completados primeiro, depois outros
      items.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? -1 : 1;
      });

      setAchievements(items);
    } catch (e) {
      console.error('Erro ao carregar achievements:', e);
    } finally {
      setLoading(false);
    }
  }

  const renderAchievementItem = ({ item }: { item: AchievementItem }) => {
    const achievement = getAchievementById(item.id);
    const isProgressAchievement = achievement?.trigger.type === 'progress';

    return (
      <View
        style={[
          styles.achievementItem,
          { backgroundColor: colors.cardBackground, borderColor: item.isCompleted ? colors.accentColor : colors.borderColor },
          {
            opacity: item.isCompleted ? 1 : 0.6,
          },
        ]}
      >
        <View style={[styles.achievementIcon, { backgroundColor: colors.inputBackground }]}>
          <Text style={styles.icon}>
            {item.isCompleted ? item.icon : '🔒'}
          </Text>
        </View>
        <View style={styles.achievementContent}>
          <Text
            style={[
              styles.achievementName,
              { color: colors.text },
              !item.isCompleted && !isProgressAchievement && styles.secretName,
              !item.isCompleted && !isProgressAchievement && { color: colors.textSecondary },
            ]}
          >
            {!item.isCompleted && !isProgressAchievement
              ? '❓ Desafio Secreto'
              : item.name}
          </Text>
          <Text
            style={[
              styles.achievementDescription,
              { color: colors.textSecondary },
              !item.isCompleted && !isProgressAchievement && styles.secretDescription,
            ]}
          >
            {!item.isCompleted && !isProgressAchievement
              ? 'Desbloqueie este desafio para ver detalhes'
              : item.description}
          </Text>
        </View>
        {item.isCompleted && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color={colors.accentColor} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Achievements</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressSection, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.cardBackground }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(completedCount / ACHIEVEMENTS.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {completedCount} de {ACHIEVEMENTS.length} desbloqueados
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentColor} />
        </View>
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={item => item.id}
          renderItem={renderAchievementItem}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
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
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1D9E75',
  },
  progressText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  achievementItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 28,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  secretName: {
    color: '#999',
  },
  achievementDescription: {
    color: '#666',
    fontSize: 12,
    lineHeight: 16,
  },
  secretDescription: {
    color: '#999',
  },
  checkmark: {
    marginLeft: 8,
  },
});
