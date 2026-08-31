import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const preferenceKey = (userId: string) => `biometricEnabled:${userId}`;

export const biometricService = {
  async isAvailable() {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    return hasHardware && isEnrolled;
  },

  async isEnabled(userId: string) {
    return (await AsyncStorage.getItem(preferenceKey(userId))) === 'true';
  },

  async setEnabled(userId: string, enabled: boolean) {
    await AsyncStorage.setItem(preferenceKey(userId), String(enabled));
  },

  async authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Protego',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  },
};
