import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TwoFactorScreen from '../screens/auth/TwoFactorScreen';
import PairingScreen from '../screens/auth/PairingScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  TwoFactor: { userId: string };
  Pairing: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="TwoFactor" component={TwoFactorScreen} />
      <Stack.Screen name="Pairing" component={PairingScreen} />
    </Stack.Navigator>
  );
}