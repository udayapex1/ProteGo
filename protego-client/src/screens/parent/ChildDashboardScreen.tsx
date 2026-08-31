import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertCircle, ArrowLeft, Map, Navigation, RefreshCw } from 'lucide-react-native';
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
            <ArrowLeft size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}><Text style={[styles.eyebrow, { color: theme.colors.textMuted }]}>Family overview</Text><Text style={[styles.title, { color: theme.colors.text }]}>Child dashboard</Text></View>
          <TouchableOpacity onPress={() => loadDashboard(true)}><RefreshCw size={22} color={theme.colors.accent} /></TouchableOpacity>
        </View>

        {error ? <View style={[styles.errorCard, { backgroundColor: theme.colors.dangerLight }]}><Text style={{ color: theme.colors.danger }}>{error}</Text></View> : null}

        {dashboard && <>
          <View style={[styles.profileCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}><Text style={styles.avatarText}>{dashboard.child.name.slice(0, 2).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.childName, { color: theme.colors.text }]}>{dashboard.child.name}</Text><Text style={[styles.muted, { color: theme.colors.textMuted }]}>{dashboard.child.email}</Text><Text style={[styles.connected, { color: theme.colors.success }]}>{dashboard.pairing.isPaired ? '● Connected' : 'Not connected'}</Text></View>
          </View>

          <View style={styles.summaryGrid}>
            <Summary label="Location logs" value={dashboard.summary.locationCount} icon="navigation" theme={theme} />
            <Summary label="SOS alerts" value={dashboard.summary.sosCount} icon="alert" theme={theme} danger />
            <Summary label="Active zones" value={dashboard.summary.activeGeofenceCount} icon="map" theme={theme} />
          </View>

          <SectionTitle title="Activity overview" theme={theme} />
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Battery trend</Text>
            <Text style={[styles.muted, { color: theme.colors.textMuted }]}>Recent reported battery levels</Text>
            <BatteryChart history={dashboard.locationHistory} theme={theme} />
          </View>
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.chartHeader}><View><Text style={[styles.chartTitle, { color: theme.colors.text }]}>Location activity</Text><Text style={[styles.muted, { color: theme.colors.textMuted }]}>Updates over the last 7 days</Text></View><Text style={[styles.chartTotal, { color: theme.colors.accent }]}>{dashboard.summary.locationCount}</Text></View>
            <ActivityChart history={dashboard.locationHistory} theme={theme} />
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

function Summary({ label, value, icon, theme, danger = false }: any) { const Icon = icon === 'alert' ? AlertCircle : icon === 'map' ? Map : Navigation; return <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Icon size={20} color={danger ? theme.colors.danger : theme.colors.accent} /><Text style={[styles.summaryValue, { color: theme.colors.text }]}>{value}</Text><Text style={[styles.muted, { color: theme.colors.textMuted }]}>{label}</Text></View>; }
function SectionTitle({ title, theme }: any) { return <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>; }
function Row({ label, value, theme, danger = false }: any) { return <View style={[styles.row, { borderBottomColor: theme.colors.border }]}><Text style={[styles.rowLabel, { color: theme.colors.textMuted }]}>{label}</Text><Text style={[styles.rowValue, { color: danger ? theme.colors.danger : theme.colors.text }]}>{value}</Text></View>; }
function BatteryChart({ history, theme }: any) {
  const points = history.length > 12 ? history.filter((_: any, index: number) => index % Math.ceil(history.length / 12) === 0).slice(-12) : history;
  return <View style={styles.chartArea}>{points.length ? points.map((point: any, index: number) => <View key={`${point.createdAt}-${index}`} style={styles.barColumn}><View style={[styles.batteryBar, { height: `${Math.max(5, point.battery)}%`, backgroundColor: point.battery <= 20 ? theme.colors.danger : point.battery <= 50 ? '#F59E0B' : theme.colors.success }]} /><Text style={[styles.chartAxis, { color: theme.colors.textMuted }]}>{index === 0 || index === points.length - 1 ? `${point.battery}%` : ''}</Text></View>) : <Text style={[styles.muted, { color: theme.colors.textMuted }]}>No battery data available.</Text>}</View>;
}
function ActivityChart({ history, theme }: any) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, offset) => { const date = new Date(today); date.setHours(0, 0, 0, 0); date.setDate(today.getDate() - (6 - offset)); return date; });
  const counts = days.map(day => history.filter((entry: any) => new Date(entry.createdAt).toDateString() === day.toDateString()).length);
  const max = Math.max(...counts, 1);
  return <View style={styles.chartArea}>{counts.map((count, index) => <View key={days[index].toISOString()} style={styles.barColumn}><View style={[styles.activityBar, { height: `${Math.max(count ? 8 : 2, (count / max) * 100)}%`, backgroundColor: theme.colors.accent }]} /><Text style={[styles.chartAxis, { color: theme.colors.textMuted }]}>{days[index].toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }, backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, headerText: { flex: 1 }, eyebrow: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }, title: { fontSize: 24, fontWeight: '700', marginTop: 3 },
  errorCard: { padding: 14, borderRadius: 12, marginBottom: 16 }, profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, borderWidth: 1 }, avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' }, childName: { fontSize: 19, fontWeight: '700' }, muted: { fontSize: 12, marginTop: 4 }, connected: { fontSize: 12, marginTop: 7, fontWeight: '600' }, summaryGrid: { flexDirection: 'row', gap: 8, marginTop: 12 }, summaryCard: { flex: 1, minHeight: 100, padding: 12, borderRadius: 14, borderWidth: 1 }, summaryValue: { fontSize: 23, fontWeight: '700', marginTop: 8 }, chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 10 }, chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, chartTitle: { fontSize: 15, fontWeight: '700' }, chartTotal: { fontSize: 22, fontWeight: '700' }, chartArea: { height: 135, flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingTop: 18, marginTop: 10 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }, batteryBar: { width: '70%', minHeight: 4, borderRadius: 5 }, activityBar: { width: '60%', minHeight: 3, borderRadius: 5 }, chartAxis: { fontSize: 9 }, sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 10 }, card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 }, row: { paddingVertical: 13, borderBottomWidth: 1, gap: 5 }, rowLabel: { fontSize: 12 }, rowValue: { fontSize: 14, fontWeight: '600' },
});
