/**
 * Secure Environment Configuration for Mobile Client.
 * Validates public environment configuration.
 * Never stores or exposes private API keys or server-side credentials.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8080/api/v1';
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';

export const ENV = {
  API_BASE_URL,
  APP_ENV,
  IS_PRODUCTION: APP_ENV === 'production',
  REQUEST_TIMEOUT_MS: 15000,
} as const;

// Security check: Warn in development if insecure HTTP is used in non-local environments
if (ENV.IS_PRODUCTION && !ENV.API_BASE_URL.startsWith('https://')) {
  console.error('[SECURITY CRITICAL] Insecure HTTP detected for production API endpoint!');
}
