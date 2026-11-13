import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  AppSecurityConfig,
  authenticateWithBiometrics,
  BiometricAuthResult,
  BiometricCapabilities,
  changeAppPin,
  clearAllLocalSecurity,
  createAndStorePin,
  disableAppPin,
  getDeviceBiometricCapabilities,
  loadPinCredential,
  loadSecurityConfig,
  PinVerifyResult,
  resetAppPinDirectly,
  saveSecurityConfig,
  verifyAppPin,
} from '../services/appSecurityService';

interface SecurityContextValue {
  capabilities: BiometricCapabilities;
  config: AppSecurityConfig;
  isAppLocked: boolean;
  lockoutRemainingSeconds: number;
  hasLocalSecurityEnabled: boolean;
  refreshSecurityState: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<PinVerifyResult>;
  unlockWithBiometric: (type: 'FINGERPRINT' | 'FACE') => Promise<BiometricAuthResult>;
  enableFingerprint: () => Promise<{ success: boolean; error?: string }>;
  disableFingerprint: () => Promise<void>;
  enableFaceLock: () => Promise<{ success: boolean; error?: string }>;
  disableFaceLock: () => Promise<void>;
  savePin: (pin: string, markConfigured?: boolean) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  disablePin: () => Promise<void>;
  resetPinAfterOtp: (newPin: string) => Promise<boolean>;
  skipSetup: () => Promise<void>;
  completeSetup: (newConfig: Partial<AppSecurityConfig>) => Promise<void>;
  lockApp: () => void;
  unlockApp: () => void;
  resetAllSecurity: () => Promise<void>;
}

const DEFAULT_CAPABILITIES: BiometricCapabilities = {
  hasHardware: false,
  isEnrolled: false,
  supportsFingerprint: false,
  supportsFace: false,
  supportedTypes: [],
};

const DEFAULT_CONFIG: AppSecurityConfig = {
  fingerprintEnabled: false,
  faceLockEnabled: false,
  pinEnabled: false,
  hasConfiguredLocalSecurity: false,
};

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

