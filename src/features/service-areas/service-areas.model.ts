import { ListQuery, ServiceArea, Society } from '@core/models';

export interface AreaListQuery extends ListQuery {
  isActive?: boolean;
}

export interface AreaPayload {
  name: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  isActive: boolean;
}

export interface SocietyListQuery extends ListQuery {
  isActive?: boolean;
}

export interface SocietyPayload {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  totalUnits?: number | null;
  isActive: boolean;
}

export interface RemoveOutcome {
  deleted: boolean;
  deactivated: boolean;
  reason: string | null;
}

/** Client-side aggregation of service_areas rows by city. */
export interface CityAggregate {
  city: string;
  state: string | null;
  areaCount: number;
  activeAreaCount: number;
  pincodeCount: number;
}

/** Flat pincode view derived from service_areas. */
export interface PincodeRow {
  pincode: string;
  areaName: string;
  city: string | null;
  isActive: boolean;
  areaId: string;
}

export type { ServiceArea, Society };
