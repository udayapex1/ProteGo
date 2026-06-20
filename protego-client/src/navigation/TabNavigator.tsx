import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Parent screens
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ZonesScreen from '../screens/parent/ZonesScreen';
import HistoryScreen from '../screens/parent/HistoryScreen';
import ProfileScreen from '../screens/parent/ProfileScreen';

// Child screens
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import ChildHistoryScreen from '../screens/child/ChildHistoryScreen';
import ChildProfileScreen from '../screens/child/ChildProfileScreen';

const Tab = createBottomTabNavigator();

const tabBarStyle = {
  backgroundColor: '#1A1A1A',
  borderRadius: 28,
  marginHorizontal: 20,
  marginBottom: 10,
  height: 60,
  borderTopWidth: 0,
  position: 'absolute' as const,
};

export default function TabNavigator() {
  const { user } = useAuth();

  if (user?.role === 'parent') {
    return (
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle }}>
        <Tab.Screen name="Home" component={ParentHomeScreen} />
        <Tab.Screen name="Zones" component={ZonesScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle }}>
      <Tab.Screen name="Home" component={ChildHomeScreen} />
      <Tab.Screen name="History" component={ChildHistoryScreen} />
      <Tab.Screen name="Profile" component={ChildProfileScreen} />
    </Tab.Navigator>
  );
}