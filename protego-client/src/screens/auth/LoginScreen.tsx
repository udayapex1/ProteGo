import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      if (result.requiresTwoFactor && result.userId) {
        navigation.navigate('TwoFactor', { userId: result.userId });
      }
      // agar 2FA nahi hai, AuthContext automatically navigate kar dega
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoWrap}>
        <View style={styles.logoIcon}>
          <Text style={{ fontSize: 28 }}>🛡️</Text>
        </View>
        <Text style={styles.logoText}>
          Protego<Text style={{ color: colors.primary }}>.</Text>
        </Text>
        <Text style={styles.tagline}>Family safety, always on</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity onPress={() => {}}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.footerText}>
          Don't have an account? <Text style={styles.footerLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: '#fff',
    fontSize: fontSize.xxl,
    fontWeight: '500',
  },
  tagline: {
    color: '#555',
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 0.5,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#fff',
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  btnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  footerText: {
    color: '#555',
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary,
  },
});