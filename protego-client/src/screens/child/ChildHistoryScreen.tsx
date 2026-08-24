import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { locationApi } from '../../api/location.api';
import { getMultiPointRoute } from '../../api/directions.api';
import { spacing, radius, fontSize } from '../../constants/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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

type MapLayer = 'standard' | 'satellite' | 'terrain' | 'hybrid';

const LAYERS: { key: MapLayer; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'standard', label: 'Standard', icon: 'map-outline' },
  { key: 'satellite', label: 'Satellite', icon: 'globe-outline' },
  { key: 'terrain', label: 'Terrain', icon: 'trail-sign-outline' },
  { key: 'hybrid', label: 'Hybrid', icon: 'layers-outline' },
];

interface HistoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  battery?: number;
  network?: 'online' | 'offline';
}

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const downsamplePoints = (raw: any[]): HistoryPoint[] => {
  const cleaned: HistoryPoint[] = [];
  let lastKept: HistoryPoint | null = null;

  for (const doc of raw) {
    const point: HistoryPoint = {
      latitude: doc.location.coordinates[1],
      longitude: doc.location.coordinates[0],
      timestamp: doc.createdAt,
      battery: doc.battery,
      network: doc.network,
    };

    if (!lastKept) {
      cleaned.push(point);
      lastKept = point;
      continue;
    }

    const distance = getDistanceMeters(
      lastKept.latitude, lastKept.longitude,
      point.latitude, point.longitude
    );
    const minutesSince =
      (new Date(point.timestamp).getTime() - new Date(lastKept.timestamp).getTime()) / 60000;

    if (distance > 25 || minutesSince > 5) {
      cleaned.push(point);
      lastKept = point;
    }
  }

  return cleaned;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const getLast7Days = () => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
};

