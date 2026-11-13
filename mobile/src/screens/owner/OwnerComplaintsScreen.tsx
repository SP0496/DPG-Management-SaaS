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
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ComplaintStatus } from '../../types/domain';
import { formatDateShort } from '../../utils/displayFormatters';

type StatusFilter = 'ALL' | ComplaintStatus;

export const OwnerComplaintsScreen: React.FC = () => {
  const {
    complaints,
    complaintsMeta,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchComplaints,
    updateComplaintStatus,
  } = usePortalData();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const applyFilter = async (nextStatus: StatusFilter, query: string) => {
    setStatusFilter(nextStatus);
    await fetchComplaints({
      status: nextStatus === 'ALL' ? undefined : nextStatus,
      search: query.trim() || undefined,
      page: 0,
    });
  };

  if (loading && complaints.length === 0) {
    return <LoadingView fullscreen message="Loading resident maintenance complaints..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="Maintenance Complaints" />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}

      <FilterChips
        options={[
          { value: 'ALL', label: 'All' },
          { value: 'OPEN', label: 'Open' },
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'RESOLVED', label: 'Resolved' },
        ]}
        selectedValue={statusFilter}
        onSelect={(val) => applyFilter(val, searchQuery)}
      />

      <AppCard style={styles.searchCard}>
        <AppInput label="Search Complaints" value={searchQuery} onChangeText={setSearchQuery} placeholder="Plumbing, WiFi, Electrical..." />
        <AppButton label="Search" variant="secondary" onPress={() => applyFilter(statusFilter, searchQuery)} />
      </AppCard>

      {complaints.length === 0 ? (
        <EmptyState
          iconName="construct-outline"
          title="No Complaints in Queue"
          message="Resident maintenance tickets will appear here for triage and resolution."
        />
      ) : (
        complaints.map((item) => (
          <AppCard key={item.id} highlighted={item.status === 'OPEN'} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={TYPOGRAPHY.h3}>{item.title}</Text>
              <StatusBadge label={item.status} tone={item.status === 'RESOLVED' ? 'navy' : 'accent'} />
            </View>
            <Text style={TYPOGRAPHY.body}>{item.description}</Text>
            <Text style={TYPOGRAPHY.caption}>
              Category: {item.category} | Priority: {item.priority} | Filed: {formatDateShort(item.createdAt)}
            </Text>

            {item.resolutionNotes ? (
              <Text style={TYPOGRAPHY.caption}>Resolution: {item.resolutionNotes}</Text>
            ) : null}

            {item.status !== 'RESOLVED' && item.status !== 'CLOSED' ? (
              <>
                <AppInput
                  label="Resolution Note"
                  value={notesMap[item.id] ?? ''}
                  onChangeText={(txt) => setNotesMap((prev) => ({ ...prev, [item.id]: txt }))}
                  placeholder="Technician assigned or issue fixed"
                />
                <View style={styles.actionsRow}>
                  {item.status === 'OPEN' ? (
                    <AppButton
                      label="Start Work"
                      variant="secondary"
                      loading={mutating}
                      onPress={() =>
                        updateComplaintStatus(
                          item.id,
                          'IN_PROGRESS',
                          notesMap[item.id] || 'Assigned technician for inspection.'
                        )
                      }
                      style={styles.flexBtn}
                    />
                  ) : null}
                  <AppButton
                    label="Mark Resolved"
                    loading={mutating}
                    onPress={() =>
                      updateComplaintStatus(
                        item.id,
                        'RESOLVED',
                        notesMap[item.id] || 'Issue resolved and verified.'
                      )
                    }
                    style={styles.flexBtn}
                  />
                </View>
              </>
            ) : null}
          </AppCard>
        ))
      )}

      {complaintsMeta.hasNext ? (
        <AppButton
          label={`Load More Complaints (${complaints.length}/${complaintsMeta.totalElements})`}
          variant="secondary"
          onPress={() =>
            fetchComplaints({
              status: statusFilter === 'ALL' ? undefined : statusFilter,
              search: searchQuery.trim() || undefined,
              page: complaintsMeta.page + 1,
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
  card: { gap: SPACING.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  actionsRow: { flexDirection: 'row', gap: SPACING.sm },
  flexBtn: { flex: 1 },
});
