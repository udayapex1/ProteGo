import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const redactDebugData = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactDebugData);
  }

  return Object.entries(data).reduce<Record<string, unknown>>((result, [key, value]) => {
    const normalizedKey = key.toLowerCase();
    const shouldRedact =
      normalizedKey.includes('password') ||
      normalizedKey.includes('token') ||
      normalizedKey.includes('authorization');

    result[key] = shouldRedact ? '[REDACTED]' : redactDebugData(value);
    return result;
  }, {});
};

// Request interceptor — har request mein token attach karo
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('[apiClient.request]', {
    method: config.method?.toUpperCase(),
    baseURL: config.baseURL,
    url: config.url,
    hasAuthToken: Boolean(token),
    data: redactDebugData(config.data),
  });

  return config;
});

// Response interceptor — token expire hone pe refresh karo
apiClient.interceptors.response.use(
  (response) => {
    console.log('[apiClient.response]', {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      data: redactDebugData(response.data),
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('[apiClient.error]', {
      status: error.response?.status,
      url: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message,
      data: redactDebugData(error.response?.data),
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        console.log('[apiClient.refresh] attempting token refresh', {
          hasRefreshToken: Boolean(refreshToken),
        });

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        await AsyncStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        console.log('[apiClient.refresh] success');

        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[apiClient.refresh] failed', {
          message: refreshError instanceof Error ? refreshError.message : 'Unknown refresh error',
        });
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // Navigate to login — context se handle karenge
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
