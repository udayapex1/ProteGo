import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../context/ThemeContext';
import { authApi } from '../../api/auth.api';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = { navigation: StackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return Alert.alert('Email required', 'Enter the email linked to your account.');
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      Alert.alert('Check your email', result.message, [{ text: 'Back to login', onPress: () => navigation.navigate('Login') }]);
    } catch (error: any) {
      Alert.alert('Request failed', error.response?.data?.message || 'Unable to send the reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Forgot password?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>We’ll send a secure reset link to your email.</Text>
        <TextInput style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.input, borderColor: theme.colors.border }]} placeholder="you@example.com" placeholderTextColor={theme.colors.textMuted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.textPrimary }]} onPress={submit} disabled={loading}>
          <Text style={[styles.buttonText, { color: theme.colors.background }]}>{loading ? 'Sending…' : 'Send reset link'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={[styles.link, { color: theme.colors.accent }]}>Back to login</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  button: { borderRadius: 100, padding: 15, alignItems: 'center', marginBottom: 18 },
  buttonText: { fontWeight: '600' },
  link: { textAlign: 'center', fontWeight: '600' },
});
