import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { ErrorBanner } from '../../components/ErrorBanner';
import { SectionHeader } from '../../components/SectionHeader';
import { SecuritySettingsSection } from '../../components/SecuritySettingsSection';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';

export const ResidentProfileScreen: React.FC = () => {
  const { user, updateAccountFullName, signOut } = useAuth();
  const {
    residentProfile,
    assignedRoom,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    updateResidentSelfProfile,
  } = usePortalData();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [occupation, setOccupation] = useState(residentProfile?.occupation ?? '');
  const [emergencyName, setEmergencyName] = useState(residentProfile?.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(residentProfile?.emergencyContactPhone ?? '');
  const [permanentAddress, setPermanentAddress] = useState(residentProfile?.permanentAddress ?? '');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);
  }, [user?.fullName]);

  useEffect(() => {
    if (residentProfile) {
      setOccupation(residentProfile.occupation || '');
      setEmergencyName(residentProfile.emergencyContactName || '');
      setEmergencyPhone(residentProfile.emergencyContactPhone || '');
      setPermanentAddress(residentProfile.permanentAddress || '');
    }
  }, [residentProfile]);

  const handleSave = async () => {
    setSavedMsg(null);
    if (fullName.trim() && fullName.trim() !== user?.fullName) {
      await updateAccountFullName(fullName.trim());
    }
    await updateResidentSelfProfile({
      occupation: occupation.trim() || undefined,
      emergencyContactName: emergencyName.trim() || undefined,
      emergencyContactPhone: emergencyPhone.trim() || undefined,
      permanentAddress: permanentAddress.trim() || undefined,
    });
    setSavedMsg('Resident profile saved.');
  };

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <View style={styles.banner}>
        <Text style={styles.roleTag}>VERIFIED RESIDENT</Text>
        <Text style={styles.name}>{residentProfile?.fullName || user?.fullName || 'PG Resident'}</Text>
        <Text style={styles.phone}>{residentProfile?.phone || user?.phone}</Text>
        <View style={styles.badgeWrap}>
          <StatusBadge
            label={residentProfile?.kycVerified ? 'KYC VERIFIED' : 'KYC PENDING'}
            tone="accent"
          />
        </View>
      </View>

      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}
      {savedMsg ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{savedMsg}</Text>
        </AppCard>
      ) : null}

      <SectionHeader title="PG Assignment & KYC Summary" />
      <AppCard style={styles.card}>
        <Text style={TYPOGRAPHY.caption}>
          Assigned PG:{' '}
          {assignedRoom
            ? `${assignedRoom.propertyName} (Room ${assignedRoom.roomNumber}, Bed ${assignedRoom.bedNumber})`
            : 'Not allocated yet'}
        </Text>
        <Text style={TYPOGRAPHY.caption}>
          ID Verification: {residentProfile?.idProofType || 'Pending owner upload'}
          {residentProfile?.idProofLast4 ? ` (ending ${residentProfile.idProofLast4})` : ''}
        </Text>
      </AppCard>

      <SectionHeader title="Personal & Emergency Contacts" />
      <AppCard style={styles.card}>
        <AppInput label="Full Name" value={fullName} onChangeText={setFullName} />
        <AppInput label="Occupation" value={occupation} onChangeText={setOccupation} />
        <AppInput label="Emergency Contact Name" value={emergencyName} onChangeText={setEmergencyName} />
        <AppInput label="Emergency Contact Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} />
        <AppInput label="Permanent Address" value={permanentAddress} onChangeText={setPermanentAddress} multiline />
        <AppButton label="Update Resident Profile" onPress={handleSave} loading={mutating} />
      </AppCard>

      <SecuritySettingsSection />

      <AppButton label="Sign Out Securely" variant="secondary" onPress={signOut} />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.midnightNavy,
    borderRadius: 14,
    padding: SPACING.lg,
    gap: 4,
  },
  roleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tangerine,
    letterSpacing: 0.6,
  },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.iceBlue },
  phone: { fontSize: 14, color: COLORS.iceBlueShade },
  badgeWrap: { marginTop: SPACING.xs },
  card: { gap: SPACING.sm },
});
