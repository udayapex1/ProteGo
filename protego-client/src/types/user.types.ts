export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pairedWith: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}