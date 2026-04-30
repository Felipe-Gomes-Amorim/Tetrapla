import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TouchableWithoutFeedback
} from 'react-native';

export default function CustomAlert({ visible, title, message, onClose }: any) {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            opacity.setValue(0);
            scale.setValue(0.9);

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    return (

        <Modal visible={visible} transparent animationType="none">

            {/* clique fora */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity }]}>

                    {/* evita fechar ao clicar dentro */}
                    <TouchableWithoutFeedback>
                        <Animated.View style={[styles.box, { transform: [{ scale }] }]}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>

                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <Text style={styles.buttonText}>OK</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>

                </Animated.View>
            </TouchableWithoutFeedback>

        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    box: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#555',
        marginBottom: 16,
    },
    button: {
        alignSelf: 'flex-end',
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    buttonText: {
        color: '#1D9E75',
        fontWeight: '600',
    },
});