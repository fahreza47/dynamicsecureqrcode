import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { styles } from './LoginScreen.styles';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Penyimpanan lokal persisten
import { BASE_URL, SESSION_KEY, AUTH_TOKEN_KEY } from '../config';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Mencegah double-submit saat request berlangsung

  const handleLogin = async () => {
    // Validasi sederhana sebelum memanggil API
    if (!username.trim() || !password.trim()) {
      Alert.alert('Peringatan', 'Username dan password tidak boleh kosong.');
      return;
    }
    try {
      setLoading(true);
      // Kirim kredensial ke backend untuk diverifikasi
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok) {
        // Simpan JWT token untuk autentikasi request selanjutnya
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access_token);

        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            userId: data.user_id,
            username: data.username,
            role: data.role,
            origin: data.origin ?? null,
          }),
        );

        // Routing berdasarkan role: admin → AdminTabs, user → UserTabs
        if (data.role === 'admin') {
          navigation.navigate('AdminTabs');
        } else {
          navigation.navigate('UserTabs');
        }
      } else {
        Alert.alert('Login Gagal', data.detail || 'Username atau password salah.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Tidak dapat menghubungi server. Periksa koneksi internet.');
    } finally {
      setLoading(false); // Reset state loading apapun hasilnya
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* KeyboardAvoidingView: mencegah keyboard menutupi input form */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>Dynamic Secure QR Ticketing</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan username"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"   // Username bersifat case-sensitive
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}  // Menyembunyikan/menampilkan karakter password
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Image 
                    source={showPassword 
                      ? require('../assets/flaticon/eye-crossed.png') 
                      : require('../assets/flaticon/eye.png')
                    } 
                    style={{ width: 20, height: 20, tintColor: '#6c757d' }} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tombol nonaktif saat loading untuk mencegah double-request */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Memproses...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Belum punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Branding logo di bagian bawah layar (ikon outlined Azure) */}
          <View style={styles.bottomLogo}>
            <View style={styles.logoBox}>
              <Image source={require('../assets/app_logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
            <Text style={styles.logoText}>DYNAMIC SECURE QR CODE</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


