import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, extractList, idOf } from '../api.js';
import BookingPicker from '../components/BookingPicker.jsx';
import DataTable from '../components/DataTable.jsx';
import Icon from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useToast } from '../components/Toast.jsx';
import { bookingName, shortId } from '../helpers.js';

const MAX_MB = 5;
const dash = <span className="muted">—</span>;

export default function Reports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [booking, setBooking] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([api.get('/api/admin/fetchAllReports'), api.get('/api/admin/bookings')]);
      setReports(extractList(r));
      setBookings(extractList(b));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Report.bookingId is populated with the full booking by the API (null if the booking was deleted).
  const rows = useMemo(
    () =>
      reports
        .map((r) => {
          const b = r.bookingId && typeof r.bookingId === 'object' ? r.bookingId : null;
          return { ...r, _booking: b, _bid: b ? idOf(b) : r.bookingId, _patient: b ? bookingName(b) : '' };
        })
        .filter((r) => !q || `${r._bid} ${r._patient} ${r._booking?.testName || ''}`.toLowerCase().includes(q.toLowerCase())),
    [reports, q]
  );

  const columns = [
    { key: '_bid', label: 'Booking ID', render: (r) => (r._bid ? <span className="mono">#{shortId(r._bid)}</span> : dash) },
    { key: '_patient', label: 'Patient', render: (r) => r._patient || <span className="muted">Booking removed</span> },
    { key: 'testName', label: 'Test', render: (r) => r._booking?.testName || dash },
    {
      key: 'fileUrl',
      label: 'Report',
      render: (r) =>
        r.fileUrl ? (
          <a className="link" href={r.fileUrl} target="_blank" rel="noreferrer">
            <Icon name="link" size={14} /> View report
          </a>
        ) : (
          dash
        ),
    },
    { key: 'uploadedBy', label: 'Uploaded by', render: (r) => r.uploadedBy?.name || dash },
    {
      key: 'createdAt',
      label: 'Uploaded on',
      render: (r) =>
        r.createdAt
          ? new Date(r.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : dash,
    },
  ];

  const close = () => {
    setOpen(false);
    setBooking(null);
    setFile(null);
  };

  const pickFile = (e) => {
    const f = e.target.files[0] || null;
    if (f && f.size > MAX_MB * 1024 * 1024) {
      toast(`File is larger than ${MAX_MB} MB`, 'error');
      e.target.value = '';
      return setFile(null);
    }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!booking) return toast('Please select a booking', 'error');
    if (!file) return toast('Please choose a PDF or image file', 'error');
    setBusy(true);
    try {
      // 1) upload the file  2) attach the returned URL to the booking
      const up = await api.upload(file);
      const fileUrl = up?.data?.fileUrl;
      if (!fileUrl) throw new Error('Upload succeeded but no file URL was returned');
      await api.post('/api/admin/reports/upload', { bookingId: idOf(booking), fileUrl });
      toast(`Report uploaded for ${bookingName(booking) || `booking #${shortId(idOf(booking))}`}`);
      close();
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await api.del(`/api/admin/deleteReports/${idOf(confirm)}`);
      toast('Report deleted');
      setConfirm(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Upload and manage reports attached to customer bookings"
        actions={
          <>
            <button className="btn" onClick={load}>
              <Icon name="refresh" size={16} /> Refresh
            </button>
            <button className="btn primary" onClick={() => setOpen(true)}>
              <Icon name="upload" size={16} /> Upload report
            </button>
          </>
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input placeholder="Search by patient name, test or booking ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="muted small">{rows.length} total</span>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          empty="No reports uploaded yet"
          actions={(r) => (
            <button className="btn sm danger" onClick={() => setConfirm(r)}>
              <Icon name="trash" size={14} /> Delete
            </button>
          )}
        />
      </div>

      {open && (
        <Modal title="Upload report" subtitle="Choose the booking and attach the report file." onClose={close}>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <span>
                Booking<em className="req"> *</em>
              </span>
              <BookingPicker bookings={bookings} value={booking ? idOf(booking) : ''} onChange={setBooking} loading={loading} />
            </div>

            {booking && (
              <div className="selected-info">
                <Icon name="check" size={16} />
                <span>
                  Report will be attached to <strong>{bookingName(booking) || 'this patient'}</strong> (booking #{shortId(idOf(booking))}
                  {booking.testName ? ` · ${booking.testName}` : ''})
                </span>
              </div>
            )}

            <label className="field">
              <span>
                Report file<em className="req"> *</em>
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={pickFile} required />
              <small className="muted">JPG, PNG, WEBP or PDF, up to {MAX_MB} MB.</small>
            </label>

            <div className="form-actions">
              <button type="button" className="btn" onClick={close}>
                Cancel
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? 'Uploading…' : 'Upload report'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal
          title="Delete this report?"
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
            The report for <strong>{confirm._patient || `booking #${shortId(confirm._bid)}`}</strong> will be permanently removed.
          </p>
        </Modal>
      )}
    </>
  );
}
