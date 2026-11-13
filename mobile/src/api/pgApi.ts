import { apiBlobRequest, apiRequest, apiTextRequest, buildQueryString } from './apiClient';
import {
  AnnouncementItem,
  AnnouncementPriority,
  BedItem,
  BedStatus,
  BookingItem,
  BookingStatus,
  ComplaintCategory,
  ComplaintItem,
  ComplaintPriority,
  ComplaintStatus,
  DepositStatus,
  FoodMenuDay,
  InvitationStatus,
  InvoiceItem,
  MonthlyGenerationResult,
  NotificationItem,
  OwnerDashboardStats,
  OwnerProfile,
  PagedResponse,
  PaymentMethod,
  PaymentReceiptData,
  PaymentRecordItem,
  PaymentSubmissionItem,
  PaymentSubmissionStatus,
  PropertyItem,
  PropertyType,
  RentLedgerEntry,
  RentRevisionItem,
  RentStatus,
  ResidentAssignedRoom,
  ResidentCheckoutDetails,
  ResidentDashboardData,
  ResidentInvitationItem,
  ResidentItem,
  RoomItem,
  SharingType,
} from '../types/domain';

export const pgApi = {
  // Owner Profile & Live Dashboard
  getOwnerDashboard: () => apiRequest<OwnerDashboardStats>('/owners/dashboard'),
  getOwnerProfile: () => apiRequest<OwnerProfile>('/owners/me'),
  updateOwnerProfile: (payload: {
    businessName: string;
    panNumber?: string;
    gstNumber?: string;
    supportPhone?: string;
    supportEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    upiId?: string;
    upiPayeeName?: string;
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    settlementAccountMasked?: string;
  }) => apiRequest<OwnerProfile>('/owners/me', { method: 'PUT', body: payload }),

  // Properties CRUD & Search & Rent Config
  searchProperties: (params: { search?: string; page?: number; size?: number }) =>
    apiRequest<PagedResponse<PropertyItem>>(`/properties/search${buildQueryString(params)}`),
  listProperties: () => apiRequest<PropertyItem[]>('/properties'),
  createProperty: (payload: {
    name: string;
    propertyType: PropertyType;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    emergencyContact: string;
    defaultBillingDay: number;
    gracePeriodDays: number;
    lateFeeAmount: number;
    amenities?: string;
  }) => apiRequest<PropertyItem>('/properties', { method: 'POST', body: payload }),
  updateProperty: (
    id: string,
    payload: {
      name: string;
      propertyType: PropertyType;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      emergencyContact: string;
      defaultBillingDay: number;
      gracePeriodDays: number;
      lateFeeAmount: number;
      amenities?: string;
    }
  ) => apiRequest<PropertyItem>(`/properties/${id}`, { method: 'PUT', body: payload }),
  updatePropertyRentConfig: (
    id: string,
    payload: { defaultBillingDay: number; gracePeriodDays: number; lateFeeAmount: number }
  ) => apiRequest<PropertyItem>(`/properties/${id}/rent-config`, { method: 'PATCH', body: payload }),
  deactivateProperty: (id: string) => apiRequest<void>(`/properties/${id}`, { method: 'DELETE' }),

  // Rooms Floor-wise & Beds Management
  searchRooms: (params: {
    propertyId?: string;
    floorNumber?: number;
    search?: string;
    page?: number;
    size?: number;
  }) => apiRequest<PagedResponse<RoomItem>>(`/rooms/search${buildQueryString(params)}`),
  listRooms: (propertyId?: string) =>
    apiRequest<RoomItem[]>(`/rooms${buildQueryString({ propertyId })}`),
  createRoom: (payload: {
    propertyId: string;
    roomNumber: string;
    floorNumber: number;
    sharingType: SharingType;
    baseMonthlyRent: number;
    hasAttachedBathroom?: boolean;
    hasBalcony?: boolean;
  }) => apiRequest<RoomItem>('/rooms', { method: 'POST', body: payload }),
  addBed: (roomId: string, bedCode: string) =>
    apiRequest<BedItem>(`/rooms/${roomId}/beds`, { method: 'POST', body: { bedCode } }),
  listOwnerBeds: (params?: { propertyId?: string; status?: BedStatus }) =>
    apiRequest<BedItem[]>(`/rooms/beds${buildQueryString(params ?? {})}`),
  updateBedStatus: (bedId: string, status: BedStatus) =>
    apiRequest<BedItem>(`/rooms/beds/${bedId}/status`, { method: 'PATCH', body: { status } }),
  deleteBed: (bedId: string) => apiRequest<void>(`/rooms/beds/${bedId}`, { method: 'DELETE' }),

  // Residents Directory, Onboarding, KYC & Secure Invitations
  searchResidents: (params: {
    kycVerified?: boolean;
    search?: string;
    page?: number;
    size?: number;
  }) => apiRequest<PagedResponse<ResidentItem>>(`/residents/search${buildQueryString(params)}`),
  onboardResident: (payload: {
    phone: string;
    fullName: string;
    email?: string;
    occupation?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    permanentAddress?: string;
    idProofType?: string;
    idProofLast4?: string;
  }) => apiRequest<ResidentItem>('/residents', { method: 'POST', body: payload }),
  verifyResidentKyc: (residentProfileId: string) =>
    apiRequest<ResidentItem>(`/residents/${residentProfileId}/verify-kyc`, { method: 'PATCH' }),
  generateInvitation: (
    residentProfileId: string,
    payload?: { propertyId?: string; expiresInHours?: number }
  ) =>
    apiRequest<ResidentInvitationItem>(`/residents/${residentProfileId}/invitations`, {
      method: 'POST',
      body: payload ?? { expiresInHours: 72 },
    }),
  searchInvitations: (params: {
    status?: InvitationStatus;
    search?: string;
    page?: number;
    size?: number;
  }) =>
    apiRequest<PagedResponse<ResidentInvitationItem>>(
      `/residents/invitations${buildQueryString(params)}`
    ),
  revokeInvitation: (invitationId: string) =>
    apiRequest<ResidentInvitationItem>(`/residents/invitations/${invitationId}/revoke`, {
      method: 'PATCH',
    }),

  // Bookings (Bed Allocation / Check-In, Rent Config, Notice, Check-Out)
  searchBookings: (params: {
    status?: BookingStatus;
    propertyId?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => apiRequest<PagedResponse<BookingItem>>(`/bookings/search${buildQueryString(params)}`),
  listBookings: () => apiRequest<BookingItem[]>('/bookings'),
  createBooking: (payload: {
    residentId: string;
    bedId: string;
    checkInDate: string;
    agreedMonthlyRent: number;
    securityDepositAmount: number;
    depositStatus: DepositStatus;
    notes?: string;
  }) => apiRequest<BookingItem>('/bookings', { method: 'POST', body: payload }),
  updateBookingRent: (bookingId: string, payload: { agreedMonthlyRent: number; notes?: string }) =>
    apiRequest<BookingItem>(`/bookings/${bookingId}/rent`, { method: 'PATCH', body: payload }),
  giveBookingNotice: (
    bookingId: string,
    payload: { expectedCheckOutDate: string; notes?: string }
  ) => apiRequest<BookingItem>(`/bookings/${bookingId}/notice`, { method: 'PATCH', body: payload }),
  checkoutBooking: (
    bookingId: string,
    payload: { actualCheckOutDate?: string; depositStatus?: DepositStatus; notes?: string }
  ) => apiRequest<BookingItem>(`/bookings/${bookingId}/checkout`, { method: 'PATCH', body: payload }),

  // Rent Invoices, Batch Generation, Overdue Tracking
  searchInvoices: (params: {
    status?: RentStatus;
    overdueOnly?: boolean;
    propertyId?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => apiRequest<PagedResponse<InvoiceItem>>(`/invoices/search${buildQueryString(params)}`),
  createInvoice: (payload: {
    bookingId: string;
    billingMonth: string;
    baseRent?: number;
    utilityCharges?: number;
    penaltyFee?: number;
    dueDate: string;
    notes?: string;
  }) => apiRequest<InvoiceItem>('/invoices', { method: 'POST', body: payload }),
  generateMonthlyInvoices: (payload: {
    billingMonth: string;
    propertyId?: string;
    utilityCharges?: number;
    notes?: string;
  }) =>
    apiRequest<MonthlyGenerationResult>('/invoices/generate-monthly', {
      method: 'POST',
      body: payload,
    }),
  markOverdueInvoices: () => apiRequest<InvoiceItem[]>('/invoices/mark-overdue', { method: 'POST' }),
  cancelInvoice: (invoiceId: string) =>
    apiRequest<InvoiceItem>(`/invoices/${invoiceId}/cancel`, { method: 'PATCH' }),

  // Cash & Manual Payments
  searchPayments: (params: {
    paymentMethod?: PaymentMethod;
    search?: string;
    page?: number;
    size?: number;
  }) => apiRequest<PagedResponse<PaymentRecordItem>>(`/payments/search${buildQueryString(params)}`),
  recordPayment: (payload: {
    invoiceId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    idempotencyKey?: string;
    referenceNumber?: string;
    notes?: string;
  }) => apiRequest<PaymentRecordItem>('/payments', { method: 'POST', body: payload }),

  // Complaints
  searchComplaints: (params: {
    status?: ComplaintStatus;
    priority?: ComplaintPriority;
    propertyId?: string;
    search?: string;
    page?: number;
    size?: number;
  }) =>
    apiRequest<PagedResponse<ComplaintItem>>(`/complaints/search${buildQueryString(params)}`),
  createComplaint: (payload: {
    title: string;
    description: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
  }) => apiRequest<ComplaintItem>('/complaints', { method: 'POST', body: payload }),
  updateComplaintStatus: (
    complaintId: string,
    payload: { status: ComplaintStatus; resolutionNotes?: string }
  ) =>
    apiRequest<ComplaintItem>(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      body: payload,
    }),

  // Announcements
  searchAnnouncements: (params: {
    propertyId?: string;
    search?: string;
    page?: number;
    size?: number;
  }) =>
    apiRequest<PagedResponse<AnnouncementItem>>(`/announcements/search${buildQueryString(params)}`),
  createAnnouncement: (payload: {
    propertyId?: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
  }) => apiRequest<AnnouncementItem>('/announcements', { method: 'POST', body: payload }),
  deactivateAnnouncement: (announcementId: string) =>
    apiRequest<void>(`/announcements/${announcementId}/deactivate`, { method: 'PATCH' }),

  // Payment Receipts & PDF Downloads
  getPaymentReceipt: (paymentId: string) =>
    apiRequest<PaymentReceiptData>(`/payments/${paymentId}/receipt`),
  downloadPaymentReceiptHtml: (paymentId: string) =>
    apiTextRequest(`/payments/${paymentId}/receipt/download`),
  downloadInvoicePdf: (invoiceId: string) =>
    apiBlobRequest(`/invoices/${invoiceId}/pdf`),
  downloadPaymentReceiptPdf: (paymentId: string) =>
    apiBlobRequest(`/payments/${paymentId}/receipt/pdf`),
  downloadSubmissionReceiptPdf: (submissionId: string) =>
    apiBlobRequest(`/payments/submissions/${submissionId}/receipt/pdf`),

  // Verified Direct Rent Payments & Owner Reconciliation
  getResidentCheckoutDetails: (invoiceId: string) =>
    apiRequest<ResidentCheckoutDetails>(`/payments/resident/checkout-details/${invoiceId}`),
  submitDirectPayment: (payload: {
    invoiceId: string;
    paymentMethod: PaymentMethod;
    amount?: number;
    utrReference: string;
    payerUpiId?: string;
    payerName?: string;
    bankName?: string;
    paymentDate?: string;
    idempotencyKey: string;
    notes?: string;
  }) => apiRequest<PaymentSubmissionItem>('/payments/submissions', { method: 'POST', body: payload }),
  listPaymentSubmissions: (params?: {
    propertyId?: string;
    floorNumber?: number;
    roomNumber?: string;
    residentId?: string;
    billingMonth?: string;
    status?: PaymentSubmissionStatus;
    search?: string;
  }) =>
    apiRequest<PaymentSubmissionItem[]>(
      `/payments/submissions${buildQueryString(params ?? {})}`
    ),
  getPaymentSubmission: (submissionId: string) =>
    apiRequest<PaymentSubmissionItem>(`/payments/submissions/${submissionId}`),
  confirmPaymentSubmission: (submissionId: string, remarks?: string) =>
    apiRequest<PaymentSubmissionItem>(`/payments/submissions/${submissionId}/confirm`, {
      method: 'POST',
      body: remarks ? { remarks } : {},
    }),
  rejectPaymentSubmission: (submissionId: string, reason: string) =>
    apiRequest<PaymentSubmissionItem>(`/payments/submissions/${submissionId}/reject`, {
      method: 'POST',
      body: { reason },
    }),
  getRentLedger: (params?: {
    propertyId?: string;
    floorNumber?: number;
    roomNumber?: string;
    residentId?: string;
    billingMonth?: string;
    status?: string;
    search?: string;
  }) => apiRequest<RentLedgerEntry[]>(`/payments/ledger${buildQueryString(params ?? {})}`),

  // Notifications & FCM Device Tokens
  listNotifications: () => apiRequest<NotificationItem[]>('/notifications'),
  getUnreadNotificationCount: () => apiRequest<number>('/notifications/unread-count'),
  markNotificationRead: (notificationId: string) =>
    apiRequest<NotificationItem>(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiRequest<number>('/notifications/read-all', { method: 'PATCH' }),
  registerDeviceToken: (payload: { token: string; platform?: 'ANDROID' | 'IOS'; appVersion?: string }) =>
    apiRequest<void>('/notifications/device-tokens', { method: 'POST', body: payload }),
  deactivateDeviceToken: (token: string) =>
    apiRequest<void>(`/notifications/device-tokens/${encodeURIComponent(token)}`, {
      method: 'DELETE',
    }),

  // Fixed-Rent Revision Agreements
  listRentRevisions: () => apiRequest<RentRevisionItem[]>('/bookings/rent-revisions'),
  proposeRentRevision: (
    bookingId: string,
    payload: { proposedMonthlyRent: number; effectiveDate: string; reason?: string }
  ) =>
    apiRequest<RentRevisionItem>(`/bookings/${bookingId}/rent-revisions`, {
      method: 'POST',
      body: payload,
    }),
  respondRentRevision: (revisionId: string, payload: { accept: boolean; remarks?: string }) =>
    apiRequest<RentRevisionItem>(`/bookings/rent-revisions/${revisionId}/respond`, {
      method: 'POST',
      body: payload,
    }),

  // Weekly Food Menu (DB-backed)
  getWeeklyFoodMenu: (propertyId?: string) =>
    apiRequest<FoodMenuDay[]>(`/food-menu${buildQueryString({ propertyId })}`),
  upsertFoodMenuDay: (payload: {
    propertyId?: string;
    dayOfWeek: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks?: string;
  }) => apiRequest<FoodMenuDay>('/food-menu', { method: 'PUT', body: payload }),

  // Resident Self Endpoints
  getResidentDashboard: () => apiRequest<ResidentDashboardData>('/residents/me/dashboard'),
  getResidentProfile: () => apiRequest<ResidentItem>('/residents/me'),
  updateResidentProfile: (payload: {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    permanentAddress?: string;
    idProofType?: string;
    idProofLast4?: string;
    occupation?: string;
  }) => apiRequest<ResidentItem>('/residents/me', { method: 'PUT', body: payload }),
  getResidentAssignedRoom: () => apiRequest<ResidentAssignedRoom | null>('/residents/me/room'),
  acceptResidentInvitation: (inviteCode: string) =>
    apiRequest<ResidentInvitationItem>('/residents/me/invitations/accept', {
      method: 'POST',
      body: { inviteCode },
    }),
};
