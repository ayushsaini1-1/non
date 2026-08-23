export type UserRole = 'user' | 'admin';

export type MachineStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';

export type SlotStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'EXPIRED'
  | 'MISUSE_REPORTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  penalty_points: number;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id?: number;
  email?: string;
  user?: UserProfile;
}

export interface Machine {
  id: number;
  name: string;
  location: string;
  status: MachineStatus;
  qr_code_token: string;
  created_at: string;
}

export interface MachineQRInfo {
  machine_id: number;
  name: string;
  qr_code_token: string;
  printable_qr_url: string;
}

export interface SlotBooking {
  id: number;
  user_id: number;
  machine_id: number;
  start_time: string;
  end_time: string;
  grace_period_end: string;
  status: SlotStatus;
  checked_in_at: string | null;
  created_at: string;
}

export interface MisuseReport {
  id: number;
  reporter_id: number;
  machine_id: number;
  slot_id: number | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
  action_taken: string;
}

export interface VerifyQRResponse {
  message: string;
  status: SlotStatus;
  slot_id: number;
  checked_in_at: string | null;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}
