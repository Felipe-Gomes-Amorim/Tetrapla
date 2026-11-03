import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Provisório: o T2 implementa a lista de escritos dos Pais (assets/fathers/*.md)
export default function FathersListScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Pais da Igreja</Text>
    </View>
  );
}
