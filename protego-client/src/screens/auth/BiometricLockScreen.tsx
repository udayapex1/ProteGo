import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { biometricService } from '../../services/biometric.service';

export default function BiometricLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { theme } = useAppTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const unlock = async () => {
    setIsAuthenticating(true);
    setError('');
    try {
      if (await biometricService.authenticate()) {
        onUnlock();
      } else {
        setError('Authentication was not completed.');
      }
    } catch {
      setError('Biometric authentication is unavailable right now.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.icon, { backgroundColor: theme.colors.primaryLight }]}>
        <Ionicons name="finger-print" size={44} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>Protego is locked</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Verify your identity to continue.</Text>
      {!!error && <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={unlock}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unlock with biometrics</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  error: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  button: { minWidth: 220, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
