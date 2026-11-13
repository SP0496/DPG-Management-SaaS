import React from 'react';
import { Linking, Share } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import App from '../App';

function jsonResponse(data: unknown, status = 200) {
  const payload = { success: true, message: 'OK', data };
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  } as Response);
}

function pdfResponse(filename = 'document.pdf') {
  const bytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'content-disposition'
          ? `attachment; filename="${filename}"`
          : 'application/pdf',
    },
    arrayBuffer: async () => bytes.buffer,
  } as unknown as Response);
}

describe('Verified Direct Rent Payments, Notifications, PDF Downloads & Fixed Rent Revisions', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction } as never);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    (SecureStore as unknown as { __resetStore: () => void }).__resetStore();
  });

  async function seedSession(role: 'RESIDENT' | 'OWNER') {
    await SecureStore.setItemAsync(
      'pg_management_verified_session_v1',
      JSON.stringify({
        accessToken: `${role.toLowerCase()}-access-token`,
        refreshToken: `${role.toLowerCase()}-refresh-token`,
        user: {
          id: role === 'OWNER' ? 'owner-1' : 'res-u9',
          email: null,
          phone: role === 'OWNER' ? '+919800000001' : '+919822334455',
          fullName: role === 'OWNER' ? 'Rohan Malhotra' : 'Siddharth Rao',
          role,
          active: true,
        },
      })
    );
  }

  it('runs resident direct UPI Intent, QR, NEFT checkout, submits UTR as PENDING_VERIFICATION, downloads invoice PDF, and displays verified summary + receipt PDF', async () => {
    await seedSession('RESIDENT');
    let submittedCreated = false;

    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 'res-u9',
          email: null,
          phone: '+919822334455',
          fullName: 'Siddharth Rao',
          role: 'RESIDENT',
          active: true,
        });
      }
      if (url.endsWith('/residents/me/dashboard')) {
        return jsonResponse({
          profile: {
            id: 'rp-9',
            userId: 'res-u9',
            ownerId: 'owner-1',
            fullName: 'Siddharth Rao',
            email: null,
            phone: '+919822334455',
            kycVerified: true,
          },
          assignedRoom: {
            bookingId: 'bk-9',
            propertyId: 'prop-9',
            propertyName: 'Maple Executive PG',
            propertyAddress: 'Whitefield, Bengaluru',
            ownerBusinessName: 'Maple Hospitality Pvt Ltd',
            roomId: 'rm-9',
            roomNumber: '402',
            floorNumber: 4,
            roomType: 'SINGLE',
            bedId: 'bd-9',
            bedNumber: '402-A',
            bookingStatus: 'ACTIVE',
            checkInDate: '2026-10-15',
            agreedMonthlyRent: 12000,
            securityDepositAmount: 20000,
            nextDueDate: '2026-11-05',
          },
          outstandingBalance: 12800,
          overdueBalance: 0,
          overdueInvoicesCount: 0,
          pendingInvoicesCount: 1,
          nextDueDate: '2026-11-05',
          nextDueAmount: 12800,
          nextDueInvoiceNumber: 'INV-NOV-101',
          openComplaintsCount: 0,
          resolvedComplaintsCount: 0,
          activeAnnouncementsCount: 0,
          recentAnnouncements: [],
        });
      }
      if (url.includes('/invoices/search')) {
        return jsonResponse({
          items: [
            {
              id: 'inv-nov-1',
              ownerId: 'owner-1',
              propertyId: 'prop-9',
              residentId: 'res-u9',
              bookingId: 'bk-9',
              invoiceNumber: 'INV-NOV-101',
              billingMonth: '2026-11-01',
              baseRent: 12000,
              utilityCharges: 800,
              penaltyFee: 0,
              totalAmount: 12800,
              paidAmount: 0,
              balanceDue: 12800,
              currency: 'INR',
              status: 'ISSUED',
              dueDate: '2026-11-05',
            },
          ],
          page: 0,
          size: 12,
          totalElements: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        });
      }
      if (url.endsWith('/invoices/inv-nov-1/pdf')) {
        return pdfResponse('invoice-INV-NOV-101.pdf');
      }
      if (url.endsWith('/payments/resident/checkout-details/inv-nov-1')) {
        return jsonResponse({
          invoiceId: 'inv-nov-1',
          invoiceNumber: 'INV-NOV-101',
          billingMonth: '2026-11-01',
          dueDate: '2026-11-05',
          status: 'ISSUED',
          fixedMonthlyRentPaise: 1200000,
          additionalChargesPaise: 80000,
          penaltyFeePaise: 0,
          totalAmountPaise: 1280000,
          paidAmountPaise: 0,
          outstandingAmountPaise: 1280000,
          fixedMonthlyRent: 12000,
          additionalCharges: 800,
          penaltyFee: 0,
          totalAmount: 12800,
          paidAmount: 0,
          outstandingAmount: 12800,
          items: [
            { id: 'li-1', itemType: 'BASE_RENT', description: 'Fixed Monthly Rent', amountPaise: 1200000, amount: 12000 },
            { id: 'li-2', itemType: 'ADDITIONAL_CHARGE', description: 'Water & Maintenance', amountPaise: 80000, amount: 800 },
          ],
          propertyName: 'Maple Executive PG',
          floorNumber: 4,
          roomNumber: '402',
          bedCode: '402-A',
          residentName: 'Siddharth Rao',
          ownerBusinessName: 'Maple Hospitality Pvt Ltd',
          ownerUpiId: 'maplepg@okhdfcbank',
          ownerUpiPayeeName: 'Maple Hospitality',
          upiDeepLink: 'upi://pay?pa=maplepg@okhdfcbank&pn=Maple%20Hospitality&am=12800.00&cu=INR',
          bankAccountHolder: 'Maple Hospitality Pvt Ltd',
          bankName: 'HDFC Bank',
          bankAccountNumber: '50200099887766',
          bankIfscCode: 'HDFC0001234',
          bankVerificationAvailable: false,
          verificationNotice: 'Automated bank API unavailable; submit UTR for owner verification.',
        });
      }
      if (url.endsWith('/payments/submissions') && method === 'POST') {
        submittedCreated = true;
        return jsonResponse(
          {
            id: 'sub-new-1',
            ownerId: 'owner-1',
            propertyId: 'prop-9',
            propertyName: 'Maple Executive PG',
            floorNumber: 4,
            roomNumber: '402',
            residentId: 'res-u9',
            residentName: 'Siddharth Rao',
            invoiceId: 'inv-nov-1',
            invoiceNumber: 'INV-NOV-101',
            billingMonth: '2026-11-01',
            idempotencyKey: 'idem-1',
            paymentMethod: 'UPI_INTENT',
            amountPaise: 1280000,
            amount: 12800,
            currency: 'INR',
            utrReference: '431209876543',
            paymentDate: '2026-11-05',
            status: 'PENDING_VERIFICATION',
            submittedAt: '2026-11-05T10:00:00Z',
            remainingBalancePaise: 1280000,
            remainingBalance: 12800,
            verificationSource: 'OWNER_MANUAL_STATEMENT',
          },
          201
        );
      }
      if (url.endsWith('/payments/submissions')) {
        return jsonResponse([
          {
            id: 'sub-confirmed-1',
            ownerId: 'owner-1',
            propertyId: 'prop-9',
            propertyName: 'Maple Executive PG',
            floorNumber: 4,
            roomNumber: '402',
            residentId: 'res-u9',
            residentName: 'Siddharth Rao',
            invoiceId: 'inv-oct-1',
            invoiceNumber: 'INV-OCT-100',
            billingMonth: '2026-10-01',
            idempotencyKey: 'idem-oct',
            paymentMethod: 'UPI_QR',
            amountPaise: 1200000,
            amount: 12000,
            currency: 'INR',
            utrReference: 'UTR-VERIFIED-9901',
            paymentDate: '2026-10-05',
            status: 'CONFIRMED',
            submittedAt: '2026-10-05T09:00:00Z',
            verifiedAt: '2026-10-05T14:30:00Z',
            receiptNumber: 'RCP-2026-1005',
            remainingBalancePaise: 0,
            remainingBalance: 0,
            verificationSource: 'OWNER_MANUAL_STATEMENT',
          },
        ]);
      }
      if (url.endsWith('/payments/submissions/sub-confirmed-1/receipt/pdf')) {
        return pdfResponse('receipt-RCP-2026-1005.pdf');
      }
      if (url.endsWith('/bookings/rent-revisions')) {
        return jsonResponse([
          {
            id: 'rev-1',
            assignmentId: 'asg-1',
            bookingId: 'bk-9',
            ownerId: 'owner-1',
            residentId: 'res-u9',
            previousMonthlyRent: 12000,
            proposedMonthlyRent: 13200,
            previousRentPaise: 1200000,
            proposedRentPaise: 1320000,
            effectiveDate: '2026-12-01',
            reason: 'Water & laundry inclusion',
            status: 'PENDING_RESIDENT_ACCEPTANCE',
            proposedAt: '2026-11-10T10:00:00Z',
          },
        ]);
      }
      if (url.endsWith('/bookings/rent-revisions/rev-1/respond') && method === 'POST') {
        return jsonResponse({
          id: 'rev-1',
          assignmentId: 'asg-1',
          bookingId: 'bk-9',
          ownerId: 'owner-1',
          residentId: 'res-u9',
          previousMonthlyRent: 12000,
          proposedMonthlyRent: 13200,
          previousRentPaise: 1200000,
          proposedRentPaise: 1320000,
          effectiveDate: '2026-12-01',
          reason: 'Water & laundry inclusion',
          status: 'ACCEPTED',
          proposedAt: '2026-11-10T10:00:00Z',
          respondedAt: '2026-11-12T08:00:00Z',
        });
      }
      if (url.endsWith('/notifications/unread-count')) {
        return jsonResponse(1);
      }
      if (url.includes('/notifications')) {
        return jsonResponse([
          {
            id: 'notif-r1',
            recipientId: 'res-u9',
            title: 'Rent Revision Proposed',
            body: 'Owner proposed rent revision from Rs 12000 to Rs 13200.',
            type: 'RENT_REVISION',
            read: false,
            pushSent: false,
            createdAt: '2026-11-10T10:00:00Z',
          },
        ]);
      }
      if (url.endsWith('/food-menu')) return jsonResponse([]);
      return jsonResponse({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const screen = render(<App />);

    // 1. Accept Rent Revision Proposal on My Room
    fireEvent.press(await screen.findByText('My Room & Property'));
    expect(await screen.findByText('Pending Rent Revision Proposals')).toBeTruthy();
    fireEvent.press(screen.getByTestId('accept-revision-rev-1'));
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([calledUrl]) =>
          String(calledUrl).endsWith('/bookings/rent-revisions/rev-1/respond')
        )
      ).toBe(true);
    });

    // 2. Navigate to Payments & Download Invoice PDF
    fireEvent.press(screen.getByText('Payments'));
    expect(await screen.findByText('INV-NOV-101')).toBeTruthy();
    fireEvent.press(screen.getByTestId('download-invoice-pdf-inv-nov-1'));
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalled();
    });

    // 3. View Verified Summary of Confirmed Submission + Download Receipt PDF
    fireEvent.press(screen.getByTestId('view-verified-summary-sub-confirmed-1'));
    expect(await screen.findByText('Payment Successful')).toBeTruthy();
    expect(screen.getByText('UTR-VERIFIED-9901')).toBeTruthy();
    fireEvent.press(screen.getByTestId('summary-download-receipt-pdf-button'));
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([calledUrl]) =>
          String(calledUrl).endsWith('/payments/submissions/sub-confirmed-1/receipt/pdf')
        )
      ).toBe(true);
    });
    fireEvent.press(screen.getByText('Close'));

    // 4. Open Direct Payment Flow -> UPI QR, NEFT, UPI Intent (never fake success), Submit UTR -> PENDING_VERIFICATION
    fireEvent.press(screen.getByTestId('pay-invoice-inv-nov-1'));
    expect(await screen.findByText('UPI ID: maplepg@okhdfcbank')).toBeTruthy();

    fireEvent.press(screen.getByText('UPI QR'));
    expect(await screen.findByTestId('upi-qr-matrix')).toBeTruthy();

    fireEvent.press(screen.getByText('NEFT'));
    expect(await screen.findByText('50200099887766')).toBeTruthy();
    expect(screen.getByText('HDFC0001234')).toBeTruthy();

    fireEvent.press(screen.getByText('UPI App'));
    fireEvent.press(screen.getByTestId('launch-upi-intent-button'));
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('upi://pay?'));
    });

    // Returning from UPI Intent MUST NOT show Payment Successful yet for inv-nov-1
    fireEvent.changeText(screen.getByTestId('utr-reference-input'), '431209876543');
    fireEvent.press(screen.getByTestId('submit-utr-payment-button'));

    await waitFor(() => {
      expect(submittedCreated).toBe(true);
    });
    expect(
      (await screen.findAllByText('Payment Submitted / Awaiting Verification')).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('loads Owner notifications, navigates to OwnerPayments, confirms resident UTR submission, and applies Rent Ledger filters', async () => {
    await seedSession('OWNER');
    const ledgerQueries: string[] = [];
    let confirmedCalled = false;

    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 'owner-1',
          email: null,
          phone: '+919800000001',
          fullName: 'Rohan Malhotra',
          role: 'OWNER',
          active: true,
        });
      }
      if (url.endsWith('/owners/dashboard')) {
        return jsonResponse({
          totalProperties: 1,
          totalRooms: 2,
          totalBeds: 4,
          occupiedBeds: 2,
          vacantBeds: 2,
          maintenanceBeds: 0,
          occupancyPercentage: 50,
          totalResidents: 2,
          activeBookings: 2,
          noticeGivenCount: 0,
          pendingKycCount: 0,
          openComplaintsCount: 0,
          inProgressComplaintsCount: 0,
          collectedThisMonth: 12000,
          pendingRentTotal: 12800,
          overdueRentTotal: 0,
          overdueInvoicesCount: 0,
          pendingInvitationsCount: 0,
          expectedMonthlyRent: 28000,
          paidResidentsCount: 1,
          pendingResidentsCount: 1,
          pendingVerificationCount: 1,
        });
      }
      if (url.endsWith('/owners/me')) {
        return jsonResponse({
          id: 'op-1',
          userId: 'owner-1',
          businessName: 'Skyline Living PG',
          upiId: 'skyline@okhdfcbank',
          kycVerified: true,
          merchantOnboardingStatus: 'NOT_STARTED',
        });
      }
      if (url.endsWith('/notifications/unread-count')) {
        return jsonResponse(1);
      }
      if (url.includes('/notifications/notif-1/read') && method === 'PATCH') {
        return jsonResponse({
          id: 'notif-1',
          recipientId: 'owner-1',
          title: 'Payment Verification Required',
          body: 'Arjun Nair submitted UTR 431209876543',
          type: 'PAYMENT_SUBMITTED',
          targetType: 'PAYMENT_SUBMISSION',
          transactionSubmissionId: 'sub-pend-1',
          read: true,
          pushSent: false,
          createdAt: '2026-11-12T08:00:00Z',
        });
      }
      if (url.includes('/notifications')) {
        return jsonResponse([
          {
            id: 'notif-1',
            recipientId: 'owner-1',
            title: 'Payment Verification Required',
            body: 'Arjun Nair submitted UTR 431209876543 for verification.',
            type: 'PAYMENT_SUBMITTED',
            targetType: 'PAYMENT_SUBMISSION',
            transactionSubmissionId: 'sub-pend-1',
            read: false,
            pushSent: false,
            createdAt: '2026-11-12T08:00:00Z',
          },
        ]);
      }
      if (url.endsWith('/payments/submissions/sub-pend-1/confirm') && method === 'POST') {
        confirmedCalled = true;
        return jsonResponse({
          id: 'sub-pend-1',
          ownerId: 'owner-1',
          propertyId: 'prop-1',
          propertyName: 'Skyline Towers',
          floorNumber: 4,
          roomNumber: '402',
          residentId: 'res-2',
          residentName: 'Arjun Nair',
          invoiceId: 'inv-2',
          invoiceNumber: 'INV-NOV-202',
          billingMonth: '2026-11-01',
          idempotencyKey: 'k-2',
          paymentMethod: 'UPI_INTENT',
          amountPaise: 1280000,
          amount: 12800,
          currency: 'INR',
          utrReference: '431209876543',
          paymentDate: '2026-11-12',
          status: 'CONFIRMED',
          submittedAt: '2026-11-12T08:00:00Z',
          verifiedAt: '2026-11-12T08:15:00Z',
          receiptNumber: 'RCP-2026-2002',
          remainingBalancePaise: 0,
          remainingBalance: 0,
          verificationSource: 'OWNER_MANUAL_STATEMENT',
        });
      }
      if (url.endsWith('/payments/submissions')) {
        return jsonResponse([
          {
            id: 'sub-pend-1',
            ownerId: 'owner-1',
            propertyId: 'prop-1',
            propertyName: 'Skyline Towers',
            floorNumber: 4,
            roomNumber: '402',
            residentId: 'res-2',
            residentName: 'Arjun Nair',
            invoiceId: 'inv-2',
            invoiceNumber: 'INV-NOV-202',
            billingMonth: '2026-11-01',
            idempotencyKey: 'k-2',
            paymentMethod: 'UPI_INTENT',
            amountPaise: 1280000,
            amount: 12800,
            currency: 'INR',
            utrReference: '431209876543',
            paymentDate: '2026-11-12',
            status: confirmedCalled ? 'CONFIRMED' : 'PENDING_VERIFICATION',
            submittedAt: '2026-11-12T08:00:00Z',
            remainingBalancePaise: confirmedCalled ? 0 : 1280000,
            remainingBalance: confirmedCalled ? 0 : 12800,
            verificationSource: 'OWNER_MANUAL_STATEMENT',
          },
        ]);
      }
      if (url.includes('/payments/ledger')) {
        ledgerQueries.push(url);
        return jsonResponse([
          {
            id: 'led-1',
            submissionId: 'sub-pend-1',
            paymentId: 'pay-202',
            invoiceId: 'inv-2',
            propertyId: 'prop-1',
            propertyName: 'Skyline Towers',
            floorNumber: 4,
            roomNumber: '402',
            residentId: 'res-2',
            residentName: 'Arjun Nair',
            invoiceNumber: 'INV-NOV-202',
            billingMonth: '2026-11-01',
            amount: 12800,
            amountPaise: 1280000,
            paymentMethod: 'UPI_INTENT',
            referenceNumber: '431209876543',
            paymentDate: '2026-11-12',
            status: 'CONFIRMED',
            receiptNumber: 'RCP-2026-2002',
          },
        ]);
      }
      return jsonResponse({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const screen = render(<App />);

    expect(await screen.findByText('₹28,000')).toBeTruthy();
    expect(screen.getByText('1 awaiting')).toBeTruthy();

    // Open Notification modal -> tap notification -> marks read & navigates to OwnerPayments
    fireEvent.press(screen.getByTestId('owner-notifications-button'));
    expect(await screen.findByText('Payment Verification Required')).toBeTruthy();
    fireEvent.press(screen.getByText('Payment Verification Required'));

    expect(await screen.findByText('Pending Bank Verification Queue')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('verification-remark-sub-pend-1'), 'Credited in HDFC statement');
    fireEvent.press(screen.getByTestId('confirm-submission-sub-pend-1'));

    await waitFor(() => {
      expect(confirmedCalled).toBe(true);
    });

    // Test Rent Ledger filters
    fireEvent.changeText(screen.getByTestId('ledger-floor-input'), '4');
    fireEvent.changeText(screen.getByTestId('ledger-room-input'), '402');
    fireEvent.changeText(screen.getByTestId('ledger-search-input'), 'Arjun');
    fireEvent.press(screen.getByTestId('apply-ledger-filters-button'));

    await waitFor(() => {
      expect(
        ledgerQueries.some(
          (q) =>
            q.includes('floorNumber=4') &&
            q.includes('roomNumber=402') &&
            q.includes('search=Arjun')
        )
      ).toBe(true);
    });
  });
});
