import { ListQuery, RatingRow, RatingSummary } from '@core/models';

export interface RatingsListQuery extends ListQuery {
  agentId?: string;
  customerId?: string;
  minRating?: number;
  maxRating?: number;
}

export interface RatingsListResponse {
  items: RatingRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: RatingSummary;
}

export interface RatingReview {
  id: string;
  reviewText?: string | null;
  createdAt: string;
}

export interface RatingDetail {
  id: string;
  rating: number;
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    bookingDate?: string;
    status?: string;
  } | null;
  customer?: {
    customerId: string;
    name?: string | null;
    mobile?: string | null;
  } | null;
  agent?: {
    agentId: string;
    name?: string | null;
    mobile?: string | null;
  } | null;
  reviews: RatingReview[];
}

export interface RatingDeleteResult {
  deleted: boolean;
  reviewsDeleted: number;
}
