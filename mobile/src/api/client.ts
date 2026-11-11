import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../config/env';
import { secureStorage } from '../utils/secureStorage';

/**
 * Hardened Axios HTTP Client.
 * Automatically injects hardware-stored JWT Bearer tokens and intercepts authentication errors.
 */

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and standardize error messages
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401) {
      // Clear compromised or expired tokens
      await secureStorage.clearAll();
    }

    // Standardize error message without leaking sensitive internal details
    const sanitizedMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'An unexpected network error occurred. Please try again.';

    return Promise.reject(new Error(sanitizedMessage));
  }
);
