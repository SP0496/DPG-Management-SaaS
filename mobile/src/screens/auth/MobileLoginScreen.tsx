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
import { isValidIndianMobile } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'MobileLogin'>;

export const MobileLoginScreen: React.FC<Props> = ({ navigation }) => {
  const { requestOtp, isSubmitting, authError, clearAuthError } = useAuth();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteField, setShowInviteField] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  const handleSendOtp = async () => {
    clearAuthError();
    setLocalError(undefined);
    const digits = phone.replace(/\D/g, '');
    if (!isValidIndianMobile(digits)) {
      setLocalError('Enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }

    const ok = await requestOtp({
      phone: digits,
      fullName: fullName.trim() || undefined,
      inviteCode: inviteCode.trim() || undefined,
    });
    if (ok) {
      navigation.navigate('OtpVerification');
    }
  };

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.brandHeader}>
        <View style={styles.logoMark}>
          <Ionicons name="business" size={28} color={COLORS.iceBlue} />
        </View>
        <Text style={TYPOGRAPHY.h1}>DPG Manager</Text>
        <Text style={styles.subtitle}>
          Sign in securely with your +91 mobile number via Firebase OTP. Your Owner or Resident
          workspace opens automatically from your verified account.
        </Text>
      </View>

      {authError ? <ErrorBanner message={authError} onDismiss={clearAuthError} /> : null}

      <AppCard style={styles.formCard}>
        <AppInput
          label="Indian Mobile Number"
          prefixText="+91"
          placeholder="9876543210"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={(text) => {
            setPhone(text.replace(/\D/g, ''));
            if (localError) setLocalError(undefined);
            if (authError) clearAuthError();
          }}
          error={localError}
          testID="mobile-phone-input"
        />

        <AppInput
          label="Full Name (Optional for First Sign-In)"
          iconName="person-outline"
          placeholder="Your full name"
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
          testID="mobile-fullname-input"
        />

        <View style={styles.inviteToggleWrap}>
          <AppButton
            label={showInviteField ? 'Hide Resident Invite Code' : 'Have a Resident Invite Code?'}
            variant="secondary"
            onPress={() => setShowInviteField((prev) => !prev)}
          />
        </View>

        {showInviteField ? (
          <AppInput
            label="PG Owner Invitation Code"
            iconName="ticket-outline"
            placeholder="Paste secure code shared by your PG owner"
            autoCapitalize="none"
            autoCorrect={false}
            value={inviteCode}
            onChangeText={setInviteCode}
            testID="mobile-invite-code-input"
          />
        ) : null}

        <AppButton
          label={isSubmitting ? 'Sending OTP...' : 'Send 6-Digit OTP'}
          onPress={handleSendOtp}
          loading={isSubmitting}
          disabled={phone.replace(/\D/g, '').length !== 10 || isSubmitting}
          testID="send-otp-button"
        />
      </AppCard>

      <View style={styles.securityNote}>
        <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.midnightNavy} />
        <Text style={styles.securityText}>
          Protected by Firebase Phone Authentication and server-verified JWT role enforcement.
        </Text>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  brandHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.midnightNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.midnightNavyMuted,
    lineHeight: 20,
  },
  formCard: {
    gap: SPACING.md,
  },
  inviteToggleWrap: {
    alignItems: 'flex-start',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.iceBlueShade,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    padding: SPACING.md,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    color: COLORS.midnightNavy,
    lineHeight: 18,
  },
});
