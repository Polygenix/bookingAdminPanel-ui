# BookingHub Admin Console (React + Vite)

Built against the `booking_api` backend (`https://api.devankit.co.in`).

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (API calls go through the Vite proxy)
npm run build      # production build -> dist/
```

For a production build, copy `.env.example` to `.env` and set `VITE_API_URL`.
If the panel is hosted on a different domain from the API, the backend must allow it (it uses `cors()`).

## API fields used

| Area | Endpoint | Fields |
| --- | --- | --- |
| Login | `POST /api/auth/login` | `{ email, password }` -> `data.token`, `data.user.role` (`admin`) |
| Bookings | `GET /api/admin/bookings` | `patientName, testName, amount, age, gender, phone, email, bookingDate, timeSlotId{date,startTime,endTime}, addressId, customer{name,email}, notes, status` |
| Booking edit | `PUT /api/admin/bookings/:id` | `patientName, testName, age, gender, phone, email, notes` |
| Booking status | `PUT /api/admin/bookings/:id/status` | `{ status }` (`pending`, `confirmed`, `completed`, `cancelled`) |
| Tests | `/api/admin/tests` | `testName, price, duration, description, preparationInstructions, imageUrl, isActive` |
| Time slots | `/api/admin/time-slots` | `date (YYYY-MM-DD), startTime, endTime (HH:mm), capacity (integer), isActive` |
| File upload | `POST /api/common/upload` | multipart field `file` (JPG/PNG/WEBP/PDF, max 5 MB) -> `data.fileUrl` |
| Reports | `POST /api/admin/reports/upload` | `{ bookingId, fileUrl }` |
| Reports list | `GET /api/admin/fetchAllReports` | `bookingId` (populated booking), `fileUrl`, `uploadedBy{name,email}` |
| Report delete | `DELETE /api/admin/deleteReports/:reportId` | |

## Reports flow

1. Bookings are fetched and shown as `#ID · Patient name` in a searchable picker.
2. The file is uploaded to `/api/common/upload`.
3. The returned `fileUrl` is attached to the selected booking.

Field definitions for the forms live in `src/config.js`.
# bookingAdminPanel-ui
