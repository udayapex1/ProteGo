import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { geofenceApi } from '../../api/geofence.api';
import { Geofence } from '../../types/location.types';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { ZonesStackParamList } from '../../navigation/ZonesStackNavigator';

type NavProp = StackNavigationProp<ZonesStackParamList, 'ZonesList'>;

export default function ZonesScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavProp>();
  const [zones, setZones] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);

  const loadZones = async () => {
    try {
      const fetchedZones = await geofenceApi.getParentZones();
      setZones(fetchedZones);
    } catch (error) {
      console.log('Failed to load zones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Har baar screen focus hone par refresh karo (create/edit ke baad wapas aane par)
  useFocusEffect(
    useCallback(() => {
      loadZones();
    }, [])
  );

  const handleDelete = (zone: Geofence) => {
    Alert.alert(
      'Delete zone',
      `Are you sure you want to delete "${zone.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await geofenceApi.deactivate(zone._id);
              setZones((prev) => prev.filter((z) => z._id !== zone._id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete zone');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Zones</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateZone', undefined)}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {zones.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="map-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No zones yet</Text>
            <Text style={styles.emptySub}>Create your first safety zone to get alerts</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => navigation.navigate('CreateZone', undefined)}
            >
              <Text style={styles.emptyCtaText}>Create zone</Text>
            </TouchableOpacity>
          </View>
        ) : (
          zones.map((zone) => (
            <View key={zone._id} style={styles.zoneCard}>
              <View style={styles.zoneRow}>
                <View style={styles.zoneIcon}>
                  <Ionicons name="home-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={styles.zoneSub}>{zone.radius}m radius</Text>
                </View>
              </View>

              <View style={styles.zoneActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    navigation.navigate('CreateZone', { zoneId: zone._id })
                  }
                >
                  <Ionicons name="create-outline" size={14} color="#555" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(zone)}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: '#000',
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneName: {
    color: '#000',
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  zoneSub: {
    color: '#aaa',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  zoneActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionText: {
    color: '#555',
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  deleteText: {
    color: colors.danger,
  },
  emptyState: {
    margin: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: '#000',
    fontSize: fontSize.md,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySub: {
    color: '#aaa',
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  emptyCta: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyCtaText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});