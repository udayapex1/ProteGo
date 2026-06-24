import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
// import ZonesScreen from '../screens/parent/ZonesScreen';
import ZonesStackNavigator from './ZonesStackNavigator';
import HistoryScreen from '../screens/parent/HistoryScreen';
import ProfileScreen from '../screens/parent/ProfileScreen';

import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import ChildHistoryScreen from '../screens/child/ChildHistoryScreen';
import ChildProfileScreen from '../screens/child/ChildProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'location',
  Zones: 'map',
  History: 'time',
  Profile: 'person-circle',
};

export default function TabNavigator() {
  const { user } = useAuth();
  const { theme } = useAppTheme();

  const tabBarStyle = {
    backgroundColor: theme.colors.tabBar,
    borderColor: theme.colors.border,
    borderRadius: 28,
    marginHorizontal: 20,
    marginBottom: 10,
    height: 60,
    borderTopWidth: 0,
    paddingHorizontal: 10,
    paddingTop: 8,
    position: 'absolute' as const,
  };

  const screenOptions = ({ route }: any) => ({
    headerShown: false,
    tabBarStyle,
    tabBarShowLabel: false,
    tabBarItemStyle: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    tabBarActiveTintColor: theme.colors.accent,
    tabBarInactiveTintColor: theme.colors.textMuted,
    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
      <Ionicons
        name={ICONS[route.name]}
        size={22}
        color={color}
        style={focused ? { transform: [{ scale: 1.05 }] } : undefined}
      />
    ),
  });

  if (user?.role === 'parent') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={ParentHomeScreen} />
        <Tab.Screen name="Zones" component={ZonesStackNavigator} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={ChildHomeScreen} />
      <Tab.Screen name="History" component={ChildHistoryScreen} />
      <Tab.Screen name="Profile" component={ChildProfileScreen} />
    </Tab.Navigator>
  );
}