/**
 * App.tsx — Root Aplikasi & Konfigurasi Navigasi
 *
 * Mendefinisikan struktur navigasi keseluruhan:
 *
 *  NavigationContainer (root)
 *  └── RootStack
 *      ├── Auth  → AuthNavigator (Login, Register)
 *      ├── UserTabs  → UserTabNavigator (Beranda, Tiket, Riwayat, Profil)
 *      ├── AdminTabs → AdminTabNavigator (Dashboard, Scanner, Profil)
 *      └── MyTicketScreen  ← [PENTING] di luar tab agar QR bisa tampil full-screen
 *                             tanpa tab bar menghalangi area QR code
 *
 * Alur navigasi setelah login:
 *   Login → (role === 'admin') ? AdminTabs : UserTabs
 */

import React from 'react';
import { Platform, Image } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';
import type { RootStackParamList, UserTabParamList, AdminTabParamList } from './src/types';

// [PERF] Meng-offload screen yang tidak aktif dari native view tree, jadi transisi
// stack tidak perlu menggerakkan/re-render seluruh screen yang sedang tidak dilihat.
// Harus dipanggil sekali di awal, sebelum navigator manapun dirender.
// Idealnya juga dipanggil di index.js sebelum AppRegistry.registerComponent —
// cek apakah sudah ada di sana juga, kalau ada boleh salah satu saja dihapus.
enableScreens();

// ── Auth Screens ──────────────────────────────────────────────────────────────
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// ── User Tab Screens ──────────────────────────────────────────────────────────
import UserDashboard from './src/screens/UserDashboard';
import MyTicketsListScreen from './src/screens/MyTicketsListScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';

// ── Admin Tab Screens ─────────────────────────────────────────────────────────
import AdminDashboard from './src/screens/AdminDashboard';
import ScannerScreen from './src/screens/ScannerScreen';       // [KRITIS] Scanner QR + BLE broadcaster
import AdminProfileScreen from './src/screens/AdminProfileScreen';

// ── Shared Full-Screen (di luar tab) ─────────────────────────────────────────
import MyTicketScreen from './src/screens/MyTicketScreen';       // [KRITIS] Tampilan QR + BLE scanner penonton
import ScanHistoryScreen from './src/screens/ScanHistoryScreen'; // Histori pemindaian admin per event

// Instance navigator — masing-masing untuk level navigasi yang berbeda
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const UserTab = createBottomTabNavigator<UserTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

// ─────────────────────────────────────────────────────────────────────────────
// Komponen Ikon Kustom Outlined SVG (Menggantikan Emoji Berwarna)
// ─────────────────────────────────────────────────────────────────────────────
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const TicketIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
    <Line x1="12" y1="5" x2="12" y2="19" strokeDasharray="3" />
  </Svg>
);

const HistoryIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const UserIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const ScannerIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const DashboardIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
  </Svg>
);

// Opsi tampilan tab bar yang dipakai bersama — tema cerah dengan aksen Azure #007BFF
const TAB_BAR_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 64,    // iOS perlu lebih tinggi
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabBarActiveTintColor: '#007BFF',    // Azure Blue untuk tab aktif
  tabBarInactiveTintColor: '#6c757d',  // Abu-abu untuk tab tidak aktif
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth Navigator — Layar sebelum login (Login & Register)
// ─────────────────────────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right', // Geser horizontal (setara forHorizontalIOS, native di kedua platform)
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Bottom Tab Navigator — Untuk penonton (role: 'user')
// ─────────────────────────────────────────────────────────────────────────────
function UserTabNavigator() {
  return (
    <UserTab.Navigator screenOptions={TAB_BAR_SCREEN_OPTIONS}>
      {/* Beranda: daftar event yang bisa dibeli tiketnya */}
      <UserTab.Screen
        name="Home"
        component={UserDashboard}
        options={{
          tabBarLabel: 'Beranda',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/home.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
      {/* Tiket Saya: daftar tiket yang dimiliki — klik untuk buka QR */}
      <UserTab.Screen
        name="MyTicketsList"
        component={MyTicketsListScreen}
        options={{
          tabBarLabel: 'Tiket Saya',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/ticket.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
      {/* Riwayat transaksi pembelian tiket */}
      <UserTab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Riwayat',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/time-past.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
      {/* Profil: informasi akun & tombol logout */}
      <UserTab.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/user.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
    </UserTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Bottom Tab Navigator — Untuk penyelenggara (role: 'admin')
// ─────────────────────────────────────────────────────────────────────────────
function AdminTabNavigator() {
  return (
    <AdminTab.Navigator screenOptions={TAB_BAR_SCREEN_OPTIONS}>
      {/* Dashboard: statistik tiket terjual/aktif/digunakan */}
      <AdminTab.Screen
        name="AdminHome"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/event.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
      {/* [KRITIS] Scanner: validasi QR + BLE broadcaster gerbang */}
      <AdminTab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scanner',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/qr-scan.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
      {/* Profil admin dengan panduan 3 lapis verifikasi */}
      <AdminTab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Image source={require('./src/assets/flaticon/user.png')} style={{ width: 24, height: 24, tintColor: color }} />,
        }}
      />
    </AdminTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root App — Komponen utama yang di-render oleh index.js
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Geser horizontal
        }}
      >
        {/* Layar pertama yang muncul adalah Auth (Login) */}
        <RootStack.Screen name="Auth" component={AuthNavigator} />

        {/* Tab navigator berdasarkan role setelah login berhasil */}
        <RootStack.Screen name="UserTabs" component={UserTabNavigator} />
        <RootStack.Screen name="AdminTabs" component={AdminTabNavigator} />

        {/*
          [KRITIS] MyTicketScreen ditempatkan di RootStack (bukan di dalam tab)
          agar bisa tampil full-screen tanpa tab bar — QR code membutuhkan ruang penuh.
          Layar ini menerima ticket_secret via route params untuk generate Gate-Bound TOTP.
        */}
        <RootStack.Screen
          name="MyTicketScreen"
          component={MyTicketScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Histori pemindaian tiket per event — hanya untuk admin */}
        <RootStack.Screen
          name="ScanHistoryScreen"
          component={ScanHistoryScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}