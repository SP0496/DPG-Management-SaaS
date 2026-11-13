export type UserRole = 'OWNER' | 'RESIDENT';

export type PropertyType = 'MENS_PG' | 'WOMENS_PG' | 'CO_LIVING' | 'HOSTEL';

export type SharingType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SHARING' | 'DORMITORY';

export type BedStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export type BookingStatus = 'PENDING' | 'ACTIVE' | 'NOTICE_GIVEN' | 'CHECKED_OUT' | 'CANCELLED';

export type DepositStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export type RentStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type PaymentMethod =
  | 'UPI_INTENT'
  | 'UPI_QR'
  | 'NEFT'
  | 'IMPS'
  | 'CASH'
  | 'UPI_MANUAL'
  | 'BANK_TRANSFER'
  | 'CHEQUE';

export type PaymentSubmissionStatus = 'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED';

export type RentRevisionStatus = 'PENDING_RESIDENT_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED';

export type NotificationType =
  | 'INVOICE'
  | 'PAYMENT'
  | 'COMPLAINT'
  | 'ANNOUNCEMENT'
  | 'BOOKING'
  | 'RENT_REVISION'
  | 'SYSTEM';

export type ComplaintCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CLEANING'
  | 'INTERNET'
  | 'SECURITY'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface AuthSessionData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  newUser: boolean;
  user: AuthUser;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  businessName: string;
  panNumber: string | null;
  gstNumber: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  upiId?: string | null;
  upiPayeeName?: string | null;
  bankAccountHolder?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  onboardingStatus?: string;
  merchantOnboardingStatus?: string;
  settlementAccountMasked?: string | null;
  kycVerified?: boolean;
}

export interface OwnerDashboardStats {
  totalProperties: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  maintenanceBeds: number;
  occupancyPercentage: number;
  totalResidents: number;
  activeBookings: number;
  noticeGivenCount: number;
  pendingKycCount: number;
  openComplaintsCount: number;
  inProgressComplaintsCount: number;
  expectedMonthlyRent?: number;
  collectedThisMonth: number;
  pendingRentTotal: number;
  overdueRentTotal: number;
  overdueInvoicesCount: number;
  pendingInvitationsCount: number;
  paidResidentsCount?: number;
  pendingResidentsCount?: number;
  pendingVerificationCount?: number;
}

