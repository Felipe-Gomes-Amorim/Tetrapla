import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BookListScreen from '../screens/BookListScreen';
import FathersListScreen from '../screens/FathersListScreen';
import ProgressRing from '../components/ProgressRing';
import { useTheme, useFathersTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { getTotalReadProgress } from '../db/database';
import { getTotalProgress } from '../data/fatherProgress';
import { subscribeProgress } from '../data/progressEvents';
import { subFont } from '../theme/fonts';

const Tab = createBottomTabNavigator();

const BAR_HEIGHT = 70;
const CENTER_SIZE = 64;
// Parte do botão central que sobe acima da barra; fica dentro do container para receber toques no Android
const CENTER_RISE = 24;
const ICON_SIZE = 28;

const TAB_META: Record<string, { label: string; icon: 'book' | 'library' }> = {
  Bible: { label: 'Bíblia', icon: 'book' },
  Fathers: { label: 'Pais', icon: 'library' },
};

// Anel central: mostra o progresso da seção selecionada (Bíblia = verde, Pais = azul)
function CenterButton({ section, onPress }: { section: 'Bible' | 'Fathers'; onPress: () => void }) {
  const { colors } = useTheme();
  const { colors: fathers } = useFathersTheme();
  const { showDeuterocanonical } = useSettings();
  const [bible, setBible] = useState(0);
  const [father, setFather] = useState(0);
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;
    const load = () => {
      getTotalReadProgress(showDeuterocanonical).then(p => active && setBible(p)).catch(() => {});
      getTotalProgress().then(p => active && setFather(p.percent)).catch(() => {});
    };
    load();
    const unsubscribe = subscribeProgress(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [showDeuterocanonical]);

  // Troca de seção: o anel dá uma pulsada curta (escala + opacidade)
  useEffect(() => {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }).start();
  }, [section]);

  const isFathers = section === 'Fathers';
  const accent = isFathers ? fathers.accentColor : colors.accentColor;
  const percent = isFathers ? father : bible;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.center,
        { backgroundColor: colors.background, borderColor: accent, shadowColor: accent },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isFathers ? 'Progresso dos Pais' : 'Progresso de leitura'}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      >
        <ProgressRing
          progress={percent}
          size={50}
          strokeWidth={4}
          backgroundColor={colors.cardBackground}
          fillColor={accent}
        />
        <Text style={[styles.centerText, { color: accent }]}>{Math.round(percent)}%</Text>
      </Animated.View>
    </Pressable>
  );
}

function TabItem({
  routeName,
  focused,
  onPress,
  onLongPress,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const { colors: fathers } = useFathersTheme();
  const meta = TAB_META[routeName];
  // Cada aba usa a cor da própria seção quando ativa
  const active = routeName === 'Fathers' ? fathers.accentColor : colors.accentColor;
  const color = focused ? active : colors.textSecondary;
  return (
    <Pressable style={styles.item} onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" accessibilityState={{ selected: focused }}>
      <Ionicons name={focused ? meta.icon : (`${meta.icon}-outline` as any)} size={ICON_SIZE} color={color} />
      <Text style={[styles.label, { color }, subFont(), focused && styles.labelActive]} numberOfLines={1}>
        {meta.label}
      </Text>
    </Pressable>
  );
}

const MainTabBar = React.memo(function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const section = state.routes[state.index].name as 'Bible' | 'Fathers';

  const press = (index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (state.index !== index && !event.defaultPrevented) navigation.navigate(route.name);
  };
  const longPress = (index: number) => navigation.emit({ type: 'tabLongPress', target: state.routes[index].key });

  return (
    <View style={{ height: BAR_HEIGHT + insets.bottom + CENTER_RISE, paddingTop: CENTER_RISE }}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.borderColor,
            height: BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TabItem routeName="Bible" focused={section === 'Bible'} onPress={() => press(0)} onLongPress={() => longPress(0)} />
        <View style={styles.centerSlot} />
        <TabItem routeName="Fathers" focused={section === 'Fathers'} onPress={() => press(1)} onLongPress={() => longPress(1)} />
      </View>
      <View style={styles.centerWrap} pointerEvents="box-none">
        <CenterButton
          section={section}
          onPress={() => navigation.getParent()?.navigate(section === 'Fathers' ? 'FatherProgress' : 'Progress')}
        />
      </View>
    </View>
  );
});

// Monta a aba Pais só depois que a tela inicial terminou de aparecer, para a troca de aba não travar
function DeferredFathers(props: any) {
  const [ready, setReady] = useState(false);
  const { colors } = useTheme();
  useEffect(() => {
    // Depois do primeiro frame (+ folga), para a aba inicial aparecer sem competir com a montagem desta
    const timer = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(timer);
  }, []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <FathersListScreen {...props} />;
}

// Navbar inferior: Bíblia | botão central de progresso | Pais. As telas de leitura ficam no Stack raiz, por cima.
export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={props => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        freezeOnBlur: true,
        lazy: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Bible" component={BookListScreen} options={{ title: 'Bíblia' }} />
      <Tab.Screen name="Fathers" component={DeferredFathers} options={{ title: 'Pais' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 6 },
  label: { fontSize: 11 },
  labelActive: { fontWeight: 'bold' },
  centerSlot: { width: CENTER_SIZE + 24 },
  centerWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  center: {
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  centerText: { position: 'absolute', fontSize: 11, fontWeight: 'bold' },
});
