import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../api.js';
import Icon from './Icons.jsx';

const NAV = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }] },
  {
    group: 'Management',
    items: [
      { to: '/bookings', label: 'Bookings', icon: 'calendar' },
      { to: '/tests', label: 'Tests', icon: 'flask' },
      { to: '/time-slots', label: 'Time Slots', icon: 'clock' },
      { to: '/reports', label: 'Reports', icon: 'file' },
      { to: '/payments', label: 'Payments', icon: 'wallet' },
      { to: '/customers', label: 'Customers', icon: 'dashboard' },
    ],
  },
];

const TITLES = { '/': 'Dashboard', '/bookings': 'Bookings', '/tests': 'Tests', '/time-slots': 'Time Slots', '/reports': 'Reports', '/payments': 'Payments', '/customers': 'Customers' };

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = getUser();
  const [open, setOpen] = useState(false);
  const display = user?.name || user?.email || 'Administrator';

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="shell">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">B</span>
          <div>
            <strong>BookingHub</strong>
            <small>Admin Console</small>
          </div>
        </div>

        <nav>
          {NAV.map((g) => (
            <div key={g.group} className="nav-group">
              <span className="nav-title">{g.group}</span>
              {g.items.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}>
                  <Icon name={n.icon} />
                  {n.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <div className="me">
            <span className="avatar">{display[0].toUpperCase()}</span>
            <div className="me-text">
              <strong>{display}</strong>
              <small>Administrator</small>
            </div>
          </div>
          <button className="icon-btn" onClick={logout} title="Sign out" aria-label="Sign out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <div className="crumbs">
            <span className="muted">Admin</span>
            <span className="muted">/</span>
            <strong>{TITLES[pathname] || 'Page'}</strong>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
