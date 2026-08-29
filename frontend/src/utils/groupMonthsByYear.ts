import { MonthSummary, MonthInsight } from '../types';

export interface YearGroup {
  year: number;
  months: MonthSummary[];
  totalIncome: number;
  totalExpenses: number;
  totalSaved: number;
}

/**
 * Groups an already-sorted (year desc, month desc, as the API returns it)
 * list of months into per-year buckets with summed totals. Relies on the
 * input already being grouped consecutively by year, it does not re-sort,
 * so if the caller ever changes the fetch order this needs to change too.
 */
export function groupMonthsByYear(months: MonthSummary[], insights: MonthInsight[]): YearGroup[] {
  const groups: YearGroup[] = [];

  for (const m of months) {
    const insight = insights.find((i) => i.year === m.year && i.month === m.month);
    const income = insight ? insight.salary : m.salary;
    const spent = insight ? insight.totalExpenses : 0;

    let group = groups[groups.length - 1];
    if (!group || group.year !== m.year) {
      group = { year: m.year, months: [], totalIncome: 0, totalExpenses: 0, totalSaved: 0 };
      groups.push(group);
    }

    group.months.push(m);
    group.totalIncome += income;
    group.totalExpenses += spent;
    group.totalSaved = group.totalIncome - group.totalExpenses;
  }

  return groups;
}
