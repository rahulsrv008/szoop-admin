import { ListQuery, ServiceArea, Society } from '@core/models';

export interface AreaListQuery extends ListQuery {
  isActive?: boolean;
  city?: string;
  region?: string;
}

export interface ZoneAreaPayload {
  area: string;
  pincode: string;
  buildingsCover?: string[];
}

export interface AreaPayload {
  name: string;
  code?: string | null;
  city?: string | null;
  region?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  serviceRadiusKm?: number | null;
  areas?: ZoneAreaPayload[];
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
  region: string | null;
  state: string | null;
  areaCount: number;
  activeAreaCount: number;
  pincodeCount: number;
}

/** Flat pincode view derived from service_areas. */
export interface PincodeRow {
  pincode: string;
  areaName: string;
  zoneName: string;
  city: string | null;
  isActive: boolean;
  areaId: string;
}

export function zonePincodes(area: ServiceArea): string[] {
  const values = new Set<string>();
  for (const item of area.areas ?? []) {
    if (item.pincode) values.add(item.pincode);
  }
  if (area.pincode) values.add(area.pincode);
  return [...values];
}

export type { ServiceArea, Society };
