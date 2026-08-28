import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import MonthView from './pages/MonthView';
import Insights from './pages/Insights';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { applyUpdate } from './serviceWorkerRegistration';
import './App.css';

export type Page = 'dashboard' | 'month' | 'insights';
export interface NavState {
  page: Page;
  year?: number;
  month?: number;
}

const AppShell: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('wdig:update-available', handler);
    return () => window.removeEventListener('wdig:update-available', handler);
  }, []);

  const navigate = (state: NavState) => setNav(state);

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="app">
      {updateAvailable && (
        <div className="update-banner">
          <span>A new version is available.</span>
          <button onClick={applyUpdate}>Refresh</button>
        </div>
      )}
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
          <button className="nav-btn nav-btn-logout" onClick={logout}>
            Logout
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

const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
