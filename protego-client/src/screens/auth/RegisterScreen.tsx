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
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { UserRole } from '../../types/user.types';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role });
      // AuthContext automatically navigate kar dega user state set hote hi
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 28 }}>🛡️</Text>
          </View>
          <Text style={styles.logoText}>
            Protego<Text style={{ color: colors.primary }}>.</Text>
          </Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

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

        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>I am a</Text>
          <View style={styles.divLine} />
        </View>

        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'parent' && styles.roleCardSelected]}
            onPress={() => setRole('parent')}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>👨‍👧</Text>
            <Text style={styles.roleName}>Parent</Text>
            <Text style={styles.roleSub}>Track & protect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'child' && styles.roleCardSelected]}
            onPress={() => setRole('child')}
          >
            <Text style={{ fontSize: 22, marginBottom: 4 }}>🧒</Text>
            <Text style={styles.roleName}>Child</Text>
            <Text style={styles.roleSub}>Stay connected</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Continue'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.footerLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: spacing.md,
  },
  divLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.borderDark,
  },
  divText: {
    color: '#444',
    fontSize: fontSize.xs,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: colors.borderDark,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(122,28,172,0.1)',
  },
  roleName: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  roleSub: {
    color: '#555',
    fontSize: fontSize.xs,
    marginTop: 2,
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