export default function ChildHistoryScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [layerPickerVisible, setLayerPickerVisible] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayer>('standard');

  const mapRef = useRef<MapView>(null);
  const fullscreenMapRef = useRef<MapView>(null);

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  const loadHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    setSelectedPointIndex(null);

    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const hoursAgo = Math.ceil((Date.now() - startOfDay.getTime()) / (1000 * 60 * 60));
      const cappedHours = Math.min(hoursAgo, 168);

      const raw = await locationApi.getHistory(user.id, cappedHours);

      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const filtered = raw.filter((doc: any) => {
        const t = new Date(doc.createdAt).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      });

      const cleaned = downsamplePoints(filtered);
      setPoints(cleaned);

      if (cleaned.length >= 2) {
        const routeResult = await getMultiPointRoute(cleaned, 'walking');
        setRouteCoords(routeResult ? routeResult.coordinates : cleaned);
      } else {
        setRouteCoords(cleaned);
      }

      if (cleaned.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(cleaned, {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          });
        }, 300);
      }
    } catch (error) {
      console.log('Failed to load child history:', error);
      setPoints([]);
      setRouteCoords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setDropdownVisible(false);
  };

  const openFullscreen = () => {
    setFullscreenVisible(true);
    if (points.length > 0) {
      setTimeout(() => {
        fullscreenMapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
        });
      }, 300);
    }
  };

  const renderMapMarkers = () => (
    <>
      <Polyline coordinates={routeCoords} strokeColor={theme.colors.primary} strokeWidth={3} />
      {points.map((point, index) => {
        const isFirst = index === 0;
        const isLast = index === points.length - 1;
        const isSelected = selectedPointIndex === index;

        if (!isFirst && !isLast && !isSelected) {
          return (
            <Marker key={index} coordinate={point} onPress={() => setSelectedPointIndex(index)}>
              <View style={[styles.dotMarker, { backgroundColor: theme.colors.primary }]} />
            </Marker>
          );
        }

        return (
          <Marker key={index} coordinate={point} onPress={() => setSelectedPointIndex(index)}>
            <View
              style={[
                styles.pinMarker,
                { backgroundColor: theme.colors.primary },
                isFirst && { backgroundColor: theme.colors.success },
                isLast && { backgroundColor: theme.colors.danger },
              ]}
            >
              <Ionicons
                name={isFirst ? 'play' : isLast ? 'flag' : 'time-outline'}
                size={12}
                color="#fff"
              />
            </View>
            <View style={styles.timeLabel}>
              <Text style={styles.timeLabelText}>{formatTime(point.timestamp)}</Text>
            </View>
          </Marker>
        );
      })}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My History</Text>

        <View>
          <TouchableOpacity
            style={[styles.dateBtn, { backgroundColor: theme.colors.primaryLight }]}
            onPress={() => setDropdownVisible((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.dateBtnText, { color: theme.colors.primary }]}>
              {formatDateLabel(selectedDate)}
            </Text>
            <Ionicons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          {dropdownVisible && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              {getLast7Days().map((d, i) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dropdownItem,
                      isSelected && { backgroundColor: theme.colors.primaryLight },
                    ]}
                    onPress={() => handleSelectDate(d)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: isSelected ? theme.colors.primary : theme.colors.text },
                        isSelected && { fontWeight: '600' },
                      ]}
                    >
                      {formatDateLabel(d)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* ── Map card ── */}
      <View style={styles.mapWrapper}>
        {points.length > 0 ? (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              mapType={mapLayer}
              customMapStyle={theme.isDark && mapLayer === 'standard' ? darkMapStyle : []}
              initialRegion={{
                latitude: points[0].latitude,
                longitude: points[0].longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {renderMapMarkers()}
            </MapView>

            <TouchableOpacity style={styles.fullscreenBtn} onPress={openFullscreen} activeOpacity={0.8}>
              <Ionicons name="expand-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={26} color="#999" />
            <Text style={styles.mapPlaceholderText}>
              {loading ? 'Loading history...' : 'No movement recorded on this day'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Stops list ── */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        My stops ({points.length})
      </Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {points.map((point, index) => {
          const isFirst = index === 0;
          const isLast = index === points.length - 1;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.stopRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                selectedPointIndex === index && { borderColor: theme.colors.primary, borderWidth: 1.5 },
              ]}
              onPress={() => {
                setSelectedPointIndex(index);
                mapRef.current?.animateToRegion(
                  { ...point, latitudeDelta: 0.005, longitudeDelta: 0.005 },
                  400
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.stopIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons
                  name={isFirst ? 'play' : isLast ? 'flag' : 'location'}
                  size={14}
                  color={theme.colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.stopTime, { color: theme.colors.text }]}>
                  {formatTime(point.timestamp)}
                </Text>
                <Text style={[styles.stopCoords, { color: theme.colors.textMuted }]}>
                  {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                </Text>
              </View>

              <View style={styles.stopMeta}>
                {point.battery != null && (
                  <View style={styles.metaChip}>
                    <Ionicons
                      name={point.battery > 20 ? 'battery-half-outline' : 'battery-dead-outline'}
                      size={12}
                      color={point.battery > 20 ? theme.colors.textMuted : theme.colors.danger}
                    />
                    <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
                      {point.battery}%
                    </Text>
                  </View>
                )}
                {point.network && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          point.network === 'online' ? theme.colors.success : theme.colors.danger,
                      },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Fullscreen map modal ── */}
      <Modal visible={fullscreenVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <MapView
            ref={fullscreenMapRef}
            style={{ flex: 1 }}
            mapType={mapLayer}
            customMapStyle={theme.isDark && mapLayer === 'standard' ? darkMapStyle : []}
            initialRegion={
              points.length > 0
                ? {
                  latitude: points[0].latitude,
                  longitude: points[0].longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
                : undefined
            }
          >
            {points.length > 0 && renderMapMarkers()}
          </MapView>

          {/* Top controls */}
          <SafeAreaView style={styles.fullscreenTopBar} edges={['top']}>
            <TouchableOpacity
              style={styles.fullscreenControlBtn}
              onPress={() => setFullscreenVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullscreenControlBtn}
              onPress={() => setLayerPickerVisible((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name="layers-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Layer picker */}
          {layerPickerVisible && (
            <View style={styles.layerPicker}>
              {LAYERS.map((layer) => {
                const isSelected = mapLayer === layer.key;
                return (
                  <TouchableOpacity
                    key={layer.key}
                    style={[styles.layerOption, isSelected && styles.layerOptionSelected]}
                    onPress={() => {
                      setMapLayer(layer.key);
                      setLayerPickerVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={layer.icon}
                      size={16}
                      color={isSelected ? '#7C3AED' : '#fff'}
                    />
                    <Text style={[styles.layerOptionText, isSelected && { color: '#7C3AED' }]}>
                      {layer.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </Modal>
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
    zIndex: 20,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '500',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 160,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 6,
    zIndex: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginHorizontal: 4,
  },
  dropdownItemText: {
    fontSize: fontSize.sm,
  },
  mapWrapper: {
    marginHorizontal: spacing.xl,
    height: 220,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    color: '#999',
    fontSize: fontSize.sm,
  },
  dotMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  pinMarker: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  timeLabel: {
    position: 'absolute',
    top: -22,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  timeLabelText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  stopRow: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopTime: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  stopCoords: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  stopMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Fullscreen modal */
  fullscreenTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  fullscreenControlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerPicker: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: 14,
    paddingVertical: 6,
    width: 150,
    elevation: 10,
  },
  layerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  layerOptionSelected: {
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  layerOptionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});