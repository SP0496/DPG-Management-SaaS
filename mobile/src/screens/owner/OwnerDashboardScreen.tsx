import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
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
import { OwnerStackParamList } from '../../navigation/OwnerNavigator';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';

export const OwnerDashboardScreen: React.FC<{ navigation?: any }> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OwnerStackParamList>>();
  const { user } = useAuth();
  const {
    dashboardStats,
    ownerProfile,
    announcements,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    loading,
    refreshing,
    error,
    clearError,
    refreshAll,
  } = usePortalData();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  if (loading && !dashboardStats) {
    return <LoadingView fullscreen message="Loading PG dashboard..." />;
  }

  const stats = dashboardStats;
  const recentAnnouncements = announcements.slice(0, 3);
  const pendingVerifyCount = stats?.pendingVerificationCount ?? 0;

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroTitleCol}>
            <Text style={styles.greeting}>OWNER PORTAL</Text>
            <Text style={styles.businessName}>
              {ownerProfile?.businessName || `${user?.fullName || 'PG Owner'}'s PG`}
            </Text>
            <Text style={styles.subline}>
              Live database sync | {stats?.totalProperties ?? 0} properties |{' '}
              {stats?.occupancyPercentage ?? 0}% occupancy
            </Text>
          </View>
          <Pressable
            onPress={() => setNotificationsOpen(true)}
            style={styles.bellButton}
            testID="owner-notifications-button"
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.midnightNavy} />
            <Text style={styles.bellText}>
              {unreadNotificationsCount > 0 ? String(unreadNotificationsCount) : '0'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.rentStrip}>
          <View style={styles.rentStripCol}>
            <Text style={styles.rentStripLabel}>EXPECTED RENT</Text>
            <Text style={styles.rentStripVal}>
              {formatINR(stats?.expectedMonthlyRent ?? 0)}
            </Text>
          </View>
          <View style={styles.rentStripCol}>
            <Text style={styles.rentStripLabel}>PAID / PENDING</Text>
            <Text style={styles.rentStripVal}>
              {stats?.paidResidentsCount ?? 0} / {stats?.pendingResidentsCount ?? 0} residents
            </Text>
          </View>
          <View style={styles.rentStripCol}>
            <Text style={styles.rentStripLabel}>VERIFY QUEUE</Text>
            <Text style={styles.rentStripVal}>{pendingVerifyCount} awaiting</Text>
          </View>
        </View>
      </View>

      {pendingVerifyCount > 0 ? (
        <AppCard highlighted style={styles.verifyAlertCard}>
          <View style={styles.itemHeader}>
            <View style={{ flex: 1 }}>
              <Text style={TYPOGRAPHY.h3}>
                {pendingVerifyCount} Payment{pendingVerifyCount === 1 ? '' : 's'} Pending Verification
              </Text>
              <Text style={TYPOGRAPHY.caption}>
                Check your bank statement and confirm or reject UTR references.
              </Text>
            </View>
            <StatusBadge label="ACTION" tone="accent" />
          </View>
          <AppButton
            label="Verify Payments Now"
            onPress={() => navigation.navigate('OwnerPayments')}
            testID="verify-payments-shortcut-button"
          />
        </AppCard>
      ) : null}

      {error ? (
        <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} />
      ) : null}

      <View style={styles.grid}>
        <StatCard
          label="Occupied Beds"
          value={`${stats?.occupiedBeds ?? 0}/${stats?.totalBeds ?? 0}`}
          caption={`${stats?.vacantBeds ?? 0} vacant | ${stats?.maintenanceBeds ?? 0} maint.`}
          iconName="bed"
          onPress={() => navigation.navigate('RoomsBeds', {})}
        />
        <StatCard
          label="Active Residents"
          value={String(stats?.totalResidents ?? 0)}
          caption={`${stats?.activeBookings ?? 0} active stays`}
          iconName="people"
          onPress={() => navigation.navigate('Residents' as never)}
        />
        <StatCard
          label="Collected (Month)"
          value={formatINR(stats?.collectedThisMonth ?? 0)}
          caption={`${stats?.pendingKycCount ?? 0} KYC pending`}
          iconName="wallet"
          onPress={() => navigation.navigate('OwnerPayments')}
        />
        <StatCard
          label="Pending Rent"
          value={formatINR(stats?.pendingRentTotal ?? 0)}
          caption={`Overdue: ${formatINR(stats?.overdueRentTotal ?? 0)}`}
          iconName="alert-circle"
          accent={(stats?.overdueInvoicesCount ?? 0) > 0}
          onPress={() => navigation.navigate('RentManagement' as never)}
        />
      </View>

      <SectionHeader title="Quick Owner Actions" />
      <View style={styles.quickRow}>
        <AppButton
          label="Add Property"
          onPress={() => navigation.navigate('Properties' as never)}
          style={styles.quickBtn}
        />
        <AppButton
          label="Rooms & Beds"
          variant="secondary"
          onPress={() => navigation.navigate('RoomsBeds', {})}
          style={styles.quickBtn}
        />
      </View>
      <View style={styles.quickRow}>
        <AppButton
          label="Verify & Ledger"
          variant="secondary"
          onPress={() => navigation.navigate('OwnerPayments')}
          style={styles.quickBtn}
        />
        <AppButton
          label="Complaints"
          variant="secondary"
          onPress={() => navigation.navigate('OwnerComplaints')}
          style={styles.quickBtn}
        />
      </View>
      <AppButton
        label={`Open Financial & Occupancy Reports (${stats?.openComplaintsCount ?? 0} open issues)`}
        variant="secondary"
        onPress={() => navigation.navigate('Reports')}
      />

      <SectionHeader title="Recent PG Announcements" />
      {recentAnnouncements.length === 0 ? (
        <EmptyState
          iconName="megaphone-outline"
          title="No Active Announcements"
          message="Publish notices from Reports & Notices to inform all residents."
        />
      ) : (
        recentAnnouncements.map((ann) => (
          <AppCard key={ann.id} highlighted={ann.priority === 'URGENT'}>
            <View style={styles.itemHeader}>
              <Text style={TYPOGRAPHY.h3}>{ann.title}</Text>
              <StatusBadge
                label={ann.priority}
                tone={ann.priority === 'URGENT' ? 'accent' : 'navy'}
              />
            </View>
            <Text style={TYPOGRAPHY.body}>{ann.content}</Text>
            <Text style={styles.dateNote}>{formatDateShort(ann.createdAt)}</Text>
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
          if (notif.transactionSubmissionId || notif.targetType === 'PAYMENT_SUBMISSION') {
            navigation.navigate('OwnerPayments');
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
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  heroTitleCol: {
    flex: 1,
    gap: 4,
  },
  bellButton: {
    backgroundColor: COLORS.tangerine,
    borderRadius: RADII.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bellText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.tangerine,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.iceBlue,
  },
  subline: {
    fontSize: 12,
    color: COLORS.iceBlueShade,
  },
  rentStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.midnightNavyHover,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  rentStripCol: {
    flex: 1,
    gap: 2,
  },
  rentStripLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tangerine,
    letterSpacing: 0.4,
  },
  rentStripVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.iceBlue,
  },
  verifyAlertCard: {
    gap: SPACING.sm,
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
  quickBtn: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  dateNote: {
    marginTop: SPACING.xs,
    fontSize: 11,
    color: COLORS.midnightNavyMuted,
  },
});
