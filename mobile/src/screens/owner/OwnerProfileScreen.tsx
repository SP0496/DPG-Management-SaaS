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
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';

export const OwnerProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    ownerProfile,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    updateOwnerBusinessProfile,
  } = usePortalData();

  const [businessName, setBusinessName] = useState(ownerProfile?.businessName ?? '');
  const [panNumber, setPanNumber] = useState(ownerProfile?.panNumber ?? '');
  const [gstNumber, setGstNumber] = useState(ownerProfile?.gstNumber ?? '');
  const [settlementAccountMasked, setSettlementAccountMasked] = useState(
    ownerProfile?.settlementAccountMasked ?? ''
  );
  const [upiId, setUpiId] = useState(ownerProfile?.upiId ?? '');
  const [upiPayeeName, setUpiPayeeName] = useState(ownerProfile?.upiPayeeName ?? '');
  const [bankAccountHolder, setBankAccountHolder] = useState(
    ownerProfile?.bankAccountHolder ?? ''
  );
  const [bankName, setBankName] = useState(ownerProfile?.bankName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(
    ownerProfile?.bankAccountNumber ?? ''
  );
  const [bankIfscCode, setBankIfscCode] = useState(ownerProfile?.bankIfscCode ?? '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ownerProfile) {
      setBusinessName(ownerProfile.businessName ?? '');
      setPanNumber(ownerProfile.panNumber ?? '');
      setGstNumber(ownerProfile.gstNumber ?? '');
      setSettlementAccountMasked(ownerProfile.settlementAccountMasked ?? '');
      setUpiId(ownerProfile.upiId ?? '');
      setUpiPayeeName(ownerProfile.upiPayeeName ?? '');
      setBankAccountHolder(ownerProfile.bankAccountHolder ?? '');
      setBankName(ownerProfile.bankName ?? '');
      setBankAccountNumber(ownerProfile.bankAccountNumber ?? '');
      setBankIfscCode(ownerProfile.bankIfscCode ?? '');
    }
  }, [ownerProfile]);

  const handleSave = async () => {
    if (!businessName.trim()) {
      setSavedNotice('PG Business Name is required.');
      return;
    }
    await updateOwnerBusinessProfile({
      businessName: businessName.trim(),
      panNumber: panNumber.trim() || undefined,
      gstNumber: gstNumber.trim() || undefined,
      settlementAccountMasked: settlementAccountMasked.trim() || undefined,
      upiId: upiId.trim() || undefined,
      upiPayeeName: upiPayeeName.trim() || undefined,
      bankAccountHolder: bankAccountHolder.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankIfscCode: bankIfscCode.trim().toUpperCase() || undefined,
    });
    setSavedNotice('Owner business, UPI, and bank transfer details saved to PostgreSQL.');
  };

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="Owner Account & Payment Setup" />
      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {savedNotice ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{savedNotice}</Text>
        </AppCard>
      ) : null}

      <AppCard highlighted style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={TYPOGRAPHY.h2}>{user?.fullName || 'PG Owner'}</Text>
            <Text style={TYPOGRAPHY.caption}>{user?.phone || 'Phone verified'}</Text>
          </View>
          <StatusBadge label="OWNER" tone="accent" />
        </View>
        <Text style={TYPOGRAPHY.caption}>
          KYC Status: {ownerProfile?.kycVerified ? 'VERIFIED' : 'PENDING'} | Collection Mode: DIRECT OWNER UPI & BANK
        </Text>
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={TYPOGRAPHY.h2}>PG Business Registration</Text>
        <AppInput
          label="PG Business Name"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Sunrise Executive PG"
          testID="owner-business-name-input"
        />
        <AppInput
          label="PAN Number"
          value={panNumber}
          onChangeText={setPanNumber}
          autoCapitalize="characters"
          placeholder="ABCDE1234F"
        />
        <AppInput
          label="GSTIN (Optional)"
          value={gstNumber}
          onChangeText={setGstNumber}
          autoCapitalize="characters"
          placeholder="29ABCDE1234F1Z5"
        />
        <AppInput
          label="Display Account Label"
          value={settlementAccountMasked}
          onChangeText={setSettlementAccountMasked}
          placeholder="HDFC **** 4421"
        />
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={TYPOGRAPHY.h2}>Direct UPI Collection Details</Text>
        <AppInput
          label="Owner UPI ID (VPA)"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          placeholder="ownerpg@okhdfcbank"
          testID="owner-upi-id-input"
        />
        <AppInput
          label="UPI Payee Display Name"
          value={upiPayeeName}
          onChangeText={setUpiPayeeName}
          placeholder="Sunrise Hospitality"
          testID="owner-upi-payee-input"
        />
      </AppCard>

      <AppCard style={styles.card}>
        <Text style={TYPOGRAPHY.h2}>NEFT / IMPS Bank Transfer Account</Text>
        <AppInput
          label="Account Holder Name"
          value={bankAccountHolder}
          onChangeText={setBankAccountHolder}
          placeholder="Sunrise Hospitality Pvt Ltd"
          testID="owner-bank-holder-input"
        />
        <AppInput
          label="Bank Name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="HDFC Bank"
          testID="owner-bank-name-input"
        />
        <AppInput
          label="Bank Account Number"
          value={bankAccountNumber}
          onChangeText={setBankAccountNumber}
          keyboardType="number-pad"
          placeholder="50200012345678"
          testID="owner-bank-account-input"
        />
        <AppInput
          label="IFSC Code"
          value={bankIfscCode}
          onChangeText={setBankIfscCode}
          autoCapitalize="characters"
          placeholder="HDFC0001234"
          testID="owner-bank-ifsc-input"
        />
        <AppButton
          label="Save Owner Profile & Bank Details"
          onPress={handleSave}
          loading={mutating}
          testID="save-owner-profile-button"
        />
      </AppCard>

      <SecuritySettingsSection />

      <AppButton label="Sign Out" variant="secondary" onPress={signOut} />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
