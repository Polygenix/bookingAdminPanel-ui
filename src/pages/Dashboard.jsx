import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, extractList, idOf } from '../api.js';
import { StatusBadge, pretty } from '../components/DataTable.jsx';
import Icon from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { BOOKING_STATUSES } from '../config.js';
import { bookingName, bookingTest, fmtDate, bookingDate, shortId } from '../helpers.js';

export default function Dashboard() {
  const [data, setData] = useState({ bookings: [], tests: [], slots: [], reports: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const safe = (p) => api.get(p).then(extractList).catch(() => []);
    Promise.all([
      safe('/api/admin/bookings'),
      safe('/api/admin/tests'),
      safe('/api/admin/time-slots'),
      safe('/api/admin/fetchAllReports'),
    ]).then(([bookings, tests, slots, reports]) => {
      setData({ bookings, tests, slots, reports });
      setLoading(false);
    });
  }, []);

  const byStatus = BOOKING_STATUSES.map((s) => ({
    s,
    n: data.bookings.filter((b) => b.status === s).length,
  }));
  const max = Math.max(1, ...byStatus.map((x) => x.n));
  const recent = [...data.bookings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  const stats = [
    { label: 'Total bookings', value: data.bookings.length, to: '/bookings', icon: 'calendar', tone: 'blue' },
    { label: 'Active tests', value: data.tests.filter((t) => t.isActive).length, to: '/tests', icon: 'flask', tone: 'violet' },
    { label: 'Time slots', value: data.slots.length, to: '/time-slots', icon: 'clock', tone: 'amber' },
    { label: 'Reports uploaded', value: data.reports.length, to: '/reports', icon: 'file', tone: 'green' },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A quick overview of your booking operations" />

      <div className="stats">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat">
            <span className={`stat-ico ${s.tone}`}>
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <span className="muted small">{s.label}</span>
              <strong>{loading ? '—' : s.value}</strong>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        <div className="card pad">
          <h3>Bookings by status</h3>
          <div className="bars">
            {byStatus.map(({ s, n }) => (
              <div className="bar-row" key={s}>
                <span className="bar-label">{pretty(s.toLowerCase())}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(n / max) * 100}%` }} />
                </div>
                <span className="bar-n">{loading ? '—' : n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card pad">
          <div className="card-title">
            <h3>Recent bookings</h3>
            <Link to="/bookings" className="link small">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="skeleton" />
          ) : recent.length === 0 ? (
            <p className="muted">No bookings yet.</p>
          ) : (
            <ul className="recent">
              {recent.map((b) => (
                <li key={idOf(b)}>
                  <span className="avatar sm">{(bookingName(b) || '?')[0].toUpperCase()}</span>
                  <div className="grow">
                    <strong>{bookingName(b) || 'Unnamed patient'}</strong>
                    <small className="muted">
                      #{shortId(idOf(b))}
                      {[bookingTest(b), fmtDate(bookingDate(b))].filter(Boolean).length > 0 &&
                        ` · ${[bookingTest(b), fmtDate(bookingDate(b))].filter(Boolean).join(' · ')}`}
                    </small>
                  </div>
                  {b.status && <StatusBadge value={b.status} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
