import axios from 'axios';
import { MonthData, MonthSummary, MonthInsight, AuthUser, BulkImportResult } from '../types';

const TOKEN_KEY = 'wdig_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string | null) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

// Attach the token to every request. Interceptor lives here rather than
// per-call so nobody can forget it on a new endpoint later.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 here always means "token missing/expired/invalid" (that's the only
// thing authMiddleware returns 401 for), never "wrong password" — that's a
// 401 from a *login* call specifically, which callers handle themselves via
// the rejected promise, not through this global interceptor. This global
// interceptor only fires for authenticated routes going stale mid-session.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && tokenStore.get()) {
      tokenStore.set(null);
      window.dispatchEvent(new Event('wdig:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const register = async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
  const { data } = await api.post('/auth/register', { email, password });
  return data;
};

export const login = async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const fetchAllMonths = async (): Promise<MonthSummary[]> => {
  const { data } = await api.get('/months');
  return data;
};

export const fetchMonth = async (year: number, month: number): Promise<MonthData> => {
  const { data } = await api.get(`/months/${year}/${month}`);
  return data;
};

export const upsertMonth = async (year: number, month: number, salary: number, salaryDate?: number): Promise<MonthData> => {
  const { data } = await api.post('/months', { year, month, salary, salaryDate });
  return data;
};

export const addExpense = async (
  year: number,
  month: number,
  expense: { description: string; amount: number; category: string; date: string }
): Promise<MonthData> => {
  const { data } = await api.post(`/months/${year}/${month}/expenses`, expense);
  return data;
};

export const deleteExpense = async (
  year: number,
  month: number,
  expenseId: string
): Promise<MonthData> => {
  const { data } = await api.delete(`/months/${year}/${month}/expenses/${expenseId}`);
  return data;
};

export const fetchInsights = async (): Promise<MonthInsight[]> => {
  const { data } = await api.get('/insights');
  return data;
};

export const bulkImportMonths = async (months: unknown[]): Promise<BulkImportResult> => {
  const { data } = await api.post('/months/bulk', months);
  return data;
};

export const deleteMonth = async (year: number, month: number): Promise<void> => {
  await api.delete(`/months/${year}/${month}`);
};
