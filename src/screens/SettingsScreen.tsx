import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Animated, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, planAccent } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePlans } from '../contexts/PlansContext';
import FadeInView from '../components/FadeInView';
import ColorSwatches from '../components/ColorSwatches';
import { subFont } from '../theme/fonts';

export default function SettingsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { plans, updatePlan, removePlan } = usePlans();
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const { showDeuterocanonical, setShowDeuterocanonical, groupBooks, setGroupBooks, otOrder, setOtOrder } = useSettings();

  // Opções extras: aparecem com fade + slide ao ligar e saem do layout só depois da animação de saída
  const anim = useRef(new Animated.Value(groupBooks ? 1 : 0)).current;
  const [renderExtra, setRenderExtra] = useState(groupBooks);

  // Seletor Cristão | Judaico: o fundo verde desliza (translateX, native driver) e a cor do texto troca junto
  const [segmentWidth, setSegmentWidth] = useState(0);
  const slide = useRef(new Animated.Value(otOrder === 'jewish' ? 1 : 0)).current;
  const slideText = useRef(new Animated.Value(otOrder === 'jewish' ? 1 : 0)).current;
  useEffect(() => {
    const toValue = otOrder === 'jewish' ? 1 : 0;
    Animated.timing(slide, { toValue, duration: 200, useNativeDriver: true }).start();
    // Cor do texto não suporta native driver, então usa um valor separado em paralelo
    Animated.timing(slideText, { toValue, duration: 200, useNativeDriver: false }).start();
  }, [otOrder]);
  const pillWidth = Math.max(0, (segmentWidth - 2) / 2); // desconta a borda de 1px de cada lado
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

      <FadeInView>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
              <View
                style={[styles.segment, { borderColor: colors.accentColor }]}
                onLayout={e => setSegmentWidth(e.nativeEvent.layout.width)}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentPill,
                    {
                      width: pillWidth,
                      backgroundColor: colors.accentColor,
                      transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, pillWidth] }) }],
                    },
                  ]}
                />
                {([['christian', 'Cristão', 0], ['jewish', 'Judaico', 1]] as const).map(([value, label, index]) => (
                  <TouchableOpacity key={value} style={styles.segmentBtn} onPress={() => setOtOrder(value)}>
                    <Animated.Text
                      style={[
                        styles.segmentText,
                        {
                          color: slideText.interpolate({
                            inputRange: [0, 1],
                            outputRange: index === 0 ? ['#fff', colors.text] : [colors.text, '#fff'],
                          }),
                        },
                      ]}
                    >
                      {label}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.help, { color: colors.textSecondary }]}>
                {otOrder === 'jewish'
                  ? 'Tanakh: Torá, Neviim (Profetas) e Ketuvim (Escritos). O Novo Testamento não muda.'
                  : 'Pentateuco, Históricos, Sapienciais/Poéticos e Profetas. O Novo Testamento não muda.'}
              </Text>
            </Animated.View>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.accentColor, marginTop: 24 }, subFont()]}>Metas de leitura</Text>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}>
          {plans.length === 0 ? (
            <Text style={[styles.help, { color: colors.textSecondary, marginTop: 0 }]}>
              Nenhuma meta criada. Crie uma na tela de Progresso de Leitura, no menu acima do círculo.
              Cada meta tem progresso próprio e a cor dela troca o verde da Bíblia.
            </Text>
          ) : (
            plans.map((p, i) => {
              const editing = editingPlanId === p.id;
              return (
                <View key={p.id} style={i > 0 && [styles.planDivider, { borderTopColor: colors.borderColor }]}>
                  <TouchableOpacity style={styles.planRow} onPress={() => setEditingPlanId(editing ? null : p.id)}>
                    <View style={[styles.planDot, { backgroundColor: planAccent(p.color, isDark) }]} />
                    <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                    <Ionicons name={editing ? 'chevron-up' : 'create-outline'} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {editing && (
                    <View style={styles.planEditor}>
                      <TextInput
                        style={[styles.planInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
                        defaultValue={p.name}
                        onChangeText={name => { if (name.trim()) updatePlan(p.id, { name }); }}
                        maxLength={30}
                        placeholder="Nome da meta"
                        placeholderTextColor={colors.inputPlaceholder}
                      />
                      <ColorSwatches value={p.color} onChange={color => updatePlan(p.id, { color })} />
                      <TouchableOpacity
                        style={styles.planRemove}
                        onPress={() =>
                          Alert.alert('Remover meta', `Remover "${p.name}" e todo o progresso dela?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Remover', style: 'destructive', onPress: () => { setEditingPlanId(null); removePlan(p.id); } },
                          ])
                        }
                      >
                        <Ionicons name="trash-outline" size={18} color="#E53935" />
                        <Text style={styles.planRemoveText}>Remover meta</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      </FadeInView>
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
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  card: { borderRadius: 10, borderWidth: 1, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '500', flex: 1, paddingRight: 12 },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  segmentPill: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontSize: 15, fontWeight: '600' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  planDivider: { borderTopWidth: StyleSheet.hairlineWidth },
  planDot: { width: 18, height: 18, borderRadius: 9 },
  planEditor: { gap: 14, paddingBottom: 12 },
  planInput: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  planRemove: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  planRemoveText: { color: '#E53935', fontSize: 15 },
  help: { fontSize: 13, lineHeight: 19, marginTop: 8 },
});
