import axios from 'axios';
import { MonthData, MonthSummary, MonthInsight } from '../types';

const api = axios.create({ baseURL: '/api' });

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
