import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import apiClient from '../../api/client';

interface PairingCode {
  code: string;
  expiresAt: string;
}

export default function PairingScreen({ navigation }: any) {
  const { user } = useAuth();
  const [pairingCode, setPairingCode] = useState<PairingCode | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    if (!pairingCode) return;

    const interval = setInterval(() => {
      const expiry = new Date(pairingCode.expiresAt).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [pairingCode]);

  const generateCode = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/pair/generate');
      setPairingCode(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!pairingCode) return;
    Clipboard.setString(pairingCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSkip = () => {
    // Navigate to main app
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const codeDigits = pairingCode?.code.split('') ?? ['–', '–', '–', '–', '–', '–'];
  const isExpired = timeLeft === 'Expired';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <LinearGradient
        colors={['#000000', '#0d0d0d', '#1a1a1a']}
        style={styles.headerGrad}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleSkip}>
          <Ionicons name="chevron-back" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Ionicons name="shield-checkmark" size={16} color="#fff" />
          </View>
          <Text style={styles.logoText}>
            Protego<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>

        <Text style={styles.headerTitle}>Pair a device</Text>
        <Text style={styles.headerSub}>
          Share this code with your child's device{'\n'}to link your accounts.
        </Text>
      </LinearGradient>

      <View style={styles.card}>
        {/* Steps */}
        <View style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={styles.stepText}>Share the code below with your child or open Protego on their device</Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={styles.stepText}>They select "Child" and enter this code — you'll be linked instantly</Text>
        </View>

        {/* Code Box */}
        <View style={styles.codeBox}>
          <View style={styles.codeDigits}>
            {codeDigits.map((digit, i) => (
              <View key={i} style={[styles.digit, isExpired && styles.digitExpired]}>
                <Text style={[styles.digitText, isExpired && styles.digitTextExpired]}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.codeTimer}>
            {loading ? 'Generating...' : isExpired ? 'Code expired' : `Expires in `}
            {!loading && !isExpired && <Text style={{ color: colors.primary }}>{timeLeft}</Text>}
          </Text>
        </View>

        {/* Copy Button */}
        <TouchableOpacity
          style={[styles.copyBtn, (isExpired || !pairingCode) && styles.btnDisabled]}
          onPress={handleCopy}
          disabled={isExpired || !pairingCode}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
          <Text style={styles.copyText}>{copied ? 'Copied!' : 'Copy code'}</Text>
        </TouchableOpacity>

        {/* Regenerate */}
        <TouchableOpacity
          style={styles.regenBtn}
          onPress={generateCode}
          disabled={loading}
        >
          <Text style={styles.regenText}>
            {loading ? 'Generating...' : 'Generate new code'}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity onPress={handleSkip} style={{ marginTop: spacing.lg }}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerGrad: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 60,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 6,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -30,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.md,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  stepText: {
    color: '#555',
    fontSize: fontSize.sm,
    lineHeight: 18,
    flex: 1,
  },
  codeBox: {
    backgroundColor: '#000',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  codeDigits: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  digit: {
    width: 36,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 0.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitExpired: {
    opacity: 0.4,
  },
  digitText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  digitTextExpired: {
    color: '#666',
  },
  codeTimer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: fontSize.xs,
  },
  copyBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  copyText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  regenBtn: {
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  regenText: {
    color: '#555',
    fontSize: fontSize.sm,
  },
  skipText: {
    color: '#aaa',
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});