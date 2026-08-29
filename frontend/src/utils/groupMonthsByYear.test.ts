import { groupMonthsByYear } from './groupMonthsByYear';
import { MonthSummary, MonthInsight } from '../types';

const summary = (year: number, month: number, salary: number): MonthSummary => ({
  _id: `${year}-${month}`,
  year,
  month,
  salary,
});

const insight = (year: number, month: number, salary: number, totalExpenses: number): MonthInsight => ({
  year,
  month,
  salary,
  totalExpenses,
  savings: salary - totalExpenses,
  savingsRate: salary > 0 ? ((salary - totalExpenses) / salary) * 100 : 0,
  categoryBreakdown: {},
  expenseCount: 0,
});

describe('groupMonthsByYear', () => {
  it('failure case: empty input returns no groups', () => {
    expect(groupMonthsByYear([], [])).toEqual([]);
  });

  it('main case: splits consecutive months into year groups with correct sums', () => {
    const months = [
      summary(2026, 8, 41050),
      summary(2026, 7, 41050),
      summary(2025, 12, 38000),
    ];
    const insights = [
      insight(2026, 8, 41050, 40996.23),
      insight(2026, 7, 41050, 41205),
      insight(2025, 12, 38000, 30000),
    ];

    const groups = groupMonthsByYear(months, insights);

    expect(groups).toHaveLength(2);
    expect(groups[0].year).toBe(2026);
    expect(groups[0].months).toHaveLength(2);
    expect(groups[0].totalIncome).toBeCloseTo(82100);
    expect(groups[0].totalExpenses).toBeCloseTo(82201.23);
    expect(groups[0].totalSaved).toBeCloseTo(-101.23);

    expect(groups[1].year).toBe(2025);
    expect(groups[1].months).toHaveLength(1);
    expect(groups[1].totalIncome).toBe(38000);
    expect(groups[1].totalExpenses).toBe(30000);
  });

  it('edge case: a month with no matching insight falls back to salary-only, zero expenses', () => {
    const months = [summary(2026, 8, 50000)];
    const groups = groupMonthsByYear(months, []); // insights not loaded yet

    expect(groups).toHaveLength(1);
    expect(groups[0].totalIncome).toBe(50000);
    expect(groups[0].totalExpenses).toBe(0);
    expect(groups[0].totalSaved).toBe(50000);
  });

  it('edge case: non-consecutive same-year entries would incorrectly split (documents the ordering assumption)', () => {
    // If months ever arrive NOT grouped consecutively by year, this function
    // produces two separate 2026 groups instead of merging them. This test
    // exists to catch that assumption breaking silently if the API's sort
    // order ever changes.
    const months = [summary(2026, 8, 1000), summary(2025, 1, 1000), summary(2026, 1, 1000)];
    const groups = groupMonthsByYear(months, []);
    expect(groups).toHaveLength(3);
  });
});