export interface PropertyItem {
  id: string;
  ownerId: string;
  name: string;
  propertyType: PropertyType;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  emergencyContact: string;
  defaultBillingDay: number;
  gracePeriodDays: number;
  lateFeeAmount: number;
  amenities?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BedItem {
  id: string;
  ownerId: string;
  propertyId: string;
  roomId: string;
  bedCode: string;
  status: BedStatus;
  version?: number;
}

export interface RoomItem {
  id: string;
  ownerId: string;
  propertyId: string;
  roomNumber: string;
  floorNumber: number;
  sharingType: SharingType;
  baseMonthlyRent: number;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
  active: boolean;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  maintenanceBeds: number;
  occupancyPercentage: number;
  beds: BedItem[];
}

export interface ResidentItem {
  id: string;
  userId: string;
  ownerId: string | null;
  fullName: string;
  email: string | null;
  phone: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  permanentAddress?: string | null;
  idProofType?: string | null;
  idProofLast4?: string | null;
  occupation?: string | null;
  kycVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResidentInvitationItem {
  id: string;
  ownerId: string;
  propertyId?: string | null;
  propertyName?: string | null;
  residentUserId: string;
  residentName?: string | null;
  phone: string;
  inviteCode?: string | null;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface BookingItem {
  id: string;
  ownerId: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  residentId: string;
  checkInDate: string;
  expectedCheckOutDate?: string | null;
  actualCheckOutDate?: string | null;
  agreedMonthlyRent: number;
  securityDepositAmount: number;
  depositStatus: DepositStatus;
  status: BookingStatus;
  notes?: string | null;
}

export interface InvoiceItem {
  id: string;
  ownerId: string;
  propertyId: string;
  residentId: string;
  bookingId: string;
  invoiceNumber: string;
  billingMonth: string;
  baseRent: number;
  utilityCharges: number;
  penaltyFee: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  status: RentStatus;
  dueDate: string;
  paidAt?: string | null;
  notes?: string | null;
}

export interface MonthlyGenerationResult {
  billingMonth: string;
  createdCount: number;
  skippedCount: number;
  generatedInvoices: InvoiceItem[];
}

export interface PaymentRecordItem {
  id: string;
  ownerId: string;
  residentId: string;
  invoiceId: string;
  idempotencyKey?: string | null;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  referenceNumber?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  notes?: string | null;
  paidAt: string;
}

export interface ComplaintItem {
  id: string;
  ownerId: string;
  propertyId: string;
  residentId: string;
  bookingId?: string | null;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  ownerId: string;
  propertyId?: string | null;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ResidentAssignedRoom {
  bookingId: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  propertyEmergencyContact?: string | null;
  propertyAmenities?: string[] | null;
  defaultBillingDay?: number;
  gracePeriodDays?: number;
  lateFeeAmount?: number;
  ownerBusinessName?: string | null;
  ownerPhone?: string | null;
  roomId: string;
  roomNumber: string;
  floorNumber: number;
  roomType: string;
  hasAttachedBathroom?: boolean;
  hasBalcony?: boolean;
  bedId: string;
  bedNumber: string;
  bookingStatus: BookingStatus;
  checkInDate: string;
  expectedCheckOutDate?: string | null;
  agreedMonthlyRent: number;
  securityDepositAmount: number;
  nextDueDate?: string | null;
}

export interface ResidentDashboardData {
  profile: ResidentItem;
  assignedRoom: ResidentAssignedRoom | null;
  outstandingBalance: number;
  overdueBalance: number;
  overdueInvoicesCount: number;
  pendingInvoicesCount: number;
  nextDueDate?: string | null;
  nextDueAmount: number;
  nextDueInvoiceNumber?: string | null;
  openComplaintsCount: number;
  resolvedComplaintsCount: number;
  activeAnnouncementsCount: number;
  recentAnnouncements: AnnouncementItem[];
}

export interface PaymentReceiptData {
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  billingMonth: string;
  propertyName: string;
  propertyAddress: string;
  roomNumber: string;
  bedNumber: string;
  ownerBusinessName: string;
  ownerPhone: string;
  residentName: string;
  residentPhone: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  referenceNumber?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  notes?: string | null;
  paidAt: string;
}

export interface FoodMenuDay {
  id?: string;
  propertyId?: string | null;
  day: string;
  dayOrder?: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks?: string | null;
}

export interface InvoiceLineItem {
  id: string;
  itemType: 'BASE_RENT' | 'ADDITIONAL_CHARGE' | 'PENALTY' | 'DISCOUNT';
  description: string;
  amountPaise: number;
  amount: number;
}

export interface ResidentCheckoutDetails {
  invoiceId: string;
  invoiceNumber: string;
  billingMonth: string;
  dueDate: string;
  status: RentStatus;
  fixedMonthlyRentPaise: number;
  additionalChargesPaise: number;
  penaltyFeePaise: number;
  totalAmountPaise: number;
  paidAmountPaise: number;
  outstandingAmountPaise: number;
  fixedMonthlyRent: number;
  additionalCharges: number;
  penaltyFee: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  items: InvoiceLineItem[];
  propertyName: string;
  floorNumber: number;
  roomNumber: string;
  bedCode: string;
  residentName: string;
  ownerBusinessName: string;
  ownerUpiId?: string | null;
  ownerUpiPayeeName?: string | null;
  upiDeepLink?: string | null;
  bankAccountHolder?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankVerificationAvailable: boolean;
  verificationNotice: string;
}

export interface PaymentSubmissionItem {
  id: string;
  ownerId: string;
  propertyId: string;
  propertyName: string;
  floorNumber: number;
  roomNumber: string;
  residentId: string;
  residentName: string;
  invoiceId: string;
  invoiceNumber: string;
  billingMonth: string;
  idempotencyKey: string;
  paymentMethod: PaymentMethod;
  amountPaise: number;
  amount: number;
  currency: string;
  utrReference: string;
  payerUpiId?: string | null;
  payerName?: string | null;
  bankName?: string | null;
  paymentDate: string;
  notes?: string | null;
  status: PaymentSubmissionStatus;
  rejectionReason?: string | null;
  submittedAt: string;
  verifiedAt?: string | null;
  receiptNumber?: string | null;
  paymentId?: string | null;
  remainingBalancePaise: number;
  remainingBalance: number;
  ownerRemarks?: string | null;
  verificationSource: string;
}

export interface RentLedgerEntry {
  id: string;
  submissionId?: string | null;
  paymentId?: string | null;
  invoiceId: string;
  propertyId: string;
  propertyName: string;
  floorNumber: number;
  roomNumber: string;
  residentId: string;
  residentName: string;
  invoiceNumber: string;
  billingMonth: string;
  amount: number;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  paymentDate: string;
  status: string;
  receiptNumber?: string | null;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  ownerId?: string | null;
  title: string;
  body: string;
  type: NotificationType;
  referenceId?: string | null;
  targetType?: string | null;
  transactionSubmissionId?: string | null;
  pushSent: boolean;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface RentRevisionItem {
  id: string;
  assignmentId: string;
  bookingId: string;
  ownerId: string;
  residentId: string;
  previousMonthlyRent: number;
  proposedMonthlyRent: number;
  previousRentPaise: number;
  proposedRentPaise: number;
  effectiveDate: string;
  reason?: string | null;
  status: RentRevisionStatus;
  proposedAt: string;
  respondedAt?: string | null;
  residentRemarks?: string | null;
}
