import React from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFatherGroups, FatherWork } from '../data/fathers';
import { subFont } from '../theme/fonts';

const sections = getFatherGroups().map(g => ({ title: g.group, data: g.works }));

function formatSize(kb: number) {
  return kb >= 1000 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${kb} KB`;
}

export default function FathersListScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.titleBar, { borderBottomColor: colors.borderColor }]}>
        <Text style={[styles.title, { color: colors.text }, subFont()]}>Pais da Igreja</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(w: FatherWork) => w.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.accentColor }, subFont()]}>{section.title}</Text>
        )}
        renderItem={({ item }: { item: FatherWork }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.borderColor }]}
            onPress={() => navigation.navigate('FatherReader', { id: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.workTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.workMeta, { color: colors.textSecondary }]}>
                {item.author} · {formatSize(item.sizeKB)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 22 },
  list: { paddingBottom: 24 },
  sectionTitle: { fontSize: 16, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  workTitle: { fontSize: 16, marginBottom: 2 },
  workMeta: { fontSize: 12 },
});
