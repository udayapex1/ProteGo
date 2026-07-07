import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

export default function PairingScreen() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ position: 'absolute', top: 56, right: 28, zIndex: 10 }}>
        <ThemeToggle />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>Pairing</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        Family pairing setup will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundDark,
  },
  title: {
    color: '#fff',
    fontSize: fontSize.xxl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
  },
});
