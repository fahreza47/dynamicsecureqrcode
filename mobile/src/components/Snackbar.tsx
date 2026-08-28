import React, { useEffect, useRef, useState } from 'react';
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

  // [FIX] Dulu ada 2 jalur animasi turun yang saling tumpang tindih: satu manual
  // (150ms, dipicu tombol Tutup/timer) dan satu lagi otomatis lewat effect (200ms,
  // dipicu perubahan prop `visible`) — keduanya jalan berurutan tiap kali dismiss.
  // Sekarang cuma ada SATU jalur: prop `visible` adalah satu-satunya sumber
  // kebenaran untuk animasi masuk/keluar. `handleDismiss` cuma memanggil
  // `onDismiss()` (mengubah `visible` di parent), animasi keluarnya ditangani
  // di sini secara konsisten.
  //
  // `rendered` sengaja dipisah dari `visible`: komponen baru benar-benar
  // unmount (return null) SETELAH animasi slide-down selesai, bukan instan
  // saat `visible` berubah — supaya animasi keluar selalu sempat kelihatan,
  // termasuk kalau suatu saat ada kode lain yang set visible=false langsung
  // tanpa lewat tombol/timer Snackbar ini.
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      // Animasi muncul (slide up)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      // Auto-dismiss — cukup ubah `visible` lewat onDismiss, animasi keluar
      // ditangani satu tempat saja di branch else bawah ini.
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Animasi turun (slide down), baru unmount konten setelah animasi selesai
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return '#2563eb'; // Royal Blue untuk sukses/sinkronisasi
      case 'error':
        return '#dc2626'; // Merah untuk error
      case 'info':
      default:
        return '#0f172a'; // Slate Dark untuk info umum
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
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>Tutup</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90, // Melayang bersih di atas floating bottom tab bar
    left: 16,
    right: 16,
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
