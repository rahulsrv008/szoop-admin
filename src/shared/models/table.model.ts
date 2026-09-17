/** Column definition consumed by <app-data-table>. */
export interface TableColumn<T = any> {
  key: string;
  label: string;
  /** How the cell is rendered. Defaults to plain text. */
  type?:
    | 'text'
    | 'number'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'badge'
    | 'boolean'
    | 'chips';
  /** Custom accessor when the value is not a top-level property. */
  value?: (row: T) => unknown;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  /** Shown instead of an empty value. */
  fallback?: string;
}

export interface TableAction<T = any> {
  id: string;
  label: string;
  icon: string;
  color?: 'primary' | 'accent' | 'warn';
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

export interface TablePageEvent {
  page: number;
  limit: number;
}

export interface TableSortEvent {
  active: string;
  direction: 'asc' | 'desc' | '';
}

export interface TableActionEvent<T = any> {
  id: string;
  row: T;
}
