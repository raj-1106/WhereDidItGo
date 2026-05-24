import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense {
  description: string;
  amount: number;
  category: string;
  date: Date;
}

export interface IMonth extends Document {
  year: number;
  month: number; // 1-12
  salary: number;
  expenses: IExpense[];
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: [
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
    ],
    default: 'Other',
  },
  date: { type: Date, required: true, default: Date.now },
});

const MonthSchema = new Schema<IMonth>(
  {
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    salary: { type: Number, required: true, min: 0 },
    expenses: [ExpenseSchema],
  },
  { timestamps: true }
);

MonthSchema.index({ year: 1, month: 1 }, { unique: true });

export const Month = mongoose.model<IMonth>('Month', MonthSchema);
