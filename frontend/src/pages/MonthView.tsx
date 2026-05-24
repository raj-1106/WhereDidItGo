import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet, TrendingDown, PiggyBank, Receipt } from 'lucide-react';
import { fetchMonth, addExpense, deleteExpense, upsertMonth } from '../api';
import { MonthData, CATEGORIES, MONTH_NAMES } from '../types';

interface Props {
  year: number;
  month: number;
  onBack: () => void;
}

const CHART_COLORS = ['#1a5c38', '#d4af37', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#14b8a6', '#ec4899', '#84cc16', '#06b6d4'];

const MonthView: React.FC<Props> = ({ year, month, onBack }) => {
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditSalary, setShowEditSalary] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [expForm, setExpForm] = useState({
    description: '',
    amount: '',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
  });
  const [salaryForm, setSalaryForm] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchMonth(year, month);
      setData(d);
      setSalaryForm(String(d.salary));
    } catch {
      setError('Failed to load month data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year, month]);

  const handleAddExpense = async () => {
    if (!expForm.description.trim() || !expForm.amount || Number(expForm.amount) <= 0) {
      setError('Fill all fields with valid values');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const d = await addExpense(year, month, {
        description: expForm.description.trim(),
        amount: Number(expForm.amount),
        category: expForm.category,
        date: expForm.date,
      });
      setData(d);
      setShowAddExpense(false);
      setExpForm({ description: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().split('T')[0] });
    } catch {
      setError('Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!data) return;
    try {
      const d = await deleteExpense(year, month, expenseId);
      setData(d);
    } catch {
      setError('Failed to delete expense');
    }
  };

  const handleUpdateSalary = async () => {
    if (!salaryForm || Number(salaryForm) <= 0) {
      setError('Enter a valid salary');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await upsertMonth(year, month, Number(salaryForm));
      load();
      setShowEditSalary(false);
    } catch {
      setError('Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading month…</div>;
  if (!data) return <div className="loading">Month not found.</div>;

  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const savings = data.salary - totalExpenses;
  const spentPct = data.salary > 0 ? (totalExpenses / data.salary) * 100 : 0;

  const categoryMap: Record<string, number> = {};
  data.expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const dailyMap: Record<string, number> = {};
  data.expenses.forEach((e) => {
    const d = new Date(e.date).getDate();
    dailyMap[`${d}`] = (dailyMap[`${d}`] || 0) + e.amount;
  });
  const barData = Object.entries(dailyMap)
    .map(([day, amt]) => ({ day, amount: amt }))
    .sort((a, b) => Number(a.day) - Number(b.day));

  const topCategory = pieData[0];

  const iconBox = (bg: string, border: string, icon: React.ReactNode) => (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  );

  const reversedExpenses = [...data.expenses].reverse();

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = reversedExpenses.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(reversedExpenses.length / ITEMS_PER_PAGE);

  return (
    <div>
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{MONTH_NAMES[month - 1]} {year}</h1>
          <p className="page-subtitle">{data.expenses.length} expense{data.expenses.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setShowAddExpense(true); }}>
          + Add Expense
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stats-grid">
        {/* Salary */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowEditSalary(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div className="stat-label" style={{ marginBottom: 0 }}>Salary ✎</div>
            {iconBox('var(--accent)', 'var(--accent)', <Wallet size={15} color="#fff" />)}
          </div>
          <div className="stat-value">₹{data.salary.toLocaleString('en-IN')}</div>
        </div>

        {/* Total Spent */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div className="stat-label" style={{ marginBottom: 0 }}>Total Spent</div>
            {iconBox('var(--danger-dim)', 'rgba(239,68,68,0.25)', <TrendingDown size={15} color="var(--danger)" />)}
          </div>
          <div className="stat-value danger">₹{totalExpenses.toLocaleString('en-IN')}</div>
          <div className="stat-sub">{spentPct.toFixed(1)}% of salary</div>
        </div>

        {/* Remaining */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <div className="stat-label" style={{ marginBottom: 0 }}>Remaining</div>
            {iconBox('var(--success-dim)', 'rgba(16,185,129,0.25)', <PiggyBank size={15} color="var(--success)" />)}
          </div>
          <div className={`stat-value ${savings >= 0 ? 'success' : 'danger'}`}>
            ₹{Math.abs(savings).toLocaleString('en-IN')}
          </div>
          <div className="stat-sub">{savings >= 0 ? 'surplus' : 'OVERSPENT'}</div>
        </div>

        {/* Biggest Spend */}
        {topCategory && (
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div className="stat-label" style={{ marginBottom: 0 }}>Biggest Spend</div>
              {iconBox('var(--accent-glow)', 'rgba(212,175,55,0.3)', <Receipt size={15} color="var(--accent)" />)}
            </div>
            <div className="stat-value accent">₹{topCategory.value.toLocaleString('en-IN')}</div>
            <div className="stat-sub">{topCategory.name}</div>
          </div>
        )}
      </div>

      {/* Spend progress */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="section-title" style={{ marginBottom: 0 }}>Budget Used</span>
          <span style={{ fontSize: '0.75rem', fontFamily: 'DM Mono', color: spentPct > 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {spentPct.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar-track" style={{ height: '10px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(spentPct, 100)}%`,
              background: spentPct > 90 ? 'var(--danger)' : spentPct > 70 ? 'var(--accent)' : 'var(--success)',
            }}
          />
        </div>
        {spentPct > 80 && (
          <div style={{ fontSize: '0.72rem', fontFamily: 'DM Mono', color: 'var(--danger)', marginTop: '0.4rem' }}>
            ⚠ You've used {spentPct.toFixed(0)}% of your income. Consider cutting {topCategory?.name}.
          </div>
        )}
      </div>

      {/* Charts */}
      {data.expenses.length > 0 && (
        <div className="two-col">
          <div className="chart-wrap">
            <div className="chart-title">Spending by Category</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '0.78rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {pieData.map((d, idx) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontFamily: 'DM Mono', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length], display: 'inline-block', flexShrink: 0 }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-title">Daily Spending</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="day" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '0.78rem' }}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="section-title">Expenses</div>
      {data.expenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◇</div>
          <div className="empty-state-text">No expenses yet. Add your first one.</div>
        </div>
      ) : (
        <div className="expense-list">
          {paginatedExpenses.map((expense) => (
            <div className="expense-item" key={expense._id}>
              <div className="expense-left">
                <div className="expense-desc">{expense.description}</div>
                <div className="expense-meta">
                  <span>{new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <span className="cat-badge">{expense.category}</span>
                </div>
              </div>
              <div className="expense-right">
                <div className="expense-amount">₹{expense.amount.toLocaleString('en-IN')}</div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteExpense(expense._id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="btn btn-ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ← Prev
          </button>

          <span style={{ fontFamily: 'DM Mono', fontSize: '0.8rem' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-ghost"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Expense</div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  placeholder="e.g. Lunch at Agashiye"
                  value={expForm.description}
                  onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="0"
                    value={expForm.amount}
                    onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={expForm.date}
                    onChange={(e) => setExpForm({ ...expForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={expForm.category}
                  onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowAddExpense(false); setError(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddExpense} disabled={saving}>
                {saving ? 'Saving…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Salary Modal */}
      {showEditSalary && (
        <div className="modal-overlay" onClick={() => setShowEditSalary(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Update Salary</div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label className="form-label">Salary (₹)</label>
              <input
                className="form-input"
                type="number"
                value={salaryForm}
                onChange={(e) => setSalaryForm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowEditSalary(false); setError(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateSalary} disabled={saving}>
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthView;