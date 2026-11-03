import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { subFont } from '../theme/fonts';

export default function SettingsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { showDeuterocanonical, setShowDeuterocanonical, groupBooks, setGroupBooks, otOrder, setOtOrder } = useSettings();

  // Opções extras: aparecem com fade + slide ao ligar e saem do layout só depois da animação de saída
  const anim = useRef(new Animated.Value(groupBooks ? 1 : 0)).current;
  const [renderExtra, setRenderExtra] = useState(groupBooks);
  useEffect(() => {
    if (groupBooks) {
      setRenderExtra(true);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setRenderExtra(false);
      });
    }
  }, [groupBooks]);

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

        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor, marginTop: 12 }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Separar livros em grupos</Text>
            <Switch
              value={groupBooks}
              onValueChange={setGroupBooks}
              trackColor={{ false: colors.borderColor, true: colors.accentColor }}
              thumbColor="#fff"
            />
          </View>
          <Text style={[styles.help, { color: colors.textSecondary }]}>
            Mostra um título antes de cada grupo (Pentateuco, Profetas, Evangelhos...).
          </Text>

          {renderExtra && (
            <Animated.View
              style={{
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
                marginTop: 14,
              }}
            >
              <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>Ordem do Antigo Testamento</Text>
              <View style={[styles.segment, { borderColor: colors.accentColor }]}>
                {([['christian', 'Cristão'], ['jewish', 'Judaico']] as const).map(([value, label]) => {
                  const active = otOrder === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.segmentBtn, active && { backgroundColor: colors.accentColor }]}
                      onPress={() => setOtOrder(value)}
                    >
                      <Text style={[styles.segmentText, { color: active ? '#fff' : colors.text }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.help, { color: colors.textSecondary }]}>
                {otOrder === 'jewish'
                  ? 'Tanakh: Torá, Neviim (Profetas) e Ketuvim (Escritos). O Novo Testamento não muda.'
                  : 'Pentateuco, Históricos, Sapienciais/Poéticos e Profetas. O Novo Testamento não muda.'}
              </Text>
            </Animated.View>
          )}
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
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontSize: 15, fontWeight: '600' },
  help: { fontSize: 13, lineHeight: 19, marginTop: 8 },
});
