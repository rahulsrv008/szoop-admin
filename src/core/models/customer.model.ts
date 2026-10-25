export interface CustomerAddress {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  addressType?: string | null;
  isDefault?: boolean;
  serviceAreaId?: string | null;
  zone?: {
    id: string;
    code?: string | null;
    name: string;
    city?: string | null;
  } | null;
}

export interface CustomerListItem {
  customerId: string;
  userId: string;
  name: string | null;
  mobile: string;
  email?: string | null;
  isActive: boolean;
  deletedAt?: string | null;
  totalBookings?: number;
  lastBookingDate?: string | null;
  createdAt: string;
  homeZone?: {
    id: string;
    code?: string | null;
    name: string;
  } | null;
}

export interface CustomerDetail extends CustomerListItem {
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  profileImage?: string | null;
  addresses?: CustomerAddress[];
  counts?: {
    bookingsByStatus?: Record<string, number>;
    totalSpent?: number;
  };
  recentBookings?: unknown[];
}

export interface UpdateCustomerPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
}
