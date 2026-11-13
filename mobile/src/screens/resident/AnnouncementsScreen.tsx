import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { formatDateShort } from '../../utils/displayFormatters';

export const AnnouncementsScreen: React.FC = () => {
  const {
    announcements,
    announcementsMeta,
    loading,
    refreshing,
    error,
    clearError,
    refreshAll,
    fetchAnnouncements,
  } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');

  if (loading && announcements.length === 0) {
    return <LoadingView fullscreen message="Loading PG announcements..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="PG Announcements" />

      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}

      <AppCard style={styles.searchCard}>
        <AppInput label="Search Notices" value={searchQuery} onChangeText={setSearchQuery} placeholder="Search title or update..." />
        <AppButton
          label="Search Notices"
          variant="secondary"
          onPress={() => fetchAnnouncements({ search: searchQuery.trim() || undefined, page: 0 })}
        />
      </AppCard>

      {announcements.length === 0 ? (
        <EmptyState
          iconName="megaphone-outline"
          title="No Announcements Yet"
          message="Important updates from your PG management appear here."
        />
      ) : (
        announcements.map((ann) => (
          <AppCard key={ann.id} highlighted={ann.priority === 'URGENT'} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={TYPOGRAPHY.h3}>{ann.title}</Text>
              <StatusBadge label={ann.priority} tone={ann.priority === 'URGENT' ? 'accent' : 'navy'} />
            </View>
            <Text style={TYPOGRAPHY.body}>{ann.content}</Text>
            <Text style={TYPOGRAPHY.caption}>Published {formatDateShort(ann.createdAt)}</Text>
          </AppCard>
        ))
      )}

      {announcementsMeta.hasNext ? (
        <AppButton
          label="Load More Announcements"
          variant="secondary"
          onPress={() =>
            fetchAnnouncements({
              search: searchQuery.trim() || undefined,
              page: announcementsMeta.page + 1,
              append: true,
            })
          }
        />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  searchCard: { gap: SPACING.sm },
  card: { gap: SPACING.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
});
