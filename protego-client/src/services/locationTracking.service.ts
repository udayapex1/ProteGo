import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from './locationTask.service';

export const startBackgroundLocationTracking = async (): Promise<boolean> => {
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
            console.log('Foreground location permission denied');
            return false;
        }

        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
            console.log('Background location permission denied');
            return false;
        }

        const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isTaskRegistered) {
            console.log('Background tracking already running');
            return true;
        }

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000, // 30 seconds
            distanceInterval: 20, // ya 20 meter move hone par
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: 'Protego is tracking your location',
                notificationBody: 'This keeps your family updated on your location.',
                notificationColor: '#7A1CAC',
            },
        });

        console.log('✅ Background location tracking started');
        return true;
    } catch (error) {
        console.log('❌ Failed to start background tracking:', error);
        return false;
    }
};

export const stopBackgroundLocationTracking = async () => {
    try {
        const isTaskRegistered = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isTaskRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            console.log('🛑 Background location tracking stopped');
        }
    } catch (error) {
        console.log('Failed to stop background tracking:', error);
    }
};