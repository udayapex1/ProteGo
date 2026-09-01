import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Bell, ChevronRight, Fingerprint, Flame, Link2, LogOut, Pencil,
  ShieldCheck, ShieldLock, Trash2, UserRound,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppAlert } from '../../context/AlertContext';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { userApi } from '../../api/user.api';
import { biometricService } from '../../services/biometric.service';

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { alert } = useAppAlert();
  const { theme } = useAppTheme();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const palette = theme.isDark ? {
    screen: '#121116', panel: '#17161B', row: '#201F26', text: '#EDEBF1', muted: '#9C99A6',
    subtle: '#7E7B87', icon: '#B77FE0', primary: '#7A1CAC', primarySoft: 'rgba(154,89,204,0.18)',
    danger: '#FF6B81', dangerSoft: 'rgba(255,107,129,0.08)', success: '#35D399',
    divider: 'rgba(255,255,255,0.06)', avatarText: '#F3E8FF',
  } : {
    screen: '#EAE6F2', panel: '#FBFAFE', row: '#F1EDF9', text: '#1D1826', muted: '#6E4B87',
    subtle: '#8A8296', icon: '#7A1CAC', primary: '#7A1CAC', primarySoft: '#EBDCF7',
    danger: '#C22E45', dangerSoft: '#FBEAEC', success: '#12946F',
    divider: 'rgba(20,10,40,0.07)', avatarText: '#FBFAFE',
  };

  useEffect(() => {
    if (!user?.id || user.role !== 'parent') return;
    biometricService.isEnabled(user.id).then(setBiometricEnabled).catch(() => undefined);
  }, [user?.id, user?.role]);

  const getInitials = (name?: string) => name
    ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleLogout = () => alert('Log out', 'Are you sure you want to log out?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: logout },
  ]);

  const handleDeleteAccount = () => alert('Delete account', 'This permanently deletes your account and cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        await userApi.deleteAccount();
        await logout();
      } catch (error: any) {
        alert('Delete failed', error.response?.data?.message || 'Unable to delete your account.');
      }
    } },
  ]);

  const handleBiometricToggle = async () => {
    if (!user?.id || biometricBusy) return;
    setBiometricBusy(true);
    try {
      if (biometricEnabled) {
        await biometricService.setEnabled(user.id, false);
        setBiometricEnabled(false);
        return;
      }
      if (!(await biometricService.isAvailable())) {
        alert('Biometrics unavailable', 'Set up fingerprint or Face ID on this device before enabling biometric login.');
        return;
      }
      if (await biometricService.authenticate()) {
        await biometricService.setEnabled(user.id, true);
        setBiometricEnabled(true);
      }
    } catch {
      alert('Biometric setup failed', 'Unable to update biometric login on this device.');
    } finally {
      setBiometricBusy(false);
    }
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <Text style={[styles.sectionLabel, { color: palette.subtle }]}>{children}</Text>
  );

  const Toggle = ({ enabled, onPress }: { enabled: boolean; onPress: () => void }) => (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      style={[styles.toggle, { backgroundColor: enabled ? palette.primary : palette.subtle }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.toggleDot, { backgroundColor: palette.panel, alignSelf: enabled ? 'flex-end' : 'flex-start' }]} />
    </TouchableOpacity>
  );

  const Row = ({ icon: Icon, title, subtitle, onPress, trailing, divider = false, danger = false }: {
    icon: IconComponent; title: string; subtitle?: string; onPress?: () => void;
    trailing?: React.ReactNode; divider?: boolean; danger?: boolean;
  }) => {
    const content = (
      <View style={[styles.row, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.divider }]}>
        <Icon size={18} color={danger ? palette.danger : palette.icon} strokeWidth={1.8} />
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, { color: danger ? palette.danger : palette.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.rowSubtitle, { color: palette.subtle }]}>{subtitle}</Text> : null}
        </View>
        {trailing}
      </View>
    );
    return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity> : content;
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.screen }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.panel, { backgroundColor: palette.panel }]}>
        <View style={styles.topBar}>
          <Text style={[styles.title, { color: palette.text }]}>Profile</Text>
          <ThemeToggle />
        </View>

        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
              <Text style={[styles.avatarText, { color: palette.avatarText }]}>{getInitials(user?.name)}</Text>
            </View>
            <View style={[styles.editBadge, { backgroundColor: palette.row, borderColor: palette.panel }]}>
              <Pencil size={10} color={palette.icon} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.identityCopy}>
            <Text style={[styles.name, { color: palette.text }]}>{user?.name || 'User'}</Text>
            <View style={[styles.roleChip, { backgroundColor: palette.primarySoft }]}>
              <ShieldCheck size={13} color={palette.icon} strokeWidth={1.8} />
              <Text style={[styles.roleText, { color: palette.icon }]}>{user?.role === 'parent' ? 'Parent' : 'Child'}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.protectionCard, { backgroundColor: palette.row, borderColor: palette.primarySoft }]}>
          <Flame size={22} color={palette.icon} strokeWidth={1.8} />
          <View>
            <Text style={[styles.protectionNumber, { color: palette.text }]}>12 days</Text>
            <Text style={[styles.protectionLabel, { color: palette.muted }]}>Family protected</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: palette.row }]}>
            <Text style={[styles.statNumber, { color: palette.success }]}>1</Text>
            <Text style={[styles.statLabel, { color: palette.subtle }]}>Connected</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: palette.row }]}>
            <Text style={[styles.statNumber, { color: palette.danger }]}>3</Text>
            <Text style={[styles.statLabel, { color: palette.subtle }]}>Alerts</Text>
          </View>
        </View>

        <SectionLabel>Security</SectionLabel>
        <View style={[styles.group, { backgroundColor: palette.row }]}>
          <Row icon={ShieldLock} title="Two-factor authentication" subtitle="Extra layer of account security" divider trailing={<Toggle enabled={twoFactorEnabled} onPress={() => setTwoFactorEnabled((value) => !value)} />} />
          <Row icon={Fingerprint} title="Biometric login" subtitle="Fingerprint or face unlock" trailing={<Toggle enabled={biometricEnabled} onPress={handleBiometricToggle} />} />
        </View>

        <SectionLabel>Family</SectionLabel>
        <View style={[styles.group, { backgroundColor: palette.row }]}>
          <Row icon={Link2} title="Paired account" subtitle={user?.pairedWith ? 'Connected' : 'Not paired yet'} onPress={() => navigation.navigate('PairedAccount')} trailing={<ChevronRight size={16} color={palette.subtle} />} />
        </View>

        <SectionLabel>Notifications</SectionLabel>
        <View style={[styles.group, { backgroundColor: palette.row }]}>
          <Row icon={Bell} title="Push notifications" subtitle="SOS, geofence and battery alerts" trailing={<Toggle enabled={notificationsEnabled} onPress={() => setNotificationsEnabled((value) => !value)} />} />
        </View>

        <SectionLabel>Account</SectionLabel>
        <View style={[styles.group, { backgroundColor: palette.row }]}>
          <Row icon={UserRound} title="Edit profile" onPress={() => navigation.navigate('EditProfile')} trailing={<ChevronRight size={16} color={palette.subtle} />} />
        </View>
        <View style={[styles.group, { backgroundColor: palette.dangerSoft }]}>
          <Row icon={LogOut} title="Log out" onPress={handleLogout} danger divider />
          <Row icon={Trash2} title="Delete account" onPress={handleDeleteAccount} danger />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, padding: 14 },
  panel: { flexGrow: 1, borderRadius: 18, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 18 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 16, fontWeight: '500' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarWrap: { width: 56, height: 56 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '500' },
  editBadge: { position: 'absolute', right: -4, bottom: -4, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  roleChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 12 },
  protectionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 },
  protectionNumber: { fontSize: 20, fontWeight: '500', lineHeight: 24 },
  protectionLabel: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stat: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  statNumber: { fontSize: 16, fontWeight: '500' },
  statLabel: { fontSize: 11, marginTop: 2 },
  sectionLabel: { fontSize: 12, marginLeft: 4, marginBottom: 8 },
  group: { borderRadius: 14, overflow: 'hidden', marginBottom: 18 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 13.5, fontWeight: '400' },
  rowSubtitle: { fontSize: 11.5, marginTop: 2 },
  toggle: { width: 34, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center' },
  toggleDot: { width: 16, height: 16, borderRadius: 8 },
});
