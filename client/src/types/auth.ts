export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface BackendApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
