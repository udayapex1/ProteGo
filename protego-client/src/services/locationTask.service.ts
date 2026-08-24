import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { locationApi } from '../api/location.api';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';

export const LOCATION_TASK_NAME = 'protego-background-location-task';

// module-level guard — persists as long as the JS engine instance is alive
let lastSentTimestamp: number | null = null;

const getBatteryPercentage = async (): Promise<number> => {
    const level = await Battery.getBatteryLevelAsync();

    // Expo returns -1 when the platform cannot provide a battery level. Do not
    // send that value to the API because the server correctly only accepts 0–100.
    if (!Number.isFinite(level) || level < 0 || level > 1) {
        console.warn('⚠️ Battery level unavailable; sending 0% as the safe telemetry fallback.', { level });
        return 0;
    }

    return Math.round(level * 100);
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.log('❌ Background location task error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];

        if (location) {
            // Skip if we already sent this exact GPS timestamp
            if (lastSentTimestamp === location.timestamp) {
                console.log('⏭️ Duplicate location fix skipped:', location.timestamp);
                return;
            }
            lastSentTimestamp = location.timestamp;

            try {
                const battery = await getBatteryPercentage();
                const networkState = await Network.getNetworkStateAsync();

                console.log('📤 Child telemetry sending:', {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    battery,
                    network: networkState.isConnected ? 'online' : 'offline',
                    timestamp: new Date(location.timestamp).toISOString(),
                });

                const savedLocation = await locationApi.updateLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    battery,
                    network: networkState.isConnected ? 'online' : 'offline',
                    isSOS: false,
                    timestamp: new Date(location.timestamp).toISOString(),
                });

                console.log('✅ Child telemetry accepted by server:', {
                    id: savedLocation?._id,
                    battery: savedLocation?.battery,
                    timestamp: savedLocation?.createdAt,
                });
            } catch (err) {
                console.log('❌ Failed to send background location:', err);
            }
        }
    }
});
