const appStateListeners = new Set<(state: string) => void>();
const mockAppState = {
  currentState: 'active',
  addEventListener: jest.fn((event: string, handler: (state: string) => void) => {
    if (event === 'change') {
      appStateListeners.add(handler);
    }
    return {
      remove: jest.fn(() => {
        appStateListeners.delete(handler);
      }),
    };
  }),
  removeEventListener: jest.fn(),
  emit: (event: string, nextState: string) => {
    if (event === 'change') {
      mockAppState.currentState = nextState;
      appStateListeners.forEach((fn) => fn(nextState));
    }
  },
};

jest.mock('react-native/Libraries/AppState/AppState', () => mockAppState);

const secureMemoryStore: Record<string, string> = {};

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => secureMemoryStore[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureMemoryStore[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureMemoryStore[key];
  }),
  __resetStore: () => {
    Object.keys(secureMemoryStore).forEach((k) => delete secureMemoryStore[k]);
  },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'http://10.0.2.2:8080/api/v1',
      },
    },
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(inset);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    SafeAreaContext: SafeAreaInsetsContext,
    initialWindowMetrics: { frame, insets: inset },
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: unknown }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
  };
});

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));

const mockAuthInstance = {
  currentUser: null as null | { uid: string; getIdToken: jest.Mock },
};

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuthInstance),
  signInWithPhoneNumber: jest.fn(),
  verifyPhoneNumber: jest.fn(),
  signInWithCredential: jest.fn(),
  PhoneAuthProvider: {
    credential: jest.fn((verificationId: string, code: string) => ({
      verificationId,
      code,
      providerId: 'phone',
    })),
  },
  getIdToken: jest.fn(),
  signOut: jest.fn(async () => {
    mockAuthInstance.currentUser = null;
  }),
}));

jest.mock('@react-native-firebase/messaging', () => {
  return jest.fn(() => ({
    requestPermission: jest.fn(async () => 1),
    getToken: jest.fn(async () => null),
    onMessage: jest.fn(() => jest.fn()),
    onTokenRefresh: jest.fn(() => jest.fn()),
  }));
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1, 2]),
  getEnrolledLevelAsync: jest.fn(async () => 3),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  cancelAuthenticate: jest.fn(async () => {}),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
    SHA512: 'SHA-512',
  },
  digestStringAsync: jest.fn(async (_algo: string, str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }),
  randomUUID: jest.fn(() => 'mock-random-salt-uuid-1234'),
  getRandomBytesAsync: jest.fn(async (len: number) => new Uint8Array(len)),
}));

if (typeof globalThis.fetch !== 'function') {
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn();
}
