import apiClient from './client';
import { User } from '../types/user.types';

export const userApi = {
  getProfile: async () => {
    const { data } = await apiClient.get<User>('/user/profile');
    return data;
  },

  updateProfile: async (payload: { name: string }) => {
    const { data } = await apiClient.patch('/user/profile', payload);
    return data as Pick<User, 'id' | 'name' | 'email' | 'role'>;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.delete('/user/account');
    return data;
  },
};
