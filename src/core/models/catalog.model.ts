export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  serviceCount?: number;
  createdAt?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description?: string | null;
  durationMinutes: number;
  isActive: boolean;
  pricingCount?: number;
  createdAt?: string;
}

export interface ServicePricing {
  id: string;
  serviceId: string;
  serviceName?: string | null;
  serviceAreaId?: string | null;
  serviceAreaName?: string | null;
  pricePerHour: string | number;
  agentPayoutPerHour?: string | number | null;
  isActive: boolean;
  createdAt?: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Society {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  totalUnits?: number | null;
  isActive: boolean;
  createdAt?: string;
}
