import apiClient from './client';
import { Geofence, GeofenceBreachPayload } from '../types/location.types';

interface CreateGeofencePayload {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export const geofenceApi = {
  create: async (payload: CreateGeofencePayload): Promise<Geofence> => {
    const { data } = await apiClient.post('/geofence/create', payload);
    return data;
  },
  update: async (id: string, payload: { name: string; latitude: number; longitude: number; radius: number }) => {
    const { data } = await apiClient.put(`/geofence/${id}`, payload);
    return data;
  },

  getParentZones: async (): Promise<Geofence[]> => {
    const { data } = await apiClient.get('/geofence/parent');
    return data;
  },

  getChildZones: async (): Promise<Geofence[]> => {
    const { data } = await apiClient.get('/geofence/child');
    return data;
  },

  deactivate: async (id: string) => {
    const { data } = await apiClient.delete(`/geofence/${id}`);
    return data;
  },

  handleBreach: async (payload: GeofenceBreachPayload) => {
    const { data } = await apiClient.post('/geofence/breach', payload);
    return data;
  },
};