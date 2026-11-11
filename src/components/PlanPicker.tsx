import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { usePlans } from '../contexts/PlansContext';
import { DEFAULT_PLAN_ID, DEFAULT_PLAN_NAME, PLAN_COLORS } from '../data/plans';
import ColorSwatches from './ColorSwatches';
import { subFont } from '../theme/fonts';

// Dropdown de metas de leitura (fica acima do círculo de progresso). O verde padrão só aparece
// na meta Padrão; as demais usam a cor escolhida ao criá-las.
export default function PlanPicker() {
  const { colors, isDark } = useTheme();
  const { plans, activePlanId, activePlanName, setActivePlan, addPlan } = usePlans();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PLAN_COLORS[0]);

  // Cor do ponto da Padrão = verde do tema; das demais = cor da meta
  const defaultDot = isDark ? '#4CAF50' : '#1D9E75';
  const activeDot = plans.find(p => p.id === activePlanId)?.color ?? defaultDot;

  const close = () => {
    setOpen(false);
    setCreating(false);
    setName('');
  };

  const choose = (id: string) => {
    setActivePlan(id);
    close();
  };

  const create = () => {
    addPlan(name, color);
    close();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Meta de leitura: ${activePlanName}`}
      >
        <View style={[styles.dot, { backgroundColor: activeDot }]} />
        <Text style={[styles.triggerText, { color: colors.text }]} numberOfLines={1}>{activePlanName}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }, subFont()]}>Metas de leitura</Text>

              {[{ id: DEFAULT_PLAN_ID, name: DEFAULT_PLAN_NAME, color: defaultDot }, ...plans].map(p => (
                <TouchableOpacity key={p.id} style={styles.option} onPress={() => choose(p.id)}>
                  <View style={[styles.dot, { backgroundColor: p.color }]} />
                  <Text style={[styles.optionText, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                  {p.id === activePlanId && <Ionicons name="checkmark" size={20} color={p.color} />}
                </TouchableOpacity>
              ))}

              {creating ? (
                <View style={[styles.createBox, { borderTopColor: colors.borderColor }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
                    placeholder="Nome da meta"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={name}
                    onChangeText={setName}
                    maxLength={30}
                    autoFocus
                  />
                  <ColorSwatches value={color} onChange={setColor} />
                  <View style={styles.createActions}>
                    <TouchableOpacity onPress={() => setCreating(false)} style={styles.actionBtn}>
                      <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={create}
                      disabled={!name.trim()}
                      style={[styles.actionBtn, styles.createBtn, { backgroundColor: color, opacity: name.trim() ? 1 : 0.4 }]}
                    >
                      <Text style={styles.createBtnText}>Criar meta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.option, styles.newOption, { borderTopColor: colors.borderColor }]}
                  onPress={() => setCreating(true)}
                >
                  <Ionicons name="add-circle-outline" size={22} color={colors.accentColor} />
                  <Text style={[styles.optionText, { color: colors.accentColor }]}>Nova meta</Text>
                </TouchableOpacity>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    minWidth: 170,
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  triggerText: { flex: 1, fontSize: 15, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  sheet: { borderRadius: 14, borderWidth: 1, padding: 16 },
  sheetTitle: { fontSize: 18, marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  optionText: { flex: 1, fontSize: 16 },
  newOption: { marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  createBox: { marginTop: 8, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 14 },
  input: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  createBtn: {},
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
