import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, extractList, idOf } from '../api.js';
import DataTable from './DataTable.jsx';
import FormFields, { buildPayload, initialValues } from './FormFields.jsx';
import Icon from './Icons.jsx';
import Modal from './Modal.jsx';
import PageHeader from './PageHeader.jsx';
import { useToast } from './Toast.jsx';

/** Generic list + create + edit + delete screen. */
export default function ResourcePage({ title, subtitle, base, fields, columns, singular }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // { mode, row }
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(extractList(await api.get(base)));
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [base, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const openModal = (mode, row) => {
    setModal({ mode, row });
    setValues(initialValues(fields, row));
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload(fields, values, modal.mode === 'edit');
      if (modal.mode === 'create') await api.post(base, payload);
      else await api.put(`${base}/${idOf(modal.row)}`, payload);
      toast(`${singular} ${modal.mode === 'create' ? 'created' : 'updated'} successfully`);
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.del(`${base}/${idOf(confirm)}`);
      toast(`${singular} deleted`);
      setConfirm(null);
      load();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <button className="btn" onClick={load}>
              <Icon name="refresh" size={16} /> Refresh
            </button>
            <button className="btn primary" onClick={() => openModal('create')}>
              <Icon name="plus" size={16} /> Add {singular}
            </button>
          </>
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="muted small">{filtered.length} total</span>
        </div>
        <DataTable
          rows={filtered}
          columns={columns}
          loading={loading}
          empty={`No ${title.toLowerCase()} found`}
          actions={(r) => (
            <>
              <button className="btn sm" onClick={() => openModal('edit', r)}>
                <Icon name="edit" size={14} /> Edit
              </button>
              <button className="btn sm danger" onClick={() => setConfirm(r)}>
                <Icon name="trash" size={14} /> Delete
              </button>
            </>
          )}
        />
      </div>

      {modal && (
        <Modal
          title={`${modal.mode === 'create' ? 'Add' : 'Edit'} ${singular}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button type="button" className="btn primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <form className="form" onSubmit={save}>
            <FormFields fields={fields} values={values} onChange={setValues} />
            <button type="submit" hidden />
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal
          title={`Delete this ${singular.toLowerCase()}?`}
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
          <p>The selected {singular.toLowerCase()} will be permanently removed.</p>
        </Modal>
      )}
    </>
  );
}
