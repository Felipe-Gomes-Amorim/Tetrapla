import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  fillColor?: string;
}

export default function ProgressRing({
  progress,
  size = 50,
  strokeWidth = 3,
  backgroundColor = '#a0a0a0',
  fillColor = '#1D9E75',
}: ProgressRingProps) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Círculo de fundo (outline cinza) */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Arco de progresso (verde) */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={cx}
          originY={cy}
        />
      </Svg>
    </View>
  );
}
