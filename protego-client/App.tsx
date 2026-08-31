import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AlertProvider } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { theme } = useAppTheme();

  return (
    <AlertProvider>
      <AuthProvider>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <AppNavigator />
      </AuthProvider>
    </AlertProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
