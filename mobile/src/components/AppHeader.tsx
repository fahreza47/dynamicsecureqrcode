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
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#007BFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8, // Compensate for padding so icon is closer to edge
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#007BFF', // Azure Blue
  },
  backPlaceholder: {
    width: 16, // If no back button, just a little space
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
});
