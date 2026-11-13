import React, { useState } from 'react';
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
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { AnnouncementPriority } from '../../types/domain';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';

const PRIORITIES: { value: AnnouncementPriority; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'IMPORTANT', label: 'Important' },
  { value: 'URGENT', label: 'Urgent' },
];

export const ReportsScreen: React.FC = () => {
  const {
    dashboardStats,
    properties,
    rooms,
    announcements,
    announcementsMeta,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchAnnouncements,
    createAnnouncement,
    deactivateAnnouncement,
  } = usePortalData();

  const [showPublishForm, setShowPublishForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('IMPORTANT');
  const [selectedPropId, setSelectedPropId] = useState<string>('ALL');
  const [searchAnn, setSearchAnn] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handlePublishAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      setFeedback('Enter both announcement title and message body.');
      return;
    }
    const created = await createAnnouncement({
      propertyId: selectedPropId === 'ALL' ? undefined : selectedPropId,
      title: title.trim(),
      content: content.trim(),
      priority,
    });
    setFeedback(`Published announcement: ${created.title}`);
    setTitle('');
    setContent('');
    setShowPublishForm(false);
  };

  if (loading && !dashboardStats) {
    return <LoadingView fullscreen message="Loading analytics and notices..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="Portfolio Reports & Occupancy" />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      <View style={styles.grid}>
        <StatCard
          label="Occupancy Rate"
          value={`${(dashboardStats?.occupancyPercentage ?? 0).toFixed(1)}%`}
          caption={`${dashboardStats?.occupiedBeds ?? 0} occupied`}
          iconName="pie-chart"
          accent
        />
        <StatCard
          label="Pending Rent"
          value={formatINR(dashboardStats?.pendingRentTotal)}
          caption={`${dashboardStats?.overdueInvoicesCount ?? 0} overdue`}
          iconName="cash-outline"
        />
      </View>

      <SectionHeader title="Property-Wise Bed Occupancy" />
      {properties.length === 0 ? (
        <EmptyState
          iconName="analytics-outline"
          title="No Properties to Report"
          message="Add PG properties and rooms to monitor floor-by-floor occupancy."
        />
      ) : (
        properties.map((prop) => {
          const propRooms = rooms.filter((r) => r.propertyId === prop.id);
          const totalBeds = propRooms.reduce((acc, r) => acc + r.totalBeds, 0);
          const occupiedBeds = propRooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
          const rate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
          return (
            <AppCard key={prop.id} style={styles.propReportCard}>
              <View style={styles.headerRow}>
                <Text style={TYPOGRAPHY.h3}>{prop.name}</Text>
                <StatusBadge label={`${rate}% Occupied`} tone="accent" />
              </View>
              <Text style={TYPOGRAPHY.caption}>
                {propRooms.length} rooms | {occupiedBeds}/{totalBeds} beds occupied | {prop.city}
              </Text>
            </AppCard>
          );
        })
      )}

      <SectionHeader
        title="Announcements Notice Board"
        actionLabel={showPublishForm ? 'Close' : 'Publish Notice'}
        onActionPress={() => setShowPublishForm((p) => !p)}
      />

      {showPublishForm ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Publish New Announcement</Text>
          <FilterChips
            options={[
              { value: 'ALL', label: 'All PGs' },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
            selectedValue={selectedPropId}
            onSelect={setSelectedPropId}
          />
          <FilterChips options={PRIORITIES} selectedValue={priority} onSelect={setPriority} />
          <AppInput label="Notice Title" value={title} onChangeText={setTitle} placeholder="Water Tank Maintenance" testID="announcement-title-input" />
          <AppInput label="Announcement Content" value={content} onChangeText={setContent} placeholder="Supply paused tomorrow 11 AM to 1 PM." multiline testID="announcement-content-input" />
          <AppButton label="Publish Announcement" onPress={handlePublishAnnouncement} loading={mutating} testID="publish-announcement-button" />
        </AppCard>
      ) : null}

      <AppCard style={styles.formCard}>
        <AppInput label="Search Notices" value={searchAnn} onChangeText={setSearchAnn} placeholder="Search published notices..." />
        <AppButton label="Filter Notices" variant="secondary" onPress={() => fetchAnnouncements({ search: searchAnn.trim() || undefined, page: 0 })} />
      </AppCard>

      {announcements.length === 0 ? (
        <EmptyState
          iconName="megaphone-outline"
          title="No Active Notices"
          message="Publish announcements here to broadcast updates directly to resident devices."
        />
      ) : (
        announcements.map((ann) => (
          <AppCard key={ann.id} style={styles.propReportCard}>
            <View style={styles.headerRow}>
              <Text style={TYPOGRAPHY.h3}>{ann.title}</Text>
              <StatusBadge label={ann.priority} tone={ann.priority === 'URGENT' ? 'accent' : 'navy'} />
            </View>
            <Text style={TYPOGRAPHY.body}>{ann.content}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.dateText}>Published {formatDateShort(ann.createdAt)}</Text>
              <AppButton label="Deactivate" variant="secondary" onPress={() => deactivateAnnouncement(ann.id)} />
            </View>
          </AppCard>
        ))
      )}

      {announcementsMeta.hasNext ? (
        <AppButton
          label="Load More Announcements"
          variant="secondary"
          onPress={() => fetchAnnouncements({ search: searchAnn.trim() || undefined, page: announcementsMeta.page + 1, append: true })}
        />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: SPACING.md },
  propReportCard: { gap: SPACING.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  formCard: { gap: SPACING.sm },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.xs },
  dateText: { fontSize: 11, color: COLORS.midnightNavyMuted },
});
