import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getPreface } from '../db/database';
import { useTheme } from '../contexts/ThemeContext';
import { brandFont, subFont } from '../theme/fonts';

// Função para normalizar caracteres especiais/problemáticos
function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    // Apóstrofos e aspas curvas
    .replace(/[\u2018\u2019\u0091\u0092]/g, "'")  // Aspas simples curvas → apóstrofo
    .replace(/[\u201C\u201D\u0093\u0094]/g, '"')  // Aspas duplas curvas → aspas retas
    // Travessões
    .replace(/[\u2013\u2014]/g, '-')  // Travessões → hífen
    // Reticências
    .replace(/[\u2026]/g, '...')  // … → ...
    // Espaços especiais
    .replace(/[\u00A0\u2000-\u200B]/g, ' ')  // Espaços especiais → espaço normal
    // Remove losango com interrogação e outros símbolos de erro
    .replace(/[\uFFFD]/g, '?');
}

type Block = { heading: boolean; text: string };

// Linhas inteiramente em maiúsculas (ex: "BEGINNING OF THE PROLOGUE...") viram títulos;
// linhas de título consecutivas são unidas em um só.
function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const letters = trimmed.match(/[A-Za-z]/g)?.length ?? 0;
    const heading = letters >= 8 && trimmed === trimmed.toUpperCase();
    const last = blocks[blocks.length - 1];
    if (heading && last?.heading) last.text += ' ' + trimmed;
    else if (heading) blocks.push({ heading: true, text: trimmed });
    else if (last && !last.heading) last.text += '\n' + line;
    else blocks.push({ heading: false, text: line });
  }
  return blocks;
}

export default function PrefaceScreen({ route, navigation }: any) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const { book, bookName } = route.params;
  const [preface, setPreface] = useState<{ title: string; content_eng: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: colors.headerBackground,
      },
      headerTintColor: colors.accentColor,
      headerTitleStyle: {
        color: colors.text,
        ...brandFont(),
      },
    });
  }, [colors, navigation]);

  useEffect(() => {
    loadPreface();
  }, [book]);

  async function loadPreface() {
    setLoading(true);
    try {
      const result = await getPreface(db, book);
      if (result.length > 0) {
        // Normaliza o texto antes de salvar no state
        setPreface({
          title: normalizeText(result[0].title),
          content_eng: normalizeText(result[0].content_eng),
        });
      }
    } catch (e) {
      console.error('Erro ao carregar prefácio:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentColor} />
      </View>
    );
  }

  if (!preface) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Text style={[styles.noContent, { color: colors.textSecondary }]}>Nenhum prefácio disponível para este livro.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.accentColor }, subFont()]}>{preface.title}</Text>
        {splitBlocks(preface.content_eng).map((b, i) =>
          b.heading ? (
            <Text key={i} style={[styles.heading, { color: colors.accentColor }, subFont()]}>{b.text}</Text>
          ) : (
            <Text key={i} style={[styles.content, { color: colors.text }]}>{b.text}</Text>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 16, color: '#1D9E75' },
  heading: { fontSize: 17, lineHeight: 24, marginTop: 12, marginBottom: 8, textAlign: 'center', color: '#1D9E75' },
  content: { fontSize: 14, lineHeight: 22, color: '#333', textAlign: 'justify' },
  noContent: { fontSize: 16, color: '#888', textAlign: 'center' },
});
