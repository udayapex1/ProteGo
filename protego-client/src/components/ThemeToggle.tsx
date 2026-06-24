import React from 'react';
import { StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
}

export default function ThemeToggle({ style }: ThemeToggleProps) {
  const { theme, toggleTheme } = useAppTheme();

  return (
    <TouchableOpacity
      accessibilityLabel={`Switch to ${theme.isDark ? 'light' : 'dark'} theme`}
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.toggleSurface,
          borderColor: theme.colors.border,
          shadowOpacity: theme.isDark ? 0 : 0.15,
        },
        style,
      ]}
    >
      <Ionicons
        name={theme.isDark ? 'sunny-outline' : 'moon-outline'}
        size={20}
        color={theme.colors.accent}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
});
