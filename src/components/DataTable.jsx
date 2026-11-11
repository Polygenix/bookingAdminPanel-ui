import { useEffect, useState } from 'react';
import Icon from './Icons.jsx';

const HIDDEN = new Set(['__v', 'password', 'updatedAt']);

export function pretty(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

export function renderCell(v) {
  if (v === null || v === undefined || v === '') return <span className="muted">—</span>;
  if (typeof v === 'boolean') return <span className={`badge ${v ? 'green' : 'gray'}`}>{v ? 'Yes' : 'No'}</span>;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v))
    return new Date(v).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (typeof v === 'string' && /^https?:\/\//.test(v))
    return (
      <a href={v} target="_blank" rel="noreferrer" className="link">
        Open
      </a>
    );
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? '' : 's'}`;
  if (typeof v === 'object') {
    const name = v.name ?? v.fullName ?? v.title ?? v.email ?? v.id ?? v._id;
    return name !== undefined ? String(name) : JSON.stringify(v).slice(0, 40);
  }
  return String(v);
}

export function StatusBadge({ value }) {
  const s = String(value || '').toUpperCase();
  const tone =
    s === 'INACTIVE'
      ? 'gray'
      : s === 'ACTIVE' || s.includes('CONFIRM') || s.includes('COMPLETE') || s.includes('PAID') || s.includes('SUCCESS')
      ? 'green'
      : s.includes('CANCEL') || s.includes('FAIL') || s.includes('REJECT')
      ? 'red'
      : s.includes('PEND')
      ? 'amber'
      : 'gray';
  const label = value ? String(value).charAt(0) + String(value).slice(1).toLowerCase() : '—';
  return (
    <span className={`badge dot ${tone}`}>
      {label}
    </span>
  );
}

export default function DataTable({ rows, columns, actions, loading, pageSize = 10, empty = 'No records found' }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows.length]);

  const cols =
    columns ||
    (rows[0]
      ? Object.keys(rows[0])
          .filter((k) => !HIDDEN.has(k) && !Array.isArray(rows[0][k]))
          .slice(0, 8)
          .map((k) => ({ key: k, label: pretty(k) }))
      : []);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const slice = rows.slice((current - 1) * pageSize, current * pageSize);
  const span = cols.length + (actions ? 1 : 0) || 1;

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {actions && <th className="right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={span}>
                    <div className="skeleton" />
                  </td>
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr>
                <td colSpan={span}>
                  <div className="empty">
                    <Icon name="inbox" size={28} />
                    <span>{empty}</span>
                  </div>
                </td>
              </tr>
            ) : (
              slice.map((r, i) => (
                <tr key={r.id ?? r._id ?? i}>
                  {cols.map((c) => (
                    <td key={c.key}>{c.render ? c.render(r) : renderCell(r[c.key])}</td>
                  ))}
                  {actions && <td className="actions">{actions(r)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > pageSize && (
        <div className="pager">
          <span className="muted">
            Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="pager-btns">
            <button className="icon-btn" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <Icon name="left" />
            </button>
            <span className="pager-num">
              {current} / {pages}
            </span>
            <button className="icon-btn" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
              <Icon name="right" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
