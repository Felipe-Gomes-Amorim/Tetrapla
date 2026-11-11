import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLAN_COLORS } from '../data/plans';

// Paleta de cores das metas de leitura (uma linha de bolinhas que quebra conforme a largura)
export default function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View style={styles.row}>
      {PLAN_COLORS.map(c => (
        <TouchableOpacity
          key={c}
          style={[styles.swatch, { backgroundColor: c }]}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={`Cor ${c}`}
          accessibilityState={{ selected: c === value }}
        >
          {c === value && <Ionicons name="checkmark" size={18} color="#fff" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
