import { useCallback, useEffect, useRef, useState } from 'react';
import { api, extractList } from '../api.js';
import DataTable from '../components/DataTable.jsx';
import Icon from '../components/Icons.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useToast } from '../components/Toast.jsx';

const PAGE_SIZE = 10;

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
        <DataTable rows={customers} columns={columns} loading={loading} empty={error ? 'Unable to load customers' : 'No customers to show'} />
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
    </>
  );
}
