import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChildProfileScreen from '../screens/child/ChildProfileScreen';
import PairedAccountScreen from '../screens/common/PairedAccountScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PairedAccount: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ChildProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ChildProfileScreen} />
      <Stack.Screen name="PairedAccount" component={PairedAccountScreen} />
    </Stack.Navigator>
  );
}