import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Month, IExpense } from '../models/Month';

const MAX_MONTHS_PER_IMPORT = 60;
const MAX_EXPENSES_PER_MONTH = 2000;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 100;

interface RawExpense {
  description?: unknown;
  amount?: unknown;
  category?: unknown;
  date?: unknown;
}

interface RawMonth {
  year?: unknown;
  month?: unknown;
  salary?: unknown;
  expenses?: unknown;
}

interface ExpenseError {
  index: number;
  reason: string;
}

// Validates one expense row. Returns either a clean object safe to store,
// or null with a reason. Never trusts the shape of the input beyond what
// it explicitly checks here, no field is passed through unread.
function validateExpense(raw: RawExpense, defaultDate: Date): { ok: true; value: Omit<IExpense, '_id'> } | { ok: false; reason: string } {
  if (typeof raw.description !== 'string' || raw.description.trim().length === 0) {
    return { ok: false, reason: 'description must be a non-empty string' };
  }
  if (raw.description.length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, reason: `description exceeds ${MAX_DESCRIPTION_LENGTH} characters` };
  }
  if (typeof raw.amount !== 'number' || !Number.isFinite(raw.amount) || raw.amount < 0) {
    return { ok: false, reason: 'amount must be a non-negative number' };
  }
  if (typeof raw.category !== 'string' || raw.category.trim().length === 0) {
    return { ok: false, reason: 'category must be a non-empty string' };
  }
  if (raw.category.length > MAX_CATEGORY_LENGTH) {
    return { ok: false, reason: `category exceeds ${MAX_CATEGORY_LENGTH} characters` };
  }

  let date = defaultDate;
  if (raw.date !== undefined) {
    if (typeof raw.date !== 'string') {
      return { ok: false, reason: 'date must be a string if provided' };
    }
    const parsed = new Date(raw.date);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, reason: 'date is not a valid date' };
    }
    date = parsed;
  }

  return {
    ok: true,
    value: {
      description: raw.description.trim(),
      amount: raw.amount,
      category: raw.category.trim(),
      date,
    },
  };
}

// POST /api/months/bulk
export const bulkImportMonths = async (req: Request, res: Response) => {
  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be an array of month objects' });
  }
  if (body.length === 0) {
    return res.status(400).json({ error: 'No months provided' });
  }
  if (body.length > MAX_MONTHS_PER_IMPORT) {
    return res.status(400).json({
      error: `Cannot import more than ${MAX_MONTHS_PER_IMPORT} months in a single request`,
    });
  }

  const userId = req.user!.uid;
  const skippedMonths: { index: number; reason: string }[] = [];
  const expenseErrorsByMonth: { year: number; month: number; errors: ExpenseError[] }[] = [];
  let monthsCreated = 0;
  let monthsMerged = 0;
  let expensesImported = 0;

  // Sequential on purpose: a file containing two rows for the same
  // year/month must have the second merge into what the first just
  // created, not race it under MongoDB's upsert semantics.
  for (let i = 0; i < body.length; i++) {
    const raw = body[i] as RawMonth;

    const year = typeof raw.year === 'number' ? raw.year : NaN;
    const month = typeof raw.month === 'number' ? raw.month : NaN;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      skippedMonths.push({ index: i, reason: 'year must be an integer between 2000 and 2100' });
      continue;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      skippedMonths.push({ index: i, reason: 'month must be an integer between 1 and 12' });
      continue;
    }

    const rawExpenses = Array.isArray(raw.expenses) ? raw.expenses : [];
    if (rawExpenses.length > MAX_EXPENSES_PER_MONTH) {
      skippedMonths.push({
        index: i,
        reason: `expenses exceeds ${MAX_EXPENSES_PER_MONTH} entries for a single month`,
      });
      continue;
    }

    const defaultDate = new Date(year, month - 1, 1);
    const validExpenses: Omit<IExpense, '_id'>[] = [];
    const rowErrors: ExpenseError[] = [];
    rawExpenses.forEach((e, idx) => {
      const result = validateExpense(e as RawExpense, defaultDate);
      if (result.ok) validExpenses.push(result.value);
      else rowErrors.push({ index: idx, reason: result.reason });
    });
    if (rowErrors.length > 0) {
      expenseErrorsByMonth.push({ year, month, errors: rowErrors });
    }

    const salary =
      typeof raw.salary === 'number' && Number.isFinite(raw.salary) && raw.salary >= 0
        ? raw.salary
        : 0;

    const existing = await Month.findOne({ userId, year, month });

    if (existing) {
      if (validExpenses.length > 0) {
        existing.expenses.push(...(validExpenses as IExpense[]));
        await existing.save();
      }
      monthsMerged++;
    } else {
      await Month.create({
        userId: new mongoose.Types.ObjectId(userId),
        year,
        month,
        salary,
        expenses: validExpenses,
      });
      monthsCreated++;
    }
    expensesImported += validExpenses.length;
  }

  res.status(200).json({
    monthsCreated,
    monthsMerged,
    expensesImported,
    skippedMonths,
    expenseErrorsByMonth,
  });
};

