import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { FilterChips } from '../../components/FilterChips';
import { LoadingView } from '../../components/LoadingView';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { BookingItem, ResidentItem } from '../../types/domain';
import { formatDateShort, formatINR, todayIsoDate } from '../../utils/displayFormatters';
import { isValidIndianMobile } from '../../utils/validation';

type SectionTab = 'DIRECTORY' | 'BOOKINGS' | 'INVITATIONS';

export const ResidentsScreen: React.FC = () => {
  const {
    properties,
    residents,
    residentsMeta,
    invitations,
    invitationsMeta,
    bookings,
    bookingsMeta,
    ownerBeds,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchResidents,
    fetchInvitations,
    fetchBookings,
    onboardResident,
    verifyResidentKyc,
    generateInvitation,
    revokeInvitation,
    createBooking,
    updateBookingRent,
    giveBookingNotice,
    checkoutBooking,
    rentRevisions,
    proposeRentRevision,
  } = usePortalData();

  const [tab, setTab] = useState<SectionTab>('DIRECTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddResident, setShowAddResident] = useState(false);

  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newOccupation, setNewOccupation] = useState('');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');

  const [allocResident, setAllocResident] = useState<ResidentItem | null>(null);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [agreedRent, setAgreedRent] = useState('9500');
  const [securityDeposit, setSecurityDeposit] = useState('15000');

  const [rentEditBooking, setRentEditBooking] = useState<BookingItem | null>(null);
  const [editedRentAmount, setEditedRentAmount] = useState('');

  const [reviseBooking, setReviseBooking] = useState<BookingItem | null>(null);
  const [proposedRentAmount, setProposedRentAmount] = useState('');
  const [revisionEffectiveFrom, setRevisionEffectiveFrom] = useState(
    `${todayIsoDate().slice(0, 7)}-01`
  );
  const [revisionReason, setRevisionReason] = useState('');

  const [latestInviteBanner, setLatestInviteBanner] = useState<{
    name: string;
    phone: string;
    code: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const vacantBeds = useMemo(
    () => ownerBeds.filter((b) => b.status === 'VACANT'),
    [ownerBeds]
  );

  const handleSearch = async () => {
    const q = searchQuery.trim() || undefined;
    if (tab === 'DIRECTORY') await fetchResidents({ search: q, page: 0 });
    else if (tab === 'BOOKINGS') await fetchBookings({ search: q, page: 0 });
    else await fetchInvitations({ search: q, page: 0 });
  };

  const handleAddResident = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (!isValidIndianMobile(digits) || !newName.trim()) {
      setFeedback('Enter a valid 10-digit +91 mobile number and resident full name.');
      return;
    }
    const created = await onboardResident({
      phone: `+91${digits}`,
      fullName: newName.trim(),
      occupation: newOccupation.trim() || undefined,
      emergencyContactName: newEmergencyName.trim() || undefined,
      emergencyContactPhone: newEmergencyPhone.trim() || undefined,
    });
    setFeedback(`Resident ${created.fullName} added to your PG directory.`);
    setNewPhone('');
    setNewName('');
    setNewOccupation('');
    setShowAddResident(false);
  };

  const handleGenerateInvite = async (resident: ResidentItem) => {
    const invite = await generateInvitation(resident.id, {
      propertyId: properties[0]?.id,
      expiresInHours: 72,
    });
    if (invite.inviteCode) {
      setLatestInviteBanner({
        name: resident.fullName,
        phone: resident.phone,
        code: invite.inviteCode,
      });
    }
    setFeedback(`Generated 72-hour secure invitation for ${resident.fullName}.`);
  };

  const handleCheckInAllocate = async () => {
    if (!allocResident) return;
    const bedId = selectedBedId || vacantBeds[0]?.id;
    if (!bedId) {
      setFeedback('No vacant bed available. Add or vacate a bed first.');
      return;
    }
    await createBooking({
      residentId: allocResident.userId,
      bedId,
      checkInDate: todayIsoDate(),
      agreedMonthlyRent: Math.max(500, Number(agreedRent) || 9500),
      securityDepositAmount: Math.max(0, Number(securityDeposit) || 0),
      depositStatus: Number(securityDeposit) > 0 ? 'PAID' : 'PENDING',
      notes: 'Checked in from Owner Portal',
    });
    setFeedback(`Checked in ${allocResident.fullName} and marked bed OCCUPIED.`);
    setAllocResident(null);
  };

  const handleSaveBookingRent = async () => {
    if (!rentEditBooking) return;
    await updateBookingRent(rentEditBooking.id, {
      agreedMonthlyRent: Math.max(500, Number(editedRentAmount) || rentEditBooking.agreedMonthlyRent),
    });
    setFeedback('Updated monthly rent on active stay.');
    setRentEditBooking(null);
  };

  const handleProposeRevision = async () => {
    if (!reviseBooking) return;
    const amt = Number(proposedRentAmount);
    if (!Number.isFinite(amt) || amt < 500 || !revisionEffectiveFrom.trim() || !revisionReason.trim()) {
      setFeedback('Enter a valid proposed rent, effective date (YYYY-MM-DD), and reason.');
      return;
    }
    const created = await proposeRentRevision(reviseBooking.id, {
      proposedMonthlyRent: amt,
      effectiveDate: revisionEffectiveFrom.trim(),
      reason: revisionReason.trim(),
    });
    setFeedback(
      `Rent revision proposed (${formatINR(created.previousMonthlyRent)} to ${formatINR(created.proposedMonthlyRent)} effective ${formatDateShort(created.effectiveDate)}). Awaiting resident acceptance.`
    );
    setReviseBooking(null);
    setRevisionReason('');
  };

  if (loading && residents.length === 0) {
    return <LoadingView fullscreen message="Loading residents, stays and invitations..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader
        title="Residents & Stays"
        actionLabel={showAddResident ? 'Close' : 'Add Resident'}
        onActionPress={() => setShowAddResident((p) => !p)}
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      {latestInviteBanner ? (
        <AppCard highlighted style={styles.inviteRevealCard}>
          <Text style={TYPOGRAPHY.h3}>One-Time Secure Invitation Code</Text>
          <Text style={TYPOGRAPHY.body}>
            Share this code with {latestInviteBanner.name} ({latestInviteBanner.phone}). For
            security, only its hash is stored and it is shown once:
          </Text>
          <Text style={styles.inviteCodeBig} selectable testID="generated-invite-code">
            {latestInviteBanner.code}
          </Text>
          <AppButton label="Dismiss Code" variant="secondary" onPress={() => setLatestInviteBanner(null)} />
        </AppCard>
      ) : null}

      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      <FilterChips
        options={[
          { value: 'DIRECTORY', label: `Residents (${residentsMeta.totalElements})` },
          { value: 'BOOKINGS', label: `Check-Ins (${bookingsMeta.totalElements})` },
          { value: 'INVITATIONS', label: `Invites (${invitationsMeta.totalElements})` },
        ]}
        selectedValue={tab}
        onSelect={setTab}
      />

      <AppCard style={styles.searchCard}>
        <AppInput
          label="Search Directory / Stays"
          placeholder="Search name, phone or notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <AppButton label="Search" variant="secondary" onPress={handleSearch} />
      </AppCard>

      {showAddResident ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Add Resident Profile</Text>
          <AppInput label="Mobile Number" prefixText="+91" value={newPhone} onChangeText={(t) => setNewPhone(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={10} placeholder="9820001122" testID="resident-phone-input" />
          <AppInput label="Full Name" value={newName} onChangeText={setNewName} placeholder="Arjun Sharma" testID="resident-name-input" />
          <AppInput label="Occupation" value={newOccupation} onChangeText={setNewOccupation} placeholder="Software Engineer" />
          <AppInput label="Emergency Contact Name" value={newEmergencyName} onChangeText={setNewEmergencyName} placeholder="Parent / Guardian" />
          <AppInput label="Emergency Contact Phone" value={newEmergencyPhone} onChangeText={setNewEmergencyPhone} placeholder="+919800000099" />
          <AppButton label="Save Resident" onPress={handleAddResident} loading={mutating} testID="save-resident-button" />
        </AppCard>
      ) : null}

      {allocResident ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Assign Bed & Check-In: {allocResident.fullName}</Text>
          {vacantBeds.length === 0 ? (
            <Text style={TYPOGRAPHY.body}>No VACANT beds found. Create a room and add a vacant bed first.</Text>
          ) : (
            <FilterChips
              options={vacantBeds.map((b) => ({ value: b.id, label: b.bedCode }))}
              selectedValue={selectedBedId || vacantBeds[0].id}
              onSelect={setSelectedBedId}
            />
          )}
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppInput label="Monthly Rent" value={agreedRent} onChangeText={setAgreedRent} keyboardType="number-pad" />
            </View>
            <View style={styles.half}>
              <AppInput label="Security Deposit" value={securityDeposit} onChangeText={setSecurityDeposit} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppButton label="Confirm Check-In" onPress={handleCheckInAllocate} loading={mutating} disabled={vacantBeds.length === 0} />
            </View>
            <View style={styles.half}>
              <AppButton label="Cancel" variant="secondary" onPress={() => setAllocResident(null)} />
            </View>
          </View>
        </AppCard>
      ) : null}

      {rentEditBooking ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Configure Resident Monthly Rent</Text>
          <AppInput label="New Monthly Rent" value={editedRentAmount} onChangeText={setEditedRentAmount} keyboardType="number-pad" />
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppButton label="Update Rent" onPress={handleSaveBookingRent} loading={mutating} />
            </View>
            <View style={styles.half}>
              <AppButton label="Cancel" variant="secondary" onPress={() => setRentEditBooking(null)} />
            </View>
          </View>
        </AppCard>
      ) : null}

      {reviseBooking ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Propose Fixed Rent Revision</Text>
          <Text style={TYPOGRAPHY.caption}>
            Current agreed rent {formatINR(reviseBooking.agreedMonthlyRent)} remains locked until accepted by the resident.
          </Text>
          <AppInput
            label="Proposed Monthly Rent"
            value={proposedRentAmount}
            onChangeText={setProposedRentAmount}
            keyboardType="number-pad"
            testID="propose-revision-rent-input"
          />
          <AppInput
            label="Effective From (YYYY-MM-DD)"
            value={revisionEffectiveFrom}
            onChangeText={setRevisionEffectiveFrom}
            placeholder="2026-12-01"
            testID="propose-revision-date-input"
          />
          <AppInput
            label="Reason for Rent Revision"
            value={revisionReason}
            onChangeText={setRevisionReason}
            placeholder="Annual maintenance & amenity revision"
            testID="propose-revision-reason-input"
          />
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppButton
                label="Send Proposal"
                onPress={handleProposeRevision}
                loading={mutating}
                testID="submit-rent-revision-button"
              />
            </View>
            <View style={styles.half}>
              <AppButton label="Cancel" variant="secondary" onPress={() => setReviseBooking(null)} />
            </View>
          </View>
        </AppCard>
      ) : null}

      {tab === 'DIRECTORY' ? (
        residents.length === 0 ? (
          <EmptyState iconName="people-outline" title="No Residents Yet" message="Onboard a resident to assign beds or send secure invitations." />
        ) : (
          residents.map((res) => (
            <AppCard key={res.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={TYPOGRAPHY.h3}>{res.fullName}</Text>
                  <Text style={TYPOGRAPHY.caption}>{res.phone} {res.occupation ? `- ${res.occupation}` : ''}</Text>
                </View>
                <StatusBadge label={res.kycVerified ? 'KYC VERIFIED' : 'KYC PENDING'} tone={res.kycVerified ? 'navy' : 'accent'} />
              </View>
              <View style={styles.rowActions}>
                <AppButton label="Invite Code" variant="secondary" onPress={() => handleGenerateInvite(res)} style={styles.flexBtn} />
                <AppButton
                  label="Assign Bed"
                  onPress={() => {
                    setAllocResident(res);
                    setSelectedBedId(vacantBeds[0]?.id ?? '');
                  }}
                  style={styles.flexBtn}
                />
                {!res.kycVerified ? (
                  <AppButton label="Verify KYC" variant="secondary" onPress={() => verifyResidentKyc(res.id)} style={styles.flexBtn} />
                ) : null}
              </View>
            </AppCard>
          ))
        )
      ) : tab === 'BOOKINGS' ? (
        bookings.length === 0 ? (
          <EmptyState iconName="bed-outline" title="No Bookings Yet" message="Assign a resident to a vacant bed from the Residents tab." />
        ) : (
          bookings.map((bk) => (
            <AppCard key={bk.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={TYPOGRAPHY.h3}>Stay #{bk.id.slice(0, 8)}</Text>
                <StatusBadge label={bk.status} tone={bk.status === 'ACTIVE' ? 'accent' : 'navy'} />
              </View>
              <Text style={TYPOGRAPHY.caption}>
                Check-In: {formatDateShort(bk.checkInDate)} | Rent: {formatINR(bk.agreedMonthlyRent)}/mo | Deposit: {formatINR(bk.securityDepositAmount)}
              </Text>
              {bk.status === 'ACTIVE' || bk.status === 'NOTICE_GIVEN' ? (
                <View style={styles.rowActions}>
                  <AppButton
                    label="Propose Revision"
                    variant="secondary"
                    onPress={() => {
                      setReviseBooking(bk);
                      setProposedRentAmount(String(bk.agreedMonthlyRent));
                    }}
                    testID={`propose-revision-${bk.id}`}
                    style={styles.flexBtn}
                  />
                  {bk.status === 'ACTIVE' ? (
                    <AppButton
                      label="Give Notice"
                      variant="secondary"
                      onPress={() => giveBookingNotice(bk.id, { expectedCheckOutDate: todayIsoDate() })}
                      style={styles.flexBtn}
                    />
                  ) : null}
                  <AppButton
                    label="Check Out"
                    onPress={() => checkoutBooking(bk.id, { depositStatus: 'REFUNDED' })}
                    style={styles.flexBtn}
                  />
                </View>
              ) : null}
              {rentRevisions.filter((r) => r.bookingId === bk.id).length > 0 ? (
                <Text style={TYPOGRAPHY.caption}>
                  Latest Revision:{' '}
                  {rentRevisions.filter((r) => r.bookingId === bk.id)[0].status} (
                  {formatINR(
                    rentRevisions.filter((r) => r.bookingId === bk.id)[0].proposedMonthlyRent
                  )}
                  )
                </Text>
              ) : null}
            </AppCard>
          ))
        )
      ) : invitations.length === 0 ? (
        <EmptyState iconName="mail-open-outline" title="No Invitations Generated" message="Generate a secure single-use invitation from any resident card." />
      ) : (
        invitations.map((inv) => (
          <AppCard key={inv.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View>
                <Text style={TYPOGRAPHY.h3}>{inv.residentName || inv.phone}</Text>
                <Text style={TYPOGRAPHY.caption}>
                  {inv.phone} | Expires {formatDateShort(inv.expiresAt)}
                </Text>
              </View>
              <StatusBadge label={inv.status} tone={inv.status === 'PENDING' ? 'accent' : 'navy'} />
            </View>
            {inv.status === 'PENDING' ? (
              <AppButton label="Revoke Invitation" variant="secondary" onPress={() => revokeInvitation(inv.id)} />
            ) : null}
          </AppCard>
        ))
      )}

      {tab === 'DIRECTORY' && residentsMeta.hasNext ? (
        <AppButton
          label="Load More Residents"
          variant="secondary"
          onPress={() => fetchResidents({ search: searchQuery.trim() || undefined, page: residentsMeta.page + 1, append: true })}
        />
      ) : null}
      {tab === 'BOOKINGS' && bookingsMeta.hasNext ? (
        <AppButton
          label="Load More Check-Ins"
          variant="secondary"
          onPress={() => fetchBookings({ search: searchQuery.trim() || undefined, page: bookingsMeta.page + 1, append: true })}
        />
      ) : null}
      {tab === 'INVITATIONS' && invitationsMeta.hasNext ? (
        <AppButton
          label="Load More Invitations"
          variant="secondary"
          onPress={() => fetchInvitations({ search: searchQuery.trim() || undefined, page: invitationsMeta.page + 1, append: true })}
        />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  searchCard: { gap: SPACING.sm },
  formCard: { gap: SPACING.sm },
  inviteRevealCard: { gap: SPACING.sm },
  inviteCodeBig: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.midnightNavy,
    letterSpacing: 1.5,
  },
  rowTwo: { flexDirection: 'row', gap: SPACING.sm },
  half: { flex: 1 },
  itemCard: { gap: SPACING.sm },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowActions: { flexDirection: 'row', gap: SPACING.xs },
  flexBtn: { flex: 1 },
});
