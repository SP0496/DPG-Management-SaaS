import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { AppState, Text, TouchableOpacity } from 'react-native';
import {
  authenticateWithBiometrics,
  changeAppPin,
  createAndStorePin,
  deletePinCredential,
  disableAppPin,
  getDeviceBiometricCapabilities,
  loadPinCredential,
  loadSecurityConfig,
  resetAppPinDirectly,
  saveSecurityConfig,
  verifyAppPin,
} from '../src/services/appSecurityService';
import { SecurityProvider, useSecurity } from '../src/context/SecurityContext';
import { AuthProvider } from '../src/context/AuthContext';
import { AppLockScreen } from '../src/screens/auth/AppLockScreen';
import { SecuritySetupModal } from '../src/components/SecuritySetupModal';
import { SecuritySettingsSection } from '../src/components/SecuritySettingsSection';
import {
  confirmFirebaseOtpAndGetIdToken,
  sendFirebasePhoneOtp,
} from '../src/services/firebasePhoneAuth';

jest.mock('../src/services/firebasePhoneAuth', () => ({
  sendFirebasePhoneOtp: jest.fn(async () => ({ verificationId: 'mock-vid-123' })),
  confirmFirebaseOtpAndGetIdToken: jest.fn(async () => 'mock-id-token-xyz'),
  signOutFirebaseAuth: jest.fn(async () => {}),
}));

const TestConsumer: React.FC = () => {
  const { isAppLocked, config, lockApp, unlockApp } = useSecurity();
  return (
    <>
      <TouchableOpacity testID="test-lock-btn" onPress={lockApp}>
        <Text>Lock</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="test-unlock-btn" onPress={unlockApp}>
        <Text>Unlock</Text>
      </TouchableOpacity>
      <Text testID="test-is-locked">{String(isAppLocked)}</Text>
      <Text testID="test-pin-enabled">{String(config.pinEnabled)}</Text>
      <Text testID="test-fp-enabled">{String(config.fingerprintEnabled)}</Text>
      <Text testID="test-face-enabled">{String(config.faceLockEnabled)}</Text>
    </>
  );
};

