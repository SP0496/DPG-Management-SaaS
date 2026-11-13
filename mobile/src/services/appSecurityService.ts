import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURITY_CONFIG_KEY = 'pg_app_security_config_v1';
const PIN_CREDENTIAL_KEY = 'pg_app_pin_credential_v1';

export interface AppSecurityConfig {
  fingerprintEnabled: boolean;
  faceLockEnabled: boolean;
  pinEnabled: boolean;
  hasConfiguredLocalSecurity: boolean;
}

export interface StoredPinCredential {
  pinHash: string;
  pinSalt: string;
  pinLength: number;
  failedAttempts: number;
  lockedUntil: number | null;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportsFingerprint: boolean;
  supportsFace: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface PinVerifyResult {
  success: boolean;
  locked?: boolean;
  remainingAttempts?: number;
  remainingSeconds?: number;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

const DEFAULT_CONFIG: AppSecurityConfig = {
  fingerprintEnabled: false,
  faceLockEnabled: false,
  pinEnabled: false,
  hasConfiguredLocalSecurity: false,
};

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Best-effort secure persistence
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Best-effort delete
  }
}

export async function loadSecurityConfig(): Promise<AppSecurityConfig> {
  const raw = await getSecureItem(SECURITY_CONFIG_KEY);
  if (!raw) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(raw);
    return {
      fingerprintEnabled: Boolean(parsed.fingerprintEnabled),
      faceLockEnabled: Boolean(parsed.faceLockEnabled),
      pinEnabled: Boolean(parsed.pinEnabled),
      hasConfiguredLocalSecurity: Boolean(parsed.hasConfiguredLocalSecurity),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveSecurityConfig(config: AppSecurityConfig): Promise<void> {
  await setSecureItem(SECURITY_CONFIG_KEY, JSON.stringify(config));
}

export async function loadPinCredential(): Promise<StoredPinCredential | null> {
  const raw = await getSecureItem(PIN_CREDENTIAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPinCredential;
  } catch {
    return null;
  }
}

export async function savePinCredential(cred: StoredPinCredential): Promise<void> {
  await setSecureItem(PIN_CREDENTIAL_KEY, JSON.stringify(cred));
}

export async function deletePinCredential(): Promise<void> {
  await deleteSecureItem(PIN_CREDENTIAL_KEY);
}

export async function getDeviceBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const supportsFingerprint = supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT
    );
    const supportsFace = supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    );

    return {
      hasHardware,
      isEnrolled,
      supportsFingerprint,
      supportsFace,
      supportedTypes,
    };
  } catch {
    return {
      hasHardware: false,
      isEnrolled: false,
      supportsFingerprint: false,
      supportsFace: false,
      supportedTypes: [],
    };
  }
}

export function isValidAppPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin.trim());
}

export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}#pg-pin#${pin}`
  );
}

export async function createAndStorePin(
  pin: string,
  markConfigured: boolean = true
): Promise<boolean> {
  const cleaned = pin.trim();
  if (!isValidAppPin(cleaned)) {
    throw new Error('App PIN must be 4 to 6 digits.');
  }

  const salt = Crypto.randomUUID ? Crypto.randomUUID() : `salt_${Date.now()}_${Math.random()}`;
  const pinHash = await hashPinWithSalt(cleaned, salt);

  const cred: StoredPinCredential = {
    pinHash,
    pinSalt: salt,
    pinLength: cleaned.length,
    failedAttempts: 0,
    lockedUntil: null,
  };

  await savePinCredential(cred);

  const config = await loadSecurityConfig();
  await saveSecurityConfig({
    ...config,
    pinEnabled: true,
    hasConfiguredLocalSecurity: markConfigured ? true : config.hasConfiguredLocalSecurity,
  });

  return true;
}

