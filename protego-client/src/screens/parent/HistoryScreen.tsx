import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { locationApi } from '../../api/location.api';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

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

interface HistoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Haversine — used to filter out points that haven't actually moved
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Collapses dense/duplicate points: keeps a point only if it's >25m from the
// last kept point, OR more than 5 minutes have passed (stationary check-in).
const downsamplePoints = (raw: any[]): HistoryPoint[] => {
  const cleaned: HistoryPoint[] = [];
  let lastKept: HistoryPoint | null = null;

  for (const doc of raw) {
    const point: HistoryPoint = {
      latitude: doc.location.coordinates[1],
      longitude: doc.location.coordinates[0],
      timestamp: doc.createdAt,
    };

    if (!lastKept) {
      cleaned.push(point);
      lastKept = point;
      continue;
    }

    const distance = getDistanceMeters(
      lastKept.latitude,
      lastKept.longitude,
      point.latitude,
      point.longitude
    );
    const minutesSinceLastKept =
      (new Date(point.timestamp).getTime() - new Date(lastKept.timestamp).getTime()) / 60000;

    if (distance > 25 || minutesSinceLastKept > 5) {
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
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  const loadHistory = async () => {
    if (!user?.pairedWith) return;
    setLoading(true);
    setSelectedPointIndex(null);

    try {
      // hours param: how far back from "now" — calculate from selectedDate's start to now
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const hoursAgo = Math.ceil((Date.now() - startOfDay.getTime()) / (1000 * 60 * 60));
      const cappedHours = Math.min(hoursAgo, 168); // backend's 7-day max

      const raw = await locationApi.getHistory(user.pairedWith, cappedHours);

      // Filter to only the selected day, then downsample
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

      if (cleaned.length > 0 && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(cleaned, {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          });
        }, 300);
      }
    } catch (error) {
      console.log('Failed to load history:', error);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
    if (Platform.OS === 'android') setShowPicker(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>History</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.dateBtnText}>{formatDateLabel(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          maximumDate={new Date()}
          minimumDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
          onChange={onDateChange}
        />
      )}

      <View style={styles.mapWrapper}>
        {points.length > 0 ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            customMapStyle={theme.isDark ? darkMapStyle : []}
            initialRegion={{
              latitude: points[0].latitude,
              longitude: points[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Polyline
              coordinates={points}
              strokeColor={colors.primary}
              strokeWidth={3}
            />

            {points.map((point, index) => {
              const isFirst = index === 0;
              const isLast = index === points.length - 1;
              const isSelected = selectedPointIndex === index;

              if (!isFirst && !isLast && !isSelected) {
                // small dot for intermediate points
                return (
                  <Marker
                    key={index}
                    coordinate={point}
                    onPress={() => setSelectedPointIndex(index)}
                  >
                    <View style={styles.dotMarker} />
                  </Marker>
                );
              }

              return (
                <Marker
                  key={index}
                  coordinate={point}
                  onPress={() => setSelectedPointIndex(index)}
                >
                  <View
                    style={[
                      styles.pinMarker,
                      isFirst && styles.pinStart,
                      isLast && styles.pinEnd,
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
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={26} color="#999" />
            <Text style={styles.mapPlaceholderText}>
              {loading ? 'Loading history...' : 'No location data for this day'}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Stops ({points.length})
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {points.map((point, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.stopRow,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              selectedPointIndex === index && styles.stopRowSelected,
            ]}
            onPress={() => {
              setSelectedPointIndex(index);
              mapRef.current?.animateToRegion(
                { ...point, latitudeDelta: 0.005, longitudeDelta: 0.005 },
                400
              );
            }}
          >
            <View style={styles.stopIcon}>
              <Ionicons
                name={
                  index === 0 ? 'play' : index === points.length - 1 ? 'flag' : 'location'
                }
                size={14}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.stopTime, { color: theme.colors.text }]}>
              {formatTime(point.timestamp)}
            </Text>
            <Text style={[styles.stopCoords, { color: theme.colors.textMuted }]}>
              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
            </Text>
          </TouchableOpacity>
        ))}
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
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateBtnText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '500',
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
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  pinMarker: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinStart: {
    backgroundColor: colors.success,
  },
  pinEnd: {
    backgroundColor: colors.danger,
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
    color: '#000',
    fontSize: fontSize.md,
    fontWeight: '500',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  stopRow: {
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
  stopRowSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopTime: {
    color: '#000',
    fontSize: fontSize.sm,
    fontWeight: '500',
    width: 60,
  },
  stopCoords: {
    color: '#aaa',
    fontSize: fontSize.xs,
    flex: 1,
  },
});