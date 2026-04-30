import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Modal, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Ref = { author: string; work: string; quote: string };

interface Props {
  visible: boolean;
  onClose: () => void;
  refs: Ref[];
  verseRef: string;
}

export default function PatristicSheet({ visible, onClose, refs, verseRef }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{verseRef}</Text>
          <Text style={styles.headerSub}>{refs.length} referências patrísticas</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={refs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.author}>{item.author}</Text>
              <Text style={styles.work}>{item.work}</Text>
              <Text style={styles.quote}>"{item.quote}"</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma referência encontrada.</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  closeBtn: { marginTop: 12, alignSelf: 'flex-end' },
  closeText: { color: '#1D9E75', fontSize: 15, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#f9f9f9', borderRadius: 10,
    padding: 14, marginBottom: 10,
  },
  author: { fontSize: 14, fontWeight: '600' },
  work: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 6 },
  quote: { fontSize: 14, lineHeight: 20, color: '#333', fontStyle: 'italic' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});