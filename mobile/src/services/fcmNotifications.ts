import { Platform } from 'react-native';
import { pgApi } from '../api/pgApi';

type MessagingModule = () => {
  requestPermission?: () => Promise<number>;
  getToken?: () => Promise<string>;
  onMessage?: (cb: (remoteMessage: { data?: Record<string, string> }) => void) => () => void;
  onTokenRefresh?: (cb: (token: string) => void) => () => void;
};

let lastRegisteredToken: string | null = null;

function resolveMessagingModule(): MessagingModule | null {
  try {
    // Dynamic require prevents crash when native messaging module is absent (Expo Go / Jest)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-firebase/messaging');
    return (mod?.default ?? mod) as MessagingModule;
  } catch {
    return null;
  }
}

export async function syncFcmDeviceToken(): Promise<string | null> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return null;
  }
  const messagingFactory = resolveMessagingModule();
  if (!messagingFactory) {
    return null;
  }
  try {
    const messaging = messagingFactory();
    await messaging.requestPermission?.();
    const token = await messaging.getToken?.();
    if (!token) return null;
    lastRegisteredToken = token;
    await pgApi.registerDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    });
    return token;
  } catch {
    return null;
  }
}

export function subscribeForegroundPushUpdates(onPaymentOrInvoiceEvent: () => void): () => void {
  const messagingFactory = resolveMessagingModule();
  if (!messagingFactory) {
    return () => undefined;
  }
  try {
    const messaging = messagingFactory();
    const unsubMsg = messaging.onMessage?.(() => {
      onPaymentOrInvoiceEvent();
    });
    const unsubToken = messaging.onTokenRefresh?.((newToken: string) => {
      lastRegisteredToken = newToken;
      pgApi.registerDeviceToken({ token: newToken, platform: 'ANDROID' }).catch(() => undefined);
    });
    return () => {
      unsubMsg?.();
      unsubToken?.();
    };
  } catch {
    return () => undefined;
  }
}

export async function unregisterFcmDeviceToken(): Promise<void> {
  if (!lastRegisteredToken) return;
  const tok = lastRegisteredToken;
  lastRegisteredToken = null;
  await pgApi.deactivateDeviceToken(tok).catch(() => undefined);
}
