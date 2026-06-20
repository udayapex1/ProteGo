import apiClient from './client';
import { LocationUpdatePayload } from '../types/location.types';

export const locationApi = {
  updateLocation: async (payload: LocationUpdatePayload) => {
    const { data } = await apiClient.post('/location/update', payload);
    return data;
  },

  syncBatch: async (locations: LocationUpdatePayload[]) => {
    const { data } = await apiClient.post('/location/sync-batch', { locations });
    return data;
  },

  getLatest: async (userId: string) => {
    const { data } = await apiClient.get(`/location/latest/${userId}`);
    return data;
  },

  getHistory: async (userId: string, hours: number = 24) => {
    const { data } = await apiClient.get(`/location/history/${userId}?hours=${hours}`);
    return data;
  },

  getSOSLocations: async (userId: string) => {
    const { data } = await apiClient.get(`/location/sos/${userId}`);
    return data;
  },
};