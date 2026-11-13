import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
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
import { useSecurity } from '../context/SecurityContext';
import { COLORS } from '../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../theme/tokens';
import { isValidAppPin } from '../services/appSecurityService';

export const SecuritySetupModal: React.FC = () => {
  const {
    capabilities,
    config,
    savePin,
    enableFingerprint,
    disableFingerprint,
    enableFaceLock,
    disableFaceLock,
    skipSetup,
    completeSetup,
  } = useSecurity();

  const [fingerprintToggle, setFingerprintToggle] = useState(false);
  const [faceLockToggle, setFaceLockToggle] = useState(false);
  const [pinToggle, setPinToggle] = useState(false);

  // PIN input state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinInputs, setShowPinInputs] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Only show if not yet configured
  if (config.hasConfiguredLocalSecurity) {
    return null;
  }

  const handleFingerprintSwitch = async (val: boolean) => {
    setErrorMsg(null);
    if (!val) {
      setFingerprintToggle(false);
      return;
    }
    if (!capabilities.supportsFingerprint) {
      setErrorMsg('Fingerprint hardware is not supported on this device.');
      return;
    }
    if (!capabilities.isEnrolled) {
      setErrorMsg('No fingerprints enrolled in device settings.');
      return;
    }
    const res = await enableFingerprint();
    if (res.success) {
      setFingerprintToggle(true);
    } else {
      setErrorMsg(res.error || 'Fingerprint verification failed.');
      setFingerprintToggle(false);
    }
  };

  const handleFaceSwitch = async (val: boolean) => {
    setErrorMsg(null);
    if (!val) {
      setFaceLockToggle(false);
      return;
    }
    if (!capabilities.supportsFace) {
      setErrorMsg('Face authentication is not supported on this device.');
      return;
    }
    if (!capabilities.isEnrolled) {
      setErrorMsg('No face data enrolled in device settings.');
      return;
    }
    const res = await enableFaceLock();
    if (res.success) {
      setFaceLockToggle(true);
    } else {
      setErrorMsg(res.error || 'Face verification failed.');
      setFaceLockToggle(false);
    }
  };

  const handleSavePinStep = async () => {
    setErrorMsg(null);
    if (!isValidAppPin(pin)) {
      setErrorMsg('PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match. Please verify.');
      return;
    }
    setIsSaving(true);
    try {
      await savePin(pin, false);
      setPinSaved(true);
      setPinToggle(true);
      setShowPinInputs(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save PIN.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await completeSetup({
        fingerprintEnabled: fingerprintToggle,
        faceLockEnabled: faceLockToggle,
        pinEnabled: pinSaved || pinToggle,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save security preferences.';
      setErrorMsg(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await skipSetup();
  };

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-half" size={32} color={COLORS.tangerine} />
              </View>
              <Text style={TYPOGRAPHY.h1}>Secure your PG Management account</Text>
              <Text style={styles.subtitle}>
                Protect your bookings, rent receipts, and personal data with biometrics or an App PIN.
              </Text>
            </View>

            {errorMsg ? <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} /> : null}

            {/* Fingerprint Option */}
            <AppCard style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeading}>
                  <Ionicons name="finger-print-outline" size={26} color={COLORS.midnightNavy} />
                  <View style={styles.labelCol}>
                    <Text style={TYPOGRAPHY.h2}>Fingerprint Lock</Text>
                    <Text style={TYPOGRAPHY.caption}>
                      {capabilities.supportsFingerprint
                        ? capabilities.isEnrolled
                          ? 'Device scanner ready'
                          : 'Not enrolled in device settings'
                        : 'Not supported on this device'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={fingerprintToggle}
                  onValueChange={handleFingerprintSwitch}
                  disabled={!capabilities.supportsFingerprint || !capabilities.isEnrolled}
                  trackColor={{ false: COLORS.disabledBg, true: COLORS.tangerine }}
                  thumbColor={COLORS.iceBlue}
                  testID="setup-fingerprint-switch"
                />
              </View>
            </AppCard>

            {/* Face Lock Option */}
            <AppCard style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeading}>
                  <Ionicons name="scan-outline" size={26} color={COLORS.midnightNavy} />
                  <View style={styles.labelCol}>
                    <Text style={TYPOGRAPHY.h2}>Face Lock</Text>
                    <Text style={TYPOGRAPHY.caption}>
                      {capabilities.supportsFace
                        ? capabilities.isEnrolled
                          ? 'Face unlock ready'
                          : 'No face enrolled in device settings'
                        : 'Not supported on this device'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={faceLockToggle}
                  onValueChange={handleFaceSwitch}
                  disabled={!capabilities.supportsFace || !capabilities.isEnrolled}
                  trackColor={{ false: COLORS.disabledBg, true: COLORS.tangerine }}
                  thumbColor={COLORS.iceBlue}
                  testID="setup-face-switch"
                />
              </View>
            </AppCard>

            {/* App PIN Option */}
            <AppCard style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowLeading}>
                  <Ionicons name="keypad-outline" size={26} color={COLORS.midnightNavy} />
                  <View style={styles.labelCol}>
                    <Text style={TYPOGRAPHY.h2}>Application PIN</Text>
                    <Text style={TYPOGRAPHY.caption}>
                      {pinSaved ? '4–6 digit PIN configured' : 'Fallback unlock code'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.pinConfigButton, pinSaved && styles.pinConfiguredBadge]}
                  onPress={() => setShowPinInputs(!showPinInputs)}
                  testID="setup-pin-toggle-inputs-button"
                >
                  <Text style={[styles.pinConfigText, pinSaved && styles.pinConfiguredText]}>
                    {pinSaved ? 'Configured' : showPinInputs ? 'Cancel' : 'Set PIN'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPinInputs ? (
                <View style={styles.pinForm}>
                  <AppInput
                    label="Enter 4–6 Digit PIN"
                    placeholder="e.g. 1234"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    value={pin}
                    onChangeText={setPin}
                    testID="setup-new-pin-input"
                  />
                  <AppInput
                    label="Confirm PIN"
                    placeholder="Re-enter PIN"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    testID="setup-confirm-pin-input"
                  />
                  <AppButton
                    label="Save App PIN"
                    onPress={handleSavePinStep}
                    loading={isSaving}
                    disabled={!isValidAppPin(pin) || pin !== confirmPin || isSaving}
                    testID="setup-save-pin-button"
                  />
                </View>
              ) : null}
            </AppCard>

            {/* Footer Buttons */}
            <View style={styles.buttonGroup}>
              <AppButton
                label="Save & Continue"
                onPress={handleSaveAndContinue}
                loading={isSaving}
                testID="setup-save-and-continue-button"
              />
              <AppButton
                label="Skip for Now"
                variant="secondary"
                onPress={handleSkip}
                disabled={isSaving}
                testID="setup-skip-button"
              />
              <Text style={styles.skipNotice}>
                You can configure or change your security methods anytime in Settings.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: COLORS.iceBlue,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
  },
  scrollContent: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  header: {
    alignItems: 'center',
    textAlign: 'center',
    gap: SPACING.xs,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.midnightNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.midnightNavyMuted,
  },
  card: {
    gap: SPACING.sm,
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
  labelCol: {
    flex: 1,
  },
  pinConfigButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.midnightNavy,
  },
  pinConfigText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.iceBlue,
  },
  pinConfiguredBadge: {
    backgroundColor: COLORS.tangerineTint,
    borderColor: COLORS.tangerine,
    borderWidth: 1,
  },
  pinConfiguredText: {
    color: COLORS.tangerine,
  },
  pinForm: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyBorder,
    paddingTop: SPACING.sm,
  },
  buttonGroup: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  skipNotice: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.midnightNavyMuted,
  },
});
