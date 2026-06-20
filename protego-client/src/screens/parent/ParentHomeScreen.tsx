import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../constants/theme';

export default function ParentHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Home</Text>
      <Text style={styles.subtitle}>Live family safety overview will appear here.</Text>
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
