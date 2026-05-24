export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface MonthData {
  _id: string;
  year: number;
  month: number;
  salary: number;
  expenses: Expense[];
}

export interface MonthSummary {
  _id: string;
  year: number;
  month: number;
  salary: number;
}

export interface MonthInsight {
  year: number;
  month: number;
  salary: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  categoryBreakdown: Record<string, number>;
  expenseCount: number;
}

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing & Rent',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Savings & Investment',
  'Personal Care',
  'Other',
] as const;

export interface MonthData {
  _id: string;
  year: number;
  month: number;
  salary: number;
  salaryDate: number;
  expenses: Expense[];
}

export type Category = (typeof CATEGORIES)[number];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
