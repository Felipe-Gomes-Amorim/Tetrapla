import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Modal, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

type Ref = { author: string; work: string; quote: string };

interface Props {
  visible: boolean;
  onClose: () => void;
  refs: Ref[];
  verseRef: string;
}

export default function PatristicSheet({ visible, onClose, refs, verseRef }: Props) {
  const { colors } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      padding: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderColor,
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    closeBtn: { marginTop: 12, alignSelf: 'flex-end' },
    closeText: { color: colors.accentColor, fontSize: 15, fontWeight: '500' },
    list: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: colors.cardBackground, borderRadius: 10,
      padding: 14, marginBottom: 10,
    },
    author: { fontSize: 14, fontWeight: '600', color: colors.text },
    work: { fontSize: 12, color: colors.textSecondary, marginTop: 2, marginBottom: 6 },
    quote: { fontSize: 14, lineHeight: 20, color: colors.text, fontStyle: 'italic' },
    empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={dynamicStyles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>{verseRef}</Text>
          <Text style={dynamicStyles.headerSub}>{refs.length} referências patrísticas</Text>
          <TouchableOpacity style={dynamicStyles.closeBtn} onPress={onClose}>
            <Text style={dynamicStyles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={refs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={dynamicStyles.list}
          renderItem={({ item }) => (
            <View style={dynamicStyles.card}>
              <Text style={dynamicStyles.author}>{item.author}</Text>
              <Text style={dynamicStyles.work}>{item.work}</Text>
              <Text style={dynamicStyles.quote}>"{item.quote}"</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={dynamicStyles.empty}>Nenhuma referência encontrada.</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const staticStyles = StyleSheet.create({
  closeBtn: { marginTop: 12, alignSelf: 'flex-end' },
  list: { padding: 16, paddingBottom: 40 },
});