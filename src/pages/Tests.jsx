import ResourcePage from '../components/ResourcePage.jsx';
import { StatusBadge, renderCell } from '../components/DataTable.jsx';
import { TEST_FIELDS } from '../config.js';
import { fmtMoney } from '../helpers.js';

const columns = [
  {
    key: 'imageUrl',
    label: 'Image',
    render: (r) => (r.imageUrl ? <img className="thumb" src={r.imageUrl} alt="" /> : <span className="muted">—</span>),
  },
  { key: 'testName', label: 'Test name', render: (r) => <strong>{r.testName}</strong> },
  { key: 'price', label: 'Price', render: (r) => fmtMoney(r.price) },
  { key: 'duration', label: 'Duration' },
  { key: 'description', label: 'Description', render: (r) => renderCell(r.description) },
  { key: 'isActive', label: 'Status', render: (r) => <StatusBadge value={r.isActive ? 'Active' : 'Inactive'} /> },
];

export default function Tests() {
  return (
    <ResourcePage
      title="Tests"
      subtitle="Manage the tests customers can book"
      singular="Test"
      base="/api/admin/tests"
      fields={TEST_FIELDS}
      columns={columns}
    />
  );
}
