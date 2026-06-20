import apiClient from "./client";
import {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  LoginResponse,
} from "../types/user.types";

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post("/auth/login", payload);
    console.log(data)
    return data;
  },
  validateTwoFactor: async (
    userId: string,
    token: string,
  ): Promise<AuthResponse> => {
    const { data } = await apiClient.post("/auth/2fa/validate", {
      userId,
      token,
    });
    return data;
  },
   logout: async () => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  setupTwoFactor: async () => {
    const { data } = await apiClient.post('/auth/2fa/setup');
    return data;
  },

  enableTwoFactor: async (token: string) => {
    const { data } = await apiClient.post('/auth/2fa/enable', { token });
    return data;
  },
};
