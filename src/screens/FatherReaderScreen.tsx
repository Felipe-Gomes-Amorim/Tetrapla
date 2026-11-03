import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Provisório: o T2 implementa o leitor dos escritos (rota 'FatherReader', params: { id: string })
export default function FatherReaderScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Leitor</Text>
    </View>
  );
}
