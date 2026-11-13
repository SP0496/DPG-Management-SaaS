import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { NotificationsModal } from '../../components/NotificationsModal';
import { SectionHeader } from '../../components/SectionHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';

export const ResidentHomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const {
    residentDashboard,
    announcements,
    notifications,
    unreadNotificationsCount,
    paymentSubmissions,
    markNotificationRead,
    markAllNotificationsRead,
    loading,
    refreshing,
    error,
    clearError,
    refreshAll,
  } = usePortalData();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  if (loading && !residentDashboard) {
    return <LoadingView message="Loading your PG stay summary and dues..." />;
  }

  const assignedRoom = residentDashboard?.assignedRoom;
  const outstandingAmount = residentDashboard?.outstandingBalance ?? 0;
  const overdueCount = residentDashboard?.overdueInvoicesCount ?? 0;
  const openComplaints = residentDashboard?.openComplaintsCount ?? 0;
  const resolvedComplaints = residentDashboard?.resolvedComplaintsCount ?? 0;
  const activeNoticesCount = residentDashboard?.activeAnnouncementsCount ?? announcements.length;
  const nextDueDate = residentDashboard?.nextDueDate;
  const nextDueLabel = nextDueDate ? `Due ${formatDateShort(nextDueDate)}` : 'No dues pending';
  const recentAnnouncements =
    residentDashboard?.recentAnnouncements && residentDashboard.recentAnnouncements.length > 0
      ? residentDashboard.recentAnnouncements
      : announcements;

  const hasPendingVerification = paymentSubmissions.some(
    (s) => s.status === 'PENDING_VERIFICATION'
  );
  const hasConfirmedSubmission = paymentSubmissions.some((s) => s.status === 'CONFIRMED');

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.titleBlock}>
            <Text style={styles.welcomeLabel}>RESIDENT PORTAL</Text>
            <Text style={styles.residentName}>
              {residentDashboard?.profile?.fullName || user?.fullName || 'PG Resident'}
            </Text>
            <Text style={styles.propertySub}>
              {assignedRoom
                ? `${assignedRoom.propertyName} - Room ${assignedRoom.roomNumber} (${assignedRoom.bedNumber})`
                : 'Awaiting room and bed allocation'}
            </Text>
          </View>
          <View style={styles.heroActionsRight}>
            <Pressable
              onPress={() => setNotificationsOpen(true)}
              style={styles.bellButton}
              testID="resident-notifications-button"
            >
              <Ionicons name="notifications-outline" size={18} color={COLORS.midnightNavy} />
              <Text style={styles.bellCount}>{unreadNotificationsCount}</Text>
            </Pressable>
            <StatusBadge
              label={residentDashboard?.profile?.kycVerified ? 'VERIFIED' : 'ACTIVE'}
              tone="accent"
            />
          </View>
        </View>

        {assignedRoom ? (
          <View style={styles.staySummaryStrip}>
            <View style={styles.stayItem}>
              <Text style={styles.stayLabel}>CHECK-IN</Text>
              <Text style={styles.stayValue}>{formatDateShort(assignedRoom.checkInDate)}</Text>
            </View>
            <View style={styles.stayItem}>
              <Text style={styles.stayLabel}>NEXT DUE</Text>
              <Text style={styles.stayValue}>
                {nextDueDate ? formatDateShort(nextDueDate) : 'No pending dues'}
              </Text>
            </View>
            <View style={styles.stayItem}>
              <Text style={styles.stayLabel}>NEXT DUE BILL</Text>
              <Text style={styles.stayValue}>
                {residentDashboard?.nextDueAmount
                  ? formatINR(residentDashboard.nextDueAmount)
                  : formatINR(assignedRoom.agreedMonthlyRent)}
              </Text>
            </View>
            <View style={styles.stayItem}>
              <Text style={styles.stayLabel}>FLOOR / SHARING</Text>
              <Text style={styles.stayValue}>
                F{assignedRoom.floorNumber} | {assignedRoom.roomType.replace('_', ' ')}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {hasPendingVerification ? (
        <AppCard highlighted style={styles.card}>
          <Text style={TYPOGRAPHY.h3}>Payment Submitted / Awaiting Verification</Text>
          <Text style={TYPOGRAPHY.caption}>
            Your rent transfer UTR has been sent to the PG owner for bank statement verification.
          </Text>
          <AppButton
            label="Track Verification Status"
            onPress={() => navigation?.navigate('MyPayments')}
          />
        </AppCard>
      ) : hasConfirmedSubmission ? (
        <AppCard highlighted style={styles.card}>
          <Text style={TYPOGRAPHY.h3}>Verified Rent Receipt Ready</Text>
          <Text style={TYPOGRAPHY.caption}>
            Your recent payment was verified by the PG owner. Download your official receipt PDF anytime.
          </Text>
          <AppButton
            label="View Verified Payments"
            variant="secondary"
            onPress={() => navigation?.navigate('MyPayments')}
          />
        </AppCard>
      ) : null}

      {error ? (
        <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} />
      ) : null}

      <View style={styles.grid}>
        <StatCard
          label="Balance Due"
          value={formatINR(outstandingAmount)}
          caption={
            overdueCount > 0
              ? `${overdueCount} overdue (${formatINR(residentDashboard?.overdueBalance ?? 0)})`
              : `${residentDashboard?.pendingInvoicesCount ?? 0} pending bills`
          }
          iconName="receipt"
          accent={outstandingAmount > 0}
          onPress={() => navigation?.navigate('MyPayments')}
        />
        <StatCard
          label="Monthly Rent"
          value={assignedRoom ? formatINR(assignedRoom.agreedMonthlyRent) : '-'}
          caption={nextDueLabel}
          iconName="bed"
          onPress={() => navigation?.navigate('MyRoom')}
        />
        <StatCard
          label="Open Complaints"
          value={String(openComplaints)}
          caption={`${resolvedComplaints} resolved`}
          iconName="construct"
          onPress={() => navigation?.navigate('ResidentComplaints')}
        />
        <StatCard
          label="Notices"
          value={String(activeNoticesCount)}
          caption="Active updates"
          iconName="megaphone"
          onPress={() => navigation?.navigate('Announcements')}
        />
      </View>

      <SectionHeader title="Quick Links" />
      <View style={styles.quickRow}>
        <AppButton
          label="My Room & Property"
          onPress={() => navigation?.navigate('MyRoom')}
          style={styles.flexBtn}
        />
        <AppButton
          label="Rent Invoices"
          variant="secondary"
          onPress={() => navigation?.navigate('MyPayments')}
          style={styles.flexBtn}
        />
      </View>
      <View style={styles.quickRow}>
        <AppButton
          label="Receipts & History"
          variant="secondary"
          onPress={() => navigation?.navigate('PaymentHistory')}
          style={styles.flexBtn}
        />
        <AppButton
          label="Weekly Food Menu"
          variant="secondary"
          onPress={() => navigation?.navigate('FoodMenu')}
          style={styles.flexBtn}
        />
      </View>

      <SectionHeader
        title="Latest PG Announcements"
        actionLabel="See All"
        onActionPress={() => navigation?.navigate('Announcements')}
      />
      {recentAnnouncements.length === 0 ? (
        <EmptyState
          iconName="megaphone-outline"
          title="No New Announcements"
          message="Notices published by your PG owner will appear here."
        />
      ) : (
        recentAnnouncements.slice(0, 3).map((ann) => (
          <AppCard key={ann.id} highlighted={ann.priority === 'URGENT'} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={TYPOGRAPHY.h3}>{ann.title}</Text>
              <StatusBadge
                label={ann.priority}
                tone={ann.priority === 'URGENT' ? 'accent' : 'navy'}
              />
            </View>
            <Text style={TYPOGRAPHY.body} numberOfLines={2}>
              {ann.content}
            </Text>
            <Text style={TYPOGRAPHY.caption}>{formatDateShort(ann.createdAt)}</Text>
          </AppCard>
        ))
      )}

      <NotificationsModal
        visible={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkRead={async (id) => {
          await markNotificationRead(id);
        }}
        onMarkAllRead={async () => {
          await markAllNotificationsRead();
        }}
        onOpenNotificationTarget={(notif) => {
          if (notif.targetType === 'RENT_REVISION') {
            navigation?.navigate('MyRoom');
          } else {
            navigation?.navigate('MyPayments');
          }
        }}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.midnightNavy,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  heroActionsRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  bellButton: {
    backgroundColor: COLORS.tangerine,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bellCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  welcomeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tangerine,
    letterSpacing: 0.6,
  },
  residentName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.iceBlue,
  },
  propertySub: {
    fontSize: 13,
    color: COLORS.iceBlueShade,
  },
  staySummaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.midnightNavyHover,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  stayItem: {
    flex: 1,
    gap: 2,
  },
  stayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tangerine,
    letterSpacing: 0.4,
  },
  stayValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.iceBlue,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  flexBtn: {
    flex: 1,
  },
  card: {
    gap: SPACING.xs,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
