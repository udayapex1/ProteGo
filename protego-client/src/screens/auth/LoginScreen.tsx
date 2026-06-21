import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

const ACCENT = '#7C3AED';
const ACCENT_LIGHT = '#F3F0FF';
const ACCENT_BORDER = 'rgba(124,58,237,0.2)';

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {/* ── Header gradient ── */}
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#0f0f0f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGrad}
        >
          {/* Logo row */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={{ fontSize: 18 }}>🛡️</Text>
            </View>
            <Text style={styles.logoText}>
              Protego<Text style={{ color: ACCENT }}>.</Text>
            </Text>
          </View>

          {/* Eyebrow + headline */}
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.headerTitle}>
            Keep your family{'\n'}safe & connected.
          </Text>
        </LinearGradient>

        {/* ── Form card ── */}
        <View style={styles.card}>

          {/* Email */}
          <Text style={styles.inputLabel}>Email address</Text>
          <View style={[
            styles.inputPill,
            focusedField === 'email' && styles.inputPillFocused,
          ]}>
            <Ionicons
              name="mail-outline"
              size={16}
              color={focusedField === 'email' ? ACCENT : '#aaa'}
            />
            <TextInput
              style={styles.inputField}
              placeholder="your@email.com"
              placeholderTextColor="#bbb"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>Password</Text>
          <View style={[
            styles.inputPill,
            focusedField === 'password' && styles.inputPillFocused,
          ]}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={focusedField === 'password' ? ACCENT : '#aaa'}
            />
            <TextInput
              style={styles.inputField}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={focusedField === 'password' ? ACCENT : '#bbb'}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity onPress={() => {}} style={styles.forgotWrapper}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'Logging in…' : 'Log in'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or continue with</Text>
            <View style={styles.orLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              {/* Google "G" rendered with colored spans */}
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <Ionicons name="finger-print-outline" size={17} color="#555" />
              <Text style={styles.socialText}>Biometric</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* ── Header ── */
  headerGrad: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 72,
  },
  logoRow: {
    marginTop: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },

  /* ── Inputs ── */
  inputLabel: {
    color: '#111',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 14,
  },
  inputPill: {
    backgroundColor: '#F7F7F7',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  inputPillFocused: {
    backgroundColor: ACCENT_LIGHT,
    borderColor: ACCENT_BORDER,
  },
  inputField: {
    flex: 1,
    color: '#111',
    fontSize: 15,
  },

  /* ── Forgot ── */
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
  },
  forgotText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '500',
  },

  /* ── Primary button ── */
  btnPrimary: {
    backgroundColor: '#0a0a0a',
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  /* ── Divider ── */
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  orLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#eee',
  },
  orText: {
    color: '#ccc',
    fontSize: 12,
  },

  /* ── Social ── */
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  socialBtn: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    borderRadius: 100,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  googleG: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285F4',
  },
  socialText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Footer ── */
  footerText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
  footerLink: {
    color: ACCENT,
    fontWeight: '500',
  },
});