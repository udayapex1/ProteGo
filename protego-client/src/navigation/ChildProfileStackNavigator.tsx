import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChildProfileScreen from '../screens/child/ChildProfileScreen';
import PairedAccountScreen from '../screens/common/PairedAccountScreen';
import BatteryOptimizationScreen from '../screens/child/BatteryOptimizationScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PairedAccount: undefined;
  BatteryOptimization: undefined;
  EditProfile: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ChildProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ChildProfileScreen} />
      <Stack.Screen name="PairedAccount" component={PairedAccountScreen} />
      <Stack.Screen name="BatteryOptimization" component={BatteryOptimizationScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
