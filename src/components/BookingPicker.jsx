import { useEffect, useMemo, useRef, useState } from 'react';
import { idOf } from '../api.js';
import { bookingDate, bookingName, bookingTest, fmtDate, shortId, slotText } from '../helpers.js';
import Icon from './Icons.jsx';
import { StatusBadge } from './DataTable.jsx';

/** Searchable dropdown: shows "#BookingId · Patient name" for every booking. */
export default function BookingPicker({ bookings, value, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef(null);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = bookings.find((b) => String(idOf(b)) === String(value));

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((b) =>
      `${idOf(b)} ${bookingName(b)} ${b.customer?.name || ''} ${b.phone || ''} ${bookingTest(b)}`.toLowerCase().includes(term)
    );
  }, [bookings, q]);

  return (
    <div className="picker" ref={box}>
      <button type="button" className={`picker-btn ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} disabled={loading}>
        {loading ? (
          <span className="muted">Loading bookings…</span>
        ) : selected ? (
          <span className="picker-sel">
            <strong className="mono">#{shortId(idOf(selected))}</strong>
            <span>{bookingName(selected) || 'Unnamed patient'}</span>
          </span>
        ) : (
          <span className="muted">Select a booking</span>
        )}
        <Icon name="down" size={16} />
      </button>

      {open && (
        <div className="picker-pop">
          <div className="search-box flat">
            <Icon name="search" size={16} />
            <input autoFocus placeholder="Search by patient, phone or booking ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <ul>
            {list.length === 0 && <li className="picker-empty">No bookings match your search</li>}
            {list.map((b) => {
              const id = idOf(b);
              const active = String(id) === String(value);
              const meta = [bookingTest(b), fmtDate(bookingDate(b)), slotText(b)].filter(Boolean).join(' · ');
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`picker-item ${active ? 'active' : ''}`}
                    onClick={() => {
                      onChange(b);
                      setOpen(false);
                      setQ('');
                    }}
                  >
                    <span className="picker-main">
                      <strong className="mono">#{shortId(id)}</strong>
                      <span>{bookingName(b) || 'Unnamed patient'}</span>
                      {b.status && <StatusBadge value={b.status} />}
                    </span>
                    {meta && <small className="muted">{meta}</small>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
