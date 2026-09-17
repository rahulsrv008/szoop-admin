/** Shape returned by every paginated backend list endpoint. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Query params accepted by the list endpoints. */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
