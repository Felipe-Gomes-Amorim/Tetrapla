import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FontSizeModalProps {
  visible: boolean;
  currentSize: number;
  onClose: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export default function FontSizeModal({
  visible,
  currentSize,
  onClose,
  onIncrease,
  onDecrease,
}: FontSizeModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1D9E75" />
          </TouchableOpacity>

          <Text style={styles.title}>Tamanho da Fonte</Text>

          <View style={styles.previewContainer}>
            <Text style={[styles.previewText, { fontSize: currentSize }]}>
              Jesus Cristo
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity style={styles.button} onPress={onDecrease}>
              <Text style={styles.buttonText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.sizeLabel}>{currentSize}px</Text>

            <TouchableOpacity style={styles.button} onPress={onIncrease}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
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
