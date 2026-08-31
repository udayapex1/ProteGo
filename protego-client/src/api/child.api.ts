import apiClient from './client';
import { ChildDashboardResponse } from '../types/child.types';

export const childApi = {
  getDashboard: async (): Promise<ChildDashboardResponse> => {
    const { data } = await apiClient.get('/child/dashboard');
    return data;
  },
};
