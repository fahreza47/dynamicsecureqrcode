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
 * [AUTO-LOGIN] Alur saat pertama dibuka:
 *   App start → cek AsyncStorage (SESSION_KEY + AUTH_TOKEN_KEY)
 *     → Jika ada session valid: langsung ke UserTabs / AdminTabs (tanpa login ulang)
 *     → Jika tidak ada: ke Auth (Login)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Platform, Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList, UserTabParamList, AdminTabParamList } from './src/types';
import { SESSION_KEY, AUTH_TOKEN_KEY } from './src/config';

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
import ScannerScreen from './src/screens/ScannerScreen';
import AdminProfileScreen from './src/screens/AdminProfileScreen';

// ── Shared Full-Screen ────────────────────────────────────────────────────────
import MyTicketScreen from './src/screens/MyTicketScreen';
import ScanHistoryScreen from './src/screens/ScanHistoryScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const UserTab = createBottomTabNavigator<UserTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

// ─────────────────────────────────────────────────────────────────────────────
// Komponen Tab Icon Modern (Floating Pill & Active Indicator Bar)
// ─────────────────────────────────────────────────────────────────────────────
interface CustomTabIconProps {
  source: any;
  label: string;
  focused: boolean;
}

const CustomTabIcon = ({ source, label, focused }: CustomTabIconProps) => (
  <View style={tabIconStyles.itemContainer}>
    <View style={[tabIconStyles.iconPill, focused && tabIconStyles.activeIconPill]}>
      <Image
        source={source}
        style={[tabIconStyles.icon, { tintColor: focused ? '#eff6ff' : '#94a3b8' }]}
      />
    </View>
    <Text
      style={[
        tabIconStyles.label,
        { color: focused ? '#2563eb' : '#94a3b8', fontWeight: focused ? '800' : '500' },
      ]}
    >
      {label}
    </Text>
    {focused
      ? <View style={tabIconStyles.activeLine} />
      : <View style={tabIconStyles.inactiveLinePlaceholder} />}
  </View>
);

const tabIconStyles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    marginTop: 24,
    minWidth: 70,
  },
  iconPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
  },
  activeIconPill: { backgroundColor: '#2563eb' },
  icon: { width: 22, height: 22 },
  label: { fontSize: 9.5, letterSpacing: 0.1, textAlign: 'center', marginBottom: 2 },
  activeLine: { width: 18, height: 2.5, backgroundColor: '#2563eb', borderRadius: 2 },
  inactiveLinePlaceholder: { width: 18, height: 2.5, backgroundColor: 'transparent' },
});

// Opsi tampilan Floating Modern Tab Bar
const TAB_BAR_SCREEN_OPTIONS = {
  headerShown: false,
  tabBarShowLabel: false,
  tabBarStyle: {
    position: 'absolute' as const,
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 16,
    right: 16,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    height: Platform.OS === 'ios' ? 76 : 68,
    paddingHorizontal: 2,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth Navigator
// ─────────────────────────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Bottom Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
function UserTabNavigator() {
  return (
    <UserTab.Navigator screenOptions={TAB_BAR_SCREEN_OPTIONS}>
      <UserTab.Screen
        name="Home"
        component={UserDashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/home.png')} label="Beranda" focused={focused} />
          ),
        }}
      />
      <UserTab.Screen
        name="MyTicketsList"
        component={MyTicketsListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/ticket.png')} label="Tiket Saya" focused={focused} />
          ),
        }}
      />
      <UserTab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/time-past.png')} label="Riwayat" focused={focused} />
          ),
        }}
      />
      <UserTab.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/user.png')} label="Profil" focused={focused} />
          ),
        }}
      />
    </UserTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Bottom Tab Navigator
// ─────────────────────────────────────────────────────────────────────────────
function AdminTabNavigator() {
  return (
    <AdminTab.Navigator screenOptions={TAB_BAR_SCREEN_OPTIONS}>
      <AdminTab.Screen
        name="AdminHome"
        component={AdminDashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/event.png')} label="Dashboard" focused={focused} />
          ),
        }}
      />
      <AdminTab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/qr-scan.png')} label="Scanner" focused={focused} />
          ),
        }}
      />
      <AdminTab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabIcon source={require('./src/assets/flaticon/user.png')} label="Profil" focused={focused} />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// [AUTO-LOGIN] Splash Screen — tampil saat app cek sesi AsyncStorage
// ─────────────────────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <Image
        source={require('./src/assets/flaticon/qr-code.png')}
        style={splashStyles.logo}
      />
      <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 20 }} />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 64, height: 64, tintColor: '#2563eb', opacity: 0.85 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // 'loading' → splash, 'user' → UserTabs, 'admin' → AdminTabs, 'guest' → Auth
  const [authState, setAuthState] = useState<'loading' | 'user' | 'admin' | 'guest'>('loading');

  const checkSession = useCallback(async () => {
    try {
      const [sessionStr, token] = await Promise.all([
        AsyncStorage.getItem(SESSION_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
      ]);
      if (sessionStr && token) {
        const session = JSON.parse(sessionStr);
        if (session?.role === 'admin') {
          setAuthState('admin');
        } else if (session?.role) {
          setAuthState('user');
        } else {
          setAuthState('guest');
        }
      } else {
        setAuthState('guest');
      }
    } catch {
      setAuthState('guest');
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const getInitialRouteName = (): keyof RootStackParamList => {
    if (authState === 'admin') return 'AdminTabs';
    if (authState === 'user') return 'UserTabs';
    return 'Auth';
  };

  if (authState === 'loading') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="UserTabs" component={UserTabNavigator} />
        <RootStack.Screen name="AdminTabs" component={AdminTabNavigator} />
        <RootStack.Screen
          name="MyTicketScreen"
          component={MyTicketScreen}
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <RootStack.Screen
          name="ScanHistoryScreen"
          component={ScanHistoryScreen}
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
