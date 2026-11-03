import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { subFont } from '../theme/fonts';

export default function SettingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { showDeuterocanonical, setShowDeuterocanonical } = useSettings();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }, subFont()]}>Configurações</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.accentColor }, subFont()]}>Livros</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Livros deuterocanônicos</Text>
            <Switch
              value={showDeuterocanonical}
              onValueChange={setShowDeuterocanonical}
              trackColor={{ false: colors.borderColor, true: colors.accentColor }}
              thumbColor="#fff"
            />
          </View>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Tobias, Judite, Sabedoria, Eclesiástico, Baruque, 1 e 2 Macabeus.{'\n'}
            Disponíveis apenas em latim (e grego em alguns livros).
          </Text>
        </View>
      </View>
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
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  card: { borderRadius: 10, borderWidth: 1, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '500', flex: 1, paddingRight: 12 },
  help: { fontSize: 13, lineHeight: 19, marginTop: 8 },
});
