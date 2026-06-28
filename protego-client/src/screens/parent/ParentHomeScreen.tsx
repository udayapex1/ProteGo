import React, { useEffect, useState, useRef } from 'react';
import { connectSocket } from '../../services/socket.service';
import * as Location from 'expo-location';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import { locationApi } from '../../api/location.api';
import { geofenceApi } from '../../api/geofence.api';
import { Geofence } from '../../types/location.types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { getWalkingOrDrivingRoute } from '../../api/directions.api';

interface LiveLocation {
  latitude: number;
  longitude: number;
  battery: number;
  network: 'online' | 'offline';
  timestamp: string;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#333' }] },
];

// Light counterpart of darkMapStyle — same feature toggles (POIs/transit hidden),
// swapped to a soft, clean light palette so it matches the rest of the light theme.
const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9a9a9a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e0e6f0' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#d9d9d9' }] },
];

// Formats a meter value as "123 m" or "1.2 km" — used for the straight-line distance label.
const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export default function ParentHomeScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [zones, setZones] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentLocation, setParentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute] = useState<{
    coordinates: { latitude: number; longitude: number }[];
    distanceText: string;
    durationText: string;
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Straight-line ("as the crow flies") distance between parent and child — computed
  // locally with Haversine, no network call. Updates whenever either location changes.
  const [straightDistance, setStraightDistance] = useState<number | null>(null);

  // Fullscreen map toggle — opens a Modal covering the whole screen with the same
  // map content (markers, route, zones), since RN has no native map fullscreen API.
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

const mapRef = useRef<MapView>(null);
const fullscreenMapRef = useRef<MapView>(null);
const hasFitMap = useRef(false);
const hasReceivedSocketUpdate = useRef(false);

  useEffect(() => {
    loadInitialData();

    let parentLocationSubscription: Location.LocationSubscription | null = null;
    let socketInstance: any;

    const watchParentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      parentLocationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setParentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    };

    const setupSocket = async () => {
      socketInstance = await connectSocket();

      socketInstance.on('location:update', (data: any) => {
         hasReceivedSocketUpdate.current = true;
        console.log('📍 Live update received:', data);
        setLiveLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          battery: data.battery,
          network: data.network,
          timestamp: data.timestamp,
        });
      });

      socketInstance.on('geofence:breach', (data: any) => {
        console.log('🚧 Geofence breach:', data);
        loadInitialData();
      });
    };

    watchParentLocation();
    setupSocket();

    return () => {
      if (socketInstance) {
        socketInstance.off('location:update');
        socketInstance.off('geofence:breach');
      }
      if (parentLocationSubscription) {
        parentLocationSubscription.remove();
      }
    };
  }, []);

  // Sirf pehli baar dono locations milne par map ko fit karo
  useEffect(() => {
    if (parentLocation && liveLocation && mapRef.current && !hasFitMap.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: parentLocation.latitude, longitude: parentLocation.longitude },
          { latitude: liveLocation.latitude, longitude: liveLocation.longitude },
        ],
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        }
      );
      hasFitMap.current = true;
    }
  }, [parentLocation, liveLocation]);

  // Recompute straight-line distance whenever either point changes.
  // Cheap local calc (Haversine) — no network call, no rate limit, instant.
  useEffect(() => {
    if (parentLocation && liveLocation) {
      const distance = getDistanceMeters(
        parentLocation.latitude,
        parentLocation.longitude,
        liveLocation.latitude,
        liveLocation.longitude
      );
      setStraightDistance(distance);
    } else {
      setStraightDistance(null);
    }
  }, [parentLocation, liveLocation]);

  const loadInitialData = async () => {
  try {
    if (user?.pairedWith) {
      const latest = await locationApi.getLatest(user.pairedWith);

      // Sirf set karo agar Socket se abhi tak kuch nahi aaya
     if (latest && !hasReceivedSocketUpdate.current) {
  setLiveLocation({
    latitude: latest.location?.coordinates?.[1] ?? latest.latitude,
    longitude: latest.location?.coordinates?.[0] ?? latest.longitude,
    battery: latest.battery,
    network: latest.network,
    timestamp: latest.createdAt ?? latest.timestamp,
  });
}

      const fetchedZones = await geofenceApi.getParentZones();
      setZones(fetchedZones);
    }
  } catch (error) {
    console.log('❌ Failed to load home data:', error);
  } finally {
    setLoading(false);
  }
};

  const isInsideZone = (zone: Geofence) => {
    if (!liveLocation) return false;
    const [zoneLng, zoneLat] = zone.center.coordinates;
    const distance = getDistanceMeters(liveLocation.latitude, liveLocation.longitude, zoneLat, zoneLng);
    return distance <= zone.radius;
  };

  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetches the actual road route (driving) between parent and child via OpenRouteService.
  // Distinct from straightDistance: this follows roads and includes ETA.
  const handleShowRoute = async () => {
    if (!parentLocation || !liveLocation || routeLoading) return;

    setRouteLoading(true);
    try {
      const nextRoute = await getWalkingOrDrivingRoute(parentLocation, liveLocation, 'driving');
      setRoute(nextRoute);

      const activeMapRef = isMapFullscreen ? fullscreenMapRef : mapRef;
      if (nextRoute?.coordinates.length && activeMapRef.current) {
        activeMapRef.current.fitToCoordinates(nextRoute.coordinates, {
          edgePadding: { top: 60, right: 60, bottom: 90, left: 60 },
          animated: true,
        });
      }
    } finally {
      setRouteLoading(false);
    }
  };

  // Same map style logic used by both the card map and the fullscreen modal map.
  const activeMapStyle = theme.isDark ? darkMapStyle : lightMapStyle;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSub, { color: theme.colors.textMuted }]}>Good morning</Text>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>Hello, {user?.name?.split(' ')[0]}</Text>
          </View>
          <ThemeToggle />
        </View>

        <View style={styles.mapCard}>
          {liveLocation ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              customMapStyle={activeMapStyle}
              initialRegion={{
                latitude: liveLocation.latitude,
                longitude: liveLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={{ latitude: liveLocation.latitude, longitude: liveLocation.longitude }}>
                <View style={styles.markerOuter}>
                  <View style={styles.markerInner} />
                </View>
              </Marker>

              {parentLocation && (
                <Marker coordinate={parentLocation}>
                  <View style={styles.parentMarkerOuter}>
                    <Ionicons name="person" size={14} color="#fff" />
                  </View>
                </Marker>
              )}

              {route ? (
                <Polyline
                  coordinates={route.coordinates}
                  strokeColor={colors.primary}
                  strokeWidth={4}
                />
              ) : parentLocation && (
                <Polyline
                  coordinates={[
                    { latitude: parentLocation.latitude, longitude: parentLocation.longitude },
                    { latitude: liveLocation.latitude, longitude: liveLocation.longitude },
                  ]}
                  strokeColor={colors.primary}
                  strokeWidth={2.5}
                  geodesic
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
              <Text style={styles.mapPlaceholderText}>
                {loading ? 'Loading location...' : 'No location data yet'}
              </Text>
            </View>
          )}

          <View style={styles.mapOverlay} pointerEvents="none" />

          <TouchableOpacity
            style={styles.fullscreenBtn}
            onPress={() => setIsMapFullscreen(true)}
            disabled={!liveLocation}
          >
            <Ionicons name="expand-outline" size={16} color="#fff" />
          </TouchableOpacity>

          <View style={styles.mapBottom}>
            <View style={styles.mapStatus}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {liveLocation ? 'Live · updated now' : 'Waiting for location'}
              </Text>
              {/* Straight-line distance shown inline next to the live status, only when no
                  road route has been fetched yet — once a route exists, the chip on the
                  right shows the (more useful) road distance + ETA instead. */}
              {straightDistance !== null && !route && (
                <Text style={styles.straightDistanceText}>
                  · {formatDistance(straightDistance)} away
                </Text>
              )}
            </View>

            {liveLocation && parentLocation && (
              <TouchableOpacity
                style={[styles.routeChip, (!parentLocation || routeLoading) && styles.routeChipDisabled]}
                onPress={handleShowRoute}
                disabled={!parentLocation || routeLoading}
              >
                {routeLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="navigate-outline" size={12} color="#fff" />
                )}
                <Text style={styles.routeChipText}>
                  {route ? `${route.distanceText} · ${route.durationText}` : 'Show route'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Fullscreen map modal — same content (markers, route, zones) as the card map,
            just rendered at full screen size with a close button on top. */}
        <Modal
          visible={isMapFullscreen}
          animationType="fade"
          onRequestClose={() => setIsMapFullscreen(false)}
        >
          <View style={[styles.fullscreenContainer, { backgroundColor: theme.isDark ? '#000' : '#fff' }]}>
            {liveLocation && (
              <MapView
                ref={fullscreenMapRef}
                style={styles.fullscreenMap}
                customMapStyle={activeMapStyle}
                initialRegion={{
                  latitude: liveLocation.latitude,
                  longitude: liveLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onMapReady={() => {
                  // Fit both points (or the active route) the moment the fullscreen map mounts,
                  // so opening fullscreen doesn't just show a tight zoom on the child alone.
                  if (route?.coordinates.length) {
                    fullscreenMapRef.current?.fitToCoordinates(route.coordinates, {
                      edgePadding: { top: 80, right: 60, bottom: 90, left: 60 },
                      animated: false,
                    });
                  } else if (parentLocation) {
                    fullscreenMapRef.current?.fitToCoordinates(
                      [parentLocation, { latitude: liveLocation.latitude, longitude: liveLocation.longitude }],
                      {
                        edgePadding: { top: 80, right: 60, bottom: 60, left: 60 },
                        animated: false,
                      }
                    );
                  }
                }}
              >
                <Marker coordinate={{ latitude: liveLocation.latitude, longitude: liveLocation.longitude }}>
                  <View style={styles.markerOuter}>
                    <View style={styles.markerInner} />
                  </View>
                </Marker>

                {parentLocation && (
                  <Marker coordinate={parentLocation}>
                    <View style={styles.parentMarkerOuter}>
                      <Ionicons name="person" size={14} color="#fff" />
                    </View>
                  </Marker>
                )}

                {route ? (
                  <Polyline coordinates={route.coordinates} strokeColor={colors.primary} strokeWidth={4} />
                ) : (
                  parentLocation && (
                    <Polyline
                      coordinates={[
                        { latitude: parentLocation.latitude, longitude: parentLocation.longitude },
                        { latitude: liveLocation.latitude, longitude: liveLocation.longitude },
                      ]}
                      strokeColor={colors.primary}
                      strokeWidth={2.5}
                      geodesic
                    />
                  )
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
            )}

            <SafeAreaView style={styles.fullscreenTopBar} edges={['top']}>
              <TouchableOpacity
                style={styles.closeFullscreenBtn}
                onPress={() => setIsMapFullscreen(false)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>

              {liveLocation && parentLocation && (
                <TouchableOpacity
                  style={[styles.routeChip, routeLoading && styles.routeChipDisabled]}
                  onPress={handleShowRoute}
                  disabled={routeLoading}
                >
                  {routeLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="navigate-outline" size={12} color="#fff" />
                  )}
                  <Text style={styles.routeChipText}>
                    {route ? `${route.distanceText} · ${route.durationText}` : 'Show route'}
                  </Text>
                </TouchableOpacity>
              )}
            </SafeAreaView>
          </View>
        </Modal>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Battery</Text>
              <Ionicons name="battery-half-outline" size={16} color={colors.success} />
            </View>
            <Text style={[styles.statVal, { color: theme.colors.text }]}>{liveLocation?.battery ?? '--'}%</Text>
            <View style={[styles.battTrack, { backgroundColor: theme.colors.border }]}>
              <View style={[styles.battFill, { width: `${liveLocation?.battery ?? 0}%` }]} />
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Network</Text>
              <Ionicons name="wifi-outline" size={16} color={theme.colors.accent} />
            </View>
            <Text style={[styles.statVal, { color: theme.colors.text }]}>{liveLocation?.network === 'online' ? 'Online' : 'Offline'}</Text>
            <Text style={[styles.statSub, { color: theme.colors.textSubtle }]}>
              {liveLocation ? new Date(liveLocation.timestamp).toLocaleTimeString() : '--'}
            </Text>
          </View>

          {/* New: Distance stat card — straight-line by default, switches to road
              distance + ETA once a route has been fetched via the "Show route" chip. */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>{route ? 'Road distance' : 'Distance'}</Text>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.statVal, { color: theme.colors.text }]}>
              {route
                ? route.distanceText
                : straightDistance !== null
                ? formatDistance(straightDistance)
                : '--'}
            </Text>
            <Text style={[styles.statSub, { color: theme.colors.textSubtle }]}>
              {route ? `ETA ${route.durationText}` : 'Straight line'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Active zones</Text>
          <TouchableOpacity>
            <Text style={[styles.sectionLink, { color: theme.colors.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {zones.length === 0 ? (
          <View style={styles.emptyZones}>
            <Ionicons name="map-outline" size={22} color={theme.colors.textSubtle} />
            <Text style={[styles.emptyZonesText, { color: theme.colors.textSubtle }]}>No zones created yet</Text>
          </View>
        ) : (
          zones.map((zone) => {
            const inside = isInsideZone(zone);
            return (
              <View key={zone._id} style={[styles.zoneCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.zoneIcon, { backgroundColor: theme.colors.inputFocused }]}>
                  <Ionicons name="home-outline" size={18} color={theme.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.zoneName, { color: theme.colors.text }]}>{zone.name}</Text>
                  <Text style={[styles.zoneSub, { color: theme.colors.textMuted }]}>{zone.radius}m radius</Text>
                </View>
                <View style={[styles.zonePill, inside ? styles.pillIn : styles.pillOut]}>
                  <Text style={[styles.zonePillText, inside ? styles.pillInText : styles.pillOutText]}>
                    {inside ? 'Inside' : 'Outside'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
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
  mapCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xxl,
    height: 280,
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
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenMap: {
    width: '100%',
    height: '100%',
  },
  fullscreenTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeFullscreenBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBottom: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mapStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  },
  straightDistanceText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSize.xs,
  },
  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(122,28,172,0.9)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  routeChipText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  routeChipDisabled: {
    opacity: 0.65,
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
  parentMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#999',
    fontSize: fontSize.xs,
  },
  statVal: {
    color: '#000',
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  statSub: {
    color: '#aaa',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  battTrack: {
    height: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  battFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: '#000',
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  sectionLink: {
    color: colors.primary,
    fontSize: fontSize.xs,
  },
  zoneCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  zoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  zonePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillIn: {
    backgroundColor: colors.successLight,
  },
  pillOut: {
    backgroundColor: colors.dangerLight,
  },
  zonePillText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  pillInText: {
    color: colors.success,
  },
  pillOutText: {
    color: colors.danger,
  },
  emptyZones: {
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 8,
  },
  emptyZonesText: {
    color: '#aaa',
    fontSize: fontSize.sm,
  },
});