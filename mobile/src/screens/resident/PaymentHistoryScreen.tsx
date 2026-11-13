import React, { useState } from 'react';
import { Modal, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
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
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { PaymentReceiptData } from '../../types/domain';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';
import { downloadAndReportReceiptPdf } from '../../utils/pdfDownloader';

export const PaymentHistoryScreen: React.FC = () => {
  const {
    payments,
    paymentsMeta,
    paymentSubmissions,
    activeReceipt,
    loading,
    refreshing,
    error,
    clearError,
    refreshAll,
    fetchPayments,
    fetchPaymentReceipt,
    downloadPaymentReceipt,
    clearActiveReceipt,
  } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [receiptActionNote, setReceiptActionNote] = useState<string | null>(null);

  const handleSearch = async () => {
    await fetchPayments({ search: searchQuery.trim() || undefined, page: 0 });
  };

  const handleViewReceipt = async (paymentId: string) => {
    setBusyPaymentId(paymentId);
    try {
      await fetchPaymentReceipt(paymentId);
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleDownloadReceipt = async (paymentId: string, receiptHint?: PaymentReceiptData) => {
    setBusyPaymentId(paymentId);
    try {
      const html = await downloadPaymentReceipt(paymentId);
      await Share.share({
        title: receiptHint?.receiptNumber ?? 'PG Rent Payment Receipt',
        message: html,
      });
      setReceiptActionNote('Official Rent Receipt prepared for sharing and download.');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const handleDownloadPdf = async (params: {
    id: string;
    paymentId?: string;
    submissionId?: string;
    receiptNumber: string;
  }) => {
    setBusyPaymentId(params.id);
    try {
      const res = await downloadAndReportReceiptPdf({
        paymentId: params.paymentId,
        submissionId: params.submissionId,
        receiptNumber: params.receiptNumber,
      });
      setReceiptActionNote(`Official receipt PDF downloaded: ${res.filename}.`);
    } finally {
      setBusyPaymentId(null);
    }
  };

  if (loading && payments.length === 0 && paymentSubmissions.length === 0) {
    return <LoadingView message="Loading verified payment history and receipts..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader title="Payment History & Verified Receipts" />

      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}
      {receiptActionNote ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{receiptActionNote}</Text>
        </AppCard>
      ) : null}

      <AppCard style={styles.searchCard}>
        <AppInput
          label="Search by Reference Number or Notes"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="UTR or RCP-..."
          testID="payment-history-search"
        />
        <AppButton label="Search History" variant="secondary" onPress={handleSearch} />
      </AppCard>

      {paymentSubmissions.length > 0 ? (
        <>
          <SectionHeader title="Direct Transfer Verification Trail" />
          {paymentSubmissions.map((sub) => (
            <AppCard key={sub.id} highlighted={sub.status === 'PENDING_VERIFICATION'} style={styles.card}>
              <View style={styles.row}>
                <View>
                  <Text style={TYPOGRAPHY.h3}>{formatINR(sub.amount)}</Text>
                  <Text style={TYPOGRAPHY.caption}>
                    {sub.invoiceNumber} | UTR: {sub.utrReference}
                  </Text>
                </View>
                <StatusBadge
                  label={sub.status}
                  tone={sub.status === 'CONFIRMED' ? 'navy' : 'accent'}
                />
              </View>
              <Text style={TYPOGRAPHY.caption}>
                Submitted: {formatDateShort(sub.submittedAt)} | Method: {sub.paymentMethod}
              </Text>
              {sub.status === 'CONFIRMED' ? (
                <AppButton
                  label="Download Receipt PDF"
                  onPress={() =>
                    handleDownloadPdf({
                      id: sub.id,
                      submissionId: sub.id,
                      receiptNumber: sub.receiptNumber || sub.utrReference,
                    })
                  }
                  loading={busyPaymentId === sub.id}
                  testID={`history-submission-pdf-${sub.id}`}
                />
              ) : sub.status === 'REJECTED' ? (
                <Text style={TYPOGRAPHY.body}>
                  Rejected: {sub.rejectionReason || 'Not matched with owner bank statement'}
                </Text>
              ) : (
                <Text style={TYPOGRAPHY.caption}>
                  Awaiting PG owner bank statement confirmation.
                </Text>
              )}
            </AppCard>
          ))}
        </>
      ) : null}

      <SectionHeader title="Confirmed Payment Records" />
      {payments.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="No Verified Payments Yet"
          message="Your confirmed PG rent payments and official downloadable receipts appear here."
        />
      ) : (
        payments.map((pay) => (
          <AppCard key={pay.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={TYPOGRAPHY.h2}>{formatINR(pay.amount)}</Text>
              <StatusBadge label={pay.paymentMethod.replace('_', ' ')} tone="navy" />
            </View>

            <Text style={TYPOGRAPHY.caption}>
              Paid On: {formatDateShort(pay.paidAt)} | Ref: {pay.referenceNumber || 'N/A'}
            </Text>
            {pay.notes ? <Text style={TYPOGRAPHY.body}>{pay.notes}</Text> : null}

            <View style={styles.actionRow}>
              <AppButton
                label="View Receipt"
                variant="secondary"
                onPress={() => handleViewReceipt(pay.id)}
                loading={busyPaymentId === pay.id}
                testID={`view-receipt-${pay.id}`}
                style={styles.flexBtn}
              />
              <AppButton
                label="Download Receipt"
                onPress={() => handleDownloadReceipt(pay.id)}
                loading={busyPaymentId === pay.id}
                testID={`download-receipt-${pay.id}`}
                style={styles.flexBtn}
              />
            </View>
            <AppButton
              label="Download Receipt PDF"
              variant="secondary"
              onPress={() =>
                handleDownloadPdf({
                  id: `pdf-${pay.id}`,
                  paymentId: pay.id,
                  receiptNumber: pay.referenceNumber || pay.id,
                })
              }
              loading={busyPaymentId === `pdf-${pay.id}`}
              testID={`download-receipt-pdf-${pay.id}`}
            />
          </AppCard>
        ))
      )}

      {paymentsMeta.hasNext ? (
        <AppButton
          label={`Load More Payments (${payments.length}/${paymentsMeta.totalElements})`}
          variant="secondary"
          onPress={() =>
            fetchPayments({
              search: searchQuery.trim() || undefined,
              page: paymentsMeta.page + 1,
              append: true,
            })
          }
        />
      ) : null}

      <Modal
        visible={Boolean(activeReceipt)}
        transparent
        animationType="slide"
        onRequestClose={clearActiveReceipt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {activeReceipt ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.receiptTag}>OFFICIAL RENT RECEIPT</Text>
                    <Text style={styles.receiptNum}>{activeReceipt.receiptNumber}</Text>
                  </View>
                  <StatusBadge label={activeReceipt.status} tone="accent" />
                </View>

                <View style={styles.detailBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Property</Text>
                    <Text style={styles.detailValue}>{activeReceipt.propertyName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Room & Bed</Text>
                    <Text style={styles.detailValue}>
                      Room {activeReceipt.roomNumber} / Bed {activeReceipt.bedNumber}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Invoice</Text>
                    <Text style={styles.detailValue}>{activeReceipt.invoiceNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Billing Month</Text>
                    <Text style={styles.detailValue}>{formatDateShort(activeReceipt.billingMonth)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Resident</Text>
                    <Text style={styles.detailValue}>{activeReceipt.residentName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PG Management</Text>
                    <Text style={styles.detailValue}>{activeReceipt.ownerBusinessName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailValue}>
                      {activeReceipt.paymentMethod.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference</Text>
                    <Text style={styles.detailValue}>{activeReceipt.referenceNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Paid Date</Text>
                    <Text style={styles.detailValue}>{formatDateShort(activeReceipt.paidAt)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Amount Paid</Text>
                    <Text style={styles.totalValue}>{formatINR(activeReceipt.amount)}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <AppButton
                    label="Share / Save Receipt"
                    onPress={() => handleDownloadReceipt(activeReceipt.paymentId, activeReceipt)}
                    loading={busyPaymentId === activeReceipt.paymentId}
                    style={styles.flexBtn}
                  />
                  <AppButton
                    label="Close"
                    variant="secondary"
                    onPress={clearActiveReceipt}
                    style={styles.flexBtn}
                  />
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  searchCard: { gap: SPACING.sm },
  card: { gap: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  flexBtn: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 43, 74, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.iceBlue,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    maxHeight: '85%',
    borderTopWidth: 2,
    borderColor: COLORS.tangerine,
  },
  modalContent: { padding: SPACING.lg, gap: SPACING.md },
  modalHeader: {
    backgroundColor: COLORS.midnightNavy,
    borderRadius: RADII.md,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptTag: { fontSize: 11, fontWeight: '700', color: COLORS.tangerine, letterSpacing: 0.5 },
  receiptNum: { fontSize: 16, fontWeight: '700', color: COLORS.iceBlue, marginTop: 2 },
  detailBox: {
    backgroundColor: COLORS.iceBlueShade,
    borderRadius: RADII.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  detailLabel: { fontSize: 13, color: COLORS.midnightNavyMuted },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.midnightNavy, textAlign: 'right', flexShrink: 1 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.navyBorder,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.midnightNavy },
  totalValue: { fontSize: 18, fontWeight: '700', color: COLORS.tangerineHover },
});
