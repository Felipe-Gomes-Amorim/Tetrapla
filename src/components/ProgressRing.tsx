import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Abaixo disso o arco seria só o ponto do linecap, que parece progresso que não existe
const MIN_VISIBLE_PROGRESS = 1;

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  fillColor?: string;
  // Se informado, contorna as bordas externa e interna do anel (contorno colado ao formato do anel)
  outlineColor?: string;
  outlineWidth?: number;
}

export default function ProgressRing({
  progress,
  size = 50,
  strokeWidth = 3,
  backgroundColor = '#a0a0a0',
  fillColor = '#1D9E75',
  outlineColor,
  outlineWidth = 1.5,
}: ProgressRingProps) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const isComplete = normalizedProgress >= 100;
  const outline = outlineColor ? outlineWidth : 0;
  const radius = (size - strokeWidth) / 2 - outline;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Contorno nas duas bordas do anel, encostado nele por fora */}
        {outlineColor && (
          <>
            <Circle cx={cx} cy={cy} r={radius + strokeWidth / 2 + outline / 2} stroke={outlineColor} strokeWidth={outline} fill="none" />
            <Circle cx={cx} cy={cy} r={radius - strokeWidth / 2 - outline / 2} stroke={outlineColor} strokeWidth={outline} fill="none" />
          </>
        )}

        {/* Círculo de fundo (outline cinza) */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Arco de progresso: com 0% (ou valor minúsculo) não desenha nada, pois o linecap round deixaria um ponto verde */}
        {normalizedProgress >= MIN_VISIBLE_PROGRESS && (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={fillColor}
            strokeWidth={strokeWidth}
            fill="none"
            // Em 100% o círculo é completo e sem dash/cap, para fechar sem emenda
            strokeDasharray={isComplete ? undefined : circumference}
            strokeDashoffset={isComplete ? undefined : strokeDashoffset}
            strokeLinecap={isComplete ? 'butt' : 'round'}
            rotation="-90"
            originX={cx}
            originY={cy}
          />
        )}
      </Svg>
    </View>
  );
}
