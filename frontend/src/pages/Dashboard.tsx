import React, { useEffect, useState, useRef } from 'react';
import { fetchAllMonths, upsertMonth, fetchInsights, bulkImportMonths } from '../api';
import { MonthSummary, MonthInsight, MONTH_NAMES, BulkImportResult } from '../types';
import { parseImportFile } from '../utils/parseImportFile';

interface Props {
  onSelectMonth: (year: number, month: number) => void;
}

const Dashboard: React.FC<Props> = ({ onSelectMonth }) => {
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [insights, setInsights] = useState<MonthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const [form, setForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    salary: '',
    salaryDate: 7,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([fetchAllMonths(), fetchInsights()]);
      setMonths(m);
      setInsights(i);
    } catch {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.salary || Number(form.salary) <= 0) {
      setError('Enter a valid salary');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await upsertMonth(form.year, form.month, Number(form.salary), form.salaryDate);
      setShowModal(false);
      load();
    } catch {
      setError('Failed to save. Check backend connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleImportClick = () => {
    setImportError('');
    setImportResult(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always clear the input value so selecting the same filename twice in
    // a row still fires onChange the second time.
    e.target.value = '';
    if (!file) return;

    setImportError('');
    setImportResult(null);

    let months: unknown[];
    try {
      const text = await file.text();
      months = parseImportFile(text);
    } catch (err: any) {
      setImportError(err.message || 'Could not read that file');
      return;
    }

    setImporting(true);
    try {
      const result = await bulkImportMonths(months);
      setImportResult(result);
      load();
    } catch (err: any) {
      setImportError(err?.response?.data?.error || 'Import failed. Check backend connection.');
    } finally {
      setImporting(false);
    }
  };

  const getInsightForMonth = (year: number, month: number) =>
    insights.find((i) => i.year === year && i.month === month);

  const totalSalary = insights.reduce((s, i) => s + i.salary, 0);
  const totalExpenses = insights.reduce((s, i) => s + i.totalExpenses, 0);
  const totalSavings = totalSalary - totalExpenses;
  const avgSavingsRate =
    insights.length > 0
      ? insights.reduce((s, i) => s + i.savingsRate, 0) / insights.length
      : 0;

  if (loading) return <div className="loading">Loading your data…</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">All-time summary across {months.length} month{months.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={handleImportClick} disabled={importing}>
            {importing ? 'Importing…' : 'Import Data'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
          <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>
            + New Month
          </button>
        </div>
      </div>

      {importError && <div className="alert alert-danger">{importError}</div>}
      {importResult && (
        <div className="alert alert-success" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div>
            Imported: {importResult.monthsCreated} new month{importResult.monthsCreated !== 1 ? 's' : ''},{' '}
            {importResult.monthsMerged} merged into existing, {importResult.expensesImported} expense
            {importResult.expensesImported !== 1 ? 's' : ''} added.
          </div>
          {importResult.skippedMonths.length > 0 && (
            <div style={{ fontSize: '0.8rem' }}>
              Skipped {importResult.skippedMonths.length} month{importResult.skippedMonths.length !== 1 ? 's' : ''}:{' '}
              {importResult.skippedMonths.map((s) => s.reason).join('; ')}
            </div>
          )}
          {importResult.expenseErrorsByMonth.length > 0 && (
            <div style={{ fontSize: '0.8rem' }}>
              {importResult.expenseErrorsByMonth.reduce((n, m) => n + m.errors.length, 0)} expense row
              {importResult.expenseErrorsByMonth.reduce((n, m) => n + m.errors.length, 0) !== 1 ? 's were' : ' was'} skipped
              for invalid data (rest of the file imported normally).
            </div>
          )}
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {insights.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Income</div>
            <div className="stat-value">₹{totalSalary.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value danger">₹{totalExpenses.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Saved</div>
            <div className="stat-value success">₹{totalSavings.toLocaleString('en-IN')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Savings Rate</div>
            <div className="stat-value accent">{avgSavingsRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {months.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <div className="empty-state-text">No months tracked yet. Add your first month.</div>
        </div>
      ) : (
        <>
          <div className="section-title">Monthly Records</div>
          <div className="month-grid">
            {months.map((m) => {
              const ins = getInsightForMonth(m.year, m.month);
              const savings = ins ? ins.savings : null;
              const spentPct = ins && m.salary > 0 ? (ins.totalExpenses / m.salary) * 100 : 0;
              return (
                <div
                  key={m._id}
                  className="month-card"
                  onClick={() => onSelectMonth(m.year, m.month)}
                >
                  <div className="month-card-year">{m.year}</div>
                  <div className="month-card-name">{MONTH_NAMES[m.month - 1]}</div>
                  <div className="month-card-salary">₹{m.salary.toLocaleString('en-IN')} salary</div>
                  {savings !== null && (
                    <div
                      className="month-card-savings"
                      style={{ color: savings >= 0 ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {savings >= 0
                        ? `↑ ₹${Math.abs(savings).toLocaleString('en-IN')} saved`
                        : `↓ ₹${Math.abs(savings).toLocaleString('en-IN')} overspent`
                      }
                    </div>
                  )}
                  {ins && (
                    <div className="progress-bar-track" style={{ marginTop: '0.75rem' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(spentPct, 100)}%`,
                          background: spentPct > 90 ? 'var(--danger)' : spentPct > 70 ? 'var(--accent)' : 'var(--success)',
                        }}
                      />
                    </div>
                  )}
                  {ins && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'DM Mono', marginTop: '0.3rem' }}>
                      {spentPct.toFixed(0)}% spent · {ins.expenseCount} entries
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">New Month</div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    min={2020}
                    max={2100}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select
                    className="form-select"
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Salary (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 75000"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Salary Date</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  max={28}
                  placeholder="e.g. 7"
                  value={form.salaryDate}
                  onChange={(e) => setForm({ ...form, salaryDate: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Saving…' : 'Create Month'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
