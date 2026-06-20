export interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  battery: number;
  network: 'online' | 'offline';
  isSOS?: boolean;
  timestamp?: string;
}

export interface LocationData {
  userId: string;
  latitude: number;
  longitude: number;
  battery: number;
  network: 'online' | 'offline';
  isSOS: boolean;
  timestamp: string;
}

export interface Geofence {
  _id: string;
  parentId: string;
  childId: string;
  name: string;
  center: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  radius: number;
  isActive: boolean;
}

export interface GeofenceBreachPayload {
  childId: string;
  geofenceId: string;
  geofenceName: string;
  type: 'enter' | 'exit';
  latitude: number;
  longitude: number;
  timestamp: number;
}