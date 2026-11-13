import React, { useMemo, useState } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { FilterChips } from '../../components/FilterChips';
import { LoadingView } from '../../components/LoadingView';
import { QrCodeMatrix } from '../../components/QrCodeMatrix';
import { SectionHeader } from '../../components/SectionHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePortalData } from '../../context/PortalDataContext';
import { COLORS } from '../../theme/colors';
import { RADII, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import {
  InvoiceItem,
  PaymentMethod,
  PaymentSubmissionItem,
  RentStatus,
  ResidentCheckoutDetails,
} from '../../types/domain';
import { formatDateShort, formatINR } from '../../utils/displayFormatters';
import { downloadAndReportInvoicePdf, downloadAndReportReceiptPdf } from '../../utils/pdfDownloader';

type DirectMethod = 'UPI_INTENT' | 'UPI_QR' | 'NEFT' | 'IMPS';

export const MyPaymentsScreen: React.FC = () => {
  const {
    residentDashboard,
    invoices,
    invoicesMeta,
    paymentSubmissions,
    loading,
    refreshing,
    mutating,
    error,
    clearError,
    refreshAll,
    fetchInvoices,
    loadResidentCheckoutDetails,
    submitDirectPayment,
  } = usePortalData();

  const [filter, setFilter] = useState<'ALL' | RentStatus>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyPdfId, setBusyPdfId] = useState<string | null>(null);

  // Direct Payment Modal state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState<ResidentCheckoutDetails | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceItem | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<DirectMethod>('UPI_INTENT');
  const [upiReturnedHint, setUpiReturnedHint] = useState(false);
  const [utrReference, setUtrReference] = useState('');
  const [payingAmount, setPayingAmount] = useState('');
  const [payerUpiId, setPayerUpiId] = useState('');
  const [remitterBankName, setRemitterBankName] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<PaymentSubmissionItem | null>(null);

  // Verified summary modal state
  const [verifiedSummary, setVerifiedSummary] = useState<PaymentSubmissionItem | null>(null);

  const outstanding = residentDashboard?.outstandingBalance ?? 0;
  const nextDue = residentDashboard?.nextDueDate;

  const submissionByInvoiceId = useMemo(() => {
    const map: Record<string, PaymentSubmissionItem> = {};
    for (const sub of paymentSubmissions) {
      if (!map[sub.invoiceId]) {
        map[sub.invoiceId] = sub;
      }
    }
    return map;
  }, [paymentSubmissions]);

  const applyFilter = async (nextFilter: 'ALL' | RentStatus) => {
    setFilter(nextFilter);
    await fetchInvoices({
      status: nextFilter === 'ALL' ? undefined : nextFilter,
      page: 0,
    });
  };

  const openDirectCheckout = async (invoice: InvoiceItem) => {
    setActiveInvoice(invoice);
    setSubmittedRecord(null);
    setUpiReturnedHint(false);
    setUtrReference('');
    setPayerUpiId('');
    setRemitterBankName('');
    setPaymentNotes('');
    setPayingAmount(String(invoice.balanceDue));
    setSelectedMethod('UPI_INTENT');
    setCheckoutOpen(true);
    setCheckoutLoading(true);
    try {
      const details = await loadResidentCheckoutDetails(invoice.id);
      setCheckoutDetails(details);
      setPayingAmount(String(details.outstandingAmount || invoice.balanceDue));
    } catch {
      setCheckoutDetails(null);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenUpiApp = async () => {
    if (!checkoutDetails?.upiDeepLink) {
      setFeedback('Owner UPI ID is not configured yet. Please pay via NEFT/IMPS or ask your PG owner.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(checkoutDetails.upiDeepLink).catch(() => true);
      if (canOpen) {
        await Linking.openURL(checkoutDetails.upiDeepLink);
      }
    } catch {
      // Opening an external UPI app may fail in web/emulator environments
    } finally {
      // NEVER mark as SUCCESS on UPI return; advance to explicit UTR confirmation step
      setUpiReturnedHint(true);
    }
  };

  const handleSubmitUtr = async () => {
    if (!activeInvoice) return;
    const trimmedUtr = utrReference.trim();
    if (trimmedUtr.length < 6) {
      setFeedback('Enter a valid UTR or bank transaction reference (at least 6 characters).');
      return;
    }
    const amt = Number(payingAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setFeedback('Enter a valid payment amount greater than zero.');
      return;
    }
    const idempotencyKey = `sub-${activeInvoice.id}-${trimmedUtr.replace(/\s+/g, '')}-${Date.now()}`;
    const created = await submitDirectPayment({
      invoiceId: activeInvoice.id,
      paymentMethod: selectedMethod as PaymentMethod,
      amount: amt,
      utrReference: trimmedUtr,
      payerUpiId: payerUpiId.trim() || undefined,
      bankName: remitterBankName.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      idempotencyKey,
    });
    setSubmittedRecord(created);
    setFeedback(
      `Payment submitted (${created.utrReference}). Current status: PENDING_VERIFICATION. Your PG owner has been notified to verify against their bank statement.`
    );
  };

  const handleDownloadInvoicePdf = async (inv: InvoiceItem) => {
    setBusyPdfId(inv.id);
    try {
      const result = await downloadAndReportInvoicePdf(inv.id, inv.invoiceNumber);
      setFeedback(
        result.isValidPdf
          ? `Downloaded invoice PDF ${result.filename} (${Math.max(1, Math.round(result.byteLength / 1024))} KB).`
          : `Downloaded invoice ${inv.invoiceNumber}.`
      );
    } finally {
      setBusyPdfId(null);
    }
  };

  const handleDownloadReceiptPdf = async (sub: PaymentSubmissionItem) => {
    setBusyPdfId(sub.id);
    try {
      const result = await downloadAndReportReceiptPdf({
        submissionId: sub.id,
        receiptNumber: sub.receiptNumber || sub.utrReference,
      });
      setFeedback(
        result.isValidPdf
          ? `Downloaded official receipt PDF ${result.filename}.`
          : `Downloaded receipt ${sub.receiptNumber || sub.id}.`
      );
    } finally {
      setBusyPdfId(null);
    }
  };

  if (loading && invoices.length === 0 && !residentDashboard) {
    return <LoadingView message="Loading your rent invoices and due schedule..." />;
  }

  return (
    <AppScreen refreshing={refreshing} onRefresh={refreshAll}>
      <View style={styles.summaryBanner}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>TOTAL BALANCE DUE</Text>
          <Text style={styles.summaryValue}>{formatINR(outstanding)}</Text>
          <Text style={styles.summarySub}>
            {nextDue ? `Next due: ${formatDateShort(nextDue)}` : 'All current rent dues settled'}
          </Text>
        </View>
        <View style={styles.summaryBadgeBox}>
          <Text style={styles.badgeLabel}>OVERDUE</Text>
          <Text style={styles.badgeVal}>{formatINR(residentDashboard?.overdueBalance ?? 0)}</Text>
        </View>
      </View>

      {error ? <ErrorBanner message={error} onRetry={refreshAll} onDismiss={clearError} /> : null}
      {feedback ? (
        <AppCard highlighted>
          <Text style={TYPOGRAPHY.bodyMedium}>{feedback}</Text>
        </AppCard>
      ) : null}

      <SectionHeader title="Rent Invoices" />

      <FilterChips
        options={[
          { value: 'ALL', label: 'All' },
          { value: 'OVERDUE', label: 'Overdue' },
          { value: 'ISSUED', label: 'Issued' },
          { value: 'PARTIALLY_PAID', label: 'Partial' },
          { value: 'PAID', label: 'Paid' },
        ]}
        selectedValue={filter}
        onSelect={(val) => applyFilter(val as 'ALL' | RentStatus)}
      />

      {invoices.length === 0 ? (
        <EmptyState
          iconName="receipt-outline"
          title="No Invoices Matching Filter"
          message="Generated monthly rent invoices from your PG owner appear here."
        />
      ) : (
        invoices.map((inv) => {
          const latestSub = submissionByInvoiceId[inv.id];
          const canPay = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.balanceDue > 0;

          return (
            <AppCard key={inv.id} highlighted={inv.status === 'OVERDUE'} style={styles.card}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={TYPOGRAPHY.h3}>{inv.invoiceNumber}</Text>
                  <Text style={TYPOGRAPHY.caption}>
                    Billing Month: {formatDateShort(inv.billingMonth)}
                  </Text>
                </View>
                <StatusBadge label={inv.status} tone={inv.status === 'PAID' ? 'navy' : 'accent'} />
              </View>

              <View style={styles.breakdownBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fixed Monthly Rent</Text>
                  <Text style={styles.detailVal}>{formatINR(inv.baseRent)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Additional Charges</Text>
                  <Text style={styles.detailVal}>{formatINR(inv.utilityCharges)}</Text>
                </View>
                {inv.penaltyFee > 0 ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Late Fee</Text>
                    <Text style={styles.detailVal}>{formatINR(inv.penaltyFee)}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.amountStrip}>
                <Text style={styles.amountText}>Total: {formatINR(inv.totalAmount)}</Text>
                <Text style={styles.amountText}>Paid: {formatINR(inv.paidAmount)}</Text>
                <Text style={styles.dueText}>Due: {formatINR(inv.balanceDue)}</Text>
              </View>

              <Text style={TYPOGRAPHY.caption}>Due Date: {formatDateShort(inv.dueDate)}</Text>

              {latestSub && latestSub.status === 'PENDING_VERIFICATION' ? (
                <View style={styles.pendingVerifyBox}>
                  <Text style={styles.pendingVerifyTitle}>
                    Payment Submitted / Awaiting Verification
                  </Text>
                  <Text style={TYPOGRAPHY.caption}>
                    UTR: {latestSub.utrReference} | Amount: {formatINR(latestSub.amount)}
                  </Text>
                </View>
              ) : null}

              {latestSub && latestSub.status === 'REJECTED' ? (
                <View style={styles.pendingVerifyBox}>
                  <Text style={styles.pendingVerifyTitle}>Submission Rejected by Owner</Text>
                  <Text style={TYPOGRAPHY.caption}>
                    Reason: {latestSub.rejectionReason || 'Verification failed'}. Submit a valid UTR below.
                  </Text>
                </View>
              ) : null}

              <View style={styles.actionRow}>
                <AppButton
                  label="Download Invoice PDF"
                  variant="secondary"
                  onPress={() => handleDownloadInvoicePdf(inv)}
                  loading={busyPdfId === inv.id}
                  testID={`download-invoice-pdf-${inv.id}`}
                  style={styles.flexBtn}
                />
                {canPay ? (
                  <AppButton
                    label={latestSub?.status === 'REJECTED' ? 'Retry Payment' : 'Pay Now'}
                    onPress={() => openDirectCheckout(inv)}
                    testID={`pay-invoice-${inv.id}`}
                    style={styles.flexBtn}
                  />
                ) : null}
              </View>
            </AppCard>
          );
        })
      )}

      {invoicesMeta.hasNext ? (
        <AppButton
          label={`Load More Invoices (${invoices.length}/${invoicesMeta.totalElements})`}
          variant="secondary"
          onPress={() =>
            fetchInvoices({
              status: filter === 'ALL' ? undefined : filter,
              page: invoicesMeta.page + 1,
              append: true,
            })
          }
        />
      ) : null}

      <SectionHeader title="Direct Payment Verification Status" />
      {paymentSubmissions.length === 0 ? (
        <EmptyState
          iconName="shield-checkmark-outline"
          title="No Direct Payment Submissions"
          message="Submitted UPI and NEFT/IMPS transaction references appear here with real-time owner verification status."
        />
      ) : (
        paymentSubmissions.map((sub) => (
          <AppCard key={sub.id} highlighted={sub.status === 'PENDING_VERIFICATION'} style={styles.card}>
            <View style={styles.rowBetween}>
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
              Method: {sub.paymentMethod.replace('_', ' ')} | Submitted: {formatDateShort(sub.submittedAt)}
            </Text>

            {sub.status === 'PENDING_VERIFICATION' ? (
              <Text style={TYPOGRAPHY.bodyMedium}>
                Awaiting PG owner verification against bank statement. Official receipt unlocks after confirmation.
              </Text>
            ) : null}

            {sub.status === 'REJECTED' ? (
              <Text style={TYPOGRAPHY.body}>
                Rejection Reason: {sub.rejectionReason || 'Transaction reference not matched'}
              </Text>
            ) : null}

            {sub.status === 'CONFIRMED' ? (
              <View style={styles.actionRow}>
                <AppButton
                  label="View Payment Summary"
                  variant="secondary"
                  onPress={() => setVerifiedSummary(sub)}
                  testID={`view-verified-summary-${sub.id}`}
                  style={styles.flexBtn}
                />
                <AppButton
                  label="Download Receipt PDF"
                  onPress={() => handleDownloadReceiptPdf(sub)}
                  loading={busyPdfId === sub.id}
                  testID={`download-submission-pdf-${sub.id}`}
                  style={styles.flexBtn}
                />
              </View>
            ) : null}
          </AppCard>
        ))
      )}

      {/* Direct Payment Checkout Modal */}
      <Modal
        visible={checkoutOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTag}>DIRECT OWNER PAYMENT (NO GATEWAY)</Text>
                  <Text style={styles.modalTitle}>{activeInvoice?.invoiceNumber}</Text>
                </View>
                <StatusBadge
                  label={submittedRecord ? submittedRecord.status : 'PAY DIRECTLY'}
                  tone="accent"
                />
              </View>

              {checkoutLoading ? (
                <LoadingView message="Loading PG owner UPI and bank details..." />
              ) : submittedRecord ? (
                <AppCard highlighted style={styles.card}>
                  <Text style={TYPOGRAPHY.h2}>Payment Submitted / Awaiting Verification</Text>
                  <Text style={TYPOGRAPHY.body}>
                    Your payment reference {submittedRecord.utrReference} for{' '}
                    {formatINR(submittedRecord.amount)} is now PENDING_VERIFICATION. It will never be marked paid until the PG owner verifies the credit on their bank statement.
                  </Text>
                  <View style={styles.breakdownBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailVal}>{submittedRecord.status}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method</Text>
                      <Text style={styles.detailVal}>{submittedRecord.paymentMethod}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>UTR / Reference</Text>
                      <Text style={styles.detailVal}>{submittedRecord.utrReference}</Text>
                    </View>
                  </View>
                  <AppButton label="Done" onPress={() => setCheckoutOpen(false)} />
                </AppCard>
              ) : (
                <>
                  <AppCard style={styles.card}>
                    <Text style={TYPOGRAPHY.h3}>
                      {checkoutDetails?.ownerBusinessName || 'PG Owner Collection Account'}
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fixed Rent</Text>
                      <Text style={styles.detailVal}>
                        {formatINR(checkoutDetails?.fixedMonthlyRent ?? activeInvoice?.baseRent ?? 0)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Additional Charges</Text>
                      <Text style={styles.detailVal}>
                        {formatINR(
                          checkoutDetails?.additionalCharges ?? activeInvoice?.utilityCharges ?? 0
                        )}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Outstanding Due</Text>
                      <Text style={styles.dueText}>
                        {formatINR(checkoutDetails?.outstandingAmount ?? activeInvoice?.balanceDue ?? 0)}
                      </Text>
                    </View>
                    {checkoutDetails?.items && checkoutDetails.items.length > 0 ? (
                      <View style={styles.lineItemsList}>
                        {checkoutDetails.items.map((item) => (
                          <Text key={item.id} style={TYPOGRAPHY.caption}>
                            {item.description}: {formatINR(item.amount)}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    <Text style={TYPOGRAPHY.caption}>
                      {checkoutDetails?.verificationNotice ||
                        'Pay directly to the owner UPI ID or bank account below, then submit the UTR reference for verification.'}
                    </Text>
                  </AppCard>

                  <FilterChips
                    options={[
                      { value: 'UPI_INTENT', label: 'UPI App' },
                      { value: 'UPI_QR', label: 'UPI QR' },
                      { value: 'NEFT', label: 'NEFT' },
                      { value: 'IMPS', label: 'IMPS' },
                    ]}
                    selectedValue={selectedMethod}
                    onSelect={(val) => setSelectedMethod(val as DirectMethod)}
                  />

                  {selectedMethod === 'UPI_INTENT' ? (
                    <AppCard style={styles.card}>
                      <Text style={TYPOGRAPHY.h3}>Android UPI Intent Payment</Text>
                      <Text style={TYPOGRAPHY.body}>
                        Payee: {checkoutDetails?.ownerUpiPayeeName || checkoutDetails?.ownerBusinessName || 'PG Owner'}
                      </Text>
                      <Text style={TYPOGRAPHY.bodyMedium}>
                        UPI ID: {checkoutDetails?.ownerUpiId || 'Not configured'}
                      </Text>
                      <AppButton
                        label="Open UPI App & Pay"
                        onPress={handleOpenUpiApp}
                        testID="launch-upi-intent-button"
                      />
                      {upiReturnedHint ? (
                        <Text style={TYPOGRAPHY.caption}>
                          Returned from UPI app? Enter your 12-digit UTR below so the owner can verify receipt.
                        </Text>
                      ) : null}
                    </AppCard>
                  ) : null}

                  {selectedMethod === 'UPI_QR' ? (
                    <AppCard style={styles.qrCard}>
                      <Text style={TYPOGRAPHY.h3}>Scan & Pay via Any UPI App</Text>
                      <QrCodeMatrix
                        value={
                          checkoutDetails?.upiDeepLink ||
                          `upi://pay?pa=${checkoutDetails?.ownerUpiId || ''}&am=${payingAmount || 0}&cu=INR`
                        }
                        size={170}
                      />
                      <Text style={TYPOGRAPHY.bodyMedium}>
                        UPI ID: {checkoutDetails?.ownerUpiId || 'Not configured'}
                      </Text>
                    </AppCard>
                  ) : null}

                  {selectedMethod === 'NEFT' || selectedMethod === 'IMPS' ? (
                    <AppCard style={styles.card}>
                      <Text style={TYPOGRAPHY.h3}>{selectedMethod} Bank Account Details</Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Account Holder</Text>
                        <Text style={styles.detailVal}>
                          {checkoutDetails?.bankAccountHolder || 'Ask owner'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Bank Name</Text>
                        <Text style={styles.detailVal}>{checkoutDetails?.bankName || 'Ask owner'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Account Number</Text>
                        <Text style={styles.detailVal}>
                          {checkoutDetails?.bankAccountNumber || 'Ask owner'}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>IFSC Code</Text>
                        <Text style={styles.detailVal}>
                          {checkoutDetails?.bankIfscCode || 'Ask owner'}
                        </Text>
                      </View>
                    </AppCard>
                  ) : null}

                  <AppCard highlighted style={styles.card}>
                    <Text style={TYPOGRAPHY.h3}>Submit Transaction Proof (UTR)</Text>
                    <AppInput
                      label="Amount Paid (INR)"
                      value={payingAmount}
                      onChangeText={setPayingAmount}
                      keyboardType="decimal-pad"
                      testID="utr-amount-input"
                    />
                    <AppInput
                      label="UTR / Transaction Reference Number"
                      value={utrReference}
                      onChangeText={setUtrReference}
                      placeholder="431209876543"
                      testID="utr-reference-input"
                    />
                    {selectedMethod === 'UPI_INTENT' || selectedMethod === 'UPI_QR' ? (
                      <AppInput
                        label="Your UPI ID (Optional)"
                        value={payerUpiId}
                        onChangeText={setPayerUpiId}
                        placeholder="resident@oksbi"
                      />
                    ) : (
                      <AppInput
                        label="Your Bank Name (Optional)"
                        value={remitterBankName}
                        onChangeText={setRemitterBankName}
                        placeholder="HDFC Bank"
                      />
                    )}
                    <AppInput
                      label="Notes (Optional)"
                      value={paymentNotes}
                      onChangeText={setPaymentNotes}
                      placeholder="November rent transfer"
                    />
                    <View style={styles.actionRow}>
                      <AppButton
                        label="Submit for Verification"
                        onPress={handleSubmitUtr}
                        loading={mutating}
                        testID="submit-utr-payment-button"
                        style={styles.flexBtn}
                      />
                      <AppButton
                        label="Cancel"
                        variant="secondary"
                        onPress={() => setCheckoutOpen(false)}
                        style={styles.flexBtn}
                      />
                    </View>
                  </AppCard>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmed Payment Successful Summary Modal */}
      <Modal
        visible={Boolean(verifiedSummary)}
        transparent
        animationType="slide"
        onRequestClose={() => setVerifiedSummary(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {verifiedSummary ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTag}>OWNER BANK VERIFIED</Text>
                    <Text style={styles.modalTitle}>Payment Successful</Text>
                  </View>
                  <StatusBadge label="CONFIRMED" tone="accent" />
                </View>

                <View style={styles.breakdownBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Amount Paid</Text>
                    <Text style={styles.dueText}>{formatINR(verifiedSummary.amount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Property Name</Text>
                    <Text style={styles.detailVal}>{verifiedSummary.propertyName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Floor Number</Text>
                    <Text style={styles.detailVal}>
                      Floor {verifiedSummary.floorNumber ?? '-'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Room Number</Text>
                    <Text style={styles.detailVal}>
                      Room {verifiedSummary.roomNumber ?? '-'}
                      {residentDashboard?.assignedRoom?.bedNumber
                        ? ` / Bed ${residentDashboard.assignedRoom.bedNumber}`
                        : ''}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Resident Name</Text>
                    <Text style={styles.detailVal}>{verifiedSummary.residentName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Billing Month</Text>
                    <Text style={styles.detailVal}>
                      {formatDateShort(verifiedSummary.billingMonth)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Date</Text>
                    <Text style={styles.detailVal}>
                      {formatDateShort(verifiedSummary.verifiedAt || verifiedSummary.submittedAt)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>UTR / Reference</Text>
                    <Text style={styles.detailVal}>{verifiedSummary.utrReference}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method</Text>
                    <Text style={styles.detailVal}>
                      {verifiedSummary.paymentMethod.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Remaining Balance</Text>
                    <Text style={styles.detailVal}>
                      {formatINR(verifiedSummary.remainingBalance ?? 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <AppButton
                    label="Download Receipt PDF"
                    onPress={() => handleDownloadReceiptPdf(verifiedSummary)}
                    loading={busyPdfId === verifiedSummary.id}
                    testID="summary-download-receipt-pdf-button"
                    style={styles.flexBtn}
                  />
                  <AppButton
                    label="Close"
                    variant="secondary"
                    onPress={() => setVerifiedSummary(null)}
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
  summaryBanner: {
    backgroundColor: COLORS.midnightNavy,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryCol: { flex: 1, gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: COLORS.tangerine, letterSpacing: 0.6 },
  summaryValue: { fontSize: 26, fontWeight: '700', color: COLORS.iceBlue },
  summarySub: { fontSize: 12, color: COLORS.iceBlueShade },
  summaryBadgeBox: {
    backgroundColor: COLORS.midnightNavyHover,
    borderRadius: RADII.md,
    padding: SPACING.sm,
    alignItems: 'flex-end',
  },
  badgeLabel: { fontSize: 10, fontWeight: '700', color: COLORS.tangerine },
  badgeVal: { fontSize: 14, fontWeight: '700', color: COLORS.iceBlue },
  card: { gap: SPACING.sm },
  qrCard: { gap: SPACING.sm, alignItems: 'center' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  breakdownBox: {
    backgroundColor: COLORS.iceBlueLight,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.navyBorder,
    padding: SPACING.sm,
    gap: 4,
  },
  lineItemsList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.navyBorder,
    paddingTop: 4,
    marginTop: 2,
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  detailLabel: { fontSize: 12, color: COLORS.midnightNavyMuted },
  detailVal: { fontSize: 12, fontWeight: '700', color: COLORS.midnightNavy, flexShrink: 1, textAlign: 'right' },
  amountStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.iceBlueShade,
    borderRadius: RADII.md,
    padding: SPACING.sm,
  },
  amountText: { fontSize: 12, fontWeight: '600', color: COLORS.midnightNavy },
  dueText: { fontSize: 13, fontWeight: '700', color: COLORS.tangerineHover },
  pendingVerifyBox: {
    backgroundColor: COLORS.tangerineTint,
    borderRadius: RADII.sm,
    padding: SPACING.sm,
    gap: 2,
  },
  pendingVerifyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.midnightNavy,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  flexBtn: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 43, 74, 0.58)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.iceBlue,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    maxHeight: '90%',
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
  modalTag: { fontSize: 10, fontWeight: '700', color: COLORS.tangerine, letterSpacing: 0.5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.iceBlue, marginTop: 2 },
});
