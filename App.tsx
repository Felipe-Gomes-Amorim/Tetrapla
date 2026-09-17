import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { SQLiteProvider } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import BookListScreen from './src/screens/BookListScreen';
import ReaderScreen from './src/screens/ReaderScreen';
import PrefaceScreen from './src/screens/PrefaceScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import { initializeDatabase } from './src/db/database';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

const Stack = createStackNavigator();

function AppContent() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    // Configurar barra de status do sistema
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    
    // Para Android, configurar cores das barras
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(colors.background, true);
    }
  }, [isDark, colors]);

  const defaultHeaderOptions = (navigation: any) => ({
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Search')}
        style={{ paddingRight: 12 }}
      >
        <Ionicons name="search" size={24} color="#1D9E75" />
      </TouchableOpacity>
    ),
  });

  // Criar tema customizado baseado no tema atual
  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.background,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.background,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Books"
          component={BookListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={({ route, navigation }) => {
            // Direction: 'next' (right to left), 'prev' (left to right), default to 'next'
            const direction = (route?.params as any)?.direction || 'next';
            return {
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 180 } },
                close: { animation: 'timing', config: { duration: 120 } },
              },
              cardStyleInterpolator: ({ current, layouts, next, inverted }) => {
                // Direction: 'next' = right-to-left, 'prev' = left-to-right
                const isNext = direction === 'next';
                const translateX = current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: isNext
                    ? [layouts.screen.width, 0]
                    : [-layouts.screen.width, 0],
                });
                const opacity = current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                });
                return {
                  cardStyle: {
                    opacity,
                    transform: [{ translateX }],
                  },
                };
              },
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Search')}
                  style={{ paddingRight: 12 }}
                >
                  <Ionicons name="search" size={24} color="#1D9E75" />
                </TouchableOpacity>
              ),
            };
          }}
        />
        <Stack.Screen
          name="Preface"
          component={PrefaceScreen}
          options={({ navigation }) => defaultHeaderOptions(navigation)}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    prepareDb().then(() => setReady(true));
  }, []);

  async function prepareDb() {
    if (Platform.OS === 'web') {
      console.log('Plataforma web - pulando cópia de banco');
      return;
    }

    const sqliteDir = FileSystem.documentDirectory + 'SQLite/';
    const dbDest = sqliteDir + 'bible.db';
    const versionFile = sqliteDir + 'db_version.txt';

    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Mude este número sempre que atualizar o banco
    const CURRENT_VERSION = '10';

    let needsCopy = false;
    const versionInfo = await FileSystem.getInfoAsync(versionFile);
    if (!versionInfo.exists) {
      needsCopy = true;
    } else {
      const savedVersion = await FileSystem.readAsStringAsync(versionFile);
      if (savedVersion !== CURRENT_VERSION) needsCopy = true;
    }

    if (needsCopy) {
      console.log('Copiando banco versão', CURRENT_VERSION);
      // Deletar arquivo antigo se existir
      const dbInfo = await FileSystem.getInfoAsync(dbDest);
      if (dbInfo.exists) {
        try {
          await FileSystem.deleteAsync(dbDest);
          console.log('Arquivo antigo deletado');
        } catch (e) {
          console.warn('Erro ao deletar arquivo antigo:', e);
        }
      }
      const asset = Asset.fromModule(require('./assets/bible.db'));
      await asset.downloadAsync();
      console.log('✅ Asset downloaded de:', asset.localUri, 'Tamanho:', (asset as any).localUri);
      await FileSystem.copyAsync({ from: asset.localUri!, to: dbDest });
      await FileSystem.writeAsStringAsync(versionFile, CURRENT_VERSION);
      console.log('✅ Banco copiado para:', dbDest);
      
      // Verificar que foi copiado corretamente
      const newFileInfo = await FileSystem.getInfoAsync(dbDest);
      console.log('✅ Banco copiado - Tamanho:', (newFileInfo as any).size, 'bytes');
    } else {
      console.log('Banco já existe com versão correta');
    }

    // Verificar que o banco foi copiado
    const fileInfo = await FileSystem.getInfoAsync(dbDest);
    console.log('Banco existe:', fileInfo.exists, 'Tamanho:', (fileInfo as any).size);
  }

  if (!ready) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#1D9E75" />
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SQLiteProvider databaseName="bible.db" onInit={testDatabase}>
            <AppContent />
          </SQLiteProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

async function testDatabase(db: SQLite.SQLiteDatabase) {
  try {
    // Inicializar tabelas se necessário
    await initializeDatabase(db);

    // Teste básico
    const tables = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table'`
    );
    console.log('📊 Tabelas encontradas:', tables.map(t => t.name).join(', '));

    // Teste de dados patrísticos (com tratamento de erro)
    try {
      const count = await db.getFirstAsync<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM patristic_refs`
      );
      console.log('📚 Total de referências patrísticas:', count?.cnt ?? 0);

      const rom8 = await db.getFirstAsync<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM patristic_refs WHERE book='ROM' AND chapter=8`
      );
      console.log('✅ ROM 8:', rom8?.cnt ?? 0, 'referências');

      if (!rom8 || rom8.cnt === 0) {
        console.warn('⚠️  Aviso: ROM 8 não tem dados patrísticos - possível banco original sem tabelas populadas');
      }
    } catch (e) {
      console.warn('⚠️  Tabela patristic_refs ainda não está populada (esperado se banco original não tem dados)');
    }
  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  }
}