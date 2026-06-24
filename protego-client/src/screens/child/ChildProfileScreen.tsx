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

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ChildProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useAppTheme();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
      <LinearGradient
        colors={theme.colors.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.topRow}>
          <Text style={[styles.topTitle, { color: theme.colors.text }]}>Profile</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={16} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={[styles.pname, { color: theme.colors.text }]}>{user?.name}</Text>
          <Text style={[styles.pemail, { color: theme.colors.textSubtle }]}>
            {(user as any)?.email || ''}
          </Text>
          <View style={styles.roleChip}>
            <Ionicons name="happy-outline" size={12} color="#C77DFF" />
            <Text style={styles.roleChipText}>Child · Paired with parent</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={sectionTitleStyle}>Sharing</Text>

        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="location-outline" size={17} color={colors.success} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Share my location</Text>
            <Text style={rowSubStyle}>Visible to your paired parent</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, shareLocationEnabled ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setShareLocationEnabled(!shareLocationEnabled)}
          >
            <View style={styles.toggleDot} />
          </TouchableOpacity>
        </View>

        <Text style={sectionTitleStyle}>Security</Text>

        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-half-outline" size={17} color={colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Two-factor authentication</Text>
            <Text style={rowSubStyle}>Extra layer of account security</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, twoFactorEnabled ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setTwoFactorEnabled(!twoFactorEnabled)}
          >
            <View style={styles.toggleDot} />
          </TouchableOpacity>
        </View>

        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="finger-print-outline" size={17} color={colors.primary} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Biometric login</Text>
            <Text style={rowSubStyle}>Use fingerprint to sign in</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, biometricEnabled ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setBiometricEnabled(!biometricEnabled)}
          >
            <View style={styles.toggleDot} />
          </TouchableOpacity>
        </View>

        <Text style={sectionTitleStyle}>Emergency</Text>
        <TouchableOpacity style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>SOS history</Text>
            <Text style={rowSubStyle}>View past emergency alerts</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>

        <Text style={sectionTitleStyle}>Notifications</Text>
        <View style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="notifications-outline" size={17} color={colors.danger} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Push notifications</Text>
            <Text style={rowSubStyle}>Zone alerts & reminders</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, notificationsEnabled ? styles.toggleOn : styles.toggleOff]}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            <View style={styles.toggleDot} />
          </TouchableOpacity>
        </View>

        <Text style={sectionTitleStyle}>Account</Text>
        <TouchableOpacity style={rowCardStyle}>
          <View style={[styles.rowIcon, { backgroundColor: theme.colors.input }]}>
            <Ionicons name="create-outline" size={17} color={theme.colors.textMuted} />
          </View>
          <View style={styles.rowText}>
            <Text style={rowTitleStyle}>Edit profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={[rowCardStyle, styles.dangerRow]} onPress={handleLogout}>
          <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, styles.dangerText]}>Log out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerGrad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 70,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  topTitle: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm + 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  pname: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '500',
    marginTop: 10,
  },
  pemail: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  roleChip: {
    marginTop: 8,
    backgroundColor: 'rgba(122,28,172,0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roleChipText: {
    color: '#C77DFF',
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  card: {
    minHeight: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -40,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    color: '#999',
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 10,
    marginTop: spacing.lg,
  },
  rowCard: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#000',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  rowSub: {
    color: '#999',
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.primary,
    alignItems: 'flex-end',
  },
  toggleOff: {
    backgroundColor: '#e5e5e5',
    alignItems: 'flex-start',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  dangerRow: {
    backgroundColor: '#FFF5F6',
    borderColor: '#FFD9DF',
  },
  dangerText: {
    color: colors.danger,
  },
});
