import { apiRequest } from './apiClient';
import { AuthSessionData, AuthUser } from '../types/domain';

export async function verifyFirebaseTokenWithBackend(params: {
  firebaseIdToken: string;
  fullName?: string;
  inviteCode?: string;
}): Promise<AuthSessionData> {
  return apiRequest<AuthSessionData>('/auth/firebase/verify', {
    method: 'POST',
    skipAuth: true,
    body: {
      firebaseIdToken: params.firebaseIdToken,
      ...(params.fullName?.trim() ? { fullName: params.fullName.trim() } : {}),
      ...(params.inviteCode?.trim() ? { inviteCode: params.inviteCode.trim() } : {}),
    },
  });
}

export async function fetchCurrentBackendUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}

export async function updateMyAccountName(fullName: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/users/me', {
    method: 'PATCH',
    body: { fullName: fullName.trim() },
  });
}

export async function logoutBackendSession(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return;
  try {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      skipAuth: true,
      body: { refreshToken },
    });
  } catch {
    // Local token clearing proceeds even if server session is already revoked
  }
}
