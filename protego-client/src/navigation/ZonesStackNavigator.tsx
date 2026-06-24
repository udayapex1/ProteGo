import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ZonesScreen from '../screens/parent/ZonesScreen';
import CreateZoneScreen from '../screens/parent/CreateZoneScreen';

export type ZonesStackParamList = {
  ZonesList: undefined;
  CreateZone: { zoneId?: string } | undefined;
};

const Stack = createStackNavigator<ZonesStackParamList>();

export default function ZonesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ZonesList" component={ZonesScreen} />
      <Stack.Screen name="CreateZone" component={CreateZoneScreen} />
    </Stack.Navigator>
  );
}