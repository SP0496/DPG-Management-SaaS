import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'pg_mock_auth_session';

export const secureStorage = {
  async saveSession<T>(userData: T): Promise<void> {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(userData), {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      // Fallback safely in web or test environments without native keystore
    }
  },

  async getSession<T>(): Promise<T | null> {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      // Ignore safely in web/test environments
    }
  },
};
