import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OutlinedIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size: number;
  outlineColor: string;
  fillColor: string; // normalmente a cor do fundo, para o ícone parecer vazado
  thickness?: number;
}

// Contorno que segue o formato do glifo: cópias do ícone deslocadas na cor do contorno,
// com o ícone na cor de fundo por cima.
const OFFSETS = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7],
];

export default function OutlinedIcon({ name, size, outlineColor, fillColor, thickness = 1.5 }: OutlinedIconProps) {
  const box = size + thickness * 2;
  const layer = (dx: number, dy: number, color: string, key: string) => (
    <View key={key} style={{ position: 'absolute', left: thickness + dx, top: thickness + dy }}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
  return (
    <View style={{ width: box, height: box }}>
      {OFFSETS.map(([x, y], i) => layer(x * thickness, y * thickness, outlineColor, `o${i}`))}
      {layer(0, 0, fillColor, 'fill')}
    </View>
  );
}
