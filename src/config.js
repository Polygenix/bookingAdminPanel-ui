// Field names below match the booking_api backend models and services exactly.

// POST /api/auth/login body: { email, password }
export const LOGIN_FIELD = 'email';

// PUT /api/admin/bookings/:id/status  ->  { status }
export const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
export const STATUS_KEY = 'status';

// Test model: testName, description, imageUrl, price, preparationInstructions, duration, isActive
export const TEST_FIELDS = [
  { name: 'testName', label: 'Test name', type: 'text', required: true },
  { name: 'price', label: 'Price (₹)', type: 'number', required: true },
  { name: 'duration', label: 'Duration (e.g. 30 mins)', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'preparationInstructions', label: 'Preparation instructions', type: 'textarea' },
  // Uploaded through POST /api/common/upload; the returned fileUrl is saved as imageUrl
  { name: 'imageUrl', label: 'Test image', type: 'image' },
  { name: 'isActive', label: 'Active', type: 'checkbox', default: true },
];

// TimeSlot model: date (YYYY-MM-DD), startTime/endTime (HH:mm), capacity (integer >= 1), isActive
export const SLOT_FIELDS = [
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'startTime', label: 'Start time', type: 'time', required: true },
  { name: 'endTime', label: 'End time', type: 'time', required: true },
  { name: 'capacity', label: 'Capacity', type: 'number', integer: true, min: 1, required: true },
  { name: 'isActive', label: 'Active', type: 'checkbox', default: true },
];

// PUT /api/admin/bookings/:id accepts only these fields
export const BOOKING_EDIT_FIELDS = [
  { name: 'patientName', label: 'Patient name', type: 'text', required: true },
  { name: 'age', label: 'Age', type: 'number', integer: true, min: 1 },
  { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'testName', label: 'Test name', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
