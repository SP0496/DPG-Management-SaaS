import Constants from 'expo-constants';
import { ApiResponse, AuthSessionData } from '../types/domain';

export class ApiClientError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface TokenStoreHooks {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensRefreshed: (session: AuthSessionData) => Promise<void> | void;
  onUnauthorizedPermanent: () => Promise<void> | void;
}

const DEFAULT_API_BASE_URL = 'http://10.0.2.2:8080/api/v1';

export function resolveApiBaseUrl(): string {
  const fromEnv =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
      ? process.env.EXPO_PUBLIC_API_BASE_URL
      : undefined;
  const fromConfig =
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? undefined;
  return (fromEnv || fromConfig || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

let tokenHooks: TokenStoreHooks | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function registerApiAuthHooks(hooks: TokenStoreHooks | null): void {
  tokenHooks = hooks;
}

async function performTokenRefresh(): Promise<string | null> {
  if (!tokenHooks) return null;
  const refreshToken = tokenHooks.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${resolveApiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          await tokenHooks?.onUnauthorizedPermanent();
          return null;
        }
        const json = (await res.json()) as ApiResponse<AuthSessionData>;
        if (!json?.success || !json.data?.accessToken) {
          await tokenHooks?.onUnauthorizedPermanent();
          return null;
        }
        await tokenHooks?.onTokensRefreshed(json.data);
        return json.data.accessToken;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false, retryOnUnauthorized = true } = options;
  const url = `${resolveApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (!skipAuth) {
    const accessToken = tokenHooks?.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, 'Unable to reach PG management server. Verify your connection.');
  }

  if (response.status === 401 && !skipAuth && retryOnUnauthorized) {
    const refreshedAccess = await performTokenRefresh();
    if (refreshedAccess) {
      return apiRequest<T>(path, { method, body, skipAuth: false, retryOnUnauthorized: false });
    }
  }

  const rawText = await response.text();
  let parsed: Record<string, unknown> | null = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const message =
      (parsed?.message as string | undefined) ||
      (parsed?.error as string | undefined) ||
      `Request failed with status ${response.status}`;
    const fieldErrors = parsed?.fieldErrors as Record<string, string> | undefined;
    throw new ApiClientError(response.status, message, fieldErrors);
  }

  if (!parsed) {
    return undefined as T;
  }

  if (Object.prototype.hasOwnProperty.call(parsed, 'data')) {
    return (parsed as unknown as ApiResponse<T>).data;
  }
  return parsed as unknown as T;
}

export async function apiTextRequest(
  path: string,
  options: { retryOnUnauthorized?: boolean; accept?: string } = {}
): Promise<string> {
  const { retryOnUnauthorized = true, accept = 'text/html' } = options;
  const url = `${resolveApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: accept };
  const accessToken = tokenHooks?.getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers });
  } catch {
    throw new ApiClientError(0, 'Unable to reach PG management server. Verify your connection.');
  }

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedAccess = await performTokenRefresh();
    if (refreshedAccess) {
      return apiTextRequest(path, { retryOnUnauthorized: false, accept });
    }
  }

  const rawText = await response.text();
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      message =
        (parsed?.message as string | undefined) ||
        (parsed?.error as string | undefined) ||
        message;
    } catch {
      // Keep status error message
    }
    throw new ApiClientError(response.status, message);
  }
  return rawText;
}

export async function apiBlobRequest(
  path: string,
  options: { retryOnUnauthorized?: boolean; accept?: string } = {}
): Promise<{ arrayBuffer: ArrayBuffer; contentType: string; filename: string }> {
  const { retryOnUnauthorized = true, accept = 'application/pdf' } = options;
  const url = `${resolveApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: accept };
  const accessToken = tokenHooks?.getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers });
  } catch {
    throw new ApiClientError(0, 'Unable to reach PG management server. Verify your connection.');
  }

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshedAccess = await performTokenRefresh();
    if (refreshedAccess) {
      return apiBlobRequest(path, { retryOnUnauthorized: false, accept });
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const parsed = (await response.json()) as Record<string, unknown>;
      message =
        (parsed?.message as string | undefined) ||
        (parsed?.error as string | undefined) ||
        message;
    } catch {
      // Keep status message
    }
    throw new ApiClientError(response.status, message);
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] ?? 'document.pdf';
  const arrayBuffer = await response.arrayBuffer();
  return {
    arrayBuffer,
    contentType: response.headers.get('content-type') ?? accept,
    filename,
  };
}

export function getAuthorizedApiUrl(path: string): { url: string; token: string | null } {
  return {
    url: `${resolveApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`,
    token: tokenHooks?.getAccessToken() ?? null,
  };
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && String(value) !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
  );
}
