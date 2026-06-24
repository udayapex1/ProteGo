import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { locationApi } from '../api/location.api';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';

export const LOCATION_TASK_NAME = 'protego-background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.log('❌ Background location task error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const location = locations[0];

        if (location) {
            try {
                const batteryLevel = await Battery.getBatteryLevelAsync();
                const networkState = await Network.getNetworkStateAsync();

                await locationApi.updateLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    battery: Math.round(batteryLevel * 100),
                    network: networkState.isConnected ? 'online' : 'offline',
                    isSOS: false,
                    timestamp: new Date(location.timestamp).toISOString(),
                });

                console.log('📍 Background location sent:', location.coords);
            } catch (err) {
                console.log('❌ Failed to send background location:', err);
            }
        }
    }
});