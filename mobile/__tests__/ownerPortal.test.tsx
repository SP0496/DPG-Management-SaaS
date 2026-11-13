import React from 'react';
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

describe('Complete Owner Portal Integration Flows', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (SecureStore as unknown as { __resetStore: () => void }).__resetStore();
    await SecureStore.setItemAsync(
      'pg_management_verified_session_v1',
      JSON.stringify({
        accessToken: 'owner-access-token',
        refreshToken: 'owner-refresh-token',
        user: {
          id: 'owner-1',
          email: null,
          phone: '+919800000001',
          fullName: 'Rohan Malhotra',
          role: 'OWNER',
          active: true,
        },
      })
    );
  });

  it('loads Owner Dashboard stats and performs Property, Floor Room, Resident Invite, Monthly Invoice & Announcement actions', async () => {
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
          totalRooms: 1,
          totalBeds: 2,
          occupiedBeds: 1,
          vacantBeds: 1,
          maintenanceBeds: 0,
          occupancyPercentage: 50,
          totalResidents: 1,
          activeBookings: 1,
          noticeGivenCount: 0,
          pendingKycCount: 1,
          openComplaintsCount: 0,
          inProgressComplaintsCount: 0,
          collectedThisMonth: 9500,
          pendingRentTotal: 5000,
          overdueRentTotal: 5000,
          overdueInvoicesCount: 1,
          pendingInvitationsCount: 0,
        });
      }
      if (url.endsWith('/owners/me')) {
        return jsonResponse({
          id: 'op-1',
          userId: 'owner-1',
          businessName: 'Skyline Living PG',
          panNumber: null,
          gstNumber: null,
          merchantOnboardingStatus: 'NOT_STARTED',
          settlementAccountMasked: null,
          kycVerified: true,
        });
      }
      if (url.includes('/properties/search')) {
        return jsonResponse({
          items: [
            {
              id: 'prop-1',
              ownerId: 'owner-1',
              name: 'Skyline Towers',
              propertyType: 'CO_LIVING',
              addressLine1: '100ft Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560038',
              emergencyContact: '+919800000001',
              defaultBillingDay: 5,
              gracePeriodDays: 3,
              lateFeeAmount: 250,
              active: true,
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
      if (url.endsWith('/properties') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return jsonResponse({
          id: 'prop-2',
          ownerId: 'owner-1',
          ...body,
          active: true,
        }, 201);
      }
      if (url.includes('/rooms/beds')) {
        return jsonResponse([
          { id: 'bed-1', ownerId: 'owner-1', propertyId: 'prop-1', roomId: 'room-1', bedCode: '101-A', status: 'OCCUPIED' },
          { id: 'bed-2', ownerId: 'owner-1', propertyId: 'prop-1', roomId: 'room-1', bedCode: '101-B', status: 'VACANT' },
        ]);
      }
      if (url.includes('/rooms/search')) {
        return jsonResponse({
          items: [
            {
              id: 'room-1',
              ownerId: 'owner-1',
              propertyId: 'prop-1',
              roomNumber: '101',
              floorNumber: 1,
              sharingType: 'DOUBLE',
              baseMonthlyRent: 9500,
              hasAttachedBathroom: true,
              hasBalcony: false,
              active: true,
              totalBeds: 2,
              occupiedBeds: 1,
              vacantBeds: 1,
              maintenanceBeds: 0,
              occupancyPercentage: 50,
              beds: [
                { id: 'bed-1', ownerId: 'owner-1', propertyId: 'prop-1', roomId: 'room-1', bedCode: '101-A', status: 'OCCUPIED' },
                { id: 'bed-2', ownerId: 'owner-1', propertyId: 'prop-1', roomId: 'room-1', bedCode: '101-B', status: 'VACANT' },
              ],
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
      if (url.endsWith('/rooms') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return jsonResponse({
          id: 'room-2',
          ownerId: 'owner-1',
          ...body,
          active: true,
          totalBeds: 0,
          occupiedBeds: 0,
          vacantBeds: 0,
          maintenanceBeds: 0,
          occupancyPercentage: 0,
          beds: [],
        }, 201);
      }
      if (url.includes('/residents/search')) {
        return jsonResponse({
          items: [
            {
              id: 'rp-1',
              userId: 'res-1',
              ownerId: 'owner-1',
              fullName: 'Kiran Nair',
              email: null,
              phone: '+919820001122',
              kycVerified: false,
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
      if (url.endsWith('/residents/rp-1/invitations') && method === 'POST') {
        return jsonResponse({
          id: 'inv-1',
          ownerId: 'owner-1',
          propertyId: 'prop-1',
          propertyName: 'Skyline Towers',
          residentUserId: 'res-1',
          residentName: 'Kiran Nair',
          phone: '+919820001122',
          inviteCode: 'PG-INVITE-9988',
          status: 'PENDING',
          expiresAt: '2026-11-15T10:00:00Z',
          createdAt: '2026-11-12T10:00:00Z',
        }, 201);
      }
      if (url.includes('/invoices/search')) {
        return jsonResponse({
          items: [
            {
              id: 'inv-rent-1',
              ownerId: 'owner-1',
              propertyId: 'prop-1',
              residentId: 'res-1',
              bookingId: 'bk-1',
              invoiceNumber: 'INV-OVERDUE-1',
              billingMonth: '2026-10-01',
              baseRent: 5000,
              utilityCharges: 0,
              penaltyFee: 0,
              totalAmount: 5000,
              paidAmount: 0,
              balanceDue: 5000,
              currency: 'INR',
              status: 'OVERDUE',
              dueDate: '2026-10-05',
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
      if (url.endsWith('/invoices/generate-monthly') && method === 'POST') {
        return jsonResponse({
          billingMonth: '2026-11-01',
          createdCount: 1,
          skippedCount: 0,
          generatedInvoices: [],
        }, 201);
      }
      if (url.endsWith('/announcements') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return jsonResponse({
          id: 'ann-1',
          ownerId: 'owner-1',
          ...body,
          active: true,
          createdAt: '2026-11-12T10:00:00Z',
        }, 201);
      }
      return jsonResponse({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const screen = render(<App />);

    // 1. Live Dashboard loads
    expect(await screen.findByText('Skyline Living PG')).toBeTruthy();
    expect(screen.getByText('1/2')).toBeTruthy();
    expect(screen.getByText('₹5,000')).toBeTruthy();

    // 2. Navigate to Properties via Quick Action & create property
    fireEvent.press(screen.getByText('Add Property'));
    expect(await screen.findByText('Skyline Towers')).toBeTruthy();
    fireEvent.press(screen.getByText('Add PG'));
    fireEvent.changeText(screen.getByTestId('property-name-input'), 'Emerald Mens PG');
    fireEvent.changeText(screen.getByTestId('property-address-input'), 'HSR Sector 2');
    fireEvent.changeText(screen.getByTestId('property-city-input'), 'Bengaluru');
    fireEvent.changeText(screen.getByTestId('property-contact-input'), '+919800001122');
    fireEvent.press(screen.getByTestId('save-property-button'));

    await waitFor(() => {
      expect(screen.getByText('Emerald Mens PG')).toBeTruthy();
    });

    // 3. Residents Tab -> Generate Secure Invite
    fireEvent.press(screen.getByText('Residents'));
    expect(await screen.findByText('Kiran Nair')).toBeTruthy();
    fireEvent.press(screen.getByText('Invite Code'));
    expect(await screen.findByText('PG-INVITE-9988')).toBeTruthy();

    // 4. Rent Tab -> Monthly Batch Run
    fireEvent.press(screen.getByText('Rent'));
    expect(await screen.findByText('INV-OVERDUE-1')).toBeTruthy();
    fireEvent.press(screen.getByText('Generate Monthly'));
    fireEvent.press(screen.getByTestId('run-batch-invoices-button'));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/invoices/generate-monthly'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
