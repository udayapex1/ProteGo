import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { pairingApi } from '../../api/pairing.api';
import ThemeToggle from '../../components/ThemeToggle';

export default function PairedAccountScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const { user, setPairedWith } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pairedUser, setPairedUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [unpairing, setUnpairing] = useState(false);

  useEffect(() => {
    fetchPairedUser();
  }, []);

  const fetchPairedUser = async () => {
    setLoading(true);
    try {
      const data = await pairingApi.getPairedUser();
      setPairedUser(data);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load paired account');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUnpair = () => {
    Alert.alert(
      'Unpair account',
      `This will disconnect you from ${pairedUser?.name}. Location sharing and alerts will stop.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            setUnpairing(true);
            try {
              await pairingApi.unpair();
              await setPairedWith(null);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to unpair');
            } finally {
              setUnpairing(false);
            }
          },
        },
      ]
    );
  };

  const relationLabel =
    user?.role === 'parent'
      ? pairedUser?.role === 'child'
        ? 'Your child'
        : 'Paired account'
      : pairedUser?.role === 'parent'
      ? 'Your parent'
      : 'Paired account';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.colors.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
          <ThemeToggle />
        </View>

        <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>Family</Text>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Paired account</Text>
      </LinearGradient>

      <ScrollView
        style={[styles.card, { backgroundColor: theme.colors.card }]}
        contentContainerStyle={{ alignItems: 'center', paddingTop: 32 }}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : pairedUser ? (
          <>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>{getInitials(pairedUser.name)}</Text>
            </View>

            <Text style={[styles.name, { color: theme.colors.text }]}>{pairedUser.name}</Text>

            <View style={styles.roleChip}>
              <Ionicons name="shield-checkmark" size={11} color="#C084FC" />
              <Text style={styles.roleChipText}>{relationLabel}</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.colors.row, borderColor: theme.colors.border }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Role</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {pairedUser.role === 'parent' ? 'Parent' : 'Child'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
                  <Text style={[styles.infoValue, { color: theme.colors.success }]}>Connected</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.unpairBtn, { backgroundColor: theme.colors.dangerLight }]}
              onPress={handleUnpair}
              disabled={unpairing}
              activeOpacity={0.8}
            >
              <Ionicons name="unlink-outline" size={16} color={theme.colors.danger} />
              <Text style={[styles.unpairText, { color: theme.colors.danger }]}>
                {unpairing ? 'Unpairing…' : 'Unpair account'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: theme.colors.textMuted, marginTop: 40 }}>No paired account found.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 24, paddingBottom: 56 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 56,
    marginBottom: 24,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.4 },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '600' },
  name: { fontSize: 19, fontWeight: '600', marginBottom: 8 },
  roleChip: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 28,
  },
  roleChipText: { color: '#C084FC', fontSize: 12, fontWeight: '500' },
  infoBox: {
    width: '100%',
    borderWidth: 0.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  divider: { height: 0.5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  unpairBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 28,
    width: '100%',
    justifyContent: 'center',
  },
  unpairText: { fontSize: 13, fontWeight: '600' },
});