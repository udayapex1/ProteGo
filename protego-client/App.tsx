import { useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [status, setStatus] = useState('Tap the button to test biometrics.');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authenticate = async () => {
    if (isAuthenticating) {
      return;
    }

    console.log('Starting biometric authentication test.');
    setIsAuthenticating(true);

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (!compatible) {
        setStatus('Biometric hardware is not available on this device.');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!enrolled) {
        setStatus('No fingerprint or face data is enrolled on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to test biometrics',
        cancelLabel: 'Cance l',
        fallbackLabel: 'Use device passcode',
      });

      if (result.success) {
        setStatus('Authentication successful.');
        Alert.alert('Success', 'Biometric authentication passed.');
      } else {
        setStatus(`Authentication failed: ${result.error}`);
      }
    } catch {
      setStatus('Unable to start biometric authentication.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Scan Test</Text>
      <Text style={styles.status}>{status}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={isAuthenticating}
        onPress={authenticate}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isAuthenticating && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {isAuthenticating ? 'Authenticating...' : 'Scan Biometrics'}
        </Text>
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 12,
    color: '#14213d',
    fontSize: 28,
    fontWeight: '700',
  },
  status: {
    marginBottom: 24,
    color: '#425466',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    minWidth: 210,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#175cd3',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
