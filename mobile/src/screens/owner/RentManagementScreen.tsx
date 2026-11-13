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
import { COLORS } from '../../theme/colors';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { InvoiceItem, PaymentMethod, RentStatus } from '../../types/domain';
import { currentBillingMonthIso, formatDateShort, formatINR } from '../../utils/displayFormatters';
import { downloadAndReportInvoicePdf } from '../../utils/pdfDownloader';

export const RentManagementScreen: React.FC = () => {
  const {
    properties,
    invoices,
    invoicesMeta,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchInvoices,
    generateMonthlyInvoices,
    markOverdueInvoices,
    cancelInvoice,
    recordPayment,
  } = usePortalData();

  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | RentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('ALL');
  const [billingMonth, setBillingMonth] = useState(currentBillingMonthIso());
  const [utilityCharges, setUtilityCharges] = useState('0');

  const [payingInvoice, setPayingInvoice] = useState<InvoiceItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payRef, setPayRef] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyPdfInvoiceId, setBusyPdfInvoiceId] = useState<string | null>(null);

  const applyFilter = async (nextFilter: 'ALL' | 'OVERDUE' | RentStatus, q = searchQuery) => {
    setFilter(nextFilter);
    await fetchInvoices({
      overdueOnly: nextFilter === 'OVERDUE' ? true : undefined,
      status:
        nextFilter === 'ALL' || nextFilter === 'OVERDUE' ? undefined : (nextFilter as RentStatus),
      search: q.trim() || undefined,
      page: 0,
    });
  };

  const handleBatchGenerate = async () => {
    const res = await generateMonthlyInvoices({
      propertyId: selectedPropertyId === 'ALL' ? undefined : selectedPropertyId,
      billingMonth,
      utilityCharges: Number(utilityCharges) || 0,
    });
    setFeedback(`Generated ${res.createdCount} invoices (${res.skippedCount} skipped as duplicates).`);
    setShowBatchForm(false);
  };

  const handleMarkOverdue = async () => {
    const count = await markOverdueInvoices();
    setFeedback(`${count} past-due invoices transitioned to OVERDUE.`);
  };

  const handleRecordCashPayment = async () => {
    if (!payingInvoice || !payAmount.trim()) return;
    await recordPayment({
      invoiceId: payingInvoice.id,
      paymentMethod: payMethod,
      amount: Number(payAmount),
      referenceNumber: payRef.trim() || undefined,
      notes: 'Recorded from Owner Rent Management',
    });
    setFeedback(`Payment recorded for ${payingInvoice.invoiceNumber}.`);
    setPayingInvoice(null);
    setPayAmount('');
    setPayRef('');
  };

  const handleDownloadInvoicePdf = async (inv: InvoiceItem) => {
    setBusyPdfInvoiceId(inv.id);
    try {
      const result = await downloadAndReportInvoicePdf(inv.id, inv.invoiceNumber);
      setFeedback(`Invoice PDF ready: ${result.filename}.`);
    } finally {
      setBusyPdfInvoiceId(null);
    }
  };

  if (loading && invoices.length === 0) {
    return <LoadingView fullscreen message="Loading rent invoices..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <SectionHeader
        title="Rent & Monthly Billing"
        actionLabel={showBatchForm ? 'Close' : 'Generate Monthly'}
        onActionPress={() => setShowBatchForm((p) => !p)}
      />

      {error ? <ErrorBanner message={error} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      <View style={styles.topActionRow}>
        <AppButton
          label="Scan & Mark Overdue"
          variant="secondary"
          onPress={handleMarkOverdue}
          loading={mutating}
          style={styles.flexBtn}
        />
        <AppButton
          label="Overdue Filter"
          variant={filter === 'OVERDUE' ? 'primary' : 'secondary'}
          onPress={() => applyFilter(filter === 'OVERDUE' ? 'ALL' : 'OVERDUE', searchQuery)}
          style={styles.flexBtn}
        />
      </View>

      {showBatchForm ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Generate Monthly Rent Invoices</Text>
          <FilterChips
            options={[
              { value: 'ALL', label: 'All Properties' },
              ...properties.map((p) => ({ value: p.id, label: p.name })),
            ]}
            selectedValue={selectedPropertyId}
            onSelect={setSelectedPropertyId}
          />
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppInput
                label="Billing Month (YYYY-MM-DD)"
                value={billingMonth}
                onChangeText={setBillingMonth}
                testID="billing-month-input"
              />
            </View>
            <View style={styles.half}>
              <AppInput
                label="Utility Charges"
                value={utilityCharges}
                onChangeText={setUtilityCharges}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <AppButton
            label="Run Monthly Invoice Batch"
            onPress={handleBatchGenerate}
            loading={mutating}
            testID="run-batch-invoices-button"
          />
        </AppCard>
      ) : null}

      {payingInvoice ? (
        <AppCard highlighted style={styles.formCard}>
          <Text style={TYPOGRAPHY.h2}>Record Cash / Desk Payment: {payingInvoice.invoiceNumber}</Text>
          <FilterChips
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'UPI_MANUAL', label: 'UPI Manual' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
            ]}
            selectedValue={payMethod}
            onSelect={(val) => setPayMethod(val as PaymentMethod)}
          />
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppInput
                label="Amount Paid"
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="number-pad"
                testID="cash-amount-input"
              />
            </View>
            <View style={styles.half}>
              <AppInput
                label="Receipt / Ref No"
                value={payRef}
                onChangeText={setPayRef}
                placeholder="RCP-101"
              />
            </View>
          </View>
          <View style={styles.rowTwo}>
            <View style={styles.half}>
              <AppButton
                label="Confirm Payment"
                onPress={handleRecordCashPayment}
                loading={mutating}
                testID="confirm-cash-payment-button"
              />
            </View>
            <View style={styles.half}>
              <AppButton label="Cancel" variant="secondary" onPress={() => setPayingInvoice(null)} />
            </View>
          </View>
        </AppCard>
      ) : null}

      <FilterChips
        options={[
          { value: 'ALL', label: 'All' },
          { value: 'OVERDUE', label: 'Overdue' },
          { value: 'ISSUED', label: 'Issued' },
          { value: 'PARTIALLY_PAID', label: 'Partial' },
          { value: 'PAID', label: 'Paid' },
        ]}
        selectedValue={filter}
        onSelect={(val) => applyFilter(val as 'ALL' | 'OVERDUE' | RentStatus, searchQuery)}
      />

      <AppCard style={styles.searchCard}>
        <AppInput
          label="Search Invoice Number"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="INV-..."
        />
        <AppButton label="Search Invoices" variant="secondary" onPress={() => applyFilter(filter, searchQuery)} />
      </AppCard>

      {invoices.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="No Invoices Matching Filter"
          message="Use Generate Monthly Rent Invoices to bill all active resident stays."
        />
      ) : (
        invoices.map((inv) => (
          <AppCard key={inv.id} highlighted={inv.status === 'OVERDUE'} style={styles.invoiceCard}>
            <View style={styles.headerRow}>
              <View>
                <Text style={TYPOGRAPHY.h3}>{inv.invoiceNumber}</Text>
                <Text style={TYPOGRAPHY.caption}>
                  Month: {formatDateShort(inv.billingMonth)} | Due: {formatDateShort(inv.dueDate)}
                </Text>
              </View>
              <StatusBadge label={inv.status} tone={inv.status === 'PAID' ? 'navy' : 'accent'} />
            </View>

            <View style={styles.amountsRow}>
              <Text style={styles.amtLabel}>Total: {formatINR(inv.totalAmount)}</Text>
              <Text style={styles.amtLabel}>Paid: {formatINR(inv.paidAmount)}</Text>
              <Text style={styles.amtDue}>Due: {formatINR(inv.balanceDue)}</Text>
            </View>

            <AppButton
              label="Download Invoice PDF"
              variant="secondary"
              onPress={() => handleDownloadInvoicePdf(inv)}
              loading={busyPdfInvoiceId === inv.id}
              testID={`owner-invoice-pdf-${inv.id}`}
            />

            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
              <View style={styles.rowTwo}>
                <View style={styles.half}>
                  <AppButton
                    label="Record Cash"
                    onPress={() => {
                      setPayingInvoice(inv);
                      setPayAmount(String(inv.balanceDue));
                      setPayMethod('CASH');
                    }}
                  />
                </View>
                <View style={styles.half}>
                  <AppButton
                    label="Cancel Invoice"
                    variant="secondary"
                    onPress={() => cancelInvoice(inv.id)}
                  />
                </View>
              </View>
            ) : null}
          </AppCard>
        ))
      )}

      {invoicesMeta.hasNext ? (
        <AppButton
          label={`Load More Invoices (${invoices.length}/${invoicesMeta.totalElements})`}
          variant="secondary"
          onPress={() =>
            fetchInvoices({
              overdueOnly: filter === 'OVERDUE' ? true : undefined,
              status: filter === 'ALL' || filter === 'OVERDUE' ? undefined : (filter as RentStatus),
              search: searchQuery.trim() || undefined,
              page: invoicesMeta.page + 1,
              append: true,
            })
          }
        />
      ) : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  topActionRow: { flexDirection: 'row', gap: SPACING.sm },
  flexBtn: { flex: 1 },
  formCard: { gap: SPACING.sm },
  searchCard: { gap: SPACING.sm },
  rowTwo: { flexDirection: 'row', gap: SPACING.sm },
  half: { flex: 1 },
  invoiceCard: { gap: SPACING.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.iceBlueShade,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  amtLabel: { fontSize: 12, fontWeight: '600', color: COLORS.midnightNavy },
  amtDue: { fontSize: 12, fontWeight: '700', color: COLORS.tangerineHover },
});
