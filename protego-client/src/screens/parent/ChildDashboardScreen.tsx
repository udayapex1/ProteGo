import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { childApi } from '../../api/child.api';
import { ChildDashboardResponse } from '../../types/child.types';

export default function ChildDashboardScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const [dashboard, setDashboard] = useState<ChildDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      setError('');
      setDashboard(await childApi.getDashboard());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load the child dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const latest = dashboard?.latestLocation;
  const latestLocation = latest && 'location' in latest
    ? { latitude: latest.location.coordinates[1], longitude: latest.location.coordinates[0], timestamp: latest.createdAt }
    : latest;

  if (loading) {
    return <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.accent} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={theme.colors.accent} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}><Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>Family overview</Text><Text style={[styles.title, { color: theme.colors.text }]}>Child dashboard</Text></View>
          <TouchableOpacity onPress={() => loadDashboard(true)}><Ionicons name="refresh-outline" size={22} color={theme.colors.accent} /></TouchableOpacity>
        </View>

        {error ? <View style={[styles.errorCard, { backgroundColor: theme.colors.dangerLight }]}><Text style={{ color: theme.colors.danger }}>{error}</Text></View> : null}

        {dashboard && <>
          <View style={[styles.profileCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}><Text style={styles.avatarText}>{dashboard.child.name.slice(0, 2).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.childName, { color: theme.colors.text }]}>{dashboard.child.name}</Text><Text style={[styles.muted, { color: theme.colors.textMuted }]}>{dashboard.child.email}</Text><Text style={[styles.connected, { color: theme.colors.success }]}>{dashboard.pairing.isPaired ? '● Connected' : 'Not connected'}</Text></View>
          </View>

          <View style={styles.summaryGrid}>
            <Summary label="Location logs" value={dashboard.summary.locationCount} icon="navigate-outline" theme={theme} />
            <Summary label="SOS alerts" value={dashboard.summary.sosCount} icon="alert-circle-outline" theme={theme} danger />
            <Summary label="Active zones" value={dashboard.summary.activeGeofenceCount} icon="map-outline" theme={theme} />
          </View>

          <SectionTitle title="Latest location" theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {latestLocation ? <>
              <Row label="Coordinates" value={`${latestLocation.latitude.toFixed(5)}, ${latestLocation.longitude.toFixed(5)}`} theme={theme} />
              <Row label="Battery" value={`${latest?.battery ?? '--'}%`} theme={theme} />
              <Row label="Network" value={latest?.network ?? '--'} theme={theme} />
              <Row label="Updated" value={new Date(latestLocation.timestamp).toLocaleString()} theme={theme} />
            </> : <Text style={[styles.muted, { color: theme.colors.textMuted }]}>No location data available.</Text>}
          </View>

          <SectionTitle title={`SOS history (${dashboard.sosLogs.length})`} theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {dashboard.sosLogs.length ? dashboard.sosLogs.map((log, index) => <Row key={`${log.createdAt}-${index}`} label={new Date(log.createdAt).toLocaleString()} value={`${log.location.coordinates[1].toFixed(5)}, ${log.location.coordinates[0].toFixed(5)} · ${log.battery}%`} theme={theme} danger />) : <Text style={[styles.muted, { color: theme.colors.textMuted }]}>No SOS alerts recorded.</Text>}
          </View>

          <SectionTitle title={`Location history (${dashboard.locationHistory.length})`} theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {dashboard.locationHistory.length ? dashboard.locationHistory.map((log, index) => <Row key={`${log.createdAt}-${index}`} label={new Date(log.createdAt).toLocaleString()} value={`${log.location.coordinates[1].toFixed(5)}, ${log.location.coordinates[0].toFixed(5)}`} theme={theme} />) : <Text style={[styles.muted, { color: theme.colors.textMuted }]}>No location history recorded.</Text>}
          </View>

          <SectionTitle title={`Active zones (${dashboard.geofences.length})`} theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {dashboard.geofences.length ? dashboard.geofences.map(zone => <Row key={zone._id} label={zone.name} value={`${zone.radius}m radius`} theme={theme} />) : <Text style={[styles.muted, { color: theme.colors.textMuted }]}>No active zones.</Text>}
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ label, value, icon, theme, danger = false }: any) { return <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Ionicons name={icon} size={20} color={danger ? theme.colors.danger : theme.colors.accent} /><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{value}</Text><Text style={[styles.muted, { color: theme.colors.textMuted }]}>{label}</Text></View>; }
function SectionTitle({ title, theme }: any) { return <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>; }
function Row({ label, value, theme, danger = false }: any) { return <View style={[styles.row, { borderBottomColor: theme.colors.border }]}><Text style={[styles.rowLabel, { color: theme.colors.textMuted }]}>{label}</Text><Text style={[styles.rowValue, { color: danger ? theme.colors.danger : theme.colors.text }]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }, backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1 }, eyebrow: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }, title: { fontSize: 24, fontWeight: '700', marginTop: 3 },
  errorCard: { padding: 14, borderRadius: 12, marginBottom: 16 }, profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, borderWidth: 1 }, avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' }, childName: { fontSize: 19, fontWeight: '700' }, muted: { fontSize: 12, marginTop: 4 }, connected: { fontSize: 12, marginTop: 7, fontWeight: '600' }, summaryGrid: { flexDirection: 'row', gap: 8, marginTop: 12 }, summaryCard: { flex: 1, minHeight: 100, padding: 12, borderRadius: 14, borderWidth: 1 }, summaryValue: { fontSize: 23, fontWeight: '700', marginTop: 8 }, sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 10 }, card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 }, row: { paddingVertical: 13, borderBottomWidth: 1, gap: 5 }, rowLabel: { fontSize: 12 }, rowValue: { fontSize: 14, fontWeight: '600' },
});
