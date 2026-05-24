import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import MonthView from './pages/MonthView';
import Insights from './pages/Insights';
import './App.css';

export type Page = 'dashboard' | 'month' | 'insights';
export interface NavState {
  page: Page;
  year?: number;
  month?: number;
}

const App: React.FC = () => {
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });

  const navigate = (state: NavState) => setNav(state);

  return (
    <div className="app">
      <nav className="topnav">
        <div className="nav-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">WhereDidItGo</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-btn ${nav.page === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate({ page: 'dashboard' })}
          >
            Overview
          </button>
          <button
            className={`nav-btn ${nav.page === 'insights' ? 'active' : ''}`}
            onClick={() => navigate({ page: 'insights' })}
          >
            Insights
          </button>
        </div>
      </nav>

      <main className="main-content">
        {nav.page === 'dashboard' && (
          <Dashboard
            onSelectMonth={(year, month) => navigate({ page: 'month', year, month })}
          />
        )}
        {nav.page === 'month' && nav.year && nav.month && (
          <MonthView
            year={nav.year}
            month={nav.month}
            onBack={() => navigate({ page: 'dashboard' })}
          />
        )}
        {nav.page === 'insights' && <Insights />}
      </main>
    </div>
  );
};

export default App;
