import { apiClient } from './apiClient';
import { User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const register = async (payload: { name: string; email: string; password: string; role?: string }) => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  return data;
};

export const login = async (payload: { email: string; password: string }) => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get<{ user: User }>('/api/auth/me');
  return data.user;
};
