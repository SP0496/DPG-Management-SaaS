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
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../types/domain';
import { formatDateShort } from '../../utils/displayFormatters';

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'INTERNET', label: 'WiFi' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES: { value: ComplaintPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

type ComplaintStatusFilter = 'ALL' | ComplaintStatus;

const STATUS_FILTERS: { value: ComplaintStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export const ResidentComplaintsScreen: React.FC = () => {
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
    createComplaint,
  } = usePortalData();

  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('PLUMBING');
  const [priority, setPriority] = useState<ComplaintPriority>('HIGH');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStatusFilter = async (next: ComplaintStatusFilter) => {
    setStatusFilter(next);
    await fetchComplaints({
      status: next === 'ALL' ? undefined : next,
      page: 0,
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setFeedback('Enter a short issue title and details before submitting.');
      return;
    }
    await createComplaint({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
    });
    setFeedback('Complaint submitted to your PG owner.');
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  if (loading && complaints.length === 0) {
    return <LoadingView fullscreen message="Loading your complaints..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader
        title="My Maintenance Complaints"
        actionLabel={showForm ? 'Close' : 'Raise Issue'}
        onActionPress={() => setShowForm((p) => !p)}
      />

      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      {showForm ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Log a Maintenance Request</Text>
          <FilterChips options={CATEGORIES} selectedValue={category} onSelect={setCategory} />
          <FilterChips options={PRIORITIES} selectedValue={priority} onSelect={setPriority} />
          <AppInput
            label="Issue Title"
            value={title}
            onChangeText={setTitle}
            placeholder="AC cooling issue in room"
            testID="resident-complaint-title"
          />
          <AppInput
            label="Issue Details"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the problem..."
            multiline
            testID="resident-complaint-description"
          />
          <AppButton
            label="Submit Complaint"
            onPress={handleSubmit}
            loading={mutating}
            testID="submit-complaint-button"
          />
        </AppCard>
      ) : null}

      <FilterChips
        options={STATUS_FILTERS}
        selectedValue={statusFilter}
        onSelect={handleStatusFilter}
      />

      {complaints.length === 0 ? (
        <EmptyState
          iconName="chatbubbles-outline"
          title="No Complaints Submitted"
          message="Need repairs or maintenance in your room? Tap Raise Issue to notify your PG owner."
          actionLabel="Raise Issue"
          onActionPress={() => setShowForm(true)}
        />
      ) : (
        complaints.map((c) => (
          <AppCard key={c.id} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={TYPOGRAPHY.h3}>{c.title}</Text>
              <StatusBadge
                label={c.status.replace('_', ' ')}
                tone={c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'navy' : 'accent'}
              />
            </View>
            <Text style={TYPOGRAPHY.body}>{c.description}</Text>
            <Text style={TYPOGRAPHY.caption}>
              {c.category} | {c.priority} | Raised {formatDateShort(c.createdAt)}
            </Text>
            {c.resolutionNotes ? (
              <Text style={TYPOGRAPHY.caption}>Owner Resolution Note: {c.resolutionNotes}</Text>
            ) : null}
          </AppCard>
        ))
      )}

      {complaintsMeta.hasNext ? (
        <AppButton
          label="Load More Complaints"
          variant="secondary"
          onPress={() =>
            fetchComplaints({
              status: statusFilter === 'ALL' ? undefined : statusFilter,
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
  formCard: { gap: SPACING.sm },
  card: { gap: SPACING.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
});
