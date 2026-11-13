import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { ErrorBanner } from '../../components/ErrorBanner';
import { PinKeypad } from '../../components/PinKeypad';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
import {
  confirmFirebaseOtpAndGetIdToken,
  sendFirebasePhoneOtp,
} from '../../services/firebasePhoneAuth';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { isValidAppPin } from '../../services/appSecurityService';
import { isValidOtp } from '../../utils/validation';

export const AppLockScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    config,
    capabilities,
    lockoutRemainingSeconds,
    unlockWithPin,
    unlockWithBiometric,
    resetPinAfterOtp,
  } = useSecurity();

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Determine initial active unlock method
  const [activeMethod, setActiveMethod] = useState<'PIN' | 'FINGERPRINT' | 'FACE'>(() => {
    if (config.pinEnabled) return 'PIN';
    if (config.fingerprintEnabled) return 'FINGERPRINT';
    if (config.faceLockEnabled) return 'FACE';
    return 'PIN';
  });

  // Forgot PIN OTP flow states
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [forgotStep, setForgotStep] = useState<'OTP' | 'NEW_PIN'>('OTP');
  const [forgotOtpHandle, setForgotOtpHandle] = useState<unknown>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);

  // Trigger biometric prompt on mount if biometric is primary
  useEffect(() => {
    if (activeMethod === 'FINGERPRINT' && config.fingerprintEnabled) {
      handleBiometricAuth('FINGERPRINT');
    } else if (activeMethod === 'FACE' && config.faceLockEnabled) {
      handleBiometricAuth('FACE');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBiometricAuth = async (type: 'FINGERPRINT' | 'FACE') => {
    setErrorMessage(null);
    setIsVerifying(true);
    try {
      const result = await unlockWithBiometric(type);
      if (!result.success) {
        if (!result.cancelled) {
          setErrorMessage(result.error || `${type === 'FACE' ? 'Face' : 'Fingerprint'} authentication failed.`);
        }
        if (config.pinEnabled) {
          setActiveMethod('PIN');
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinSubmit = async () => {
    if (enteredPin.length < 4 || isVerifying || lockoutRemainingSeconds > 0) return;
    setErrorMessage(null);
    setIsVerifying(true);
    try {
      const result = await unlockWithPin(enteredPin);
      if (!result.success) {
        setErrorMessage(result.error || 'Incorrect PIN entered.');
        setEnteredPin('');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStartForgotPin = async () => {
    setForgotError(null);
    setForgotOtp('');
    setForgotNewPin('');
    setForgotConfirmPin('');
    setForgotStep('OTP');
    setShowForgotPinModal(true);

    if (!user?.phone) {
      setForgotError('No phone number associated with current session.');
      return;
    }

    setIsSendingForgotOtp(true);
    try {
      const handle = await sendFirebasePhoneOtp(user.phone, false);
      setForgotOtpHandle(handle);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP for PIN reset.';
      setForgotError(msg);
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    setForgotError(null);
    const cleaned = forgotOtp.trim();
    if (!isValidOtp(cleaned)) {
      setForgotError('Enter a valid 6-digit SMS verification code.');
      return;
    }

    setIsSendingForgotOtp(true);
    try {
      // Re-verify with Firebase Phone Auth
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await confirmFirebaseOtpAndGetIdToken(forgotOtpHandle as any, cleaned);
      setForgotStep('NEW_PIN');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP.';
      setForgotError(msg);
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  const handleResetPinSubmit = async () => {
    setForgotError(null);
    if (!isValidAppPin(forgotNewPin)) {
      setForgotError('New PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (forgotNewPin !== forgotConfirmPin) {
      setForgotError('PINs do not match. Please verify.');
      return;
    }

    setIsSendingForgotOtp(true);
    try {
      await resetPinAfterOtp(forgotNewPin);
      setShowForgotPinModal(false);
      setErrorMessage(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset PIN.';
      setForgotError(msg);
    } finally {
      setIsSendingForgotOtp(false);
    }
  };

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.lockBadge}>
            <Ionicons name="shield-checkmark" size={36} color={COLORS.tangerine} />
          </View>
          <Text style={TYPOGRAPHY.h1}>Application Locked</Text>
          <Text style={styles.subtitle}>
            {user?.fullName ? `Welcome back, ${user.fullName}` : 'Welcome back'}
          </Text>
          <Text style={styles.phoneCaption}>{user?.phone || 'Session Protected'}</Text>
        </View>

        {errorMessage ? (
          <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        ) : null}

        {lockoutRemainingSeconds > 0 ? (
          <AppCard highlighted style={styles.lockoutCard}>
            <Ionicons name="time-outline" size={24} color={COLORS.tangerine} />
            <Text style={styles.lockoutText}>
              Too many incorrect PIN attempts. Locked out for {lockoutRemainingSeconds}s.
            </Text>
          </AppCard>
        ) : null}

        {/* PIN Authentication View */}
        {activeMethod === 'PIN' ? (
          <AppCard style={styles.authCard}>
            <Text style={styles.methodTitle}>Enter Application PIN</Text>
            <PinKeypad
              value={enteredPin}
              onChange={(val) => {
                setEnteredPin(val);
                if (errorMessage) setErrorMessage(null);
              }}
              maxLength={6}
              disabled={isVerifying || lockoutRemainingSeconds > 0}
              testIDPrefix="lock-screen-pin"
            />

            <AppButton
              label={isVerifying ? 'Verifying PIN...' : 'Unlock Session'}
              onPress={handlePinSubmit}
              loading={isVerifying}
              disabled={enteredPin.length < 4 || isVerifying || lockoutRemainingSeconds > 0}
              testID="unlock-pin-submit-button"
            />

            <TouchableOpacity
              style={styles.forgotPinLink}
              onPress={handleStartForgotPin}
              disabled={isVerifying}
              testID="forgot-pin-button"
            >
              <Text style={styles.forgotPinText}>Forgot PIN? Reset with Mobile OTP</Text>
            </TouchableOpacity>
          </AppCard>
        ) : null}

        {/* Fingerprint Authentication View */}
        {activeMethod === 'FINGERPRINT' ? (
          <AppCard style={styles.authCard}>
            <Text style={styles.methodTitle}>Fingerprint Authentication</Text>
            <TouchableOpacity
              style={styles.biometricCircle}
              onPress={() => handleBiometricAuth('FINGERPRINT')}
              disabled={isVerifying}
              testID="biometric-fingerprint-trigger"
            >
              {isVerifying ? (
                <ActivityIndicator size="large" color={COLORS.tangerine} />
              ) : (
                <Ionicons name="finger-print-outline" size={64} color={COLORS.tangerine} />
              )}
            </TouchableOpacity>
            <Text style={styles.biometricInstruction}>
              Tap the icon or touch your device's fingerprint sensor to unlock.
            </Text>
          </AppCard>
        ) : null}

        {/* Face Lock Authentication View */}
        {activeMethod === 'FACE' ? (
          <AppCard style={styles.authCard}>
            <Text style={styles.methodTitle}>Face Lock Authentication</Text>
            <TouchableOpacity
              style={styles.biometricCircle}
              onPress={() => handleBiometricAuth('FACE')}
              disabled={isVerifying}
              testID="biometric-face-trigger"
            >
              {isVerifying ? (
                <ActivityIndicator size="large" color={COLORS.tangerine} />
              ) : (
                <Ionicons name="scan-outline" size={64} color={COLORS.tangerine} />
              )}
            </TouchableOpacity>
            <Text style={styles.biometricInstruction}>
              Tap the icon or glance at your front camera to unlock.
            </Text>
          </AppCard>
        ) : null}

        {/* Switch Between Available Methods */}
        <View style={styles.methodsRow}>
          {config.fingerprintEnabled && activeMethod !== 'FINGERPRINT' ? (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setActiveMethod('FINGERPRINT');
                handleBiometricAuth('FINGERPRINT');
              }}
              testID="switch-to-fingerprint-button"
            >
              <Ionicons name="finger-print-outline" size={20} color={COLORS.midnightNavy} />
              <Text style={styles.switchButtonText}>Use Fingerprint</Text>
            </TouchableOpacity>
          ) : null}

          {config.faceLockEnabled && activeMethod !== 'FACE' ? (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setActiveMethod('FACE');
                handleBiometricAuth('FACE');
              }}
              testID="switch-to-face-button"
            >
              <Ionicons name="scan-outline" size={20} color={COLORS.midnightNavy} />
              <Text style={styles.switchButtonText}>Use Face Lock</Text>
            </TouchableOpacity>
          ) : null}

          {config.pinEnabled && activeMethod !== 'PIN' ? (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setActiveMethod('PIN')}
              testID="switch-to-pin-button"
            >
              <Ionicons name="keypad-outline" size={20} color={COLORS.midnightNavy} />
              <Text style={styles.switchButtonText}>Use PIN</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Safe Sign Out Option */}
        <View style={styles.footer}>
          <AppButton
            label="Sign Out Securely"
            variant="secondary"
            onPress={signOut}
            testID="lock-screen-signout-button"
          />
        </View>
      </View>

      {/* Forgot PIN / OTP Reauthentication Modal */}
      <Modal visible={showForgotPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.h2}>Reset Application PIN</Text>
              <TouchableOpacity
                onPress={() => setShowForgotPinModal(false)}
                disabled={isSendingForgotOtp}
              >
                <Ionicons name="close-circle-outline" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            {forgotError ? <ErrorBanner message={forgotError} /> : null}

            {forgotStep === 'OTP' ? (
              <View style={styles.modalBody}>
                <Text style={TYPOGRAPHY.body}>
                  Enter the 6-digit SMS verification code sent by Firebase to your registered number{' '}
                  <Text style={{ fontWeight: '700' }}>{user?.phone}</Text>.
                </Text>
                <AppInput
                  label="SMS Verification Code"
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={forgotOtp}
                  onChangeText={setForgotOtp}
                  testID="forgot-pin-otp-input"
                />
                <AppButton
                  label={isSendingForgotOtp ? 'Verifying OTP...' : 'Verify OTP Code'}
                  onPress={handleVerifyForgotOtp}
                  loading={isSendingForgotOtp}
                  disabled={forgotOtp.length !== 6 || isSendingForgotOtp}
                  testID="verify-forgot-otp-button"
                />
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={TYPOGRAPHY.body}>
                  Mobile number verified! Enter and confirm your new 4–6 digit App PIN.
                </Text>
                <AppInput
                  label="New 4–6 Digit PIN"
                  placeholder="Enter new PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  value={forgotNewPin}
                  onChangeText={setForgotNewPin}
                  testID="forgot-new-pin-input"
                />
                <AppInput
                  label="Confirm New PIN"
                  placeholder="Re-enter new PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  value={forgotConfirmPin}
                  onChangeText={setForgotConfirmPin}
                  testID="forgot-confirm-pin-input"
                />
                <AppButton
                  label={isSendingForgotOtp ? 'Saving PIN...' : 'Save New PIN & Unlock'}
                  onPress={handleResetPinSubmit}
                  loading={isSendingForgotOtp}
                  disabled={
                    !isValidAppPin(forgotNewPin) ||
                    forgotNewPin !== forgotConfirmPin ||
                    isSendingForgotOtp
                  }
                  testID="save-forgot-new-pin-button"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  header: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.midnightNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.midnightNavy,
    fontWeight: '600',
  },
  phoneCaption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.midnightNavyMuted,
  },
  lockoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.tangerineTint,
    borderColor: COLORS.tangerine,
  },
  lockoutText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.midnightNavy,
    fontWeight: '600',
  },
  authCard: {
    gap: SPACING.md,
    alignItems: 'center',
  },
  methodTitle: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
  },
  forgotPinLink: {
    paddingVertical: SPACING.xs,
  },
  forgotPinText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.tangerine,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  biometricCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.iceBlue,
    borderWidth: 2,
    borderColor: COLORS.tangerine,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  biometricInstruction: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.midnightNavyMuted,
    paddingHorizontal: SPACING.md,
  },
  methodsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.iceBlueLight,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  switchButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.midnightNavy,
    fontWeight: '700',
  },
  footer: {
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.iceBlue,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBody: {
    gap: SPACING.md,
  },
});
