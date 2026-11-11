import ResourcePage from '../components/ResourcePage.jsx';
import { StatusBadge } from '../components/DataTable.jsx';
import { SLOT_FIELDS } from '../config.js';
import { fmtDate } from '../helpers.js';

const columns = [
  { key: 'date', label: 'Date', render: (r) => <strong>{fmtDate(`${r.date}T00:00:00`)}</strong> },
  { key: 'time', label: 'Time', render: (r) => `${r.startTime} – ${r.endTime}` },
  { key: 'capacity', label: 'Capacity' },
  {
    key: 'bookedCount',
    label: 'Booked',
    render: (r) => (
      <span>
        {r.bookedCount ?? 0} / {r.capacity}
      </span>
    ),
  },
  { key: 'isActive', label: 'Status', render: (r) => <StatusBadge value={r.isActive ? 'Active' : 'Inactive'} /> },
];

export default function TimeSlots() {
  return (
    <ResourcePage
      title="Time Slots"
      subtitle="Configure the slots available for booking"
      singular="Time Slot"
      base="/api/admin/time-slots"
      fields={SLOT_FIELDS}
      columns={columns}
    />
  );
}
