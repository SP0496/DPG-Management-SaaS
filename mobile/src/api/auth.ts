import { apiClient } from './client';
import { LoginFormData, RegisterFormData } from '../utils/validation';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ROLE_SUPER_ADMIN' | 'ROLE_PROPERTY_ADMIN' | 'ROLE_STAFF' | 'ROLE_TENANT';
  organizationId?: string;
}

export interface AuthApiResponse {
  success: boolean;
  message: string;
  data: {
    tokenType: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserProfile;
  };
}

export const authApi = {
  async register(data: RegisterFormData): Promise<AuthApiResponse['data']> {
    const res = await apiClient.post<AuthApiResponse>('/auth/register', data);
    return res.data.data;
  },

  async login(data: LoginFormData): Promise<AuthApiResponse['data']> {
    const res = await apiClient.post<AuthApiResponse>('/auth/login', data);
    return res.data.data;
  },

  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<{ success: boolean; data: UserProfile }>('/auth/me');
    return res.data.data;
  },
};
