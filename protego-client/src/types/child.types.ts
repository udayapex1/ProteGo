import { Geofence } from './location.types';
import { UserRole } from './user.types';

export interface ChildDashboardUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pairedWith: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
}

export interface ChildDashboardLocation {
  location: { type: 'Point'; coordinates: [number, number] };
  battery: number;
  network: 'online' | 'offline';
  isSOS?: boolean;
  createdAt: string;
}

export interface ChildDashboardResponse {
  generatedAt: string;
  child: ChildDashboardUser;
  pairing: { parentId: string; childId: string; isPaired: boolean };
  latestLocation: ChildDashboardLocation | {
    latitude: number;
    longitude: number;
    battery: number;
    network: 'online' | 'offline';
    isSOS: boolean;
    timestamp: string;
  } | null;
  locationHistory: ChildDashboardLocation[];
  sosLogs: Array<Pick<ChildDashboardLocation, 'location' | 'battery' | 'createdAt'>>;
  geofences: Geofence[];
  summary: {
    historyHours: number;
    locationCount: number;
    sosCount: number;
    activeGeofenceCount: number;
  };
}
