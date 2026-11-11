import { idOf } from './api.js';

/** Patient the booking is for (Booking.patientName). Falls back to the account holder. */
export function bookingName(b) {
  if (!b || typeof b !== 'object') return '';
  return (b.patientName || b.customer?.name || '').trim();
}

/** Account holder that placed the booking (Booking.customer is populated by the API). */
export function customerName(b) {
  return b?.customer && typeof b.customer === 'object' ? b.customer.name || '' : '';
}

export function shortId(id) {
  const s = String(id ?? '');
  return s.length > 10 ? `…${s.slice(-6)}` : s;
}

export const bookingTest = (b) => b?.testName || '';
export const bookingDate = (b) => b?.bookingDate || '';

export function fmtDate(v) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtMoney(v) {
  if (v === undefined || v === null || v === '') return '';
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

export function slotText(b) {
  const s = b?.timeSlotId;
  if (s && typeof s === 'object' && s.startTime) return `${s.startTime} – ${s.endTime}`;
  return b?.timeSlot || '';
}

export function addressText(a) {
  if (!a || typeof a !== 'object') return '';
  return [a.houseNo, a.street, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ');
}

export function bookingLabel(b) {
  const name = bookingName(b);
  return `#${shortId(idOf(b))}${name ? ` · ${name}` : ''}`;
}
