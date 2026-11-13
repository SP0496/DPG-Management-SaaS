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
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { PaymentMethod, PaymentSubmissionStatus } from '../../types/domain';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';
import { downloadAndReportReceiptPdf } from '../../utils/pdfDownloader';

export const OwnerPaymentsScreen: React.FC = () => {
  const {
    properties,
    invoices,
    payments,
    paymentsMeta,
    paymentSubmissions,
    rentLedger,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchPayments,
    recordPayment,
    confirmPaymentSubmission,
    rejectPaymentSubmission,
    fetchRentLedger,
  } = usePortalData();

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Verification remarks & rejection reasons mapped by submissionId
  const [submissionRemarks, setSubmissionRemarks] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyReceiptId, setBusyReceiptId] = useState<string | null>(null);

  // Rent payment ledger filters
  const [ledgerPropertyId, setLedgerPropertyId] = useState<string>('ALL');
  const [ledgerFloor, setLedgerFloor] = useState('');
  const [ledgerRoom, setLedgerRoom] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerMonth, setLedgerMonth] = useState('');
  const [ledgerStatus, setLedgerStatus] = useState<'ALL' | PaymentSubmissionStatus>('ALL');

  const openInvoices = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED');

  const pendingSubmissions = useMemo(
    () => paymentSubmissions.filter((s) => s.status === 'PENDING_VERIFICATION'),
    [paymentSubmissions]
  );

  const handleRecordPayment = async () => {
    const invId = selectedInvoiceId || openInvoices[0]?.id;
    if (!invId || !amount.trim()) {
      setFeedback('Select an open invoice and enter payment amount.');
      return;
    }
    await recordPayment({
      invoiceId: invId,
      paymentMethod: method,
      amount: Number(amount),
      referenceNumber: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setShowRecordForm(false);
    setAmount('');
    setReference('');
    setNotes('');
    setFeedback('Cash / desk payment recorded and invoice balance updated.');
  };

  const handleConfirmSubmission = async (submissionId: string) => {
    const remark = (submissionRemarks[submissionId] || '').trim() || 'Verified against owner bank statement';
    const confirmed = await confirmPaymentSubmission(submissionId, remark);
    setFeedback(
      `Payment ${confirmed.utrReference} confirmed (${formatINR(confirmed.amount)}). Official receipt ${confirmed.receiptNumber || ''} issued.`
    );
  };

  const handleRejectSubmission = async (submissionId: string) => {
    const reason = (submissionRemarks[submissionId] || '').trim();
    if (reason.length < 3) {
      setFeedback('Enter a rejection reason in the remark box before rejecting a payment submission.');
      return;
    }
    const rejected = await rejectPaymentSubmission(submissionId, reason);
    setFeedback(
      `Submission ${rejected.utrReference} marked REJECTED. Invoice remains unpaid and resident was notified.`
    );
  };

  const handleApplyLedgerFilters = async () => {
    const floorNum = ledgerFloor.trim() ? Number(ledgerFloor.trim()) : undefined;
    await fetchRentLedger({
      propertyId: ledgerPropertyId === 'ALL' ? undefined : ledgerPropertyId,
      floorNumber: Number.isFinite(floorNum) ? floorNum : undefined,
      roomNumber: ledgerRoom.trim() || undefined,
      search: ledgerSearch.trim() || undefined,
      billingMonth: ledgerMonth.trim() || undefined,
      status: ledgerStatus === 'ALL' ? undefined : ledgerStatus,
    });
  };

  const handleDownloadLedgerPdf = async (submissionId: string, receiptNumber?: string | null) => {
    setBusyReceiptId(submissionId);
    try {
      const res = await downloadAndReportReceiptPdf({
        submissionId,
        receiptNumber: receiptNumber || submissionId,
      });
      setFeedback(`Receipt PDF downloaded: ${res.filename}.`);
    } finally {
      setBusyReceiptId(null);
    }
  };

  if (loading && payments.length === 0 && paymentSubmissions.length === 0) {
    return <LoadingView message="Loading payments and bank verification queue..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader
        title="Pending Bank Verification Queue"
        actionLabel={pendingSubmissions.length > 0 ? `${pendingSubmissions.length} Pending` : undefined}
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      {pendingSubmissions.length === 0 ? (
        <EmptyState
          iconName="checkmark-done-circle-outline"
          title="No Pending Bank Verifications"
          message="Direct resident UPI and NEFT/IMPS submissions waiting for bank statement verification appear here."
        />
      ) : (
        pendingSubmissions.map((sub) => (
          <AppCard key={sub.id} highlighted style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={TYPOGRAPHY.h3}>
                  {sub.residentName} - {formatINR(sub.amount)}
                </Text>
                <Text style={TYPOGRAPHY.caption}>
                  {sub.propertyName} | Floor {sub.floorNumber ?? '-'} | Room {sub.roomNumber ?? '-'}
                </Text>
              </View>
              <StatusBadge label="PENDING VERIFICATION" tone="accent" />
            </View>

            <View style={styles.detailBox}>
              <Text style={TYPOGRAPHY.bodyMedium}>UTR / Ref: {sub.utrReference}</Text>
              <Text style={TYPOGRAPHY.caption}>
                Invoice: {sub.invoiceNumber} | Month: {formatDateShort(sub.billingMonth)} | Method:{' '}
                {sub.paymentMethod}
              </Text>
              <Text style={TYPOGRAPHY.caption}>Submitted: {formatDateShort(sub.submittedAt)}</Text>
            </View>

            <AppInput
              label="Verification Remark / Rejection Reason"
              value={submissionRemarks[sub.id] ?? ''}
              onChangeText={(txt) =>
                setSubmissionRemarks((prev) => ({ ...prev, [sub.id]: txt }))
              }
              placeholder="Matched on HDFC statement or UTR not found"
              testID={`verification-remark-${sub.id}`}
            />

            <View style={styles.actionRow}>
              <AppButton
                label="Confirm Payment"
                onPress={() => handleConfirmSubmission(sub.id)}
                loading={mutating}
                testID={`confirm-submission-${sub.id}`}
                style={styles.flexBtn}
              />
              <AppButton
                label="Reject"
                variant="secondary"
                onPress={() => handleRejectSubmission(sub.id)}
                loading={mutating}
                testID={`reject-submission-${sub.id}`}
                style={styles.flexBtn}
              />
            </View>
          </AppCard>
        ))
      )}

      <SectionHeader
        title="Rent Payment Table & Ledger Filters"
        actionLabel={showRecordForm ? 'Close Desk Entry' : 'Record Desk Payment'}
        onActionPress={() => {
          setShowRecordForm((p) => !p);
          if (openInvoices[0]) {
            setSelectedInvoiceId(openInvoices[0].id);
            setAmount(String(openInvoices[0].balanceDue));
          }
        }}
      />

      {showRecordForm ? (
        <AppCard highlighted style={styles.card}>
          <Text style={TYPOGRAPHY.h2}>Record Desk / Offline Cash Payment</Text>
          {openInvoices.length === 0 ? (
            <Text style={TYPOGRAPHY.body}>All current invoices are settled.</Text>
          ) : (
            <FilterChips
              options={openInvoices.map((i) => ({
                value: i.id,
                label: `${i.invoiceNumber} (${formatINR(i.balanceDue)})`,
              }))}
              selectedValue={selectedInvoiceId || openInvoices[0].id}
              onSelect={(val) => {
                setSelectedInvoiceId(val);
                const found = openInvoices.find((i) => i.id === val);
                if (found) setAmount(String(found.balanceDue));
              }}
            />
          )}
          <FilterChips
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'UPI_MANUAL', label: 'UPI' },
              { value: 'BANK_TRANSFER', label: 'Bank' },
            ]}
            selectedValue={method}
            onSelect={(val) => setMethod(val as PaymentMethod)}
          />
          <AppInput label="Amount Paid" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
          <AppInput label="Reference / UTR / Receipt No" value={reference} onChangeText={setReference} placeholder="UTR-889212" />
          <AppInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Paid directly at reception" />
          <AppButton label="Confirm & Issue Receipt" onPress={handleRecordPayment} loading={mutating} />
        </AppCard>
      ) : null}

      <AppCard style={styles.card}>
        <FilterChips
          options={[
            { value: 'ALL', label: 'All Properties' },
            ...properties.map((p) => ({ value: p.id, label: p.name })),
          ]}
          selectedValue={ledgerPropertyId}
          onSelect={setLedgerPropertyId}
        />
        <FilterChips
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'PENDING_VERIFICATION', label: 'Pending' },
            { value: 'CONFIRMED', label: 'Confirmed' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
          selectedValue={ledgerStatus}
          onSelect={(val) => setLedgerStatus(val as 'ALL' | PaymentSubmissionStatus)}
        />
        <View style={styles.rowTwo}>
          <View style={styles.half}>
            <AppInput
              label="Floor"
              value={ledgerFloor}
              onChangeText={setLedgerFloor}
              keyboardType="number-pad"
              placeholder="e.g. 2"
              testID="ledger-floor-input"
            />
          </View>
          <View style={styles.half}>
            <AppInput
              label="Room No"
              value={ledgerRoom}
              onChangeText={setLedgerRoom}
              placeholder="e.g. 204"
              testID="ledger-room-input"
            />
          </View>
        </View>
        <View style={styles.rowTwo}>
          <View style={styles.half}>
            <AppInput
              label="Resident / Invoice / UTR"
              value={ledgerSearch}
              onChangeText={setLedgerSearch}
              placeholder="Search..."
              testID="ledger-search-input"
            />
          </View>
          <View style={styles.half}>
            <AppInput
              label="Month (YYYY-MM-DD)"
              value={ledgerMonth}
              onChangeText={setLedgerMonth}
              placeholder="2026-11-01"
              testID="ledger-month-input"
            />
          </View>
        </View>
        <AppButton
          label="Apply Ledger Filters"
          variant="secondary"
          onPress={handleApplyLedgerFilters}
          loading={loading}
          testID="apply-ledger-filters-button"
        />
      </AppCard>

      {rentLedger.length === 0 ? (
        <EmptyState
          iconName="document-text-outline"
          title="No Rent Ledger Entries"
          message="Invoices and resident payment submissions matching your filters will appear here."
        />
      ) : (
        rentLedger.map((entry) => (
          <AppCard key={entry.id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={TYPOGRAPHY.h3}>{entry.residentName}</Text>
                <Text style={TYPOGRAPHY.caption}>
                  {entry.propertyName} | F{entry.floorNumber ?? '-'} | Room {entry.roomNumber ?? '-'}
                </Text>
              </View>
              <StatusBadge
                label={entry.status}
                tone={entry.status === 'CONFIRMED' || entry.status === 'COMPLETED' ? 'navy' : 'accent'}
              />
            </View>
            <View style={styles.ledgerRow}>
              <Text style={TYPOGRAPHY.caption}>
                {entry.invoiceNumber} ({formatDateShort(entry.billingMonth)}) | {formatDateShort(entry.paymentDate)}
              </Text>
              <Text style={TYPOGRAPHY.bodyMedium}>
                Amount: {formatINR(entry.amount)} | Method: {entry.paymentMethod}
              </Text>
              {entry.referenceNumber ? (
                <Text style={TYPOGRAPHY.caption}>
                  UTR / Ref: {entry.referenceNumber}
                  {entry.receiptNumber ? ` | Receipt: ${entry.receiptNumber}` : ''}
                </Text>
              ) : null}
            </View>
            {entry.status === 'CONFIRMED' && entry.submissionId ? (
              <AppButton
                label="Download Receipt PDF"
                variant="secondary"
                onPress={() => handleDownloadLedgerPdf(entry.submissionId!, entry.receiptNumber || entry.invoiceNumber)}
                loading={busyReceiptId === entry.submissionId}
              />
            ) : null}
          </AppCard>
        ))
      )}

      <SectionHeader title="Settled Payment Records" />
      {payments.length === 0 ? (
        <EmptyState
          iconName="cash-outline"
          title="No Confirmed Payments Yet"
          message="Confirmed bank-verified transfers and desk payments appear here."
        />
      ) : (
        payments.map((pay) => (
          <AppCard key={pay.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={TYPOGRAPHY.h2}>{formatINR(pay.amount)}</Text>
              <StatusBadge label={pay.paymentMethod.replace('_', ' ')} tone="navy" />
            </View>
            <Text style={TYPOGRAPHY.caption}>
              Paid At: {formatDateShort(pay.paidAt)} | Ref: {pay.referenceNumber || 'N/A'}
            </Text>
            {pay.notes ? <Text style={TYPOGRAPHY.body}>{pay.notes}</Text> : null}
          </AppCard>
        ))
      )}

      {paymentsMeta.hasNext ? (
        <AppButton
          label={`Load More Payments (${payments.length}/${paymentsMeta.totalElements})`}
          variant="secondary"
          onPress={() => fetchPayments({ page: paymentsMeta.page + 1, append: true })}
        />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.sm },
  rowTwo: { flexDirection: 'row', gap: SPACING.sm },
  half: { flex: 1 },
  detailBox: {
    backgroundColor: COLORS.iceBlueShade,
    borderRadius: RADII.sm,
    padding: SPACING.sm,
    gap: 2,
  },
  ledgerRow: { gap: 2 },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  flexBtn: { flex: 1 },
});
