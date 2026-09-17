import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FontSizeModalProps {
  visible: boolean;
  currentSize: number;
  onClose: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  colors?: {
    background: string;
    text: string;
    cardBackground: string;
    accentColor: string;
    borderColor?: string;
  };
}

const defaultColors = {
  background: '#fff',
  text: '#222',
  cardBackground: '#f5f5f5',
  accentColor: '#1D9E75',
};

export default function FontSizeModal({
  visible,
  currentSize,
  onClose,
  onIncrease,
  onDecrease,
  colors = defaultColors,
}: FontSizeModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.accentColor} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text }]}>Tamanho da Fonte</Text>

          <View style={[styles.previewContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.previewText, { fontSize: currentSize, color: colors.text }]}>
              Jesus Cristo
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.accentColor }]} onPress={onDecrease}>
              <Text style={styles.buttonText}>−</Text>
            </TouchableOpacity>

            <Text style={[styles.sizeLabel, { color: colors.accentColor }]}>{currentSize}px</Text>

            <TouchableOpacity style={[styles.button, { backgroundColor: colors.accentColor }]} onPress={onIncrease}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.accentColor }]} onPress={onClose}>
            <Text style={styles.confirmText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    color: '#222',
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 8,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D9E75',
  },
  confirmBtn: {
    backgroundColor: '#1D9E75',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
