import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell,
} from 'recharts';
import { fetchInsights } from '../api';
import { MonthInsight, MONTH_NAMES } from '../types';

const CHART_COLORS = ['#1a5c38', '#d4af37', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#14b8a6', '#ec4899', '#84cc16', '#06b6d4'];

interface AIAdvice {
  summary: string;
  tips: { category: string; advice: string; saving: string }[];
  priority: string;
}

const Insights: React.FC = () => {
  const [insights, setInsights] = useState<MonthInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    fetchInsights()
      .then(setInsights)
      .catch(() => setError('Failed to load insights. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const getAIAdvice = async () => {
    if (!insights.length) return;
    setAiLoading(true);
    setAiError('');
    setAiAdvice(null);

    const catTotals: Record<string, number> = {};
    insights.forEach((i) => {
      Object.entries(i.categoryBreakdown).forEach(([cat, amt]) => {
        catTotals[cat] = (catTotals[cat] || 0) + amt;
      });
    });

    const totalIncome = insights.reduce((s, i) => s + i.salary, 0);
    const totalSpent = insights.reduce((s, i) => s + i.totalExpenses, 0);
    const avgSavingsRate = insights.reduce((s, i) => s + i.savingsRate, 0) / insights.length;

    const prompt = `You are a personal finance advisor for an Indian user. Analyze this spending data and give specific, actionable advice.

Monthly Data (last ${insights.length} months):
${insights.map(i => `- ${MONTH_NAMES[i.month - 1]} ${i.year}: Salary ₹${i.salary}, Spent ₹${i.totalExpenses}, Saved ₹${i.savings} (${i.savingsRate.toFixed(1)}%)`).join('\n')}

Category Breakdown (all-time):
${Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => `- ${cat}: ₹${amt} (${((amt / totalSpent) * 100).toFixed(1)}%)`).join('\n')}

Total Income: ₹${totalIncome}
Total Spent: ₹${totalSpent}  
Average Savings Rate: ${avgSavingsRate.toFixed(1)}%

Respond ONLY with a JSON object, no markdown, no explanation outside the JSON:
{
  "summary": "2-3 sentence honest assessment of their financial health",
  "tips": [
    {
      "category": "category name",
      "advice": "specific actionable tip for this category",
      "saving": "estimated monthly saving e.g. ₹2,000-3,000"
    }
  ],
  "priority": "The single most important thing they should do this month"
}

Give 3-5 tips. Be direct and specific to their actual numbers. Reference Indian context where relevant.`;

    try {
      const response = await fetch(
  "https://wherediditgo.onrender.com/api/ai-advice",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  }
);

console.log("Status:", response.status);

const raw = await response.text();

console.log("Raw response:", raw);
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: AIAdvice = JSON.parse(clean);
      setAiAdvice(parsed);
    } catch (err) {
      setAiError('Failed to get AI advice. Try again.' + String(err));
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="loading">Crunching numbers…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  if (insights.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Insights</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <div className="empty-state-text">No data yet. Track at least one month to see insights.</div>
        </div>
      </div>
    );
  }

  const lineData = insights.map((i) => ({
    name: `${MONTH_NAMES[i.month - 1].slice(0, 3)} ${String(i.year).slice(2)}`,
    Salary: i.salary,
    Spent: i.totalExpenses,
    Saved: Math.max(i.savings, 0),
    'Savings %': parseFloat(i.savingsRate.toFixed(1)),
  }));

  const catTotals: Record<string, number> = {};
  insights.forEach((i) => {
    Object.entries(i.categoryBreakdown).forEach(([cat, amt]) => {
      catTotals[cat] = (catTotals[cat] || 0) + amt;
    });
  });
  const catData = Object.entries(catTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalIncome = insights.reduce((s, i) => s + i.salary, 0);
  const totalSpent = insights.reduce((s, i) => s + i.totalExpenses, 0);
  const totalSaved = totalIncome - totalSpent;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">Trends across {insights.length} months · All amounts in ₹</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">₹{totalIncome.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value danger">₹{totalSpent.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Saved</div>
          <div className="stat-value success">₹{totalSaved.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Savings Rate</div>
          <div className="stat-value accent">
            {(insights.reduce((s, i) => s + i.savingsRate, 0) / insights.length).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* AI Advisor Section */}
      <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiAdvice ? '1.25rem' : 0 }}>
          <div>
            <div className="section-title" style={{ color: 'var(--accent)', marginBottom: '0.2rem' }}>
              ◈ AI Financial Advisor
            </div>
            {!aiAdvice && (
              <div style={{ fontSize: '0.78rem', fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
                Analyzes your actual spending and gives personalized savings tips
              </div>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={getAIAdvice}
            disabled={aiLoading}
            style={{ whiteSpace: 'nowrap' }}
          >
            {aiLoading ? 'Analyzing…' : aiAdvice ? 'Refresh Analysis' : 'Analyze My Spending'}
          </button>
        </div>

        {aiError && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{aiError}</div>}

        {aiLoading && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', fontFamily: 'DM Mono', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Reading your spending patterns…
          </div>
        )}

        {aiAdvice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Summary */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '1rem', background: 'var(--bg-3)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
              {aiAdvice.summary}
            </div>

            {/* Tips */}
            <div>
              <div className="section-title">Where to cut spending</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {aiAdvice.tips.map((tip, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '0.9rem 1rem', background: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono' }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'DM Mono', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tip.category}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                        {tip.advice}
                      </div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'DM Mono', color: 'var(--success)' }}>
                        Potential saving: {tip.saving}/month
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority action */}
            <div style={{ padding: '1rem', background: 'var(--accent-glow)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 'var(--radius)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>★</span>
              <div>
                <div style={{ fontSize: '0.68rem', fontFamily: 'DM Mono', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Top Priority This Month
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {aiAdvice.priority}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Income vs Spending trend */}
      <div className="chart-wrap">
        <div className="chart-title">Income vs Spending Trend</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData} margin={{ top: 0, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip
              formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']}
              contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '0.78rem' }}
            />
            <Legend wrapperStyle={{ fontFamily: 'DM Mono', fontSize: '0.72rem' }} />
            <Line type="monotone" dataKey="Salary" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Spent" stroke="var(--danger)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Saved" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="two-col">
        <div className="chart-wrap">
          <div className="chart-title">Savings Rate % Over Time</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: 'var(--text-muted)' }} unit="%" />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Savings Rate']}
                contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'DM Mono', fontSize: '0.78rem' }}
              />
              <Bar dataKey="Savings %" radius={[4, 4, 0, 0]}>
                {lineData.map((entry, idx) => (
                  <Cell key={idx} fill={entry['Savings %'] >= 20 ? 'var(--success)' : entry['Savings %'] >= 10 ? 'var(--accent)' : 'var(--danger)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrap">
          <div className="chart-title">All-Time Category Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {catData.slice(0, 7).map((cat, idx) => {
              const pct = totalSpent > 0 ? (cat.value / totalSpent) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'DM Mono', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length], display: 'inline-block' }} />
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'DM Mono', color: 'var(--text-muted)' }}>
                      ₹{cat.value.toLocaleString('en-IN')} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar-track" style={{ height: '5px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, background: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
