import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthSessionData, AuthUser } from '../types/domain';

const SESSION_KEY = 'pg_management_verified_session_v1';

export interface StoredAuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function saveStoredAuthSession(session: AuthSessionData | StoredAuthSession): Promise<void> {
  const payload: StoredAuthSession = {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
  };
  const serialized = JSON.stringify(payload);
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, serialized);
}

export async function loadStoredAuthSession(): Promise<StoredAuthSession | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(SESSION_KEY);
    } else {
      raw = await SecureStore.getItemAsync(SESSION_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthSession;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearStoredAuthSession(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Best-effort local session wipe
  }
}
