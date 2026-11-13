import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { AppInput } from './AppInput';
import { ErrorBanner } from './ErrorBanner';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import {
  confirmFirebaseOtpAndGetIdToken,
  sendFirebasePhoneOtp,
} from '../services/firebasePhoneAuth';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { isValidAppPin } from '../services/appSecurityService';
import { isValidOtp } from '../utils/validation';

export const SecuritySettingsSection: React.FC = () => {
  const { user } = useAuth();
  const {
    capabilities,
    config,
    hasLocalSecurityEnabled,
    enableFingerprint,
    disableFingerprint,
    enableFaceLock,
    disableFaceLock,
    savePin,
    changePin,
    disablePin,
    resetPinAfterOtp,
  } = useSecurity();

  const [sectionNotice, setSectionNotice] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // Change PIN modal states
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Set PIN modal states
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [setNewPinVal, setSetNewPinVal] = useState('');
  const [setConfirmPinVal, setSetConfirmPinVal] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Forgot PIN OTP flow states
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [forgotStep, setForgotStep] = useState<'OTP' | 'NEW_PIN'>('OTP');
  const [forgotOtpHandle, setForgotOtpHandle] = useState<unknown>(null);
  const [isProcessingForgot, setIsProcessingForgot] = useState(false);

  const handleToggleFingerprint = async (val: boolean) => {
    setSectionError(null);
    setSectionNotice(null);
    if (!val) {
      await disableFingerprint();
      setSectionNotice('Fingerprint lock disabled.');
      return;
    }
    const res = await enableFingerprint();
    if (res.success) {
      setSectionNotice('Fingerprint lock enabled successfully.');
    } else {
      setSectionError(res.error || 'Failed to enable fingerprint lock.');
    }
  };

  const handleToggleFaceLock = async (val: boolean) => {
    setSectionError(null);
    setSectionNotice(null);
    if (!val) {
      await disableFaceLock();
      setSectionNotice('Face lock disabled.');
      return;
    }
    const res = await enableFaceLock();
    if (res.success) {
      setSectionNotice('Face lock enabled successfully.');
    } else {
      setSectionError(res.error || 'Failed to enable face lock.');
    }
  };

  const handleTogglePinLock = async (val: boolean) => {
    setSectionError(null);
    setSectionNotice(null);
    if (!val) {
      await disablePin();
      setSectionNotice('Application PIN lock disabled.');
      return;
    }
    // Open modal to set PIN
    setShowSetPinModal(true);
  };

  const handleSaveNewPin = async () => {
    setSectionError(null);
    if (!isValidAppPin(setNewPinVal)) {
      setSectionError('PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (setNewPinVal !== setConfirmPinVal) {
      setSectionError('PINs do not match.');
      return;
    }
    setIsSettingPin(true);
    try {
      await savePin(setNewPinVal);
      setShowSetPinModal(false);
      setSetNewPinVal('');
      setSetConfirmPinVal('');
      setSectionNotice('Application PIN configured and enabled.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save PIN.';
      setSectionError(msg);
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleChangePinSubmit = async () => {
    setSectionError(null);
    if (!isValidAppPin(newPin)) {
      setSectionError('New PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setSectionError('New PINs do not match.');
      return;
    }
    setIsChangingPin(true);
    try {
      await changePin(currentPin, newPin);
      setShowChangePinModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setSectionNotice('Application PIN changed successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PIN change failed.';
      setSectionError(msg);
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleStartForgotPin = async () => {
    setSectionError(null);
    setForgotOtp('');
    setForgotNewPin('');
    setForgotConfirmPin('');
    setForgotStep('OTP');
    setShowForgotPinModal(true);

    if (!user?.phone) {
      setSectionError('No phone number associated with current session.');
      return;
    }

    setIsProcessingForgot(true);
    try {
      const handle = await sendFirebasePhoneOtp(user.phone, false);
      setForgotOtpHandle(handle);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP for PIN reset.';
      setSectionError(msg);
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    setSectionError(null);
    const cleaned = forgotOtp.trim();
    if (!isValidOtp(cleaned)) {
      setSectionError('Enter a valid 6-digit SMS verification code.');
      return;
    }

    setIsProcessingForgot(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await confirmFirebaseOtpAndGetIdToken(forgotOtpHandle as any, cleaned);
      setForgotStep('NEW_PIN');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP.';
      setSectionError(msg);
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleResetPinSubmit = async () => {
    setSectionError(null);
    if (!isValidAppPin(forgotNewPin)) {
      setSectionError('New PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (forgotNewPin !== forgotConfirmPin) {
      setSectionError('PINs do not match.');
      return;
    }

    setIsProcessingForgot(true);
    try {
      await resetPinAfterOtp(forgotNewPin);
      setShowForgotPinModal(false);
      setSectionNotice('Application PIN reset and updated via SMS verification.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reset PIN.';
      setSectionError(msg);
    } finally {
      setIsProcessingForgot(false);
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader title="Authentication & Security" />

      {sectionError ? (
        <ErrorBanner message={sectionError} onDismiss={() => setSectionError(null)} />
      ) : null}

      {sectionNotice ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{sectionNotice}</Text>
        </AppCard>
      ) : null}

      <AppCard style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={TYPOGRAPHY.h2}>App Lock Protection</Text>
            <Text style={TYPOGRAPHY.caption}>
              {hasLocalSecurityEnabled
                ? 'Protected with local biometrics and/or PIN'
                : 'No local unlocking method active'}
            </Text>
          </View>
          <StatusBadge
            label={hasLocalSecurityEnabled ? 'SECURED' : 'NOT CONFIGURED'}
            tone={hasLocalSecurityEnabled ? 'accent' : 'soft'}
          />
        </View>

        {/* Supported Biometric Hardware Status */}
        <View style={styles.biometricStatusBox}>
          <Text style={styles.subHeading}>Available Biometric Hardware:</Text>
          {capabilities.supportsFingerprint ? (
            <View style={styles.bulletRow}>
              <Ionicons name="finger-print-outline" size={16} color={COLORS.midnightNavy} />
              <Text style={TYPOGRAPHY.caption}>
                Fingerprint: Supported ({capabilities.isEnrolled ? 'Enrolled' : 'Not Enrolled in OS'})
              </Text>
            </View>
          ) : null}

          {capabilities.supportsFace ? (
            <View style={styles.bulletRow}>
              <Ionicons name="scan-outline" size={16} color={COLORS.midnightNavy} />
              <Text style={TYPOGRAPHY.caption}>
                Face Unlock: Supported ({capabilities.isEnrolled ? 'Enrolled' : 'Not Enrolled in OS'})
              </Text>
            </View>
          ) : null}

          {!capabilities.supportsFingerprint && !capabilities.supportsFace ? (
            <Text style={TYPOGRAPHY.caption}>No biometric hardware detected on this device.</Text>
          ) : null}
        </View>

        {/* Fingerprint Lock Switch */}
        {capabilities.supportsFingerprint ? (
          <View style={styles.rowBetween}>
            <View style={styles.rowLeading}>
              <Ionicons name="finger-print-outline" size={22} color={COLORS.midnightNavy} />
              <View>
                <Text style={TYPOGRAPHY.bodyMedium}>Fingerprint Lock</Text>
                <Text style={TYPOGRAPHY.caption}>Unlock app using fingerprint</Text>
              </View>
            </View>
            <Switch
              value={config.fingerprintEnabled}
              onValueChange={handleToggleFingerprint}
              disabled={!capabilities.isEnrolled}
              trackColor={{ false: COLORS.disabledBg, true: COLORS.tangerine }}
              thumbColor={COLORS.iceBlue}
              testID="settings-fingerprint-switch"
            />
          </View>
        ) : null}

        {/* Face Lock Switch */}
        {capabilities.supportsFace ? (
          <View style={styles.rowBetween}>
            <View style={styles.rowLeading}>
              <Ionicons name="scan-outline" size={22} color={COLORS.midnightNavy} />
              <View>
                <Text style={TYPOGRAPHY.bodyMedium}>Face Lock</Text>
                <Text style={TYPOGRAPHY.caption}>Unlock app using face recognition</Text>
              </View>
            </View>
            <Switch
              value={config.faceLockEnabled}
              onValueChange={handleToggleFaceLock}
              disabled={!capabilities.isEnrolled}
              trackColor={{ false: COLORS.disabledBg, true: COLORS.tangerine }}
              thumbColor={COLORS.iceBlue}
              testID="settings-face-switch"
            />
          </View>
        ) : null}

        {/* Application PIN Lock Switch */}
        <View style={styles.rowBetween}>
          <View style={styles.rowLeading}>
            <Ionicons name="keypad-outline" size={22} color={COLORS.midnightNavy} />
            <View>
              <Text style={TYPOGRAPHY.bodyMedium}>Application PIN Lock</Text>
              <Text style={TYPOGRAPHY.caption}>4–6 digit custom numeric passcode</Text>
            </View>
          </View>
          <Switch
            value={config.pinEnabled}
            onValueChange={handleTogglePinLock}
            trackColor={{ false: COLORS.disabledBg, true: COLORS.tangerine }}
            thumbColor={COLORS.iceBlue}
            testID="settings-pin-switch"
          />
        </View>

        {/* PIN Management Buttons */}
        {config.pinEnabled ? (
          <View style={styles.pinActionsRow}>
            <AppButton
              label="Change PIN"
              variant="secondary"
              onPress={() => setShowChangePinModal(true)}
              testID="settings-change-pin-button"
            />
            <AppButton
              label="Forgot PIN"
              variant="secondary"
              onPress={handleStartForgotPin}
              testID="settings-forgot-pin-button"
            />
          </View>
        ) : (
          <AppButton
            label="Set Application PIN"
            variant="secondary"
            onPress={() => setShowSetPinModal(true)}
            testID="settings-set-pin-button"
          />
        )}
      </AppCard>

      {/* Set PIN Modal */}
      <Modal visible={showSetPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.h2}>Set Application PIN</Text>
              <TouchableOpacity onPress={() => setShowSetPinModal(false)} disabled={isSettingPin}>
                <Ionicons name="close-circle-outline" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>
            <AppInput
              label="New 4–6 Digit PIN"
              placeholder="e.g. 5678"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={setNewPinVal}
              onChangeText={setSetNewPinVal}
              testID="set-new-pin-input"
            />
            <AppInput
              label="Confirm PIN"
              placeholder="Re-enter PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={setConfirmPinVal}
              onChangeText={setSetConfirmPinVal}
              testID="set-confirm-pin-input"
            />
            <AppButton
              label={isSettingPin ? 'Saving PIN...' : 'Save & Enable PIN'}
              onPress={handleSaveNewPin}
              loading={isSettingPin}
              disabled={
                !isValidAppPin(setNewPinVal) || setNewPinVal !== setConfirmPinVal || isSettingPin
              }
              testID="save-new-pin-modal-button"
            />
          </View>
        </View>
      </Modal>

      {/* Change PIN Modal */}
      <Modal visible={showChangePinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.h2}>Change Application PIN</Text>
              <TouchableOpacity
                onPress={() => setShowChangePinModal(false)}
                disabled={isChangingPin}
              >
                <Ionicons name="close-circle-outline" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>
            <AppInput
              label="Current PIN"
              placeholder="Enter current PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={currentPin}
              onChangeText={setCurrentPin}
              testID="change-current-pin-input"
            />
            <AppInput
              label="New 4–6 Digit PIN"
              placeholder="Enter new PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={newPin}
              onChangeText={setNewPin}
              testID="change-new-pin-input"
            />
            <AppInput
              label="Confirm New PIN"
              placeholder="Re-enter new PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={confirmNewPin}
              onChangeText={setConfirmNewPin}
              testID="change-confirm-pin-input"
            />
            <AppButton
              label={isChangingPin ? 'Updating PIN...' : 'Update PIN'}
              onPress={handleChangePinSubmit}
              loading={isChangingPin}
              disabled={
                !currentPin ||
                !isValidAppPin(newPin) ||
                newPin !== confirmNewPin ||
                isChangingPin
              }
              testID="update-pin-modal-button"
            />
          </View>
        </View>
      </Modal>

      {/* Forgot PIN Modal */}
      <Modal visible={showForgotPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={TYPOGRAPHY.h2}>Reset PIN via Mobile OTP</Text>
              <TouchableOpacity
                onPress={() => setShowForgotPinModal(false)}
                disabled={isProcessingForgot}
              >
                <Ionicons name="close-circle-outline" size={24} color={COLORS.midnightNavy} />
              </TouchableOpacity>
            </View>

            {forgotStep === 'OTP' ? (
              <View style={styles.modalBody}>
                <Text style={TYPOGRAPHY.body}>
                  We sent a 6-digit SMS verification code to +91 {user?.phone || 'registered number'}.
                </Text>
                <AppInput
                  label="SMS Verification Code"
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={forgotOtp}
                  onChangeText={setForgotOtp}
                  testID="settings-forgot-otp-input"
                />
                <AppButton
                  label={isProcessingForgot ? 'Verifying OTP...' : 'Verify OTP Code'}
                  onPress={handleVerifyForgotOtp}
                  loading={isProcessingForgot}
                  disabled={forgotOtp.length !== 6 || isProcessingForgot}
                  testID="settings-verify-forgot-otp-button"
                />
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={TYPOGRAPHY.body}>
                  Mobile number verified! Enter your new 4–6 digit App PIN.
                </Text>
                <AppInput
                  label="New 4–6 Digit PIN"
                  placeholder="Enter new PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  value={forgotNewPin}
                  onChangeText={setForgotNewPin}
                  testID="settings-forgot-new-pin-input"
                />
                <AppInput
                  label="Confirm New PIN"
                  placeholder="Re-enter new PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  value={forgotConfirmPin}
                  onChangeText={setForgotConfirmPin}
                  testID="settings-forgot-confirm-pin-input"
                />
                <AppButton
                  label={isProcessingForgot ? 'Saving PIN...' : 'Save New PIN'}
                  onPress={handleResetPinSubmit}
                  loading={isProcessingForgot}
                  disabled={
                    !isValidAppPin(forgotNewPin) ||
                    forgotNewPin !== forgotConfirmPin ||
                    isProcessingForgot
                  }
                  testID="settings-save-forgot-pin-button"
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  card: {
    gap: SPACING.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  biometricStatusBox: {
    backgroundColor: COLORS.iceBlue,
    borderRadius: RADII.sm,
    padding: SPACING.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pinActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
