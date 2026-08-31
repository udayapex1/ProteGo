import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { pairingApi } from '../../api/pairing.api';
import ThemeToggle from '../../components/ThemeToggle';

const ACCENT = '#7C3AED';
const CODE_LENGTH = 6;

export default function JoinPairingScreen() {
  const { theme } = useAppTheme();
  const { setPairedWith } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    // handle paste of full code
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const next = Array(CODE_LENGTH).fill('');
      pasted.forEach((d, i) => (next[i] = d));
      setDigits(next);
      const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);
      inputsRef.current[lastIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = text.replace(/\D/g, '');
    setDigits(next);

    if (text && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await pairingApi.joinWithCode(code);
      // backend doesn't return the parent's id here, but we just need
      // pairedWith to be truthy so AppNavigator stops treating this
      // user as unpaired. Refetch to get the real id:
      const paired = await pairingApi.getPairedUser();
      await setPairedWith(paired.id);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Something went wrong';
      Alert.alert('Pairing Failed', message);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ position: 'absolute', top: 56, right: 28, zIndex: 10 }}>
        <ThemeToggle />
      </View>

      <LinearGradient
        colors={theme.colors.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="link" size={26} color="#fff" />
        </View>
        <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>Almost there</Text>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Enter the code{'\n'}your parent shared.
        </Text>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>
          Ask your parent to open Protego and generate a pairing code from their app.
        </Text>

        <View style={styles.codeRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputsRef.current[i] = ref; }}
              style={[
                styles.codeBox,
                {
                  backgroundColor: theme.colors.input,
                  borderColor: digit ? ACCENT : theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH} // allows paste-into-first-box
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: theme.colors.textPrimary }, loading && { opacity: 0.8 }]}
          onPress={handleJoin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: theme.colors.background }]}>
            {loading ? 'Connecting…' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 28, paddingTop: 90, paddingBottom: 60 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: -0.5 },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  label: { fontSize: 13, lineHeight: 19, marginBottom: 24 },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '600',
  },
  btnPrimary: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '500', letterSpacing: -0.2 },
});
