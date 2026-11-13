import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import {
  getIdToken,
  signInWithCredential,
  signInWithPhoneNumber,
  verifyPhoneNumber,
} from '@react-native-firebase/auth';
import App from '../App';

function jsonFetchResponse(data: unknown, status = 200) {
  const payload = {
    success: status >= 200 && status < 300,
    message: status >= 200 && status < 300 ? 'OK' : 'Request rejected',
    data,
  };
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
    json: async () => payload,
  } as Response);
}

describe('Firebase Phone OTP & Role-Verified Backend Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore as unknown as { __resetStore: () => void }).__resetStore();
    globalThis.fetch = jest.fn();
  });

  it('sends Firebase OTP for +91 phone, verifies OTP, exchanges Firebase ID token with backend, and opens Owner portal without sending client role', async () => {
    const mockConfirm = jest.fn().mockResolvedValue({
      user: { uid: 'firebase-uid-owner-1' },
    });
    (signInWithPhoneNumber as jest.Mock).mockResolvedValue({
      verificationId: 'vid-123',
      confirm: mockConfirm,
    });
    (getIdToken as jest.Mock).mockResolvedValue('firebase-real-id-token-xyz');

    (globalThis.fetch as jest.Mock).mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/auth/firebase/verify')) {
        const sentBody = JSON.parse(String(init?.body ?? '{}'));
        expect(sentBody.firebaseIdToken).toBe('firebase-real-id-token-xyz');
        expect(sentBody.role).toBeUndefined();
        return jsonFetchResponse({
          accessToken: 'jwt-access-1',
          refreshToken: 'jwt-refresh-1',
          tokenType: 'Bearer',
          expiresInMs: 900000,
          newUser: false,
          user: {
            id: 'owner-u1',
            email: null,
            phone: '+919800000001',
            fullName: 'Vikram Mehta',
            role: 'OWNER',
            active: true,
          },
        });
      }
      if (url.endsWith('/owners/dashboard')) {
        return jsonFetchResponse({
          totalProperties: 2,
          totalRooms: 8,
          totalBeds: 20,
          occupiedBeds: 15,
          vacantBeds: 5,
          maintenanceBeds: 0,
          occupancyPercentage: 75,
          totalResidents: 15,
          activeBookings: 15,
          noticeGivenCount: 1,
          pendingKycCount: 2,
          openComplaintsCount: 1,
          inProgressComplaintsCount: 0,
          collectedThisMonth: 135000,
          pendingRentTotal: 18000,
          overdueRentTotal: 9000,
          overdueInvoicesCount: 1,
          pendingInvitationsCount: 1,
        });
      }
      if (url.endsWith('/owners/me')) {
        return jsonFetchResponse({
          id: 'op-1',
          userId: 'owner-u1',
          businessName: 'Mehta Residency Group',
          panNumber: null,
          gstNumber: null,
          merchantOnboardingStatus: 'NOT_STARTED',
          settlementAccountMasked: null,
          kycVerified: true,
        });
      }
      return jsonFetchResponse({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
    });

    const screen = render(<App />);

    const phoneInput = await screen.findByTestId('mobile-phone-input');
    fireEvent.changeText(phoneInput, '9800000001');
    fireEvent.press(screen.getByTestId('send-otp-button'));

    await waitFor(() => {
      expect(signInWithPhoneNumber).toHaveBeenCalledWith(expect.anything(), '+919800000001');
    });

    const otpInput = await screen.findByTestId('otp-input');
    fireEvent.changeText(otpInput, '482910');
    fireEvent.press(screen.getByTestId('verify-otp-button'));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('482910');
      expect(getIdToken).toHaveBeenCalledWith({ uid: 'firebase-uid-owner-1' }, true);
    });

    expect(await screen.findByText('Mehta Residency Group')).toBeTruthy();
    expect(screen.getByText('₹1,35,000')).toBeTruthy();
  });

  it('enforces 30s OTP resend countdown, surfaces Firebase OTP error, and opens Resident portal when backend verifies RESIDENT role', async () => {
    jest.useFakeTimers();

    const failingConfirm = jest
      .fn()
      .mockRejectedValueOnce({ code: 'auth/invalid-verification-code' })
      .mockResolvedValueOnce({ user: { uid: 'firebase-uid-res-1' } });

    (signInWithPhoneNumber as jest.Mock).mockResolvedValue({
      verificationId: 'vid-init',
      confirm: jest.fn(),
    });
    (verifyPhoneNumber as jest.Mock).mockResolvedValue({
      state: 'sent',
      verificationId: 'vid-resent',
      code: null,
      error: null,
    });
    (signInWithCredential as jest.Mock).mockResolvedValue({
      user: { uid: 'firebase-uid-res-1' },
    });

    let verifyCalled = 0;
    (getIdToken as jest.Mock).mockResolvedValue('firebase-res-id-token');
    (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.endsWith('/auth/firebase/verify')) {
        verifyCalled += 1;
        return jsonFetchResponse({
          accessToken: 'res-jwt-1',
          refreshToken: 'res-ref-1',
          tokenType: 'Bearer',
          expiresInMs: 900000,
          newUser: true,
          user: {
            id: 'res-u1',
            email: null,
            phone: '+919811112222',
            fullName: 'Ananya Verma',
            role: 'RESIDENT',
            active: true,
          },
        });
      }
      if (url.endsWith('/residents/me/dashboard')) {
        return jsonFetchResponse({
          profile: {
            id: 'rp-1',
            userId: 'res-u1',
            ownerId: 'owner-u1',
            fullName: 'Ananya Verma',
            email: null,
            phone: '+919811112222',
            kycVerified: false,
          },
          assignedRoom: {
            bookingId: 'bk-1',
            propertyId: 'prop-1',
            propertyName: 'Emerald Girls PG',
            propertyAddress: 'Koramangala, Bengaluru',
            roomId: 'rm-1',
            roomNumber: '204',
            floorNumber: 2,
            roomType: 'DOUBLE',
            bedId: 'bd-1',
            bedNumber: '204-A',
            bookingStatus: 'ACTIVE',
            checkInDate: '2026-11-01',
            agreedMonthlyRent: 11000,
            securityDepositAmount: 20000,
          },
          outstandingBalance: 0,
          overdueBalance: 0,
          overdueInvoicesCount: 0,
          pendingInvoicesCount: 0,
          nextDueAmount: 11000,
          openComplaintsCount: 0,
          resolvedComplaintsCount: 0,
          activeAnnouncementsCount: 0,
          recentAnnouncements: [],
        });
      }
      if (url.endsWith('/residents/me')) {
        return jsonFetchResponse({
          id: 'rp-1',
          userId: 'res-u1',
          ownerId: 'owner-u1',
          fullName: 'Ananya Verma',
          email: null,
          phone: '+919811112222',
          kycVerified: false,
        });
      }
      if (url.endsWith('/residents/me/room')) {
        return jsonFetchResponse({
          bookingId: 'bk-1',
          propertyId: 'prop-1',
          propertyName: 'Emerald Girls PG',
          propertyAddress: 'Koramangala, Bengaluru',
          roomId: 'rm-1',
          roomNumber: '204',
          floorNumber: 2,
          roomType: 'DOUBLE',
          bedId: 'bd-1',
          bedNumber: '204-A',
          bookingStatus: 'ACTIVE',
          checkInDate: '2026-11-01',
          agreedMonthlyRent: 11000,
          securityDepositAmount: 20000,
        });
      }
      return jsonFetchResponse({ items: [], page: 0, size: 12, totalElements: 0, totalPages: 0, hasNext: false, hasPrevious: false });
    });

    const screen = render(<App />);
    const phoneInput = await screen.findByTestId('mobile-phone-input');
    fireEvent.changeText(phoneInput, '9811112222');
    fireEvent.press(screen.getByTestId('send-otp-button'));

    const resendBtn = await screen.findByTestId('resend-otp-button');
    expect(resendBtn.props.accessibilityState?.disabled).toBe(true);

    // Advance 30s countdown
    for (let i = 0; i < 30; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      expect(screen.getByTestId('resend-otp-button').props.accessibilityState?.disabled).toBeFalsy();
    });

    fireEvent.press(screen.getByTestId('resend-otp-button'));
    await waitFor(() => {
      expect(verifyPhoneNumber).toHaveBeenCalledWith(expect.anything(), '+919811112222', 60, true);
    });

    // Simulate invalid OTP failure from signInWithCredential first, then success
    (signInWithCredential as jest.Mock).mockRejectedValueOnce({
      code: 'auth/invalid-verification-code',
    });

    fireEvent.changeText(screen.getByTestId('otp-input'), '999999');
    fireEvent.press(screen.getByTestId('verify-otp-button'));

    expect(
      await screen.findByText('Invalid 6-digit OTP code. Please check the SMS and retry.')
    ).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('otp-input'), '112233');
    fireEvent.press(screen.getByTestId('verify-otp-button'));

    expect(await screen.findByText('Emerald Girls PG - Room 204 (204-A)')).toBeTruthy();
    expect(verifyCalled).toBe(1);
    expect(failingConfirm).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
