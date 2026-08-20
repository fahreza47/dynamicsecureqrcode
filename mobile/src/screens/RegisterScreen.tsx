import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, AUTH_TOKEN_KEY, SESSION_KEY } from '../config';
import { styles } from './RegisterScreen.styles';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validasi input sebelum memanggil API
    if (username.trim().length < 3) {
      Alert.alert('Validasi', 'Username minimal 3 karakter.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validasi', 'Password minimal 6 karakter.');
      return;
    }
    try {
      setLoading(true);
      // Backend akan generate master_secret_key unik saat register
      // master_secret_key adalah root dari hierarki KDF seluruh tiket user ini
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simpan JWT token dan session
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
        await AsyncStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            userId: data.id,
            username: data.username,
            role: data.role,
            origin: null,
          }),
        );

        Alert.alert('Sukses', 'Akun berhasil dibuat. Silakan login.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.detail || 'Registrasi gagal.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Tidak dapat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Image 
                  source={require('../assets/flaticon/angle-left.png')} 
                  style={styles.backIcon} 
                />
              </TouchableOpacity> */}
              <Text style={styles.title}>Daftar Akun</Text>
            </View>
            <Text style={styles.subtitle}>Dynamic Secure QR Ticketing</Text>
          </View>

          <View style={styles.form}>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#94a3b8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
                  secureTextEntry={!showPassword}
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

            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? 'Memproses...' : 'Register'}</Text>
            </TouchableOpacity>

            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomLogo}>
            <View style={styles.logoBox}>
              <Image source={require('../assets/app_logo.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
            <Text style={styles.logoText}>DYNAMIC SECURE QR CODE</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


