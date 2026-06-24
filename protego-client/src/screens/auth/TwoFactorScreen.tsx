import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

type Props = StackScreenProps<AuthStackParamList, 'TwoFactor'>;

export default function TwoFactorScreen({ route }: Props) {
  const { completeTwoFactor } = useAuth();
  const { theme } = useAppTheme();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!token) {
      Alert.alert('Error', 'Please enter your verification code');
      return;
    }

    setLoading(true);
    try {
      await completeTwoFactor(route.params.userId, token);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Two-factor verification</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        Enter the code from your authenticator app.
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        placeholder="Verification code"
        placeholderTextColor={theme.colors.textMuted}
        value={token}
        onChangeText={setToken}
        keyboardType="number-pad"
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundDark,
  },
  title: {
    color: '#fff',
    fontSize: fontSize.xxl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    borderWidth: 1,
    color: '#fff',
    fontSize: fontSize.base,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
