import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import BookListScreen from '../screens/BookListScreen';
import FathersListScreen from '../screens/FathersListScreen';
import { useTheme } from '../contexts/ThemeContext';
import { subFont } from '../theme/fonts';

const Tab = createBottomTabNavigator();

// Navbar inferior: Bíblia | Pais. As telas de leitura ficam no Stack raiz, por cima (sem a barra).
export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: 'beside-icon',
        tabBarActiveTintColor: colors.accentColor,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 14, ...subFont() },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderColor,
          borderTopWidth: 1,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen
        name="Bible"
        component={BookListScreen}
        options={{
          title: 'Bíblia',
          // Ícone sempre verde (cor de destaque); ativo = preenchido, inativo = contorno
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={size} color={colors.accentColor} />
          ),
        }}
      />
      <Tab.Screen
        name="Fathers"
        component={FathersListScreen}
        options={{
          title: 'Pais',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} size={size} color={colors.accentColor} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
