import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getPreface } from '../db/database';

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

export default function PrefaceScreen({ route }: any) {
  const db = useSQLiteContext();
  const { book, bookName } = route.params;
  const [preface, setPreface] = useState<{ title: string; content_eng: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (!preface) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.noContent}>Nenhum prefácio disponível para este livro.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{preface.title}</Text>
        <Text style={styles.content}>{preface.content_eng}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1D9E75' },
  content: { fontSize: 14, lineHeight: 22, color: '#333', textAlign: 'justify' },
  noContent: { fontSize: 16, color: '#888', textAlign: 'center' },
});
