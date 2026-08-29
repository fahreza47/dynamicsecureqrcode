import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, AUTH_TOKEN_KEY, SESSION_KEY } from '../config';
import { styles } from './RegisterScreen.styles';
import CustomDialog, { DialogType } from '../components/CustomDialog';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // State untuk CustomDialog
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type?: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmStyle?: 'default' | 'danger';
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleRegister = async () => {
    // Validasi input sebelum memanggil API
    if (username.trim().length < 3) {
      setDialogConfig({
        visible: true,
        type: 'warning',
        title: 'Validasi Username',
        message: 'Username minimal terdiri dari 3 karakter.',
        confirmText: 'Mengerti',
        onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
      });
      return;
    }
    if (password.length < 6) {
      setDialogConfig({
        visible: true,
        type: 'warning',
        title: 'Validasi Password',
        message: 'Password minimal terdiri dari 6 karakter.',
        confirmText: 'Mengerti',
        onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
      });
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

        setDialogConfig({
          visible: true,
          type: 'success',
          title: 'Pendaftaran Berhasil!',
          message: 'Akun Anda berhasil dibuat. Silakan login untuk melanjutkan.',
          confirmText: 'Login Sekarang',
          onConfirm: () => {
            setDialogConfig(prev => ({ ...prev, visible: false }));
            navigation.navigate('Login');
          },
        });
      } else {
        setDialogConfig({
          visible: true,
          type: 'error',
          title: 'Registrasi Gagal',
          message: data.detail || 'Terjadi kesalahan saat memproses pendaftaran.',
          confirmText: 'Coba Lagi',
          onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
        });
      }
    } catch (error) {
      console.error(error);
      setDialogConfig({
        visible: true,
        type: 'error',
        title: 'Koneksi Gagal',
        message: 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.',
        confirmText: 'Mengerti',
        onConfirm: () => setDialogConfig(prev => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
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
        </ScrollView>
      </KeyboardAvoidingView>


      {/* Logo bawah — di luar View agar tidak ikut naik saat keyboard muncul */}
      <View style={styles.bottomLogo}>
        <View style={styles.logoBox}>
          <Image source={require('../assets/logo_aplikasi.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
        </View>
        <Text style={styles.logoText}>DYNAMIC SECURE QR CODE</Text>
      </View>

      {/* Custom Dialog untuk Validasi & Sukses Registrasi */}
      <CustomDialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        confirmStyle={dialogConfig.confirmStyle}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
      />
    </SafeAreaView>
  );
}