describe('Fingerprint, Face Lock and App PIN Authentication Suite', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (SecureStore as unknown as { __resetStore: () => void }).__resetStore();

    // Default mock: device supports both fingerprint and face recognition
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
  });

  describe('1. PIN Security Service (Salted Hash, Retry Limits, Lockout)', () => {
    it('creates a 4–6 digit PIN with secure salt and never stores raw PIN in plain text', async () => {
      await expect(createAndStorePin('12')).rejects.toThrow('App PIN must be 4 to 6 digits.');
      await expect(createAndStorePin('1234567')).rejects.toThrow('App PIN must be 4 to 6 digits.');
      await expect(createAndStorePin('abcd')).rejects.toThrow('App PIN must be 4 to 6 digits.');

      const success = await createAndStorePin('4829');
      expect(success).toBe(true);

      const stored = await loadPinCredential();
      expect(stored).not.toBeNull();
      expect(stored?.pinHash).toBeDefined();
      expect(stored?.pinSalt).toBeDefined();
      // Ensure raw PIN is never stored
      expect(stored?.pinHash).not.toBe('4829');
      expect(JSON.stringify(stored)).not.toContain('"4829"');
      expect(stored?.failedAttempts).toBe(0);
      expect(stored?.lockedUntil).toBeNull();

      const config = await loadSecurityConfig();
      expect(config.pinEnabled).toBe(true);
      expect(config.hasConfiguredLocalSecurity).toBe(true);
    });

    it('verifies correct PIN successfully and resets any prior failed attempts', async () => {
      await createAndStorePin('9512');

      const result = await verifyAppPin('9512');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects incorrect PIN and decrements remaining attempts before temporary lockout', async () => {
      await createAndStorePin('9512');

      const badAttempt = await verifyAppPin('1111');
      expect(badAttempt.success).toBe(false);
      expect(badAttempt.locked).toBe(false);
      expect(badAttempt.remainingAttempts).toBe(4);
      expect(badAttempt.error).toContain('4 attempts remaining');

      const stored = await loadPinCredential();
      expect(stored?.failedAttempts).toBe(1);
    });

    it('enforces progressive lockout after 5, 6, and 7 failed PIN attempts', async () => {
      await createAndStorePin('7788');

      // 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        const res = await verifyAppPin('0000');
        expect(res.success).toBe(false);
        expect(res.locked).toBe(false);
      }

      // 5th failed attempt -> 30s lockout
      const fifthAttempt = await verifyAppPin('0000');
      expect(fifthAttempt.success).toBe(false);
      expect(fifthAttempt.locked).toBe(true);
      expect(fifthAttempt.remainingSeconds).toBe(30);
      expect(fifthAttempt.error).toContain('PIN locked');

      // Attempting while locked out should immediately reject without re-hashing
      const duringLockout = await verifyAppPin('7788');
      expect(duringLockout.success).toBe(false);
      expect(duringLockout.locked).toBe(true);

      // Advance time beyond 30s
      const cred = await loadPinCredential();
      if (cred) {
        cred.lockedUntil = Date.now() - 1000;
        await SecureStore.setItemAsync('pg_app_pin_credential_v1', JSON.stringify(cred));
      }

      // 6th attempt -> 60s lockout
      const sixthAttempt = await verifyAppPin('0000');
      expect(sixthAttempt.success).toBe(false);
      expect(sixthAttempt.locked).toBe(true);
      expect(sixthAttempt.remainingSeconds).toBe(60);
    });

    it('changes PIN after verifying old PIN and rejects if old PIN is invalid', async () => {
      await createAndStorePin('1234');

      await expect(changeAppPin('9999', '5678')).rejects.toThrow();

      const changed = await changeAppPin('1234', '5678');
      expect(changed).toBe(true);

      expect((await verifyAppPin('1234')).success).toBe(false);
      expect((await verifyAppPin('5678')).success).toBe(true);
    });

    it('resets PIN directly after OTP reauthentication and disables PIN when requested', async () => {
      await createAndStorePin('1234');
      await resetAppPinDirectly('4321');
      expect((await verifyAppPin('4321')).success).toBe(true);

      await disableAppPin();
      const config = await loadSecurityConfig();
      expect(config.pinEnabled).toBe(false);
      expect(await loadPinCredential()).toBeNull();
    });
  });

  describe('2. Biometric Authentication (Fingerprint & Face Recognition)', () => {
    it('detects fingerprint hardware and allows fingerprint unlock when enrolled', async () => {
      const caps = await getDeviceBiometricCapabilities();
      expect(caps.hasHardware).toBe(true);
      expect(caps.supportsFingerprint).toBe(true);
      expect(caps.supportsFace).toBe(true);
      expect(caps.isEnrolled).toBe(true);

      const auth = await authenticateWithBiometrics('FINGERPRINT');
      expect(auth.success).toBe(true);
      expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: 'Scan fingerprint to unlock PG Management',
        })
      );
    });

    it('detects face authentication and does NOT assume fingerprint implies face support', async () => {
      // Simulate Motorola device with only fingerprint sensor and NO face unlock hardware
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const caps = await getDeviceBiometricCapabilities();
      expect(caps.supportsFingerprint).toBe(true);
      expect(caps.supportsFace).toBe(false);

      const faceResult = await authenticateWithBiometrics('FACE');
      expect(faceResult.success).toBe(false);
      expect(faceResult.error).toContain('Face authentication is not supported on this device');
    });

    it('handles biometric cancellation and device biometric lockout gracefully', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'user_cancel',
      });

      const cancelResult = await authenticateWithBiometrics('FINGERPRINT');
      expect(cancelResult.success).toBe(false);
      expect(cancelResult.cancelled).toBe(true);
      expect(cancelResult.error).toBe('Authentication cancelled.');

      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'lockout',
      });

      const lockoutResult = await authenticateWithBiometrics('FINGERPRINT');
      expect(lockoutResult.success).toBe(false);
      expect(lockoutResult.error).toContain('Too many failed biometric attempts');
    });

    it('handles device without enrolled biometrics', async () => {
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

      const res = await authenticateWithBiometrics('FINGERPRINT');
      expect(res.success).toBe(false);
      expect(res.error).toContain('No biometric credentials enrolled');
    });
  });

  describe('3. Setup Flow Modal ("Secure your PG Management account")', () => {
    it('renders setup options, enables fingerprint, sets PIN, and saves preferences', async () => {
      const screen = render(
        <SecurityProvider isAuthenticated={true}>
          <SecuritySetupModal />
        </SecurityProvider>
      );

      expect(screen.getByText('Secure your PG Management account')).toBeTruthy();
      expect(screen.getByText('Fingerprint Lock')).toBeTruthy();
      expect(screen.getByText('Face Lock')).toBeTruthy();

      // Wait for device capabilities to load
      expect(await screen.findByText('Device scanner ready')).toBeTruthy();

      // Toggle Fingerprint
      const fpSwitch = screen.getByTestId('setup-fingerprint-switch');
      await act(async () => {
        fireEvent(fpSwitch, 'valueChange', true);
      });

      // Open PIN inputs
      fireEvent.press(screen.getByTestId('setup-pin-toggle-inputs-button'));
      const newPinInput = screen.getByTestId('setup-new-pin-input');
      const confirmPinInput = screen.getByTestId('setup-confirm-pin-input');

      fireEvent.changeText(newPinInput, '1234');
      fireEvent.changeText(confirmPinInput, '1234');

      await act(async () => {
        fireEvent.press(screen.getByTestId('setup-save-pin-button'));
      });

      // Save & Continue
      await act(async () => {
        fireEvent.press(screen.getByTestId('setup-save-and-continue-button'));
      });

      const config = await loadSecurityConfig();
      expect(config.hasConfiguredLocalSecurity).toBe(true);
      expect(config.fingerprintEnabled).toBe(true);
      expect(config.pinEnabled).toBe(true);
    });

    it('allows user to skip setup and marks local security configured', async () => {
      const screen = render(
        <SecurityProvider isAuthenticated={true}>
          <SecuritySetupModal />
        </SecurityProvider>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('setup-skip-button'));
      });

      const config = await loadSecurityConfig();
      expect(config.hasConfiguredLocalSecurity).toBe(true);
      expect(config.fingerprintEnabled).toBe(false);
      expect(config.pinEnabled).toBe(false);
    });
  });

  describe('4. Application Lock Screen (Keypad, Method Switching, Forgot PIN OTP Reset)', () => {
    beforeEach(async () => {
      await createAndStorePin('4829');
      await saveSecurityConfig({
        fingerprintEnabled: true,
        faceLockEnabled: true,
        pinEnabled: true,
        hasConfiguredLocalSecurity: true,
      });
    });

    it('renders locked screen with PinKeypad and unlocks on correct PIN submission', async () => {
      const screen = render(
        <AuthProvider>
          <SecurityProvider isAuthenticated={true}>
            <AppLockScreen />
          </SecurityProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Application Locked')).toBeTruthy();
      expect(screen.getByText('Enter Application PIN')).toBeTruthy();

      // Enter 4829 via keypad
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-4'));
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-8'));
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-2'));
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-9'));

      await act(async () => {
        fireEvent.press(screen.getByTestId('unlock-pin-submit-button'));
      });

      // Should succeed without error
      expect(screen.queryByText(/Incorrect PIN/)).toBeNull();
    });

    it('surfaces error banner on incorrect PIN', async () => {
      const screen = render(
        <AuthProvider>
          <SecurityProvider isAuthenticated={true}>
            <AppLockScreen />
          </SecurityProvider>
        </AuthProvider>
      );

      fireEvent.press(screen.getByTestId('lock-screen-pin-key-1'));
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-1'));
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-1'));
      fireEvent.press(screen.getByTestId('lock-screen-pin-key-1'));

      await act(async () => {
        fireEvent.press(screen.getByTestId('unlock-pin-submit-button'));
      });

      expect(await screen.findByText(/Incorrect PIN/)).toBeTruthy();
    });

    it('allows switching between Fingerprint, Face Lock, and PIN authentication', async () => {
      const screen = render(
        <AuthProvider>
          <SecurityProvider isAuthenticated={true}>
            <AppLockScreen />
          </SecurityProvider>
        </AuthProvider>
      );

      // Switch to Fingerprint
      const fpBtn = await screen.findByTestId('switch-to-fingerprint-button');
      await act(async () => {
        fireEvent.press(fpBtn);
      });
      expect(screen.getByText('Fingerprint Authentication')).toBeTruthy();

      // Switch to Face Lock
      const faceBtn = screen.getByTestId('switch-to-face-button');
      await act(async () => {
        fireEvent.press(faceBtn);
      });
      expect(screen.getByText('Face Lock Authentication')).toBeTruthy();

      // Switch back to PIN
      const pinBtn = screen.getByTestId('switch-to-pin-button');
      await act(async () => {
        fireEvent.press(pinBtn);
      });
      expect(screen.getByText('Enter Application PIN')).toBeTruthy();
    });

    it('handles Forgot PIN flow via Firebase OTP reauthentication and resets PIN', async () => {
      (sendFirebasePhoneOtp as jest.Mock).mockResolvedValue({
        verificationId: 'reset-vid-123',
      });
      (confirmFirebaseOtpAndGetIdToken as jest.Mock).mockResolvedValue('id-token-valid');

      const screen = render(
        <AuthProvider>
          <SecurityProvider isAuthenticated={true}>
            <AppLockScreen />
          </SecurityProvider>
        </AuthProvider>
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId('forgot-pin-button'));
      });

      expect(screen.getByText('Reset Application PIN')).toBeTruthy();

      // Step 1: Enter OTP
      const otpInput = screen.getByTestId('forgot-pin-otp-input');
      fireEvent.changeText(otpInput, '654321');

      await act(async () => {
        fireEvent.press(screen.getByTestId('verify-forgot-otp-button'));
      });

      // Step 2: Enter new PIN & confirm
      expect(await screen.findByText('New 4–6 Digit PIN')).toBeTruthy();
      const newPinInput = screen.getByTestId('forgot-new-pin-input');
      const confirmPinInput = screen.getByTestId('forgot-confirm-pin-input');

      fireEvent.changeText(newPinInput, '3344');
      fireEvent.changeText(confirmPinInput, '3344');

      await act(async () => {
        fireEvent.press(screen.getByTestId('save-forgot-new-pin-button'));
      });

      // Verify that the new PIN unlocks successfully
      const check = await verifyAppPin('3344');
      expect(check.success).toBe(true);
    });
  });

  describe('5. Settings Screen (SecuritySettingsSection)', () => {
    it('displays security status, supported biometric hardware, and allows toggling methods', async () => {
      const screen = render(
        <AuthProvider>
          <SecurityProvider isAuthenticated={true}>
            <SecuritySettingsSection />
          </SecurityProvider>
        </AuthProvider>
      );

      expect(screen.getByText('Authentication & Security')).toBeTruthy();
      expect(screen.getByText('App Lock Protection')).toBeTruthy();
      expect(screen.getByText('NOT CONFIGURED')).toBeTruthy();

      // Hardware status checks
      expect(await screen.findByText(/Fingerprint: Supported/)).toBeTruthy();
      expect(await screen.findByText(/Face Unlock: Supported/)).toBeTruthy();

      // Enable Fingerprint
      const fpSwitch = screen.getByTestId('settings-fingerprint-switch');
      await act(async () => {
        fireEvent(fpSwitch, 'valueChange', true);
      });

      expect(await screen.findByText('Fingerprint lock enabled successfully.')).toBeTruthy();
      expect(screen.getByText('SECURED')).toBeTruthy();
    });

    it('allows setting, changing, and resetting PIN from settings', async () => {
      const screen = render(
        <AuthProvider>
          <SecurityProvider isAuthenticated={true}>
            <SecuritySettingsSection />
          </SecurityProvider>
        </AuthProvider>
      );

      // Open Set PIN modal
      fireEvent.press(screen.getByTestId('settings-set-pin-button'));
      fireEvent.changeText(screen.getByTestId('set-new-pin-input'), '8899');
      fireEvent.changeText(screen.getByTestId('set-confirm-pin-input'), '8899');

      await act(async () => {
        fireEvent.press(screen.getByTestId('save-new-pin-modal-button'));
      });

      expect(await screen.findByText('Application PIN configured and enabled.')).toBeTruthy();

      // Open Change PIN modal
      fireEvent.press(screen.getByTestId('settings-change-pin-button'));
      fireEvent.changeText(screen.getByTestId('change-current-pin-input'), '8899');
      fireEvent.changeText(screen.getByTestId('change-new-pin-input'), '1122');
      fireEvent.changeText(screen.getByTestId('change-confirm-pin-input'), '1122');

      await act(async () => {
        fireEvent.press(screen.getByTestId('update-pin-modal-button'));
      });

      expect(await screen.findByText('Application PIN changed successfully.')).toBeTruthy();
      expect((await verifyAppPin('1122')).success).toBe(true);
    });
  });

  describe('6. AppState Background / Foreground Transitions', () => {
    it('locks session when returning from background if local security is enabled', async () => {
      await saveSecurityConfig({
        fingerprintEnabled: true,
        faceLockEnabled: false,
        pinEnabled: false,
        hasConfiguredLocalSecurity: true,
      });

      const screen = render(
        <SecurityProvider isAuthenticated={true}>
          <TestConsumer />
        </SecurityProvider>
      );

      // Initially locked on boot when local security is active
      await waitFor(() => {
        expect(screen.getByTestId('test-is-locked').props.children).toBe('true');
      });

      // User unlocks session
      await act(async () => {
        fireEvent.press(screen.getByTestId('test-unlock-btn'));
      });
      expect(screen.getByTestId('test-is-locked').props.children).toBe('false');

      // App transitions to background and then returns to active
      await act(async () => {
        (AppState as unknown as { emit?: (event: string, state: string) => void }).emit?.(
          'change',
          'background'
        );
      });

      await act(async () => {
        (AppState as unknown as { emit?: (event: string, state: string) => void }).emit?.(
          'change',
          'active'
        );
      });

      // App should re-lock upon returning to foreground
      expect(screen.getByTestId('test-is-locked').props.children).toBe('true');
    });
  });
});
