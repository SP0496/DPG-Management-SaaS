import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';

export const MyRoomScreen: React.FC = () => {
  const {
    assignedRoom,
    rentRevisions,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    respondRentRevision,
  } = usePortalData();

  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingRevisions = useMemo(
    () => rentRevisions.filter((r) => r.status === 'PENDING_RESIDENT_ACCEPTANCE'),
    [rentRevisions]
  );

  const pastRevisions = useMemo(
    () => rentRevisions.filter((r) => r.status !== 'PENDING_RESIDENT_ACCEPTANCE'),
    [rentRevisions]
  );

  const handleRevisionDecision = async (revisionId: string, accept: boolean) => {
    const updated = await respondRentRevision(revisionId, {
      accept,
      remarks: accept ? 'Agreed by resident' : 'Declined by resident',
    });
    setFeedback(
      updated.status === 'ACCEPTED'
        ? `Rent revision accepted. New monthly rent ${formatINR(updated.proposedMonthlyRent)} takes effect from ${formatDateShort(updated.effectiveDate)}.`
        : 'Rent revision rejected. Your existing fixed monthly rent remains unchanged.'
    );
  };

  if (loading && !assignedRoom) {
    return <LoadingView message="Loading your assigned room and PG property..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="My Room & PG Property" />
      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      {!assignedRoom ? (
        <EmptyState
          iconName="bed-outline"
          title="No Room Assigned"
          message="Your PG owner has not allocated a room and bed to your profile yet. Ask your owner to generate an invitation or assign a bed."
        />
      ) : (
        <>
          <AppCard highlighted style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={TYPOGRAPHY.h2}>{assignedRoom.propertyName}</Text>
              <StatusBadge label={assignedRoom.bookingStatus} tone="accent" />
            </View>
            <Text style={TYPOGRAPHY.body}>{assignedRoom.propertyAddress}</Text>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>PG Management</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>{assignedRoom.ownerBusinessName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Owner Contact</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>{assignedRoom.ownerPhone || 'Not listed'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Emergency Helpline</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>{assignedRoom.propertyEmergencyContact}</Text>
            </View>

            {assignedRoom.propertyAmenities && assignedRoom.propertyAmenities.length > 0 ? (
              <View style={styles.amenitiesWrap}>
                {assignedRoom.propertyAmenities.map((amenity) => (
                  <View key={amenity} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </AppCard>

          <AppCard style={styles.card}>
            <SectionHeader title="Allocated Room & Bed" />
            <View style={styles.statStrip}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>ROOM</Text>
                <Text style={styles.statVal}>Room {assignedRoom.roomNumber}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>BED</Text>
                <Text style={styles.statVal}>Bed {assignedRoom.bedNumber}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>FLOOR</Text>
                <Text style={styles.statVal}>Floor {assignedRoom.floorNumber}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Room Sharing Type</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>{assignedRoom.roomType.replace('_', ' ')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Facilities</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>
                {[
                  assignedRoom.hasAttachedBathroom ? 'Attached Bath' : 'Shared Bath',
                  assignedRoom.hasBalcony ? 'Balcony' : null,
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Check-In Date</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>{formatDateShort(assignedRoom.checkInDate)}</Text>
            </View>
          </AppCard>

          <AppCard style={styles.card}>
            <SectionHeader title="Fixed Monthly Rent & Billing Terms" />
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Fixed Agreed Monthly Rent</Text>
              <Text style={styles.rentHighlight}>{formatINR(assignedRoom.agreedMonthlyRent)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Security Deposit</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>{formatINR(assignedRoom.securityDepositAmount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Monthly Billing Day</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>Day {assignedRoom.defaultBillingDay} of each month</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Next Due Date</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>
                {assignedRoom.nextDueDate ? formatDateShort(assignedRoom.nextDueDate) : 'No open dues'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={TYPOGRAPHY.caption}>Grace Period & Late Fee</Text>
              <Text style={TYPOGRAPHY.bodyMedium}>
                {assignedRoom.gracePeriodDays} days / {formatINR(assignedRoom.lateFeeAmount)}
              </Text>
            </View>
            <Text style={styles.agreementNote}>
              Your fixed monthly rent was locked when your room was assigned. Room catalog price changes do not modify this agreement unless a Rent Revision Agreement is mutually accepted.
            </Text>
          </AppCard>

          {pendingRevisions.length > 0 ? (
            <>
              <SectionHeader title="Pending Rent Revision Proposals" />
              {pendingRevisions.map((rev) => (
                <AppCard key={rev.id} highlighted style={styles.card}>
                  <View style={styles.headerRow}>
                    <Text style={TYPOGRAPHY.h3}>Rent Revision Proposal</Text>
                    <StatusBadge label="ACTION REQUIRED" tone="accent" />
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={TYPOGRAPHY.caption}>Current Fixed Rent</Text>
                    <Text style={TYPOGRAPHY.bodyMedium}>{formatINR(rev.previousMonthlyRent)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={TYPOGRAPHY.caption}>Proposed Monthly Rent</Text>
                    <Text style={styles.rentHighlight}>{formatINR(rev.proposedMonthlyRent)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={TYPOGRAPHY.caption}>Effective From</Text>
                    <Text style={TYPOGRAPHY.bodyMedium}>{formatDateShort(rev.effectiveDate)}</Text>
                  </View>
                  <Text style={TYPOGRAPHY.body}>Reason: {rev.reason}</Text>
                  <View style={styles.actionRow}>
                    <AppButton
                      label="Accept Revision"
                      onPress={() => handleRevisionDecision(rev.id, true)}
                      loading={mutating}
                      testID={`accept-revision-${rev.id}`}
                      style={styles.flexBtn}
                    />
                    <AppButton
                      label="Reject Revision"
                      variant="secondary"
                      onPress={() => handleRevisionDecision(rev.id, false)}
                      loading={mutating}
                      testID={`reject-revision-${rev.id}`}
                      style={styles.flexBtn}
                    />
                  </View>
                </AppCard>
              ))}
            </>
          ) : null}

          {pastRevisions.length > 0 ? (
            <>
              <SectionHeader title="Rent Revision History" />
              {pastRevisions.map((rev) => (
                <AppCard key={rev.id} style={styles.card}>
                  <View style={styles.headerRow}>
                    <Text style={TYPOGRAPHY.h3}>
                      {formatINR(rev.previousMonthlyRent)} to {formatINR(rev.proposedMonthlyRent)}
                    </Text>
                    <StatusBadge
                      label={rev.status}
                      tone={rev.status === 'ACCEPTED' ? 'navy' : 'accent'}
                    />
                  </View>
                  <Text style={TYPOGRAPHY.caption}>
                    Effective: {formatDateShort(rev.effectiveDate)} | {rev.reason}
                  </Text>
                </AppCard>
              ))}
            </>
          ) : null}
        </>
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.navyBorder,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  rentHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.tangerineHover,
  },
  agreementNote: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.midnightNavyMuted,
    marginTop: 4,
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 4,
  },
  amenityChip: {
    backgroundColor: COLORS.iceBlueShade,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.midnightNavy,
  },
  statStrip: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.midnightNavy,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tangerine,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.iceBlue,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
});
