import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { View, ActivityIndicator } from 'react-native';
import ThemeToggle from '../components/ThemeToggle';
import { useAppTheme } from '../context/ThemeContext';
import PairingScreen from '../screens/auth/PairingScreen';
import JoinPairingScreen from '../screens/auth/JoinPairingScreen';
import BiometricLockScreen from '../screens/auth/BiometricLockScreen';
import { biometricService } from '../services/biometric.service';

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useAppTheme();
  const [isLocked, setIsLocked] = useState(false);
  const navigationTheme = theme.isDark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    let mounted = true;
    let shouldLockOnActive = false;

    const syncLock = async () => {
      if (!user || user.role !== 'parent') {
        if (mounted) setIsLocked(false);
        return;
      }
      const enabled = await biometricService.isEnabled(user.id);
      if (mounted) setIsLocked(enabled && shouldLockOnActive);
    };

    if (user?.role === 'parent') {
      biometricService.isEnabled(user.id).then((enabled) => {
        if (mounted) setIsLocked(enabled);
      }).catch(() => undefined);
    } else {
      setIsLocked(false);
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        shouldLockOnActive = true;
      } else if (shouldLockOnActive) {
        syncLock();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [user?.id, user?.role]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (isLocked) {
    return <BiometricLockScreen onUnlock={() => setIsLocked(false)} />;
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
