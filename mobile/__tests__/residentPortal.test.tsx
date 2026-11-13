import React from 'react';
import { Share } from 'react-native';
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

function htmlResponse(html: string, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
  } as Response);
}

function errorResponse(message: string, status = 500) {
  const payload = { success: false, message };
  return Promise.resolve({
    ok: false,
    status,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  } as Response);
}

describe('Resident Portal Complete Flows, Read-Only Security & States', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction } as never);
    (SecureStore as unknown as { __resetStore: () => void }).__resetStore();
    await SecureStore.setItemAsync(
      'pg_management_verified_session_v1',
      JSON.stringify({
        accessToken: 'res-access-token',
        refreshToken: 'res-refresh-token',
        user: {
          id: 'res-u9',
          email: null,
          phone: '+919822334455',
          fullName: 'Siddharth Rao',
          role: 'RESIDENT',
          active: true,
        },
      })
    );
  });

  function buildFullResidentFetchMock() {
    return jest.fn((url: string, init?: RequestInit) => {
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
            occupation: 'Product Designer',
            emergencyContactName: 'Meera Rao',
            emergencyContactPhone: '+919811223344',
            permanentAddress: 'Indiranagar, Bengaluru',
            kycVerified: true,
          },
          assignedRoom: {
            bookingId: 'bk-9',
            propertyId: 'prop-9',
            propertyName: 'Maple Executive PG',
            propertyAddress: 'Whitefield, Bengaluru',
            propertyEmergencyContact: '+919900112233',
            propertyAmenities: ['WiFi', 'Power Backup', 'Laundry'],
            defaultBillingDay: 5,
            gracePeriodDays: 3,
            lateFeeAmount: 250,
            ownerBusinessName: 'Maple Hospitality Pvt Ltd',
            ownerPhone: '+919800000001',
            roomId: 'rm-9',
            roomNumber: '402',
            floorNumber: 4,
            roomType: 'SINGLE',
            hasAttachedBathroom: true,
            hasBalcony: true,
            bedId: 'bd-9',
            bedNumber: '402-A',
            bookingStatus: 'ACTIVE',
            checkInDate: '2026-10-15',
            agreedMonthlyRent: 14500,
            securityDepositAmount: 25000,
            nextDueDate: '2026-11-05',
          },
          outstandingBalance: 15000,
          overdueBalance: 0,
          overdueInvoicesCount: 0,
          pendingInvoicesCount: 1,
          nextDueDate: '2026-11-05',
          nextDueAmount: 15000,
          nextDueInvoiceNumber: 'INV-MAPLE-402',
          openComplaintsCount: 1,
          resolvedComplaintsCount: 0,
          activeAnnouncementsCount: 1,
          recentAnnouncements: [
            {
              id: 'ann-1',
              ownerId: 'owner-1',
              propertyId: 'prop-9',
              title: 'Rooftop Tank Cleaning',
              content: 'Scheduled water supply pause from 11 AM to 1 PM.',
              priority: 'IMPORTANT',
              active: true,
              createdAt: '2026-11-11T08:00:00Z',
            },
          ],
        });
      }
      if (url.endsWith('/food-menu')) {
        return jsonResponse([
          {
            id: 'fm-1',
            propertyId: 'prop-9',
            day: 'Monday',
            dayOrder: 1,
            breakfast: 'Masala Dosa & Filter Coffee',
            lunch: 'Rajma Chawal & Raita',
            snacks: 'Samosa & Ginger Tea',
            dinner: 'Chapati & Paneer Curry',
          },
        ]);
      }
      if (url.includes('/invoices/search')) {
        return jsonResponse({
          items: [
            {
              id: 'inv-9',
              ownerId: 'owner-1',
              propertyId: 'prop-9',
              residentId: 'res-u9',
              bookingId: 'bk-9',
              invoiceNumber: 'INV-MAPLE-402',
              billingMonth: '2026-11-01',
              baseRent: 14500,
              utilityCharges: 500,
              penaltyFee: 0,
              totalAmount: 15000,
              paidAmount: 0,
              balanceDue: 15000,
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
      if (url.includes('/payments/search')) {
        return jsonResponse({
          items: [
            {
              id: 'pay-901',
              ownerId: 'owner-1',
              residentId: 'res-u9',
              invoiceId: 'inv-8',
              paymentMethod: 'UPI_MANUAL',
              amount: 14500,
              currency: 'INR',
              referenceNumber: 'UPI-881234',
              status: 'COMPLETED',
              notes: 'October rent paid',
              paidAt: '2026-10-04T10:30:00Z',
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
      if (url.endsWith('/payments/pay-901/receipt')) {
        return jsonResponse({
          receiptNumber: 'RCP-2026-0901',
          paymentId: 'pay-901',
          invoiceId: 'inv-8',
          invoiceNumber: 'INV-MAPLE-401',
          billingMonth: '2026-10-01',
          propertyName: 'Maple Executive PG',
          propertyAddress: 'Whitefield, Bengaluru',
          roomNumber: '402',
          bedNumber: '402-A',
          ownerBusinessName: 'Maple Hospitality Pvt Ltd',
          ownerPhone: '+919800000001',
          residentName: 'Siddharth Rao',
          residentPhone: '+919822334455',
          paymentMethod: 'UPI_MANUAL',
          amount: 14500,
          currency: 'INR',
          referenceNumber: 'UPI-881234',
          status: 'COMPLETED',
          notes: 'October rent paid',
          paidAt: '2026-10-04T10:30:00Z',
        });
      }
      if (url.endsWith('/payments/pay-901/receipt/download')) {
        return htmlResponse('<html><body><h1>Receipt RCP-2026-0901</h1></body></html>');
      }
      if (url.includes('/announcements/search')) {
        return jsonResponse({
          items: [
            {
              id: 'ann-1',
              ownerId: 'owner-1',
              propertyId: 'prop-9',
              title: 'Rooftop Tank Cleaning',
              content: 'Scheduled water supply pause from 11 AM to 1 PM.',
              priority: 'IMPORTANT',
              active: true,
              createdAt: '2026-11-11T08:00:00Z',
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
      if (url.endsWith('/complaints') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return jsonResponse(
          {
            id: 'cmp-99',
            ownerId: 'owner-1',
            propertyId: 'prop-9',
            residentId: 'res-u9',
            ...body,
            status: 'OPEN',
            createdAt: '2026-11-12T10:00:00Z',
          },
          201
        );
      }
      if (url.includes('/complaints/search')) {
        return jsonResponse({
          items: [
            {
              id: 'cmp-10',
              ownerId: 'owner-1',
              propertyId: 'prop-9',
              residentId: 'res-u9',
              title: 'WiFi router slow on 4th floor',
              description: 'Frequent drops during evening hours.',
              category: 'INTERNET',
              priority: 'MEDIUM',
              status: 'IN_PROGRESS',
              resolutionNotes: 'ISP technician visiting tomorrow morning.',
              createdAt: '2026-11-10T09:00:00Z',
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
      return jsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
    });
  }

  it('navigates dashboard, room/property, invoices, complaints, profile, and DB food menu in read-only mode', async () => {
    const fetchMock = buildFullResidentFetchMock();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const screen = render(<App />);

    // 1. Resident Home Dashboard
    expect(await screen.findByText('Maple Executive PG - Room 402 (402-A)')).toBeTruthy();
    expect(screen.getAllByText('₹15,000').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rooftop Tank Cleaning')).toBeTruthy();

    // 2-6. My Room & Property details (read-only)
    fireEvent.press(screen.getByText('My Room & Property'));
    expect(await screen.findByText('Maple Hospitality Pvt Ltd')).toBeTruthy();
    expect(screen.getByText('+919900112233')).toBeTruthy();
    expect(screen.getByText('Attached Bath | Balcony')).toBeTruthy();
    expect(screen.queryByText('Record Payment')).toBeNull();

    // 7. Rent Invoices
    fireEvent.press(screen.getByText('Payments'));
    expect(await screen.findByText('INV-MAPLE-402')).toBeTruthy();
    expect(screen.getByText('Total: ₹15,000')).toBeTruthy();
    expect(screen.queryByText('Edit Rent')).toBeNull();

    // 10-11. Raise & Track Complaints
    fireEvent.press(screen.getByText('Complaints'));
    expect(
      await screen.findByText('Owner Resolution Note: ISP technician visiting tomorrow morning.')
    ).toBeTruthy();
    const raiseButtons = await screen.findAllByText('Raise Issue');
    fireEvent.press(raiseButtons[0]);
    fireEvent.changeText(screen.getByTestId('resident-complaint-title'), 'Geyser tripping MCB');
    fireEvent.changeText(
      screen.getByTestId('resident-complaint-description'),
      'Warm water heater switches off after 2 minutes'
    );
    fireEvent.press(screen.getByTestId('submit-complaint-button'));
    expect(await screen.findByText('Geyser tripping MCB')).toBeTruthy();

    // 14. Profile tab
    fireEvent.press(screen.getByText('Profile'));
    expect(await screen.findByText('PG Assignment & KYC Summary')).toBeTruthy();

    // 12-13. Weekly Food Menu backed by DB
    fireEvent.press(screen.getByText('Home'));
    fireEvent.press(await screen.findByText('Weekly Food Menu'));
    expect(await screen.findByText('Masala Dosa & Filter Coffee')).toBeTruthy();
    expect(screen.getByText('Samosa & Ginger Tea')).toBeTruthy();
  });

  it('displays Payment History and previews and downloads official Rent Receipts', async () => {
    const fetchMock = buildFullResidentFetchMock();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const screen = render(<App />);
    fireEvent.press(await screen.findByText('Receipts & History'));

    const viewReceiptBtn = await screen.findByTestId('view-receipt-pay-901');
    fireEvent.press(viewReceiptBtn);
    expect(await screen.findByText('RCP-2026-0901')).toBeTruthy();
    expect(screen.getByText('INV-MAPLE-401')).toBeTruthy();
    fireEvent.press(screen.getByText('Close'));

    const dlBtn = await screen.findByTestId('download-receipt-pay-901');
    fireEvent.press(dlBtn);
    await waitFor(() => {
      expect(Share.share).toHaveBeenCalled();
    });
    expect(
      fetchMock.mock.calls.some(([calledUrl]) =>
        String(calledUrl).endsWith('/payments/pay-901/receipt/download')
      )
    ).toBe(true);
  });

  it('displays unassigned empty state and API error retry banner cleanly', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          id: 'res-empty',
          email: null,
          phone: '+919822334400',
          fullName: 'Unassigned Resident',
          role: 'RESIDENT',
          active: true,
        });
      }
      if (url.endsWith('/residents/me/dashboard')) {
        return errorResponse('Temporary server connection issue', 503);
      }
      if (url.endsWith('/food-menu')) {
        return jsonResponse([]);
      }
      return jsonResponse({
        items: [],
        page: 0,
        size: 12,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const screen = render(<App />);

    expect(await screen.findByText('Temporary server connection issue')).toBeTruthy();
    expect(screen.getByText('Awaiting room and bed allocation')).toBeTruthy();
  });
});
