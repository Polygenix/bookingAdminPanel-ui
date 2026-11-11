import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, extractList, idOf } from '../api.js';
import DataTable, { StatusBadge, pretty } from '../components/DataTable.jsx';
import FormFields, { buildPayload, initialValues } from '../components/FormFields.jsx';
import Icon from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useToast } from '../components/Toast.jsx';
import { BOOKING_EDIT_FIELDS, BOOKING_STATUSES, STATUS_KEY } from '../config.js';
import { addressText, bookingName, customerName, fmtDate, fmtMoney, shortId, slotText } from '../helpers.js';

const dash = <span className="muted">—</span>;

function Section({ title, rows }) {
  return (
    <div className="section">
      <h4>{title}</h4>
      <dl className="kv">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || dash}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Bookings() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(extractList(await api.get('/api/admin/bookings')));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const okStatus = statusFilter === 'ALL' || r.status === statusFilter;
        const hay = `${idOf(r)} ${r.patientName} ${customerName(r)} ${r.phone} ${r.email} ${r.testName}`.toLowerCase();
        return okStatus && (!q || hay.includes(q.toLowerCase()));
      }),
    [rows, q, statusFilter]
  );

  const openDetail = async (r) => {
    setDetail(r);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/admin/bookings/${idOf(r)}`);
      if (res?.data) setDetail(res.data);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async () => {
    try {
      await api.put(`/api/admin/bookings/${idOf(statusModal)}/status`, { [STATUS_KEY]: newStatus });
      toast('Booking status updated');
      setStatusModal(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const openEdit = (r) => {
    setEditing(r);
    setValues(initialValues(BOOKING_EDIT_FIELDS, r));
  };

  const saveEdit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload(BOOKING_EDIT_FIELDS, values);
      // Only send fields that actually changed (changing testName re-prices the booking on the server).
      Object.keys(payload).forEach((k) => {
        if (String(payload[k]) === String(editing[k] ?? '')) delete payload[k];
      });
      if (Object.keys(payload).length === 0) {
        toast('No changes to save');
        setEditing(null);
        return;
      }
      await api.put(`/api/admin/bookings/${idOf(editing)}`, payload);
      toast('Booking updated');
      setEditing(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.del(`/api/admin/bookings/${idOf(confirm)}`);
      toast('Booking deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const columns = [
    { key: '_id', label: 'Booking ID', render: (r) => <span className="mono">#{shortId(idOf(r))}</span> },
    {
      key: 'patientName',
      label: 'Patient',
      render: (r) => (
        <div className="two-line">
          <strong>{r.patientName || dash}</strong>
          <small className="muted">{r.phone}</small>
        </div>
      ),
    },
    { key: 'testName', label: 'Test' },
    {
      key: 'bookingDate',
      label: 'Date & slot',
      render: (r) => (
        <div className="two-line">
          <span>{fmtDate(r.bookingDate) || dash}</span>
          <small className="muted">{slotText(r)}</small>
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: (r) => fmtMoney(r.amount) || dash },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="View and manage all customer bookings"
        actions={
          <button className="btn" onClick={load}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input placeholder="Search by patient, phone, test or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {pretty(s)}
              </option>
            ))}
          </select>
          <span className="muted small">{filtered.length} bookings</span>
        </div>

        <DataTable
          rows={filtered}
          columns={columns}
          loading={loading}
          empty="No bookings found"
          actions={(r) => (
            <>
              <button className="btn sm" onClick={() => openDetail(r)}>
                <Icon name="eye" size={14} /> View
              </button>
              <button className="btn sm" onClick={() => openEdit(r)}>
                <Icon name="edit" size={14} /> Edit
              </button>
              <button
                className="btn sm"
                onClick={() => {
                  setStatusModal(r);
                  setNewStatus(r.status || BOOKING_STATUSES[0]);
                }}
              >
                Status
              </button>
              <button className="btn sm danger" onClick={() => setConfirm(r)} aria-label="Delete booking">
                <Icon name="trash" size={14} />
              </button>
            </>
          )}
        />
      </div>

      {detail && (
        <Modal
          title="Booking details"
          subtitle={`${bookingName(detail) || 'Patient'} · #${shortId(idOf(detail))}`}
          wide
          onClose={() => setDetail(null)}
        >
          {detailLoading && <p className="muted">Refreshing…</p>}
          <div className="sections">
            <Section
              title="Booking"
              rows={[
                ['Booking ID', <span className="mono">{idOf(detail)}</span>],
                ['Status', <StatusBadge value={detail.status} />],
                ['Test', detail.testName],
                ['Amount', fmtMoney(detail.amount)],
                ['Date', fmtDate(detail.bookingDate)],
                ['Time slot', slotText(detail)],
                ['Notes', detail.notes],
                ['Created', detail.createdAt && new Date(detail.createdAt).toLocaleString()],
              ]}
            />
            <Section
              title="Patient"
              rows={[
                ['Name', detail.patientName],
                ['Age', detail.age],
                ['Gender', detail.gender],
                ['Phone', detail.phone],
                ['Email', detail.email],
              ]}
            />
            <Section
              title="Account holder"
              rows={[
                ['Name', customerName(detail)],
                ['Email', detail.customer?.email],
              ]}
            />
            <Section
              title="Collection address"
              rows={[
                ['Type', detail.addressId?.addressType],
                ['Contact', detail.addressId?.fullName && `${detail.addressId.fullName} · ${detail.addressId.phone}`],
                ['Address', addressText(detail.addressId)],
              ]}
            />
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title="Edit booking"
          subtitle={`#${shortId(idOf(editing))} · ${customerName(editing) ? `Account: ${customerName(editing)}` : 'Customer booking'}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <form className="form" onSubmit={saveEdit}>
            <FormFields fields={BOOKING_EDIT_FIELDS} values={values} onChange={setValues} />
            <p className="muted small">Changing the test name also updates the booking amount to the new test's price.</p>
            <button type="submit" hidden />
          </form>
        </Modal>
      )}

      {statusModal && (
        <Modal
          title="Update booking status"
          subtitle={`${bookingName(statusModal) || 'Patient'} · #${shortId(idOf(statusModal))}`}
          onClose={() => setStatusModal(null)}
          footer={
            <>
              <button className="btn" onClick={() => setStatusModal(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={updateStatus}>
                Update status
              </button>
            </>
          }
        >
          <label className="field">
            <span>New status</span>
            <select className="full" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
          </label>
          {newStatus === 'cancelled' && statusModal.status !== 'cancelled' && (
            <p className="muted small" style={{ marginTop: 12 }}>
              Cancelling releases the reserved time slot capacity.
            </p>
          )}
        </Modal>
      )}

      {confirm && (
        <Modal
          title="Delete this booking?"
          subtitle="This action cannot be undone."
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button className="btn danger solid" onClick={remove}>
                Yes, delete
              </button>
            </>
          }
        >
          <p>
            Booking <strong>#{shortId(idOf(confirm))}</strong>
            {bookingName(confirm) ? ` for ${bookingName(confirm)}` : ''} will be permanently removed.
          </p>
        </Modal>
      )}
    </>
  );
}
