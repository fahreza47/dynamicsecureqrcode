import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

type AppHeaderProps = {
  title: string;           // Nama halaman, ditampilkan di tengah/kiri
  onBack?: () => void;     // Handler tombol back — jika undefined, tombol back tidak muncul
  showBack?: boolean;      // Default: true jika onBack ada
};

export default function AppHeader({ title, onBack, showBack = true }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {showBack && onBack ? (
        <TouchableOpacity style={styles.backButtonBox} onPress={onBack} activeOpacity={0.7}>
          <Image source={require('../assets/flaticon/angle-left.png')} style={styles.backIcon} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#f8fafc',
  },
  backButtonBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  backIcon: {
    width: 16,
    height: 16,
    tintColor: '#2563eb', // Royal Blue
  },
  backPlaceholder: {
    width: 8,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
});
