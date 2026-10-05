export interface AdminZoneRef {
  id: string;
  name: string;
  code?: string | null;
  city?: string | null;
}

export interface AdminProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  unrestricted?: boolean;
  zones?: AdminZoneRef[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
  admin?: AdminProfile;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
