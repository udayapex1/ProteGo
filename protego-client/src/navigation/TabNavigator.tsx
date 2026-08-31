import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ChildDashboardScreen from '../screens/parent/ChildDashboardScreen';
import ZonesStackNavigator from './ZonesStackNavigator';
import HistoryScreen from '../screens/parent/HistoryScreen';
import ParentProfileStackNavigator from './ParentProfileStackNavigator';

import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import ChildHistoryScreen from '../screens/child/ChildHistoryScreen';
import ChildProfileStackNavigator from './ChildProfileStackNavigator';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = { Home: 'home-outline', Dashboard: 'grid-outline', Zones: 'map-outline', History: 'time-outline', Profile: 'person-outline' };
const LABELS: Record<string, string> = { Home: 'Home', Dashboard: 'Dashboard', Zones: 'Zones', History: 'History', Profile: 'Profile' };

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();

  return <View style={styles.barOuter}><View style={[styles.bar, { backgroundColor: theme.isDark ? '#000' : '#080808' }]}>{state.routes.map((route, index) => {
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return <Pressable key={route.key} onPress={onPress} style={[styles.tabButton, { flex: focused ? 1.8 : 1 }]} accessibilityRole="tab" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={options?.tabBarAccessibilityLabel || LABELS[route.name] || route.name} hitSlop={6}>
      <View style={[styles.tabContent, focused && styles.activeTab]}><Ionicons name={ICONS[route.name] || 'ellipse-outline'} size={22} color={focused ? '#fff' : '#E5E7EB'} />{focused && <Text numberOfLines={1} style={styles.activeLabel}>{LABELS[route.name] || route.name}</Text>}</View>
    </Pressable>;
  })}</View></View>;
}

const screenOptions = { headerShown: false, tabBarShowLabel: false };

export default function TabNavigator() {
  const { user } = useAuth();

  if (user?.role === 'parent') {
    return (
      <Tab.Navigator tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={ParentHomeScreen} />
        <Tab.Screen name="Dashboard" component={ChildDashboardScreen} />
        <Tab.Screen name="Zones" component={ZonesStackNavigator} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ParentProfileStackNavigator} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={ChildHomeScreen} />
      <Tab.Screen name="History" component={ChildHistoryScreen} />
      <Tab.Screen name="Profile" component={ChildProfileStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barOuter: { position: 'absolute', left: 20, right: 20, bottom: 10 },
  bar: { height: 70, borderRadius: 36, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, elevation: 12, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, overflow: 'hidden' },
  tabButton: { alignItems: 'center', justifyContent: 'center', minHeight: 54 },
  tabContent: { minHeight: 48, minWidth: 48, paddingHorizontal: 10, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  activeTab: { backgroundColor: '#2D2D2F', paddingHorizontal: 16, borderRadius: 28 },
  activeLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
