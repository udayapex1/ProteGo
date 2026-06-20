import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ChildProfileScreen() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.role}>{user?.role}</Text>

      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  name: { fontSize: 18, fontWeight: '500' },
  role: { fontSize: 14, color: '#999' },
  btn: { backgroundColor: '#E8003D', padding: 14, borderRadius: 12, marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '500' },
});