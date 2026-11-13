import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { isValidOtp } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const {
    pendingPhone,
    resendCooldown,
    isSubmitting,
    authError,
    clearAuthError,
    verifyOtp,
    resendOtp,
  } = useAuth();

  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | undefined>();

  const handleVerify = async () => {
    clearAuthError();
    setLocalError(undefined);
    const cleaned = otp.replace(/\D/g, '');
    if (!isValidOtp(cleaned)) {
      setLocalError('Enter the 6-digit numeric OTP sent to your mobile.');
      return;
    }
    await verifyOtp(cleaned);
  };

  const handleResend = async () => {
    clearAuthError();
    setLocalError(undefined);
    await resendOtp();
  };

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbox-ellipses-outline" size={26} color={COLORS.midnightNavy} />
        </View>
        <Text style={TYPOGRAPHY.h1}>Verify Mobile Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit SMS code sent by Firebase to +91 {pendingPhone ?? '----------'}.
        </Text>
      </View>

      {authError ? <ErrorBanner message={authError} onDismiss={clearAuthError} /> : null}

      <AppCard style={styles.card}>
        <AppInput
          label="6-Digit Verification Code"
          iconName="lock-closed-outline"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(text) => {
            setOtp(text.replace(/\D/g, ''));
            if (localError) setLocalError(undefined);
            if (authError) clearAuthError();
          }}
          error={localError}
          testID="otp-input"
        />

        <AppButton
          label={isSubmitting ? 'Verifying OTP...' : 'Verify & Sign In'}
          onPress={handleVerify}
          loading={isSubmitting}
          disabled={otp.replace(/\D/g, '').length !== 6 || isSubmitting}
          testID="verify-otp-button"
        />

        <View style={styles.resendRow}>
          <Text style={TYPOGRAPHY.caption}>
            {resendCooldown > 0
              ? `Resend available in ${resendCooldown}s`
              : 'Did not receive the SMS code?'}
          </Text>
          <AppButton
            label={resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend OTP'}
            variant="secondary"
            onPress={handleResend}
            disabled={resendCooldown > 0 || isSubmitting}
            testID="resend-otp-button"
          />
        </View>

        <AppButton
          label="Change Mobile Number"
          variant="secondary"
          onPress={() => {
            clearAuthError();
            navigation.goBack();
          }}
          disabled={isSubmitting}
        />
      </AppCard>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.tangerine,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.midnightNavyMuted,
    lineHeight: 20,
  },
  card: {
    gap: SPACING.md,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
});
