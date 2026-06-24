import apiClient from "./client";
import {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  LoginResponse,
} from "../types/user.types";

const getRegisterLogPayload = ({ password, ...safePayload }: RegisterPayload) => ({
  ...safePayload,
  password: password ? "[REDACTED]" : "",
});

const getLoginLogPayload = ({ password, ...safePayload }: LoginPayload) => ({
  ...safePayload,
  password: password ? "[REDACTED]" : "",
});

const getAuthResponseLogPayload = (data: AuthResponse) => ({
  user: data.user,
  hasAccessToken: Boolean(data.accessToken),
  hasRefreshToken: Boolean(data.refreshToken),
});

const getLoginResponseLogPayload = (data: LoginResponse) => {
  if (data.requiresTwoFactor) {
    return {
      requiresTwoFactor: true,
      userId: data.userId,
    };
  }

  return getAuthResponseLogPayload(data);
};

const getAuthErrorLogPayload = (error: any) => ({
  status: error.response?.status,
  message: error.response?.data?.message || error.message,
  data: error.response?.data,
});

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    console.log("[authApi.register] POST /auth/register", getRegisterLogPayload(payload));

    try {
      const { data } = await apiClient.post("/auth/register", payload);
      console.log("[authApi.register] success", getAuthResponseLogPayload(data));
      return data;
    } catch (error: any) {
      console.error("[authApi.register] failed", getAuthErrorLogPayload(error));
      throw error;
    }
  },
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    console.log("[authApi.login] POST /auth/login", getLoginLogPayload(payload));

    try {
      const { data } = await apiClient.post("/auth/login", payload);
      console.log("[authApi.login] success", getLoginResponseLogPayload(data));
      return data;
    } catch (error: any) {
      console.error("[authApi.login] failed", getAuthErrorLogPayload(error));
      throw error;
    }
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