export async function verifyAppPin(enteredPin: string): Promise<PinVerifyResult> {
  const cred = await loadPinCredential();
  if (!cred) {
    return { success: false, error: 'No Application PIN is configured.' };
  }

  const now = Date.now();
  if (cred.lockedUntil && now < cred.lockedUntil) {
    const remainingSeconds = Math.ceil((cred.lockedUntil - now) / 1000);
    return {
      success: false,
      locked: true,
      remainingSeconds,
      error: `PIN locked due to repeated incorrect attempts. Try again in ${remainingSeconds}s, or reset with Mobile OTP.`,
    };
  }

  const computedHash = await hashPinWithSalt(enteredPin.trim(), cred.pinSalt);
  if (computedHash === cred.pinHash) {
    // Reset lockout and failed count upon correct PIN
    if (cred.failedAttempts > 0 || cred.lockedUntil !== null) {
      cred.failedAttempts = 0;
      cred.lockedUntil = null;
      await savePinCredential(cred);
    }
    return { success: true };
  }

  // Increment failed attempts and calculate progressive lockout
  const newFailedAttempts = (cred.failedAttempts || 0) + 1;
  let newLockedUntil: number | null = null;
  let remainingSeconds = 0;

  if (newFailedAttempts >= 7) {
    // 5 minutes lockout after 7+ failed attempts
    newLockedUntil = now + 300 * 1000;
    remainingSeconds = 300;
  } else if (newFailedAttempts === 6) {
    // 60 seconds lockout after 6 failed attempts
    newLockedUntil = now + 60 * 1000;
    remainingSeconds = 60;
  } else if (newFailedAttempts >= 5) {
    // 30 seconds lockout after 5 failed attempts
    newLockedUntil = now + 30 * 1000;
    remainingSeconds = 30;
  }

  cred.failedAttempts = newFailedAttempts;
  cred.lockedUntil = newLockedUntil;
  await savePinCredential(cred);

  if (newLockedUntil) {
    return {
      success: false,
      locked: true,
      remainingSeconds,
      remainingAttempts: 0,
      error: `PIN locked due to repeated incorrect attempts. Try again in ${remainingSeconds}s, or reset with Mobile OTP.`,
    };
  }

  const remainingAttempts = Math.max(0, 5 - newFailedAttempts);
  return {
    success: false,
    locked: false,
    remainingAttempts,
    error: `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before temporary lockout.`,
  };
}

export async function changeAppPin(oldPin: string, newPin: string): Promise<boolean> {
  const verifyResult = await verifyAppPin(oldPin);
  if (!verifyResult.success) {
    throw new Error(verifyResult.error || 'Current PIN verification failed.');
  }
  return await createAndStorePin(newPin);
}

export async function resetAppPinDirectly(newPin: string): Promise<boolean> {
  return await createAndStorePin(newPin);
}

export async function disableAppPin(): Promise<void> {
  await deletePinCredential();
  const config = await loadSecurityConfig();
  await saveSecurityConfig({
    ...config,
    pinEnabled: false,
  });
}

export async function authenticateWithBiometrics(
  type: 'FINGERPRINT' | 'FACE'
): Promise<BiometricAuthResult> {
  const capabilities = await getDeviceBiometricCapabilities();
  if (!capabilities.hasHardware) {
    return {
      success: false,
      error: 'Biometric authentication hardware is not available on this device.',
    };
  }

  if (type === 'FINGERPRINT' && !capabilities.supportsFingerprint) {
    return {
      success: false,
      error: 'Fingerprint hardware is not supported on this device.',
    };
  }

  if (type === 'FACE' && !capabilities.supportsFace) {
    return {
      success: false,
      error: 'Face authentication is not supported on this device.',
    };
  }

  if (!capabilities.isEnrolled) {
    return {
      success: false,
      error: 'No biometric credentials enrolled in device security settings.',
    };
  }

  try {
    const promptMessage =
      type === 'FACE'
        ? 'Scan face to unlock PG Management'
        : 'Scan fingerprint to unlock PG Management';

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'weak',
    });

    if (result.success) {
      return { success: true };
    }

    if (result.error === 'user_cancel' || result.error === 'app_cancel') {
      return {
        success: false,
        cancelled: true,
        error: 'Authentication cancelled.',
      };
    }

    if (result.error === 'lockout') {
      return {
        success: false,
        error: 'Too many failed biometric attempts. Device biometrics temporarily locked.',
      };
    }

    return {
      success: false,
      error: result.error ? `Biometric authentication failed (${result.error}).` : 'Biometric verification failed.',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Biometric authentication error.';
    return { success: false, error: msg };
  }
}

export async function clearAllLocalSecurity(): Promise<void> {
  await deleteSecureItem(SECURITY_CONFIG_KEY);
  await deleteSecureItem(PIN_CREDENTIAL_KEY);
}
