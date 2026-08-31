import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { userApi } from '../../api/user.api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { theme } = useAppTheme();
  const [twoFactorEnabled,     setTwoFactorEnabled]     = useState(true);
  const [biometricEnabled,     setBiometricEnabled]     = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete account', 'This permanently deletes your account and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await userApi.deleteAccount();
          await logout();
        } catch (error: any) {
          Alert.alert('Delete failed', error.response?.data?.message || 'Unable to delete your account.');
        }
      } },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const rowCardStyle = [
    styles.rowCard,
    { backgroundColor: theme.colors.row, borderColor: theme.colors.border },
  ];
  const rowTitleStyle = [styles.rowTitle, { color: theme.colors.text }];
  const rowSubStyle = [styles.rowSub, { color: theme.colors.textMuted }];
  const sectionTitleStyle = [styles.sectionTitle, { color: theme.colors.textSubtle }];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >

      {/* ── Header ── */}
      <LinearGradient
        colors={theme.colors.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.textSubtle }]}>Account</Text>
            <Text style={[styles.topTitle, { color: theme.colors.text }]}>Profile</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarOuter}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            {/* Edit badge */}
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="pencil" size={9} color="#fff" />
            </View>
          </View>

          <Text style={[styles.pname, { color: theme.colors.text }]}>{user?.name}</Text>
          <Text style={[styles.pemail, { color: theme.colors.textSubtle }]}>
            {(user as any)?.email || ''}
          </Text>

          <View style={styles.roleChip}>
            <Ionicons name="shield-checkmark" size={11} color="#C084FC" />
            <Text style={styles.roleChipText}>
              {user?.role === 'parent' ? 'Parent' : 'Child'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Card ── */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.statNum, { color: theme.colors.primary }]}>12</Text>
            <Text style={[styles.statLabel, { color: theme.colors.primary }]}>Days active</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.successLight }]}>
            <Text style={[styles.statNum, { color: theme.colors.success }]}>1</Text>
            <Text style={[styles.statLabel, { color: theme.colors.success }]}>Connected</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.dangerLight }]}>
            <Text style={[styles.statNum, { color: theme.colors.danger }]}>3</Text>
            <Text style={[styles.statLabel, { color: theme.colors.danger }]}>Alerts</Text>
          </View>
        </View>

        {/* ── Security ── */}
        <Text style={sectionTitleStyle}>Security</Text>

        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="shield-half-outline" size={17} color={theme.colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Two-factor authentication</Text>
            <Text style={rowSubStyle}>Extra layer of account security</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, twoFactorEnabled ? { backgroundColor: theme.colors.primary, alignItems: 'flex-end' } : { backgroundColor: theme.colors.input, alignItems: 'flex-start' }]}
            onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleDot, { backgroundColor: theme.colors.surface }]} />
          </TouchableOpacity>
        </View>

        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="finger-print-outline" size={17} color={theme.colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Biometric login</Text>
            <Text style={rowSubStyle}>Use fingerprint to sign in</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, biometricEnabled ? { backgroundColor: theme.colors.primary, alignItems: 'flex-end' } : { backgroundColor: theme.colors.input, alignItems: 'flex-start' }]}
            onPress={() => setBiometricEnabled(!biometricEnabled)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleDot, { backgroundColor: theme.colors.surface }]} />
          </TouchableOpacity>
        </View>

        {/* ── Family ── */}
        <Text style={sectionTitleStyle}>Family</Text>

        <TouchableOpacity
         style={rowCardStyle} activeOpacity={0.7}
          onPress={() => navigation.navigate('PairedAccount')}
         >
          <View style={[styles.rowIcon, { backgroundColor: theme.colors.successLight }]}>
            <Ionicons name="link-outline" size={17} color={theme.colors.success} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Paired account</Text>
            <Text style={[rowSubStyle, user?.pairedWith && { color: theme.colors.success }]}>
              {user?.pairedWith ? '● Connected' : 'Not paired yet'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSubtle} />
        </TouchableOpacity>

        {/* ── Notifications ── */}
        <Text style={sectionTitleStyle}>Notifications</Text>

        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: theme.colors.dangerLight }]}>
            <Ionicons name="notifications-outline" size={17} color={theme.colors.danger} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Push notifications</Text>
            <Text style={rowSubStyle}>SOS, geofence & battery alerts</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, notificationsEnabled ? { backgroundColor: theme.colors.primary, alignItems: 'flex-end' } : { backgroundColor: theme.colors.input, alignItems: 'flex-start' }]}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleDot, { backgroundColor: theme.colors.surface }]} />
          </TouchableOpacity>
        </View>

        {/* ── Account ── */}
        <Text style={sectionTitleStyle}>Account</Text>

        {/* Edit + Logout side by side */}
        <View style={styles.accountRow}>
          <TouchableOpacity
            style={[
              styles.accountBtn,
              styles.editBtn,
              { backgroundColor: theme.colors.row, borderColor: theme.colors.border },
            ]}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.colors.input }]}>
              <Ionicons name="create-outline" size={17} color={theme.colors.text} />
            </View>
            <Text style={[styles.editBtnText, { color: theme.colors.text }]}>Edit profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.accountBtn,
              { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.dangerLight },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.colors.dangerLight }]}>
              <Ionicons name="log-out-outline" size={17} color={theme.colors.danger} />
            </View>
            <Text style={[styles.logoutBtnText, { color: theme.colors.danger }]}>Log out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountBtn, { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.dangerLight }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.colors.dangerLight }]}>
              <Ionicons name="trash-outline" size={17} color={theme.colors.danger} />
            </View>
            <Text style={[styles.logoutBtnText, { color: theme.colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* ── Header ── */
  headerGrad: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 56,
    marginBottom: 24,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  topTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Avatar */
  avatarWrap: {
    alignItems: 'center',
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pname: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  pemail: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 3,
    marginBottom: 10,
  },
  roleChip: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleChipText: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '500',
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.3,
  },

  /* Section title */
  sectionTitle: {
    color: '#bbb',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 20,
    marginLeft: 4,
  },

  /* Row cards */
  rowCard: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#111',
    fontSize: 13,
    fontWeight: '500',
  },
  rowSub: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 1,
  },

  /* Toggle */
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  /* Account row — side by side */
  accountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  accountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
  },
  editBtn: {
    backgroundColor: '#fff',
    borderColor: '#eee',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
