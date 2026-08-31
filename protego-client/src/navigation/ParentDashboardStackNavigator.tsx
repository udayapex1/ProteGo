import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ChildDashboardScreen from '../screens/parent/ChildDashboardScreen';

export type ParentDashboardStackParamList = { ParentHome: undefined; ChildDashboard: undefined };
const Stack = createStackNavigator<ParentDashboardStackParamList>();

export default function ParentDashboardStackNavigator() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="ParentHome" component={ParentHomeScreen} /><Stack.Screen name="ChildDashboard" component={ChildDashboardScreen} /></Stack.Navigator>;
}
