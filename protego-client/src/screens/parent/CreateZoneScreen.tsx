import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { geofenceApi } from '../../api/geofence.api';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { ZonesStackParamList } from '../../navigation/ZonesStackNavigator';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

type NavProp = StackNavigationProp<ZonesStackParamList, 'CreateZone'>;
type RouteProps = RouteProp<ZonesStackParamList, 'CreateZone'>;

export default function CreateZoneScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const zoneId = route.params?.zoneId;
  const isEditing = !!zoneId;

  const mapRef = useRef<MapView>(null);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(300);
  const [center, setCenter] = useState({ latitude: 22.7196, longitude: 75.8577 });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      if (isEditing) {
        // Edit mode — existing zone data load karo
        const zones = await geofenceApi.getParentZones();
        const existingZone = zones.find((z) => z._id === zoneId);
        if (existingZone) {
          setName(existingZone.name);
          setRadius(existingZone.radius);
          setCenter({
            latitude: existingZone.center.coordinates[1],
            longitude: existingZone.center.coordinates[0],
          });
        }
      } else {
        // Create mode — current location se start karo
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setCenter({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      }
    } catch (error) {
      console.log('Failed to initialize:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handleRegionChangeComplete = (region: any) => {
    setCenter({ latitude: region.latitude, longitude: region.longitude });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a zone name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        latitude: center.latitude,
        longitude: center.longitude,
        radius: Math.round(radius),
      };

      if (isEditing && zoneId) {
        await geofenceApi.update(zoneId, payload);
      } else {
        await geofenceApi.create(payload);
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save zone');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textMuted }}>Loading map...</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{isEditing ? 'Edit zone' : 'New zone'}</Text>
          <ThemeToggle />
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            <Circle
              center={center}
              radius={radius}
              strokeColor={colors.primary}
              fillColor="rgba(122,28,172,0.15)"
              strokeWidth={1.5}
            />
          </MapView>

          {/* Fixed center pin — map move hota hai, pin center mein fixed rehta hai */}
          <View style={styles.centerPinWrapper} pointerEvents="none">
            <View style={styles.centerPin} />
          </View>

          <View style={styles.mapHint}>
            <Text style={styles.mapHintText}>Drag map to position the zone</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Zone name</Text>
          <View style={styles.inputPill}>
            <Ionicons name="pricetag-outline" size={14} color="#999" />
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Home, School, Grandma's"
              placeholderTextColor="#bbb"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.radiusRow}>
            <Text style={styles.inputLabel}>Radius</Text>
            <Text style={styles.radiusVal}>{Math.round(radius)} m</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 30 }}
            minimumValue={100}
            maximumValue={2000}
            step={50}
            value={radius}
            onValueChange={setRadius}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor="#eee"
            thumbTintColor={colors.primary}
          />

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? 'Saving...' : isEditing ? 'Update zone' : 'Create zone'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  headerTitle: {
    color: '#000',
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  mapWrapper: {
    marginHorizontal: spacing.xl,
    height: 240,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A1A1A',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerPinWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -9,
    marginLeft: -9,
  },
  centerPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: '#fff',
  },
  mapHint: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mapHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.xs,
  },
  formCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  inputLabel: {
    color: '#000',
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputPill: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  inputField: {
    flex: 1,
    color: '#000',
    fontSize: fontSize.base,
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  radiusVal: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#000',
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '500',
  },
});