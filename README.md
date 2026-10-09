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

The project has separate `backend` and `frontend` applications. For a local demo, start MongoDB and then run the backend and frontend in separate terminals.

### Database

With Docker installed, start a persistent local MongoDB database:

```bash
docker run -d --name matapp-mongodb --restart unless-stopped -p 27017:27017 -v matapp-mongo-data:/data/db mongo:7
```

If the `matapp-mongodb` container already exists, start it with `docker start matapp-mongodb` instead.

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

The seed script deletes and recreates all users, routes, and matatus in the configured database. Use it only with a disposable local/demo database, never an existing operator database.

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

Open <http://localhost:5173>. In development, Vite proxies `/api` to the backend. In deployment, set `VITE_API_URL` to the public backend API URL, including `/api`, or configure the frontend host to proxy `/api`.

## Payments

`PAYMENT_MODE=DEMO` is the default and simulates successful payments without moving money. Never present a demo payment as a real receipt. For Safaricom Daraja, configure the credentials in `backend/.env`, expose the callback over public HTTPS, and verify the complete flow using Safaricom sandbox credentials before applying for production access.

## Production Setup

Real payments require accounts and service configuration outside this repository. You need:

- A Safaricom Daraja developer application, sandbox credentials, and production approval with the shortcode, passkey, and transaction type issued for your business. Start at <https://developer.safaricom.co.ke>.
- A hosted MongoDB database (for example MongoDB Atlas), with a database user, TLS connection string, network access restricted to your backend host, and automated backups.
- A Node.js 20 LTS backend host and a frontend host, both using HTTPS. Configure the backend host's secrets/environment settings rather than committing `.env`.
- A stable public API domain so Safaricom can reach the payment callback. Do not use localhost, a temporary tunnel, or a private Codespaces URL for live transactions.

### Configure and test

1. Copy `backend/.env.example` to `backend/.env` for local testing. Keep `.env` private; it is ignored by Git.
2. Set `MONGO_URI` to your Atlas connection string and generate an application secret with `openssl rand -hex 32` for `JWT_SECRET`.
3. In the Daraja portal, create/use a sandbox app. Fill `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, and `MPESA_PASSKEY` with sandbox values. Set `PAYMENT_MODE=DARAJA` and `MPESA_ENV=sandbox`.
4. Generate a separate callback secret with `openssl rand -hex 32`. Put it in `MPESA_CALLBACK_TOKEN` and set `MPESA_CALLBACK_URL` to `https://YOUR_API_DOMAIN/api/payments/callback/<the-same-token>`. The callback path must contain the exact token and must be public HTTPS.
5. Set `MPESA_TRANSACTION_TYPE` to the type issued for your shortcode. Set `CLIENT_URL` to your frontend origin. For multiple frontend origins, separate HTTPS origins with commas.
6. Deploy the backend, then configure the frontend's `VITE_API_URL` as `https://YOUR_API_DOMAIN/api` (or route `/api` through the same public origin). If the backend is behind one trusted reverse proxy, set `TRUST_PROXY=true` so rate limiting uses client IPs correctly.
7. Run `cd backend && npm test`, then complete sandbox tests for successful, declined, delayed, and mismatched callbacks. Confirm booking/payment records and callback reachability before requesting Daraja production access.
8. For live deployment, set `NODE_ENV=production`, `PAYMENT_MODE=DARAJA`, `MPESA_ENV=production`, production Daraja values, an Atlas `MONGO_URI`, a random `JWT_SECRET`, and HTTPS `CLIENT_URL` in the backend host's secret manager. The server refuses to start in production with demo/sandbox payments or placeholder secrets.

Do not run `npm run seed` against production: it deletes and recreates users, routes, and matatus. Do not publish the demo passwords. Before taking bookings from the public, complete business/legal requirements, test payment reconciliation and refunds with your provider, and establish customer support, privacy/retention rules, monitoring, incident response, and backup restoration procedures. This code is a deployment-ready foundation, not a guarantee of regulatory or operational compliance.

## Main workflows

- Passengers register or log in, search routes, select a vehicle and seat, pay, and view or cancel eligible bookings.
- Conductors view their passenger manifest and mark confirmed passengers as boarded.
- Admins view the dashboard and create routes and matatus.

## Checks

Run backend unit checks with `cd backend && npm test` and build the frontend with `cd frontend && npm run build`.
