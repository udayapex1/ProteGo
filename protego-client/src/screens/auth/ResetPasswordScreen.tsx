import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppAlert } from '../../context/AlertContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useAppTheme } from '../../context/ThemeContext';
import { authApi } from '../../api/auth.api';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'ResetPassword'>; route: RouteProp<AuthStackParamList, 'ResetPassword'> };

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { alert } = useAppAlert();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 8) return alert('Invalid password', 'Password must be at least 8 characters.');
    if (password !== confirm) return alert('Passwords do not match', 'Enter the same password twice.');
    setLoading(true);
    try {
      const result = await authApi.resetPassword(route.params.token, password);
      alert('Password updated', result.message, [{ text: 'Log in', onPress: () => navigation.navigate('Login') }]);
    } catch (error: any) {
      alert('Reset failed', error.response?.data?.message || 'The reset link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create a new password</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Choose a password with at least 8 characters.</Text>
        <TextInput style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.input, borderColor: theme.colors.border }]} placeholder="New password" placeholderTextColor={theme.colors.textMuted} secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.input, borderColor: theme.colors.border }]} placeholder="Confirm password" placeholderTextColor={theme.colors.textMuted} secureTextEntry value={confirm} onChangeText={setConfirm} />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.textPrimary }]} onPress={submit} disabled={loading}>
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>{loading ? 'Updating…' : 'Update password'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  button: { borderRadius: 100, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { fontWeight: '600' },
});
