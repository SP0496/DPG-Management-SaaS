import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ApiClientError } from '../api/apiClient';
import { pgApi } from '../api/pgApi';
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
import {
  subscribeForegroundPushUpdates,
  syncFcmDeviceToken,
  unregisterFcmDeviceToken,
} from '../services/fcmNotifications';
import { useAuth } from './AuthContext';

export interface PaginationMeta {
  page: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

const EMPTY_META: PaginationMeta = {
  page: 0,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
};

function toMeta<T>(res: PagedResponse<T>): PaginationMeta {
  return {
    page: res.page,
    totalElements: res.totalElements,
    totalPages: res.totalPages,
    hasNext: res.hasNext,
  };
}

function mergePage<T extends { id: string }>(existing: T[], incoming: T[] | undefined, append: boolean): T[] {
  const safeIncoming = Array.isArray(incoming) ? incoming : [];
  if (!append) return safeIncoming;
  const seen = new Set(existing.map((i) => i.id));
  return [...existing, ...safeIncoming.filter((i) => !seen.has(i.id))];
}

function readableError(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

interface PortalDataContextValue {
  loading: boolean;
  refreshing: boolean;
  mutating: boolean;
  error: string | null;
  clearError: () => void;
  refreshAll: () => Promise<void>;

  // Owner Profile & Dashboard
  dashboardStats: OwnerDashboardStats | null;
  ownerProfile: OwnerProfile | null;
  updateOwnerBusinessProfile: (payload: Parameters<typeof pgApi.updateOwnerProfile>[0]) => Promise<OwnerProfile>;

  // Properties
  properties: PropertyItem[];
  propertiesMeta: PaginationMeta;
  fetchProperties: (params?: { search?: string; page?: number; append?: boolean }) => Promise<void>;
  createProperty: (payload: Parameters<typeof pgApi.createProperty>[0]) => Promise<PropertyItem>;
  updateProperty: (id: string, payload: Parameters<typeof pgApi.updateProperty>[1]) => Promise<PropertyItem>;
  updatePropertyRentConfig: (
    id: string,
    payload: { defaultBillingDay: number; gracePeriodDays: number; lateFeeAmount: number }
  ) => Promise<PropertyItem>;
  deactivateProperty: (id: string) => Promise<void>;

  // Rooms & Beds
  rooms: RoomItem[];
  roomsMeta: PaginationMeta;
  ownerBeds: BedItem[];
  fetchRooms: (params?: {
    propertyId?: string;
    floorNumber?: number;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  fetchOwnerBeds: (params?: { propertyId?: string; status?: BedStatus }) => Promise<BedItem[]>;
  createRoom: (payload: {
    propertyId: string;
    roomNumber: string;
    floorNumber: number;
    sharingType: SharingType;
    baseMonthlyRent: number;
    hasAttachedBathroom?: boolean;
    hasBalcony?: boolean;
  }) => Promise<RoomItem>;
  addBed: (roomId: string, bedCode: string) => Promise<BedItem>;
  updateBedStatus: (bedId: string, status: BedStatus) => Promise<BedItem>;
  deleteBed: (bedId: string) => Promise<void>;

  // Residents & Secure Invitations
  residents: ResidentItem[];
  residentsMeta: PaginationMeta;
  invitations: ResidentInvitationItem[];
  invitationsMeta: PaginationMeta;
  fetchResidents: (params?: {
    kycVerified?: boolean;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  fetchInvitations: (params?: {
    status?: InvitationStatus;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  onboardResident: (payload: Parameters<typeof pgApi.onboardResident>[0]) => Promise<ResidentItem>;
  verifyResidentKyc: (residentProfileId: string) => Promise<ResidentItem>;
  generateInvitation: (
    residentProfileId: string,
    payload?: { propertyId?: string; expiresInHours?: number }
  ) => Promise<ResidentInvitationItem>;
  revokeInvitation: (invitationId: string) => Promise<ResidentInvitationItem>;

  // Bookings (Bed Allocation / Check-In / Rent / Notice / Check-Out)
  bookings: BookingItem[];
  bookingsMeta: PaginationMeta;
  fetchBookings: (params?: {
    status?: BookingStatus;
    propertyId?: string;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  createBooking: (payload: {
    residentId: string;
    bedId: string;
    checkInDate: string;
    agreedMonthlyRent: number;
    securityDepositAmount: number;
    depositStatus: DepositStatus;
    notes?: string;
  }) => Promise<BookingItem>;
  updateBookingRent: (
    bookingId: string,
    payload: { agreedMonthlyRent: number; notes?: string }
  ) => Promise<BookingItem>;
  giveBookingNotice: (
    bookingId: string,
    payload: { expectedCheckOutDate: string; notes?: string }
  ) => Promise<BookingItem>;
  checkoutBooking: (
    bookingId: string,
    payload: { actualCheckOutDate?: string; depositStatus?: DepositStatus; notes?: string }
  ) => Promise<BookingItem>;

  // Invoices & Overdue & Cash/Manual Payments
  invoices: InvoiceItem[];
  invoicesMeta: PaginationMeta;
  payments: PaymentRecordItem[];
  paymentsMeta: PaginationMeta;
  fetchInvoices: (params?: {
    status?: RentStatus;
    overdueOnly?: boolean;
    propertyId?: string;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  fetchPayments: (params?: {
    paymentMethod?: PaymentMethod;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  createInvoice: (payload: Parameters<typeof pgApi.createInvoice>[0]) => Promise<InvoiceItem>;
  generateMonthlyInvoices: (payload: {
    billingMonth: string;
    propertyId?: string;
    utilityCharges?: number;
    notes?: string;
  }) => Promise<MonthlyGenerationResult>;
  markOverdueInvoices: () => Promise<InvoiceItem[]>;
  cancelInvoice: (invoiceId: string) => Promise<InvoiceItem>;
  recordPayment: (payload: {
    invoiceId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    idempotencyKey?: string;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<PaymentRecordItem>;

  // Complaints & Announcements
  complaints: ComplaintItem[];
  complaintsMeta: PaginationMeta;
  announcements: AnnouncementItem[];
  announcementsMeta: PaginationMeta;
  fetchComplaints: (params?: {
    status?: ComplaintStatus;
    priority?: ComplaintPriority;
    propertyId?: string;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  fetchAnnouncements: (params?: {
    propertyId?: string;
    search?: string;
    page?: number;
    append?: boolean;
  }) => Promise<void>;
  createComplaint: (payload: {
    title: string;
    description: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
  }) => Promise<ComplaintItem>;
  updateComplaintStatus: (
    complaintId: string,
    status: ComplaintStatus,
    resolutionNotes?: string
  ) => Promise<ComplaintItem>;
  createAnnouncement: (payload: {
    propertyId?: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
  }) => Promise<AnnouncementItem>;
  deactivateAnnouncement: (announcementId: string) => Promise<void>;

  // Resident Self Data
  residentDashboard: ResidentDashboardData | null;
  residentProfile: ResidentItem | null;
  assignedRoom: ResidentAssignedRoom | null;
  updateResidentSelfProfile: (
    payload: Parameters<typeof pgApi.updateResidentProfile>[0]
  ) => Promise<ResidentItem>;
  acceptInvitationCode: (inviteCode: string) => Promise<ResidentInvitationItem>;
  foodMenu: FoodMenuDay[];
  fetchFoodMenu: (propertyId?: string) => Promise<FoodMenuDay[]>;
  activeReceipt: PaymentReceiptData | null;
  fetchPaymentReceipt: (paymentId: string) => Promise<PaymentReceiptData>;
  downloadPaymentReceipt: (paymentId: string) => Promise<string>;
  clearActiveReceipt: () => void;

  // Direct Payment Verification, Filtered Ledger, Notifications & Rent Revisions
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  fetchNotifications: () => Promise<NotificationItem[]>;
  markNotificationRead: (notificationId: string) => Promise<NotificationItem>;
  markAllNotificationsRead: () => Promise<number>;
  paymentSubmissions: PaymentSubmissionItem[];
  fetchPaymentSubmissions: (
    params?: Parameters<typeof pgApi.listPaymentSubmissions>[0]
  ) => Promise<PaymentSubmissionItem[]>;
  loadResidentCheckoutDetails: (invoiceId: string) => Promise<ResidentCheckoutDetails>;
  submitDirectPayment: (
    payload: Parameters<typeof pgApi.submitDirectPayment>[0]
  ) => Promise<PaymentSubmissionItem>;
  confirmPaymentSubmission: (submissionId: string, remarks?: string) => Promise<PaymentSubmissionItem>;
  rejectPaymentSubmission: (submissionId: string, reason: string) => Promise<PaymentSubmissionItem>;
  rentLedger: RentLedgerEntry[];
  fetchRentLedger: (params?: Parameters<typeof pgApi.getRentLedger>[0]) => Promise<RentLedgerEntry[]>;
  rentRevisions: RentRevisionItem[];
  fetchRentRevisions: () => Promise<RentRevisionItem[]>;
  proposeRentRevision: (
    bookingId: string,
    payload: Parameters<typeof pgApi.proposeRentRevision>[1]
  ) => Promise<RentRevisionItem>;
  respondRentRevision: (
    revisionId: string,
    payload: Parameters<typeof pgApi.respondRentRevision>[1]
  ) => Promise<RentRevisionItem>;
}

const PortalDataContext = createContext<PortalDataContextValue | undefined>(undefined);

export const PortalDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<OwnerDashboardStats | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [propertiesMeta, setPropertiesMeta] = useState<PaginationMeta>(EMPTY_META);

  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [roomsMeta, setRoomsMeta] = useState<PaginationMeta>(EMPTY_META);
  const [ownerBeds, setOwnerBeds] = useState<BedItem[]>([]);

  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [residentsMeta, setResidentsMeta] = useState<PaginationMeta>(EMPTY_META);

  const [invitations, setInvitations] = useState<ResidentInvitationItem[]>([]);
  const [invitationsMeta, setInvitationsMeta] = useState<PaginationMeta>(EMPTY_META);

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [bookingsMeta, setBookingsMeta] = useState<PaginationMeta>(EMPTY_META);

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicesMeta, setInvoicesMeta] = useState<PaginationMeta>(EMPTY_META);

  const [payments, setPayments] = useState<PaymentRecordItem[]>([]);
  const [paymentsMeta, setPaymentsMeta] = useState<PaginationMeta>(EMPTY_META);

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [complaintsMeta, setComplaintsMeta] = useState<PaginationMeta>(EMPTY_META);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementsMeta, setAnnouncementsMeta] = useState<PaginationMeta>(EMPTY_META);

  const [residentDashboard, setResidentDashboard] = useState<ResidentDashboardData | null>(null);
  const [residentProfile, setResidentProfile] = useState<ResidentItem | null>(null);
  const [assignedRoom, setAssignedRoom] = useState<ResidentAssignedRoom | null>(null);
  const [foodMenu, setFoodMenu] = useState<FoodMenuDay[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceiptData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmissionItem[]>([]);
  const [rentLedger, setRentLedger] = useState<RentLedgerEntry[]>([]);
  const [rentRevisions, setRentRevisions] = useState<RentRevisionItem[]>([]);

  const clearError = useCallback(() => setError(null), []);
  const clearActiveReceipt = useCallback(() => setActiveReceipt(null), []);

  const fetchFoodMenu = useCallback(async (propertyId?: string): Promise<FoodMenuDay[]> => {
    const items = await pgApi.getWeeklyFoodMenu(propertyId);
    const list = Array.isArray(items) ? items : [];
    setFoodMenu(list);
    return list;
  }, []);

  const fetchPaymentReceipt = useCallback(async (paymentId: string): Promise<PaymentReceiptData> => {
    const receipt = await pgApi.getPaymentReceipt(paymentId);
    setActiveReceipt(receipt);
    return receipt;
  }, []);

  const downloadPaymentReceipt = useCallback(
    async (paymentId: string): Promise<string> => pgApi.downloadPaymentReceiptHtml(paymentId),
    []
  );

  const fetchNotifications = useCallback(async (): Promise<NotificationItem[]> => {
    const items = await pgApi.listNotifications();
    const list = Array.isArray(items) ? items : [];
    setNotifications(list);
    setUnreadNotificationsCount(list.filter((n) => !n.read).length);
    return list;
  }, []);

  const fetchPaymentSubmissions = useCallback(
    async (params?: Parameters<typeof pgApi.listPaymentSubmissions>[0]): Promise<PaymentSubmissionItem[]> => {
      const items = await pgApi.listPaymentSubmissions(params);
      const list = Array.isArray(items) ? items : [];
      if (!params) {
        setPaymentSubmissions(list);
      }
      return list;
    },
    []
  );

  const fetchRentLedger = useCallback(
    async (params?: Parameters<typeof pgApi.getRentLedger>[0]): Promise<RentLedgerEntry[]> => {
      const items = await pgApi.getRentLedger(params);
      const list = Array.isArray(items) ? items : [];
      setRentLedger(list);
      return list;
    },
    []
  );

  const fetchRentRevisions = useCallback(async (): Promise<RentRevisionItem[]> => {
    const items = await pgApi.listRentRevisions();
    const list = Array.isArray(items) ? items : [];
    setRentRevisions(list);
    return list;
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (user?.role !== 'OWNER') return;
    try {
      const stats = await pgApi.getOwnerDashboard();
      setDashboardStats(stats);
    } catch {
      // Background dashboard refresh failure does not overwrite action feedback
    }
  }, [user?.role]);

  const fetchProperties = useCallback(
    async (params: { search?: string; page?: number; append?: boolean } = {}) => {
      const res = await pgApi.searchProperties({
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setProperties((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setPropertiesMeta(toMeta(res));
    },
    []
  );

  const fetchRooms = useCallback(
    async (
      params: {
        propertyId?: string;
        floorNumber?: number;
        search?: string;
        page?: number;
        append?: boolean;
      } = {}
    ) => {
      const res = await pgApi.searchRooms({
        propertyId: params.propertyId,
        floorNumber: params.floorNumber,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setRooms((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setRoomsMeta(toMeta(res));
    },
    []
  );

  const fetchOwnerBeds = useCallback(
    async (params?: { propertyId?: string; status?: BedStatus }): Promise<BedItem[]> => {
      const res = await pgApi.listOwnerBeds(params);
      const list = Array.isArray(res) ? res : [];
      setOwnerBeds(list);
      return list;
    },
    []
  );

  const fetchResidents = useCallback(
    async (
      params: { kycVerified?: boolean; search?: string; page?: number; append?: boolean } = {}
    ) => {
      const res = await pgApi.searchResidents({
        kycVerified: params.kycVerified,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setResidents((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setResidentsMeta(toMeta(res));
    },
    []
  );

  const fetchInvitations = useCallback(
    async (
      params: { status?: InvitationStatus; search?: string; page?: number; append?: boolean } = {}
    ) => {
      const res = await pgApi.searchInvitations({
        status: params.status,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setInvitations((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setInvitationsMeta(toMeta(res));
    },
    []
  );

  const fetchBookings = useCallback(
    async (
      params: {
        status?: BookingStatus;
        propertyId?: string;
        search?: string;
        page?: number;
        append?: boolean;
      } = {}
    ) => {
      const res = await pgApi.searchBookings({
        status: params.status,
        propertyId: params.propertyId,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setBookings((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setBookingsMeta(toMeta(res));
    },
    []
  );

  const fetchInvoices = useCallback(
    async (
      params: {
        status?: RentStatus;
        overdueOnly?: boolean;
        propertyId?: string;
        search?: string;
        page?: number;
        append?: boolean;
      } = {}
    ) => {
      const res = await pgApi.searchInvoices({
        status: params.status,
        overdueOnly: params.overdueOnly,
        propertyId: params.propertyId,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setInvoices((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setInvoicesMeta(toMeta(res));
    },
    []
  );

  const fetchPayments = useCallback(
    async (
      params: {
        paymentMethod?: PaymentMethod;
        search?: string;
        page?: number;
        append?: boolean;
      } = {}
    ) => {
      const res = await pgApi.searchPayments({
        paymentMethod: params.paymentMethod,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setPayments((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setPaymentsMeta(toMeta(res));
    },
    []
  );

  const fetchComplaints = useCallback(
    async (
      params: {
        status?: ComplaintStatus;
        priority?: ComplaintPriority;
        propertyId?: string;
        search?: string;
        page?: number;
        append?: boolean;
      } = {}
    ) => {
      const res = await pgApi.searchComplaints({
        status: params.status,
        priority: params.priority,
        propertyId: params.propertyId,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setComplaints((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setComplaintsMeta(toMeta(res));
    },
    []
  );

  const fetchAnnouncements = useCallback(
    async (
      params: { propertyId?: string; search?: string; page?: number; append?: boolean } = {}
    ) => {
      const res = await pgApi.searchAnnouncements({
        propertyId: params.propertyId,
        search: params.search,
        page: params.page ?? 0,
        size: 12,
      });
      setAnnouncements((prev) => mergePage(prev, res.items, Boolean(params.append)));
      setAnnouncementsMeta(toMeta(res));
    },
    []
  );

  const loadRoleData = useCallback(
    async (isPullRefresh: boolean) => {
      if (!isAuthenticated || !user) return;
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        if (user.role === 'OWNER') {
          const [dash, profile] = await Promise.all([
            pgApi.getOwnerDashboard(),
            pgApi.getOwnerProfile(),
            fetchFoodMenu().catch(() => []),
            fetchProperties({ page: 0 }),
            fetchRooms({ page: 0 }),
            fetchOwnerBeds(),
            fetchResidents({ page: 0 }),
            fetchInvitations({ page: 0 }),
            fetchBookings({ page: 0 }),
            fetchInvoices({ page: 0 }),
            fetchPayments({ page: 0 }),
            fetchComplaints({ page: 0 }),
            fetchAnnouncements({ page: 0 }),
            fetchNotifications().catch(() => []),
            fetchPaymentSubmissions().catch(() => []),
            fetchRentLedger().catch(() => []),
            fetchRentRevisions().catch(() => []),
          ]);
          setDashboardStats(dash);
          setOwnerProfile(profile);
        } else {
          const [dash] = await Promise.all([
            pgApi.getResidentDashboard(),
            fetchFoodMenu().catch(() => []),
            fetchInvoices({ page: 0 }),
            fetchPayments({ page: 0 }),
            fetchComplaints({ page: 0 }),
            fetchAnnouncements({ page: 0 }),
            fetchNotifications().catch(() => []),
            fetchPaymentSubmissions().catch(() => []),
            fetchRentRevisions().catch(() => []),
          ]);
          setResidentDashboard(dash);
          setResidentProfile(dash.profile);
          setAssignedRoom(dash.assignedRoom ?? null);
        }
      } catch (err) {
        setError(readableError(err, 'Failed to sync workspace data from server.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      isAuthenticated,
      user,
      fetchFoodMenu,
      fetchProperties,
      fetchRooms,
      fetchOwnerBeds,
      fetchResidents,
      fetchInvitations,
      fetchBookings,
      fetchInvoices,
      fetchPayments,
      fetchComplaints,
      fetchAnnouncements,
      fetchNotifications,
      fetchPaymentSubmissions,
      fetchRentLedger,
      fetchRentRevisions,
    ]
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setDashboardStats(null);
      setOwnerProfile(null);
      setProperties([]);
      setPropertiesMeta(EMPTY_META);
      setRooms([]);
      setRoomsMeta(EMPTY_META);
      setOwnerBeds([]);
      setResidents([]);
      setResidentsMeta(EMPTY_META);
      setInvitations([]);
      setInvitationsMeta(EMPTY_META);
      setBookings([]);
      setBookingsMeta(EMPTY_META);
      setInvoices([]);
      setInvoicesMeta(EMPTY_META);
      setPayments([]);
      setPaymentsMeta(EMPTY_META);
      setComplaints([]);
      setComplaintsMeta(EMPTY_META);
      setAnnouncements([]);
      setAnnouncementsMeta(EMPTY_META);
      setResidentDashboard(null);
      setResidentProfile(null);
      setAssignedRoom(null);
      setFoodMenu([]);
      setActiveReceipt(null);
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setPaymentSubmissions([]);
      setRentLedger([]);
      setRentRevisions([]);
      setError(null);
      unregisterFcmDeviceToken().catch(() => undefined);
      return;
    }

    loadRoleData(false);
    syncFcmDeviceToken().catch(() => undefined);
    const unsubscribeFcm = subscribeForegroundPushUpdates(() => {
      loadRoleData(true);
    });
    return () => {
      unsubscribeFcm();
    };
  }, [isAuthenticated, user?.id, user?.role, loadRoleData]);

  const refreshAll = useCallback(async () => {
    await loadRoleData(true);
  }, [loadRoleData]);

  const runMutation = useCallback(
    async <T,>(work: () => Promise<T>, refreshDash = true): Promise<T> => {
      setMutating(true);
      setError(null);
      try {
        const result = await work();
        if (refreshDash) {
          await refreshDashboard();
        }
        return result;
      } catch (err) {
        const msg = readableError(err, 'Unable to save changes to server.');
        setError(msg);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [refreshDashboard]
  );

  const updateOwnerBusinessProfile = useCallback(
    async (payload: Parameters<typeof pgApi.updateOwnerProfile>[0]) =>
      runMutation(async () => {
        const updated = await pgApi.updateOwnerProfile(payload);
        setOwnerProfile(updated);
        return updated;
      }, false),
    [runMutation]
  );

  const createProperty = useCallback(
    async (payload: Parameters<typeof pgApi.createProperty>[0]) =>
      runMutation(async () => {
        const created = await pgApi.createProperty(payload);
        setProperties((prev) => [created, ...prev]);
        return created;
      }),
    [runMutation]
  );

  const updateProperty = useCallback(
    async (id: string, payload: Parameters<typeof pgApi.updateProperty>[1]) =>
      runMutation(async () => {
        const updated = await pgApi.updateProperty(id, payload);
        setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      }, false),
    [runMutation]
  );

  const updatePropertyRentConfig = useCallback(
    async (
      id: string,
      payload: { defaultBillingDay: number; gracePeriodDays: number; lateFeeAmount: number }
    ) =>
      runMutation(async () => {
        const updated = await pgApi.updatePropertyRentConfig(id, payload);
        setProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return updated;
      }, false),
    [runMutation]
  );

  const deactivateProperty = useCallback(
    async (id: string) =>
      runMutation(async () => {
        await pgApi.deactivateProperty(id);
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }),
    [runMutation]
  );

  const createRoom = useCallback(
    async (payload: Parameters<typeof pgApi.createRoom>[0]) =>
      runMutation(async () => {
        const created = await pgApi.createRoom(payload);
        setRooms((prev) => [created, ...prev]);
        return created;
      }),
    [runMutation]
  );

  const addBed = useCallback(
    async (roomId: string, bedCode: string) =>
      runMutation(async () => {
        const bed = await pgApi.addBed(roomId, bedCode);
        await Promise.all([fetchRooms({ page: 0 }), fetchOwnerBeds()]);
        return bed;
      }),
    [runMutation, fetchRooms, fetchOwnerBeds]
  );

  const updateBedStatus = useCallback(
    async (bedId: string, status: BedStatus) =>
      runMutation(async () => {
        const updated = await pgApi.updateBedStatus(bedId, status);
        await Promise.all([fetchRooms({ page: 0 }), fetchOwnerBeds()]);
        return updated;
      }),
    [runMutation, fetchRooms, fetchOwnerBeds]
  );

  const deleteBed = useCallback(
    async (bedId: string) =>
      runMutation(async () => {
        await pgApi.deleteBed(bedId);
        await Promise.all([fetchRooms({ page: 0 }), fetchOwnerBeds()]);
      }),
    [runMutation, fetchRooms, fetchOwnerBeds]
  );

  const onboardResident = useCallback(
    async (payload: Parameters<typeof pgApi.onboardResident>[0]) =>
      runMutation(async () => {
        const created = await pgApi.onboardResident(payload);
        setResidents((prev) => [created, ...prev]);
        return created;
      }),
    [runMutation]
  );

  const verifyResidentKyc = useCallback(
    async (residentProfileId: string) =>
      runMutation(async () => {
        const updated = await pgApi.verifyResidentKyc(residentProfileId);
        setResidents((prev) => prev.map((r) => (r.id === residentProfileId ? updated : r)));
        return updated;
      }),
    [runMutation]
  );

  const generateInvitation = useCallback(
    async (residentProfileId: string, payload?: { propertyId?: string; expiresInHours?: number }) =>
      runMutation(async () => {
        const created = await pgApi.generateInvitation(residentProfileId, payload);
        setInvitations((prev) => [created, ...prev]);
        return created;
      }),
    [runMutation]
  );

  const revokeInvitation = useCallback(
    async (invitationId: string) =>
      runMutation(async () => {
        const updated = await pgApi.revokeInvitation(invitationId);
        setInvitations((prev) => prev.map((i) => (i.id === invitationId ? updated : i)));
        return updated;
      }),
    [runMutation]
  );

  const createBooking = useCallback(
    async (payload: Parameters<typeof pgApi.createBooking>[0]) =>
      runMutation(async () => {
        const created = await pgApi.createBooking(payload);
        setBookings((prev) => [created, ...prev]);
        await Promise.all([fetchRooms({ page: 0 }), fetchOwnerBeds()]);
        return created;
      }),
    [runMutation, fetchRooms, fetchOwnerBeds]
  );

  const updateBookingRent = useCallback(
    async (bookingId: string, payload: { agreedMonthlyRent: number; notes?: string }) =>
      runMutation(async () => {
        const updated = await pgApi.updateBookingRent(bookingId, payload);
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
        return updated;
      }, false),
    [runMutation]
  );

  const giveBookingNotice = useCallback(
    async (bookingId: string, payload: { expectedCheckOutDate: string; notes?: string }) =>
      runMutation(async () => {
        const updated = await pgApi.giveBookingNotice(bookingId, payload);
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
        return updated;
      }),
    [runMutation]
  );

  const checkoutBooking = useCallback(
    async (
      bookingId: string,
      payload: { actualCheckOutDate?: string; depositStatus?: DepositStatus; notes?: string }
    ) =>
      runMutation(async () => {
        const updated = await pgApi.checkoutBooking(bookingId, payload);
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
        await Promise.all([fetchRooms({ page: 0 }), fetchOwnerBeds()]);
        return updated;
      }),
    [runMutation, fetchRooms, fetchOwnerBeds]
  );

  const createInvoice = useCallback(
    async (payload: Parameters<typeof pgApi.createInvoice>[0]) =>
      runMutation(async () => {
        const created = await pgApi.createInvoice(payload);
        setInvoices((prev) => [created, ...prev]);
        return created;
      }),
    [runMutation]
  );

  const generateMonthlyInvoices = useCallback(
    async (payload: Parameters<typeof pgApi.generateMonthlyInvoices>[0]) =>
      runMutation(async () => {
        const summary = await pgApi.generateMonthlyInvoices(payload);
        await fetchInvoices({ page: 0 });
        return summary;
      }),
    [runMutation, fetchInvoices]
  );

  const markOverdueInvoices = useCallback(
    async () =>
      runMutation(async () => {
        const updatedList = await pgApi.markOverdueInvoices();
        await fetchInvoices({ page: 0 });
        return updatedList;
      }),
    [runMutation, fetchInvoices]
  );

  const cancelInvoice = useCallback(
    async (invoiceId: string) =>
      runMutation(async () => {
        const updated = await pgApi.cancelInvoice(invoiceId);
        setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? updated : i)));
        return updated;
      }),
    [runMutation]
  );

  const recordPayment = useCallback(
    async (payload: Parameters<typeof pgApi.recordPayment>[0]) =>
      runMutation(async () => {
        const created = await pgApi.recordPayment(payload);
        setPayments((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
        await fetchInvoices({ page: 0 });
        return created;
      }),
    [runMutation, fetchInvoices]
  );

  const createComplaint = useCallback(
    async (payload: Parameters<typeof pgApi.createComplaint>[0]) =>
      runMutation(async () => {
        const created = await pgApi.createComplaint(payload);
        setComplaints((prev) => [created, ...prev]);
        pgApi
          .getResidentDashboard()
          .then((dash) => setResidentDashboard(dash))
          .catch(() => undefined);
        return created;
      }, false),
    [runMutation]
  );

  const updateComplaintStatus = useCallback(
    async (complaintId: string, status: ComplaintStatus, resolutionNotes?: string) =>
      runMutation(async () => {
        const updated = await pgApi.updateComplaintStatus(complaintId, {
          status,
          resolutionNotes,
        });
        setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
        return updated;
      }),
    [runMutation]
  );

  const createAnnouncement = useCallback(
    async (payload: Parameters<typeof pgApi.createAnnouncement>[0]) =>
      runMutation(async () => {
        const created = await pgApi.createAnnouncement(payload);
        setAnnouncements((prev) => [created, ...prev]);
        return created;
      }, false),
    [runMutation]
  );

  const deactivateAnnouncement = useCallback(
    async (announcementId: string) =>
      runMutation(async () => {
        await pgApi.deactivateAnnouncement(announcementId);
        setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      }, false),
    [runMutation]
  );

  const updateResidentSelfProfile = useCallback(
    async (payload: Parameters<typeof pgApi.updateResidentProfile>[0]) =>
      runMutation(async () => {
        const updated = await pgApi.updateResidentProfile(payload);
        setResidentProfile(updated);
        return updated;
      }, false),
    [runMutation]
  );

  const acceptInvitationCode = useCallback(
    async (inviteCode: string) =>
      runMutation(async () => {
        const accepted = await pgApi.acceptResidentInvitation(inviteCode);
        await loadRoleData(true);
        return accepted;
      }, false),
    [runMutation, loadRoleData]
  );

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const updated = await pgApi.markNotificationRead(notificationId);
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === notificationId ? updated : n));
      setUnreadNotificationsCount(next.filter((n) => !n.read).length);
      return next;
    });
    return updated;
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const count = await pgApi.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotificationsCount(0);
    return count;
  }, []);

  const loadResidentCheckoutDetails = useCallback(
    async (invoiceId: string) => pgApi.getResidentCheckoutDetails(invoiceId),
    []
  );

  const submitDirectPayment = useCallback(
    async (payload: Parameters<typeof pgApi.submitDirectPayment>[0]) =>
      runMutation(async () => {
        const created = await pgApi.submitDirectPayment(payload);
        setPaymentSubmissions((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
        return created;
      }, false),
    [runMutation]
  );

  const confirmPaymentSubmission = useCallback(
    async (submissionId: string, remarks?: string) =>
      runMutation(async () => {
        const confirmed = await pgApi.confirmPaymentSubmission(submissionId, remarks);
        setPaymentSubmissions((prev) => prev.map((s) => (s.id === submissionId ? confirmed : s)));
        await Promise.all([
          fetchInvoices({ page: 0 }).catch(() => undefined),
          fetchPayments({ page: 0 }).catch(() => undefined),
          fetchRentLedger().catch(() => undefined),
        ]);
        return confirmed;
      }),
    [runMutation, fetchInvoices, fetchPayments, fetchRentLedger]
  );

  const rejectPaymentSubmission = useCallback(
    async (submissionId: string, reason: string) =>
      runMutation(async () => {
        const rejected = await pgApi.rejectPaymentSubmission(submissionId, reason);
        setPaymentSubmissions((prev) => prev.map((s) => (s.id === submissionId ? rejected : s)));
        await fetchRentLedger().catch(() => undefined);
        return rejected;
      }),
    [runMutation, fetchRentLedger]
  );

  const proposeRentRevision = useCallback(
    async (bookingId: string, payload: Parameters<typeof pgApi.proposeRentRevision>[1]) =>
      runMutation(async () => {
        const created = await pgApi.proposeRentRevision(bookingId, payload);
        setRentRevisions((prev) => [created, ...prev]);
        return created;
      }, false),
    [runMutation]
  );

  const respondRentRevision = useCallback(
    async (revisionId: string, payload: Parameters<typeof pgApi.respondRentRevision>[1]) =>
      runMutation(async () => {
        const updated = await pgApi.respondRentRevision(revisionId, payload);
        setRentRevisions((prev) => prev.map((r) => (r.id === revisionId ? updated : r)));
        await loadRoleData(true);
        return updated;
      }, false),
    [runMutation, loadRoleData]
  );

  return (
    <PortalDataContext.Provider
      value={{
        loading,
        refreshing,
        mutating,
        error,
        clearError,
        refreshAll,
        dashboardStats,
        ownerProfile,
        updateOwnerBusinessProfile,
        properties,
        propertiesMeta,
        fetchProperties,
        createProperty,
        updateProperty,
        updatePropertyRentConfig,
        deactivateProperty,
        rooms,
        roomsMeta,
        ownerBeds,
        fetchRooms,
        fetchOwnerBeds,
        createRoom,
        addBed,
        updateBedStatus,
        deleteBed,
        residents,
        residentsMeta,
        invitations,
        invitationsMeta,
        fetchResidents,
        fetchInvitations,
        onboardResident,
        verifyResidentKyc,
        generateInvitation,
        revokeInvitation,
        bookings,
        bookingsMeta,
        fetchBookings,
        createBooking,
        updateBookingRent,
        giveBookingNotice,
        checkoutBooking,
        invoices,
        invoicesMeta,
        payments,
        paymentsMeta,
        fetchInvoices,
        fetchPayments,
        createInvoice,
        generateMonthlyInvoices,
        markOverdueInvoices,
        cancelInvoice,
        recordPayment,
        complaints,
        complaintsMeta,
        announcements,
        announcementsMeta,
        fetchComplaints,
        fetchAnnouncements,
        createComplaint,
        updateComplaintStatus,
        createAnnouncement,
        deactivateAnnouncement,
        residentDashboard,
        residentProfile,
        assignedRoom,
        updateResidentSelfProfile,
        acceptInvitationCode,
        foodMenu,
        fetchFoodMenu,
        activeReceipt,
        fetchPaymentReceipt,
        downloadPaymentReceipt,
        clearActiveReceipt,
        notifications,
        unreadNotificationsCount,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        paymentSubmissions,
        fetchPaymentSubmissions,
        loadResidentCheckoutDetails,
        submitDirectPayment,
        confirmPaymentSubmission,
        rejectPaymentSubmission,
        rentLedger,
        fetchRentLedger,
        rentRevisions,
        fetchRentRevisions,
        proposeRentRevision,
        respondRentRevision,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
};

export function usePortalData(): PortalDataContextValue {
  const ctx = useContext(PortalDataContext);
  if (!ctx) {
    throw new Error('usePortalData must be used inside PortalDataProvider');
  }
  return ctx;
}
