import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = { Home: 'home-outline', Dashboard: 'view-dashboard-outline', Zones: 'map-outline', History: 'clock-outline', Profile: 'account-outline' };
const LABELS: Record<string, string> = { Home: 'Home', Dashboard: 'Dashboard', Zones: 'Zones', History: 'History', Profile: 'Profile' };

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const inactiveColor = theme.isDark ? '#E5E7EB' : '#71717A';
  const activeColor = theme.isDark ? '#fff' : theme.colors.primary;

  return <View style={styles.barOuter}><View style={[styles.bar, !theme.isDark && styles.lightBar, { backgroundColor: theme.isDark ? 'transparent' : theme.colors.tabBar, borderColor: theme.colors.border, shadowOpacity: theme.isDark ? 0 : 0.18 }]}>{state.routes.map((route, index) => {
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return <Pressable key={route.key} onPress={onPress} style={[styles.tabButton, { flex: focused ? 1.8 : 1 }]} accessibilityRole="tab" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={options?.tabBarAccessibilityLabel || LABELS[route.name] || route.name} hitSlop={6}>
      <View style={[styles.tabContent, focused && [styles.activeTab, { backgroundColor: theme.isDark ? '#2D2D2F' : theme.colors.primaryLight }]]}><MaterialCommunityIcons name={ICONS[route.name] || 'circle-outline'} size={22} color={focused ? activeColor : inactiveColor} />{focused && <Text numberOfLines={1} style={[styles.activeLabel, { color: activeColor }]}>{LABELS[route.name] || route.name}</Text>}</View>
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
  lightBar: { borderWidth: 1 },
  tabButton: { alignItems: 'center', justifyContent: 'center', minHeight: 54 },
  tabContent: { minHeight: 48, minWidth: 48, paddingHorizontal: 10, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  activeTab: { paddingHorizontal: 16, borderRadius: 28 },
  activeLabel: { fontSize: 14, fontWeight: '600' },
});
