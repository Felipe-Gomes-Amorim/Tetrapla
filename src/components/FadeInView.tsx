import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

// Entrada suave: fade + deslize curto para cima (native driver, não pesa na JS thread).
// A animação reinicia quando `trigger` muda (ex.: voltar a mostrar uma lista que ficou oculta).
export default function FadeInView({
  children, style, trigger, duration = 220, distance = 10,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  trigger?: unknown;
  duration?: number;
  distance?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [trigger]);

  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
