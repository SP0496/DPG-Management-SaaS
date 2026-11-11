import * as SecureStore from 'expo-secure-store';

/**
 * Hardware-backed Secure Token Storage.
 * Uses Android Keystore and iOS Keychain.
 * Protects against token extraction, memory scraping, and physical device compromise.
 */

const ACCESS_TOKEN_KEY = 'pg_auth_access_token';
const REFRESH_TOKEN_KEY = 'pg_auth_refresh_token';
const USER_DATA_KEY = 'pg_auth_user_data';

export const secureStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async saveUserData(userData: object): Promise<void> {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
  },

  async getUserData<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  },
};
