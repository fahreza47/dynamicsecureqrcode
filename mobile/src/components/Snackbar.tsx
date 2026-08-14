import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, Platform, TouchableOpacity, View } from 'react-native';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
  duration?: number;
}

export default function Snackbar({
  visible,
  message,
  type = 'info',
  onDismiss,
  duration = 3000,
}: SnackbarProps) {
  const slideAnim = useRef(new Animated.Value(100)).current; // Mulai tersembunyi di bawah layar

  useEffect(() => {
    if (visible) {
      // Animasi muncul (slide up)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      // Mulai timer untuk auto-dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Animasi turun (slide down)
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return '#007BFF'; // Azure Blue untuk sukses/sinkronisasi
      case 'error':
        return '#dc2626'; // Merah untuk error
      case 'info':
      default:
        return '#212529'; // Hitam gelap/abu tua untuk info umum
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBgColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.text}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>Tutup</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 75, // Melayang di atas bottom tab bar
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    zIndex: 9999,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
