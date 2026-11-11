import { useCallback, useEffect, useRef, useState } from 'react';
import { api, extractList } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import FormFields, { initialValues } from '../components/FormFields.jsx';
import Icon from '../components/Icons.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useToast } from '../components/Toast.jsx';

const PAGE_SIZE = 10;

const customerFields = [
  { name: 'name', label: 'Name' },
  { name: 'email', label: 'Email', type: 'email' },
];

const isCustomerActive = (customer) => {
  const value = customer.isActive ?? customer.is_active ?? customer.active ?? customer.status;
  return (
    value === true ||
    value === 1 ||
    (typeof value === 'string' && ['true', '1', 'active'].includes(value.trim().toLowerCase()))
  );
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
];

function getPagination(response) {
  const data = response?.data;
  return response?.pagination ?? response?.meta ?? (data && !Array.isArray(data) ? data.pagination ?? data.meta : undefined);
}

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const loadCustomers = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set('search', search);

    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/api/admin/fetchAllCustomers?${params.toString()}`);
      if (currentRequest !== requestId.current) return;
      setCustomers(extractList(response));
      setPagination(getPagination(response) || null);
    } catch (e) {
      if (currentRequest !== requestId.current) return;
      setCustomers([]);
      setPagination(null);
      setError(true);
      toast(e.message, 'error');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    loadCustomers();
    return () => {
      requestId.current += 1;
    };
  }, [loadCustomers]);

  const total = Number(
    pagination?.totalCustomers ?? pagination?.totalCount ?? pagination?.total ?? pagination?.count
  );
  const totalPagesValue = Number(pagination?.totalPages ?? pagination?.pages);
  const totalPages = Number.isFinite(totalPagesValue) && totalPagesValue > 0
    ? totalPagesValue
    : Number.isFinite(total) && total >= 0
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : customers.length === PAGE_SIZE
        ? page + 1
        : page;

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setValues(initialValues(customerFields, customer));
  };

  const saveCustomer = async (event) => {
    event?.preventDefault();
    const customerId = editingCustomer?._id ?? editingCustomer?.id ?? editingCustomer?.customerId;
    if (!customerId) {
      toast('Unable to update customer: customer ID is missing', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/admin/updateCustomer/${encodeURIComponent(customerId)}`, {
        name: values.name,
        email: values.email,
      });
      toast('Customer updated successfully');
      setEditingCustomer(null);
      loadCustomers();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deactivateCustomer = async (customer) => {
    const customerId = customer?._id ?? customer?.id ?? customer?.customerId;
    if (!customerId) {
      toast('Unable to update customer status: customer ID is missing', 'error');
      return;
    }

    const key = String(customerId);
    setUpdatingStatus((current) => ({ ...current, [key]: true }));
    try {
      await api.patch(`/api/admin/updateCustomerStatus/${encodeURIComponent(customerId)}`, { isActive: false });
      setCustomers((current) =>
        current.map((item) => {
          const itemId = item?._id ?? item?.id ?? item?.customerId;
          return String(itemId) === key ? { ...item, isActive: false } : item;
        })
      );
      toast('Customer deactivated successfully');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdatingStatus((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="View registered customers"
        actions={
          <button className="btn" onClick={loadCustomers} disabled={loading}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
        }
      />

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input
              aria-label="Search customers"
              placeholder="Search by name or email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <span className="muted small">
            {Number.isFinite(total) && total >= 0 ? `${total} customers` : `${customers.length} shown`}
          </span>
        </div>
        <DataTable
          rows={customers}
          columns={columns}
          loading={loading}
          empty={error ? 'Unable to load customers' : 'No customers to show'}
          actions={(customer) => (
            <>
              <button className="btn sm" onClick={() => openEdit(customer)}>
                <Icon name="edit" size={14} /> Edit
              </button>
              {isCustomerActive(customer) && (
                <button
                  className="btn sm danger"
                  onClick={() => deactivateCustomer(customer)}
                  disabled={!!updatingStatus[String(customer._id ?? customer.id ?? customer.customerId)]}
                >
                  {updatingStatus[String(customer._id ?? customer.id ?? customer.customerId)]
                    ? 'Updating…'
                    : 'Deactivate'}
                </button>
              )}
            </>
          )}
        />
        {!loading && customers.length > 0 && (
          <div className="pager">
            <span className="muted">
              {Number.isFinite(total) && total >= 0
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                : `Page ${page}`}
            </span>
            <div className="pager-btns">
              <button
                className="icon-btn"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
              >
                <Icon name="left" />
              </button>
              <span className="pager-num">{page} / {totalPages}</span>
              <button
                className="icon-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                aria-label="Next page"
              >
                <Icon name="right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editingCustomer && (
        <Modal
          title="Edit customer"
          onClose={() => setEditingCustomer(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setEditingCustomer(null)}>
                Cancel
              </button>
              <button type="submit" form="customer-edit-form" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <form id="customer-edit-form" className="form" onSubmit={saveCustomer}>
            <FormFields fields={customerFields} values={values} onChange={setValues} />
            <button type="submit" hidden />
          </form>
        </Modal>
      )}
    </>
  );
}
