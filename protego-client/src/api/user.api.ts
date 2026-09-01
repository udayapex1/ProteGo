import apiClient from './client';
import { User } from '../types/user.types';

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
};

export type UpdatedProfile = Pick<User, 'id' | 'name' | 'email' | 'role' | 'pairedWith' | 'isTwoFactorEnabled'>;

export const userApi = {
  getProfile: async () => {
    const { data } = await apiClient.get<User>('/user/profile');
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UpdatedProfile> => {
    const { data } = await apiClient.patch<UpdatedProfile>('/user/profile', payload);
    return data;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.delete('/user/account');
    return data;
  },
};
