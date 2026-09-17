import { AgentAttendanceRow, ListQuery } from '@core/models';

/** Query accepted by GET admin/attendance. */
export interface AttendanceListQuery extends ListQuery {
  agentId?: string;
  status?: string;
}

export interface AttendanceTotals {
  records: number;
  presentDays: number;
  completedShifts: number;
  totalHours: number;
}

export interface AttendanceListItem {
  id: string;
  agentId: string;
  agentName?: string | null;
  agentMobile?: string | null;
  attendanceDate: string;
  checkIn?: string | null;
  checkOut?: string | null;
  hoursWorked?: number | null;
  status?: string | null;
}

export interface AttendanceListResponse {
  items: AttendanceListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: AttendanceTotals;
}

export interface AttendanceReportQuery {
  agentId?: string;
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface AttendanceReportRow {
  agentId: string;
  agentName: string;
  agentMobile?: string | null;
  presentDays: number;
  totalHours: number;
  averageHours: number;
  lastCheckIn?: string | null;
}

export interface AttendanceReportResponse {
  range: { from: string; to: string };
  items: AttendanceReportRow[];
  totals: {
    agents: number;
    presentDays: number;
    totalHours: number;
  };
}

export type { AgentAttendanceRow };