export const SecurityProvider: React.FC<{
  children: ReactNode;
  isAuthenticated: boolean;
}> = ({ children, isAuthenticated }) => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>(DEFAULT_CAPABILITIES);
  const [config, setConfig] = useState<AppSecurityConfig>(DEFAULT_CONFIG);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  const lastBackgroundTime = useRef<number | null>(null);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasLocalSecurityEnabled =
    config.fingerprintEnabled || config.faceLockEnabled || config.pinEnabled;

  const refreshSecurityState = useCallback(async () => {
    try {
      const [caps, conf, pinCred] = await Promise.all([
        getDeviceBiometricCapabilities(),
        loadSecurityConfig(),
        loadPinCredential(),
      ]);

      setCapabilities(caps);
      setConfig(conf);

      // Check existing PIN lockout status
      if (pinCred?.lockedUntil && pinCred.lockedUntil > Date.now()) {
        const remaining = Math.ceil((pinCred.lockedUntil - Date.now()) / 1000);
        setLockoutRemainingSeconds(remaining);
      } else {
        setLockoutRemainingSeconds(0);
      }
    } catch {
      // Fallback safely
    }
  }, []);

  // Initialize capabilities and security config
  useEffect(() => {
    refreshSecurityState();
  }, [refreshSecurityState]);

  // Lock session when user is authenticated with local security active on app start
  useEffect(() => {
    if (isAuthenticated && hasLocalSecurityEnabled) {
      setIsAppLocked(true);
    } else {
      setIsAppLocked(false);
    }
  }, [isAuthenticated, hasLocalSecurityEnabled]);

  // Handle PIN lockout countdown timer
  useEffect(() => {
    if (lockoutRemainingSeconds <= 0) {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
      return;
    }

    lockoutTimerRef.current = setInterval(() => {
      setLockoutRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, [lockoutRemainingSeconds]);

  // AppState background/foreground listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lastBackgroundTime.current = Date.now();
      } else if (nextAppState === 'active') {
        if (isAuthenticated && hasLocalSecurityEnabled) {
          setIsAppLocked(true);
        }
        refreshSecurityState();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, hasLocalSecurityEnabled, refreshSecurityState]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<PinVerifyResult> => {
      const result = await verifyAppPin(pin);
      if (result.success) {
        setIsAppLocked(false);
        setLockoutRemainingSeconds(0);
      } else if (result.locked && result.remainingSeconds) {
        setLockoutRemainingSeconds(result.remainingSeconds);
      }
      return result;
    },
    []
  );

  const unlockWithBiometric = useCallback(
    async (type: 'FINGERPRINT' | 'FACE'): Promise<BiometricAuthResult> => {
      const result = await authenticateWithBiometrics(type);
      if (result.success) {
        setIsAppLocked(false);
      }
      return result;
    },
    []
  );

  const enableFingerprint = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!capabilities.hasHardware || !capabilities.supportsFingerprint) {
      return { success: false, error: 'Fingerprint hardware is not available on this device.' };
    }
    if (!capabilities.isEnrolled) {
      return { success: false, error: 'No fingerprint enrolled. Please enroll in Android Security Settings.' };
    }

    // Verify biometric once to confirm authorization
    const authResult = await authenticateWithBiometrics('FINGERPRINT');
    if (!authResult.success) {
      return { success: false, error: authResult.error || 'Fingerprint verification failed.' };
    }

    const current = await loadSecurityConfig();
    const updated: AppSecurityConfig = {
      ...current,
      fingerprintEnabled: true,
    };
    await saveSecurityConfig(updated);
    setConfig(updated);
    return { success: true };
  }, [capabilities]);

  const disableFingerprint = useCallback(async () => {
    const current = await loadSecurityConfig();
    const updated: AppSecurityConfig = {
      ...current,
      fingerprintEnabled: false,
    };
    await saveSecurityConfig(updated);
    setConfig(updated);
  }, []);

  const enableFaceLock = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!capabilities.hasHardware || !capabilities.supportsFace) {
      return { success: false, error: 'Face authentication hardware is not available on this device.' };
    }
    if (!capabilities.isEnrolled) {
      return { success: false, error: 'No face data enrolled. Please enroll in Android Security Settings.' };
    }

    const authResult = await authenticateWithBiometrics('FACE');
    if (!authResult.success) {
      return { success: false, error: authResult.error || 'Face verification failed.' };
    }

    const current = await loadSecurityConfig();
    const updated: AppSecurityConfig = {
      ...current,
      faceLockEnabled: true,
    };
    await saveSecurityConfig(updated);
    setConfig(updated);
    return { success: true };
  }, [capabilities]);

  const disableFaceLock = useCallback(async () => {
    const current = await loadSecurityConfig();
    const updated: AppSecurityConfig = {
      ...current,
      faceLockEnabled: false,
    };
    await saveSecurityConfig(updated);
    setConfig(updated);
  }, []);

  const savePin = useCallback(
    async (pin: string, markConfigured: boolean = true): Promise<boolean> => {
      await createAndStorePin(pin, markConfigured);
      const current = await loadSecurityConfig();
      const updated: AppSecurityConfig = {
        ...current,
        pinEnabled: true,
        hasConfiguredLocalSecurity: markConfigured ? true : current.hasConfiguredLocalSecurity,
      };
      await saveSecurityConfig(updated);
      setConfig(updated);
      return true;
    },
    []
  );

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const success = await changeAppPin(oldPin, newPin);
    await refreshSecurityState();
    return success;
  }, [refreshSecurityState]);

  const disablePin = useCallback(async () => {
    await disableAppPin();
    const current = await loadSecurityConfig();
    const updated: AppSecurityConfig = {
      ...current,
      pinEnabled: false,
    };
    await saveSecurityConfig(updated);
    setConfig(updated);
    await refreshSecurityState();
  }, [refreshSecurityState]);

  const resetPinAfterOtp = useCallback(async (newPin: string): Promise<boolean> => {
    const success = await resetAppPinDirectly(newPin);
    setIsAppLocked(false);
    setLockoutRemainingSeconds(0);
    await refreshSecurityState();
    return success;
  }, [refreshSecurityState]);

  const skipSetup = useCallback(async () => {
    const current = await loadSecurityConfig();
    const updated: AppSecurityConfig = {
      ...current,
      hasConfiguredLocalSecurity: true,
    };
    await saveSecurityConfig(updated);
    setConfig(updated);
  }, []);

  const completeSetup = useCallback(
    async (newConfig: Partial<AppSecurityConfig>) => {
      const current = await loadSecurityConfig();
      const updated: AppSecurityConfig = {
        ...current,
        ...newConfig,
        hasConfiguredLocalSecurity: true,
      };
      await saveSecurityConfig(updated);
      setConfig(updated);
    },
    []
  );

  const lockApp = useCallback(() => {
    if (hasLocalSecurityEnabled) {
      setIsAppLocked(true);
    }
  }, [hasLocalSecurityEnabled]);

  const unlockApp = useCallback(() => {
    setIsAppLocked(false);
  }, []);

  const resetAllSecurity = useCallback(async () => {
    await clearAllLocalSecurity();
    setConfig({ ...DEFAULT_CONFIG });
    setIsAppLocked(false);
    setLockoutRemainingSeconds(0);
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        capabilities,
        config,
        isAppLocked,
        lockoutRemainingSeconds,
        hasLocalSecurityEnabled,
        refreshSecurityState,
        unlockWithPin,
        unlockWithBiometric,
        enableFingerprint,
        disableFingerprint,
        enableFaceLock,
        disableFaceLock,
        savePin,
        changePin,
        disablePin,
        resetPinAfterOtp,
        skipSetup,
        completeSetup,
        lockApp,
        unlockApp,
        resetAllSecurity,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export function useSecurity(): SecurityContextValue {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used inside SecurityProvider');
  }
  return ctx;
}
