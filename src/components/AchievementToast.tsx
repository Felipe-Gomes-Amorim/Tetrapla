import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface AchievementToastProps {
  visible: boolean;
  achievement?: {
    name: string;
    icon: string;
  } | null;
}

export default function AchievementToast({
  visible,
  achievement,
}: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, achievement, slideAnim]);

  if (!achievement) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.leftBorder} />
      <View style={styles.content}>
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Achievement Desbloqueado!</Text>
          <Text style={styles.name}>{achievement.name}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  leftBorder: {
    width: 4,
    backgroundColor: '#FFD700',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
