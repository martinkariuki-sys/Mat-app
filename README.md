# Mat App

A full-stack Kenyan matatu booking and transport management application.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Authentication: JWT + bcrypt
- Payments: M-Pesa Daraja integration with demo mode
- Icons/UI: Lucide React

## Setup

The project has separate `backend` and `frontend` applications. Open three terminals from the repository root.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Set `MONGO_URI` in `backend/.env` to a local MongoDB instance or MongoDB Atlas. The default is `mongodb://127.0.0.1:27017/matapp`. The API starts at <http://localhost:5000>.

### Demo data

With MongoDB running, seed the demo accounts and vehicles:

```bash
cd backend
npm run seed
```

| Role | Phone | Password |
| --- | --- | --- |
| Admin | `0700000000` | `123456` |
| Conductor | `0711111111` | `123456` |
| Passenger | `0722222222` | `123456` |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Set `VITE_API_URL` if the backend is not running at `http://localhost:5000/api`.

## Payments

`PAYMENT_MODE=DEMO` is the default and simulates successful payments without moving money. For Safaricom Daraja, set `PAYMENT_MODE=DARAJA` and configure the M-Pesa credentials in `backend/.env`. The callback URL must be publicly reachable; in Codespaces, use a public forwarded port or tunnel URL for `MPESA_CALLBACK_URL`.

## Main workflows

- Passengers register or log in, search routes, select a vehicle and seat, pay, and view or cancel eligible bookings.
- Conductors view their passenger manifest and mark confirmed passengers as boarded.
- Admins view the dashboard and create routes and matatus.

## Production considerations

This is a working foundation, not a production transport-company deployment. Before public use, add rate limiting, stronger validation, audit logs, password reset and phone OTP flows, payment reconciliation, M-Pesa callback security, expiration for unpaid bookings, driver management, route schedules, notifications, privacy and terms pages, HTTPS, backups, and monitoring.
