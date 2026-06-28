import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { locationApi } from '../../api/location.api';
import { geofenceApi } from '../../api/geofence.api';
import { Geofence } from '../../types/location.types';
import {
  startBackgroundLocationTracking,
} from '../../services/locationTracking.service';
import { getWalkingOrDrivingRoute } from '../../api/directions.api';

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

const SOS_THUMB_SIZE = 50;

export default function ChildHomeScreen() {
  const { user } = useAuth();
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [zones, setZones] = useState<Geofence[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [sosTriggering, setSosTriggering] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [route, setRoute] = useState<{
    coordinates: { latitude: number; longitude: number }[];
    distanceText: string;
    durationText: string;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    initTracking();
    loadZones();

    return () => {
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
    };
  }, []);

  const initTracking = async () => {
    // Foreground live update for the map UI itself
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      watchSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (location) => {
          setMyLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    }

    // Background tracking (sends to backend even when app is closed/minimized)
    const started = await startBackgroundLocationTracking();
    setIsTracking(started);
  };

  const loadZones = async () => {
    try {
      const fetchedZones = await geofenceApi.getChildZones();
      setZones(fetchedZones);
    } catch (error) {
      console.log('Failed to load zones:', error);
    }
  };

  const handleSOS = async () => {
    if (!myLocation) {
      Alert.alert('Error', 'Location not available yet. Please wait a moment.');
      return;
    }

    setSosTriggering(true);
    try {
      await locationApi.updateLocation({
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
        battery: 100, // ideally pull real battery here too
        network: 'online',
        isSOS: true,
        timestamp: new Date().toISOString(),
      });
      Alert.alert('SOS Sent', 'Your parent has been notified of your emergency.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS. Please try again.');
    } finally {
      setSosTriggering(false);
    }
  };

  const getZoneCenter = (zone: Geofence) => ({
    latitude: zone.center.coordinates[1],
    longitude: zone.center.coordinates[0],
  });

  const handleShowRouteToZone = async (zone: Geofence) => {
    if (!myLocation || routeLoading) return;

    const destination = getZoneCenter(zone);
    setSelectedZoneId(zone._id);
    setRouteLoading(true);

    try {
      const nextRoute = await getWalkingOrDrivingRoute(myLocation, destination, 'walking');
      setRoute(nextRoute);

      if (nextRoute?.coordinates.length && mapRef.current) {
        mapRef.current.fitToCoordinates(nextRoute.coordinates, {
          edgePadding: { top: 60, right: 60, bottom: 70, left: 60 },
          animated: true,
        });
      }
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingSub}>Your location</Text>
          <Text style={styles.greeting}>{user?.name?.split(' ')[0]}</Text>
        </View>
        <View style={[styles.statusChip, isTracking ? styles.statusChipOn : styles.statusChipOff]}>
          <View style={[styles.statusDot, { backgroundColor: isTracking ? colors.success : '#ccc' }]} />
          <Text style={[styles.statusChipText, { color: isTracking ? colors.success : '#999' }]}>
            {isTracking ? 'Sharing live' : 'Not sharing'}
          </Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        {myLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: myLocation.latitude,
              longitude: myLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: myLocation.latitude,
              longitude: myLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={myLocation}>
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
            </Marker>

            {zones.map((zone) => {
              if (zone._id !== selectedZoneId) return null;

              return (
                <Marker key={`${zone._id}-destination`} coordinate={getZoneCenter(zone)}>
                  <View style={styles.destinationMarker}>
                    <Ionicons name="flag" size={14} color="#fff" />
                  </View>
                </Marker>
              );
            })}

            {route && (
              <Polyline
                coordinates={route.coordinates}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            )}

            {zones.map((zone) => (
              <Circle
                key={zone._id}
                center={{
                  latitude: zone.center.coordinates[1],
                  longitude: zone.center.coordinates[0],
                }}
                radius={zone.radius}
                strokeColor={colors.primary}
                fillColor="rgba(122,28,172,0.12)"
                strokeWidth={1.5}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location-outline" size={28} color="#555" />
            <Text style={styles.mapPlaceholderText}>Getting your location...</Text>
          </View>
        )}

        {myLocation && (
          <View style={styles.mapBottom}>
            <View style={styles.mapStatus}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{route ? `${route.distanceText} · ${route.durationText}` : 'Choose a zone route'}</Text>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Your zones</Text>
      <View style={styles.zoneScroll}>
        {zones.length === 0 ? (
          <Text style={styles.emptyZonesText}>No zones set by your parent yet</Text>
        ) : (
          zones.map((zone) => (
            <TouchableOpacity
              key={zone._id}
              style={[styles.zoneChip, selectedZoneId === zone._id && styles.zoneChipSelected]}
              onPress={() => handleShowRouteToZone(zone)}
              disabled={!myLocation || routeLoading}
            >
              <Ionicons name="home-outline" size={14} color={colors.primary} />
              <Text style={styles.zoneChipText}>{zone.name}</Text>
              {routeLoading && selectedZoneId === zone._id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="navigate-outline" size={14} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.sosWrap}>
        <TouchableOpacity
          style={[styles.sosBtn, sosTriggering && { opacity: 0.7 }]}
          onPress={() =>
            Alert.alert('Confirm SOS', 'This will alert your parent immediately. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send SOS', style: 'destructive', onPress: handleSOS },
            ])
          }
          disabled={sosTriggering}
        >
          <View style={styles.sosIconWrap}>
            <Ionicons name="alert" size={18} color="#fff" />
          </View>
          <Text style={styles.sosText}>{sosTriggering ? 'Sending...' : 'Hold for SOS'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greetingSub: {
    color: '#999',
    fontSize: fontSize.sm,
  },
  greeting: {
    color: '#000',
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  statusChipOn: {
    backgroundColor: colors.successLight,
  },
  statusChipOff: {
    backgroundColor: '#f0f0f0',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  mapCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xxl,
    height: 240,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    color: '#555',
    fontSize: fontSize.sm,
  },
  markerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(122,28,172,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  destinationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapBottom: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
  },
  mapStatus: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#000',
    fontSize: fontSize.md,
    fontWeight: '500',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  zoneScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.xl,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zoneChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  zoneChipText: {
    color: '#000',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  emptyZonesText: {
    color: '#aaa',
    fontSize: fontSize.sm,
  },
sosWrap: {
  marginTop: 'auto',
  marginHorizontal: spacing.xl,
  marginBottom: 90, // navbar height (60) + margin (10) + extra buffer
},
  sosBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  sosIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '500',
  },
});
