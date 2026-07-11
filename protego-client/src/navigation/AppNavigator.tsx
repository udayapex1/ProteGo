import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { View, ActivityIndicator } from 'react-native';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../context/ThemeContext';
import PairingScreen from '../screens/auth/PairingScreen';
import JoinPairingScreen from '../screens/auth/JoinPairingScreen';

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useAppTheme();
  const navigationTheme = theme.isDark ? DarkTheme : DefaultTheme;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  // parent hai but pair nahi hua abhi tak -> Pairing screen dikhao
const needsPairing = !user?.pairedWith && (user?.role === 'parent' || user?.role === 'child');

  return (
  <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <NavigationContainer theme={navigationTheme}>
      {!user ? (
        <AuthNavigator />
      ) : needsPairing ? (
        user.role === 'parent' ? <PairingScreen /> : <JoinPairingScreen />
      ) : (
        <TabNavigator />
      )}
    </NavigationContainer>
  </View>
);
}