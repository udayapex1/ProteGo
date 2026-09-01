import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/parent/ProfileScreen';
import PairedAccountScreen from '../screens/common/PairedAccountScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  PairedAccount: undefined;
  EditProfile: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ParentProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="PairedAccount" component={PairedAccountScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}