// GET /api/months - get all months summary (this user only)
export const getAllMonths = async (req: Request, res: Response) => {
  try {
    const months = await Month.find({ userId: req.user!.uid }, { expenses: 0 }).sort({
      year: -1,
      month: -1,
    });
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch months' });
  }
};

// GET /api/months/:year/:month - get single month with expenses (this user only)
export const getMonth = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    const doc = await Month.findOne({
      userId: req.user!.uid,
      year: Number(year),
      month: Number(month),
    });
    if (!doc) return res.status(404).json({ error: 'Month not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch month' });
  }
};

// POST /api/months - create or update month salary (this user only)
export const upsertMonth = async (req: Request, res: Response) => {
  try {
    const { year, month, salary } = req.body;
    if (!year || !month || salary === undefined) {
      return res.status(400).json({ error: 'year, month, and salary are required' });
    }
    const doc = await Month.findOneAndUpdate(
      { userId: req.user!.uid, year, month },
      { $setOnInsert: { expenses: [] }, $set: { salary } },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create/update month' });
  }
};

// POST /api/months/:year/:month/expenses - add expense (this user only)
export const addExpense = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;
    const { description, amount, category, date } = req.body;
    if (!description || amount === undefined || !category) {
      return res.status(400).json({ error: 'description, amount, and category are required' });
    }
    const doc = await Month.findOne({
      userId: req.user!.uid,
      year: Number(year),
      month: Number(month),
    });
    if (!doc) return res.status(404).json({ error: 'Month not found. Set salary first.' });

    doc.expenses.push({ description, amount, category, date: date ? new Date(date) : new Date() });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
};

// DELETE /api/months/:year/:month/expenses/:expenseId (this user only)
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { year, month, expenseId } = req.params;
    const doc = await Month.findOne({
      userId: req.user!.uid,
      year: Number(year),
      month: Number(month),
    });
    if (!doc) return res.status(404).json({ error: 'Month not found' });

    doc.expenses = doc.expenses.filter((e: any) => e._id.toString() !== expenseId);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// GET /api/insights - multi-month analytics (this user only)
export const getInsights = async (req: Request, res: Response) => {
  try {
    const months = await Month.find({ userId: req.user!.uid }).sort({ year: 1, month: 1 });
    const insights = months.map((m) => {
      const totalExpenses = m.expenses.reduce((sum, e) => sum + e.amount, 0);
      const categoryBreakdown: Record<string, number> = {};
      m.expenses.forEach((e) => {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      });
      return {
        year: m.year,
        month: m.month,
        salary: m.salary,
        totalExpenses,
        savings: m.salary - totalExpenses,
        savingsRate: m.salary > 0 ? ((m.salary - totalExpenses) / m.salary) * 100 : 0,
        categoryBreakdown,
        expenseCount: m.expenses.length,
      };
    });
    res.json(insights);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute insights' });
  }
};
