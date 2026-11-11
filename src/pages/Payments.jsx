import { useMemo, useState } from 'react';
import DataTable, { StatusBadge } from '../components/DataTable.jsx';
import Icon from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { bookingName, fmtMoney, shortId } from '../helpers.js';

const STATUSES = ['pending', 'paid', 'failed'];
const dash = <span className="muted">—</span>;

/**
 * Payments page — UI only, not connected to the API yet.
 *
 * To bind later: fetch GET /api/admin/fetchAllPayment and put the result array into `payments`.
 * Each payment has: _id, booking (populated booking), customer { name, email },
 * razorpayOrderId, razorpayPaymentId, amount, currency, status (pending | paid | failed), createdAt.
 */
export default function Payments() {
  const [payments] = useState([]); // <- bind API data here
  const [loading] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        const okStatus = status === 'ALL' || p.status === status;
        const hay = `${p.razorpayOrderId} ${p.razorpayPaymentId} ${bookingName(p.booking)} ${p.customer?.name} ${p.customer?.email}`.toLowerCase();
        return okStatus && (!q || hay.includes(q.toLowerCase()));
      }),
    [payments, q, status]
  );

  const count = (s) => payments.filter((p) => p.status === s).length;
  const revenue = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const stats = [
    { label: 'Total revenue', value: fmtMoney(revenue) || '₹0', icon: 'wallet', tone: 'green' },
    { label: 'Total payments', value: payments.length, icon: 'file', tone: 'blue' },
    { label: 'Paid', value: count('paid'), icon: 'check', tone: 'violet' },
    { label: 'Pending / Failed', value: `${count('pending')} / ${count('failed')}`, icon: 'clock', tone: 'amber' },
  ];

  const columns = [
    {
      key: 'razorpayOrderId',
      label: 'Payment',
      render: (p) => (
        <div className="two-line">
          <span className="mono">{p.razorpayOrderId || '—'}</span>
          <small className="muted mono">{p.razorpayPaymentId || 'Awaiting payment'}</small>
        </div>
      ),
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (p) => (
        <div className="two-line">
          <strong>{bookingName(p.booking) || dash}</strong>
          <small className="muted">{p.booking?.testName}</small>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Account holder',
      render: (p) => (
        <div className="two-line">
          <span>{p.customer?.name || dash}</span>
          <small className="muted">{p.customer?.email}</small>
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: (p) => <strong>{fmtMoney(p.amount) || dash}</strong> },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge value={p.status} /> },
    {
      key: 'createdAt',
      label: 'Date',
      render: (p) =>
        p.createdAt
          ? new Date(p.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : dash,
    },
  ];

  return (
    <>
      <PageHeader title="Payments" subtitle="Track Razorpay payments received for bookings" />

      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className={`stat-ico ${s.tone}`}>
              <Icon name={s.icon} size={20} />
            </span>
            <div>
              <span className="muted small">{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input placeholder="Search by patient, email or payment ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <span className="muted small">{filtered.length} payments</span>
        </div>

        <DataTable
          rows={filtered}
          columns={columns}
          loading={loading}
          empty="No payments to show"
          actions={(p) => (
            <button className="btn sm" onClick={() => setDetail(p)}>
              <Icon name="eye" size={14} /> View
            </button>
          )}
        />
      </div>

      {detail && (
        <Modal
          title="Payment details"
          subtitle={`${fmtMoney(detail.amount)} · ${detail.currency || 'INR'}`}
          onClose={() => setDetail(null)}
        >
          <dl className="kv">
            {[
              ['Status', <StatusBadge value={detail.status} />],
              ['Amount', `${fmtMoney(detail.amount)} ${detail.currency || ''}`],
              ['Order ID', <span className="mono">{detail.razorpayOrderId}</span>],
              ['Payment ID', <span className="mono">{detail.razorpayPaymentId}</span>],
              ['Booking', detail.booking && `#${shortId(detail.booking._id)} · ${bookingName(detail.booking)}`],
              ['Test', detail.booking?.testName],
              ['Account holder', detail.customer && `${detail.customer.name} (${detail.customer.email})`],
              ['Date', detail.createdAt && new Date(detail.createdAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || dash}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </>
  );
}
