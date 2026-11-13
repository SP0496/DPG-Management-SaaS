import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ApiClientError, registerApiAuthHooks } from '../api/apiClient';
import {
  fetchCurrentBackendUser,
  logoutBackendSession,
  updateMyAccountName,
  verifyFirebaseTokenWithBackend,
} from '../api/authApi';
import {
  confirmFirebaseOtpAndGetIdToken,
  PhoneConfirmationHandle,
  sendFirebasePhoneOtp,
  signOutFirebaseAuth,
} from '../services/firebasePhoneAuth';
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  saveStoredAuthSession,
} from '../services/sessionStorage';
import { clearAllLocalSecurity } from '../services/appSecurityService';
import { AuthSessionData, AuthUser } from '../types/domain';
import { isValidIndianMobile, isValidOtp } from '../utils/validation';

interface RequestOtpParams {
  phone: string;
  fullName?: string;
  inviteCode?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isBootstrapping: boolean;
  isSubmitting: boolean;
  isAuthenticated: boolean;
  pendingPhone: string | null;
  resendCooldown: number;
  authError: string | null;
  isNewUserSession: boolean;
  clearAuthError: () => void;
  requestOtp: (params: RequestOtpParams) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  updateAccountFullName: (fullName: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const RESEND_COUNTDOWN_SECONDS = 30;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractReadableError(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [pendingFullName, setPendingFullName] = useState<string | undefined>(undefined);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | undefined>(undefined);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isNewUserSession, setIsNewUserSession] = useState<boolean>(false);

  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const confirmationRef = useRef<PhoneConfirmationHandle | null>(null);

  const wipeLocalSession = useCallback(async () => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    confirmationRef.current = null;
    setUser(null);
    setPendingPhone(null);
    setPendingFullName(undefined);
    setPendingInviteCode(undefined);
    setIsNewUserSession(false);
    await clearStoredAuthSession();
  }, []);

  const persistSession = useCallback(async (session: AuthSessionData) => {
    accessTokenRef.current = session.accessToken;
    refreshTokenRef.current = session.refreshToken;
    setUser(session.user);
    setIsNewUserSession(Boolean(session.newUser));
    await saveStoredAuthSession(session);
  }, []);

  useEffect(() => {
    registerApiAuthHooks({
      getAccessToken: () => accessTokenRef.current,
      getRefreshToken: () => refreshTokenRef.current,
      onTokensRefreshed: async (session) => {
        await persistSession(session);
      },
      onUnauthorizedPermanent: async () => {
        await signOutFirebaseAuth();
        await wipeLocalSession();
      },
    });

    return () => {
      registerApiAuthHooks(null);
    };
  }, [persistSession, wipeLocalSession]);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const stored = await loadStoredAuthSession();
        if (!stored) {
          return;
        }
        accessTokenRef.current = stored.accessToken;
        refreshTokenRef.current = stored.refreshToken;
        // Re-verify identity and authoritative role with Spring Boot backend
        const verifiedUser = await fetchCurrentBackendUser();
        if (active) {
          setUser(verifiedUser);
          await saveStoredAuthSession({
            accessToken: accessTokenRef.current ?? stored.accessToken,
            refreshToken: refreshTokenRef.current ?? stored.refreshToken,
            user: verifiedUser,
          });
        }
      } catch {
        if (active) {
          await wipeLocalSession();
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [wipeLocalSession]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const requestOtp = useCallback(
    async ({ phone, fullName, inviteCode }: RequestOtpParams): Promise<boolean> => {
      const digits = phone.replace(/\D/g, '');
      if (!isValidIndianMobile(digits)) {
        setAuthError('Enter a valid 10-digit Indian mobile number starting with 6-9.');
        return false;
      }

      setAuthError(null);
      setIsSubmitting(true);
      try {
        const confirmation = await sendFirebasePhoneOtp(digits, false);
        confirmationRef.current = confirmation;
        setPendingPhone(digits);
        setPendingFullName(fullName?.trim() ? fullName.trim() : undefined);
        setPendingInviteCode(inviteCode?.trim() ? inviteCode.trim() : undefined);
        setResendCooldown(RESEND_COUNTDOWN_SECONDS);
        return true;
      } catch (error) {
        setAuthError(extractReadableError(error, 'Failed to send Firebase SMS OTP.'));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const resendOtp = useCallback(async (): Promise<boolean> => {
    if (!pendingPhone) {
      setAuthError('Enter your mobile number again to start a new OTP session.');
      return false;
    }
    if (resendCooldown > 0) {
      return false;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      const confirmation = await sendFirebasePhoneOtp(pendingPhone, true);
      confirmationRef.current = confirmation;
      setResendCooldown(RESEND_COUNTDOWN_SECONDS);
      return true;
    } catch (error) {
      setAuthError(extractReadableError(error, 'Failed to resend OTP. Please try again.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingPhone, resendCooldown]);

  const verifyOtp = useCallback(
    async (otp: string): Promise<boolean> => {
      const normalizedOtp = otp.trim();
      if (!isValidOtp(normalizedOtp)) {
        setAuthError('Enter the 6-digit verification code sent via SMS.');
        return false;
      }

      setAuthError(null);
      setIsSubmitting(true);
      try {
        const firebaseIdToken = await confirmFirebaseOtpAndGetIdToken(
          confirmationRef.current,
          normalizedOtp
        );
        const session = await verifyFirebaseTokenWithBackend({
          firebaseIdToken,
          fullName: pendingFullName,
          inviteCode: pendingInviteCode,
        });
        await persistSession(session);
        confirmationRef.current = null;
        setPendingPhone(null);
        setPendingFullName(undefined);
        setPendingInviteCode(undefined);
        return true;
      } catch (error) {
        setAuthError(
          extractReadableError(error, 'Unable to verify OTP or complete backend sign-in.')
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [pendingFullName, pendingInviteCode, persistSession]
  );

  const updateAccountFullName = useCallback(async (fullName: string): Promise<AuthUser> => {
    const updated = await updateMyAccountName(fullName);
    setUser(updated);
    if (accessTokenRef.current && refreshTokenRef.current) {
      await saveStoredAuthSession({
        accessToken: accessTokenRef.current,
        refreshToken: refreshTokenRef.current,
        user: updated,
      });
    }
    return updated;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await logoutBackendSession(refreshTokenRef.current);
      await signOutFirebaseAuth();
    } finally {
      await wipeLocalSession();
      await clearAllLocalSecurity();
      setAuthError(null);
      setIsSubmitting(false);
    }
  }, [wipeLocalSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isBootstrapping,
        isSubmitting,
        isAuthenticated: Boolean(user),
        pendingPhone,
        resendCooldown,
        authError,
        isNewUserSession,
        clearAuthError,
        requestOtp,
        resendOtp,
        verifyOtp,
        updateAccountFullName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
