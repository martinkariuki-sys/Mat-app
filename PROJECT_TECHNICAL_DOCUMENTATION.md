# KABARAK UNIVERSITY
## SCHOOL / FACULTY: ____________________________________
## DEPARTMENT OF COMPUTER SCIENCE AND INFORMATION TECHNOLOGY

# MAT APP
# KENYAN MATATU BOOKING AND TRANSPORT MANAGEMENT SYSTEM

## PROJECT TECHNICAL DOCUMENTATION

A team project report submitted in partial fulfilment of the requirements for the relevant course/programme at Kabarak University.

### PREPARED BY
1. Martin Kariuki | Registration Number: __________________________
2. Emmanuel Kiambati | Registration Number: ______________________

### SUPERVISOR / LECTURER: __________________________________________
### ACADEMIC YEAR: ____________________

---

## DOCUMENT CONTROL
| Field | Details |
| --- | --- |
| Project name | Mat App |
| Document title | Project Technical Documentation |
| Institution | Kabarak University |
| Team members | Martin Kariuki; Emmanuel Kiambati |
| Registration numbers | To be completed by the team |
| Document version | 1.0 — Initial documentation draft |
| Date | 9 October 2026 |
| Repository / source | https://github.com/<team/repository> |
| Review status | Verified against the current repository implementation |

---

## ABSTRACT
Mat App is a full-stack web application designed to support booking and operational management for Kenya’s matatu transport sector. It provides a central platform for passengers, conductors, and administrators. Passengers can register, browse routes, view available seats, create bookings, and pay using the built-in M-Pesa demo flow or real Daraja integration if configured. Conductors can review bookings for a route and mark passengers as boarded, while administrators can manage routes, matatus, and system users.

The implemented project uses React with Vite for the frontend, Node.js with Express for the backend API, MongoDB for persistence, JWT for authentication, bcrypt for password hashing, Axios for HTTP requests, and M-Pesa Daraja support with demo-mode simulation. This documentation summarises the project’s purpose, architecture, data model, security considerations, and operation steps based on the actual repository contents and scripts.

---

## TABLE OF CONTENTS
- 1. Introduction and Project Overview
- 2. Project Objectives and Scope
- 3. Technology Stack
- 4. System Architecture
- 5. User Roles and Functional Features
- 6. Setup and Installation
- 7. Environment Configuration
- 8. Running the Application Locally
- 9. API Endpoints Summary
- 10. Database Design Overview
- 11. Payment Integration Notes
- 12. Security and Production Considerations
- 13. Testing and Validation
- 14. Troubleshooting
- 15. Future Enhancements
- 16. Conclusion

---

# 1. INTRODUCTION AND PROJECT OVERVIEW

## 1.1 Project overview
Mat App is a Kenyan matatu booking and transport management application that digitises selected operational and booking flows in the public transport sector. It brings together passengers, conductors, and administrators through one application layer.

## 1.2 Problem statement
In many local transport operations, booking, route information, seat allocation, conductor records, and payments are managed manually or in disconnected systems. This can lead to seat conflicts, cash-handling delays, inconsistent records, and poor visibility. Mat App addresses this by providing a centralised digital workflow for transport booking and operational management.

## 1.3 Purpose
The purpose of Mat App is to provide a practical web-based solution for route discovery, seat reservation, booking confirmation, payment flow, and operational management in a Kenyan matatu context.

## 1.4 Objectives
- Allow passengers to register and log in.
- Search and view routes and matatus.
- Select a journey and seat.
- Create and view bookings.
- Complete or simulate payment for bookings.
- Give conductors access to booking manifests and boarding updates.
- Let administrators manage routes and matatus.
- Demonstrate full-stack integration between frontend, backend, and database.

## 1.5 Scope
The project includes:
- user authentication and role-based access
- route and vehicle discovery
- booking creation and seat validation
- payment initiation and status handling
- conductor boarding actions
- admin dashboard and management routes

The project does not claim to be a full production transport ERP or a live nationwide transport platform. Production payment and deployment settings should be handled using secure hosting and production credentials.

## 1.6 Intended audience
This documentation is intended for:
- the student development team
- academic supervisors and examiners
- future maintainers of the source code
- testers and stakeholders reviewing the app

---

# 2. PROJECT SCOPE AND REQUIREMENTS

## 2.1 Functional requirements
- The system should authenticate users and assign them a role.
- Passengers should be able to view routes and create bookings.
- Seat conflicts should be prevented by server-side validation.
- Booking history should be visible to the passenger.
- Conductors should be able to access passenger manifests and mark passengers as boarded.
- Admins should add and review route and matatu records.
- Payment results should update the relevant booking state.

## 2.2 Non-functional requirements
- Usability: mobile-friendly and simple to navigate
- Security: hashed passwords, JWT tokens, protected API routes
- Reliability: consistent validation and meaningful error response handling
- Maintainability: separate frontend and backend codebases
- Performance: efficient database reads and indexed booking checks

## 2.3 Assumptions
The system is designed as a local-development-ready application with a MongoDB database and optional M-Pesa integration. Payment is configurable through environment variables, and the default demo mode is used unless live Daraja credentials are supplied.

---

# 3. TECHNOLOGY STACK

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React + Vite | User interface and SPA development |
| Styling | CSS / React components | Layout, forms and responsive interface |
| HTTP client | Axios | Browser-to-backend communication |
| Backend | Node.js + Express | API routes, middleware and business logic |
| Database | MongoDB | Persistent storage for users, routes, matatus and bookings |
| Authentication | JWT + bcrypt | Session tokens and password hashing |
| Payments | Safaricom M-Pesa Daraja | Payment processing with demo mode |
| Dev tools | npm, Git, Node.js | Setup, package management and source control |

## Verified project versions from package files
The project package manifests define the following stack:

- Backend: Node application named `mat-app-backend`
- Frontend: React app named `mat-app-frontend`
- Backend runtime dependencies: Express, Mongoose, Axios, bcryptjs, dotenv, JWT, helmet, cors, express-rate-limit
- Frontend dependencies: React, React DOM, Axios, Lucide React
- Build tooling: Vite and React plugin

---

# 4. SYSTEM ARCHITECTURE

## 4.1 Architecture overview
The project follows a standard client-server architecture:

- The React frontend presents the UI and sends requests to the backend.
- The Express backend processes requests, validates data, enforces role rules, and interacts with MongoDB.
- MongoDB stores users, routes, matatus, bookings, and payment data.
- M-Pesa integration is handled server-side through configured credentials and callback endpoints.

## 4.2 Frontend layer
The frontend is a Vite React application. It communicates with the backend through the URL configured in `VITE_API_URL` or the default proxy path `/api`.

The frontend API layer sets the `Authorization` header using the saved JWT token if present.

## 4.3 Backend layer
The backend exposes Express routes under `/api` for:
- authentication
- matatu search and list routes
- booking creation and booking history
- payment requests and callbacks
- admin dashboard data
- conductor manifest and boarding actions

## 4.4 Database layer
MongoDB stores the primary records in the application. The repository defines models such as:
- `User`
- `Route`
- `Matatu`
- `Booking`
- `Payment`

## 4.5 Request flow
1. User signs in or registers through the frontend.
2. Frontend sends JSON requests to Express routes.
3. The backend validates the request and authorises access.
4. MongoDB stores or retrieves records.
5. Payment requests are processed through the M-Pesa service layer when configured.
6. Booking and payment status are returned to the user.

---

# 5. USER ROLES AND FUNCTIONAL FEATURES

## 5.1 Passenger
Passengers can:
- register with a name, phone, optional email, and password
- log in and receive a JWT token
- search for routes and matatus
- view available seats for a selected trip
- create a booking for a valid seat
- view their own bookings
- cancel bookings that are still eligible for cancellation
- pay through the M-Pesa demo or configured payment flow

## 5.2 Conductor
Conductors can:
- view bookings tied to their assigned matatus
- access passenger manifest information
- mark bookings as boarded
- update the booking status from confirmed to completed when boarding is confirmed

## 5.3 Administrator
Admins can:
- view the dashboard statistics
- list routes and matatus
- create new routes and matatus
- create conductor accounts
- inspect user records and operational counts

## 5.4 Role access model
The middleware enforces access model checks using authenticated users and roles.

| Capability | Passenger | Conductor | Admin |
| --- | --- | --- | --- |
| Register / login | Yes | Yes | Yes |
| Search routes | Yes | Yes | Yes |
| Create booking | Yes | No | Optional |
| View booking history | Own bookings | Assigned trip bookings | Full view |
| Mark boarded | No | Yes | Yes, via admin routes |
| Manage routes | No | No | Yes |
| Manage matatus | No | No | Yes |

---

# 6. SETUP AND INSTALLATION

## 6.1 Prerequisites
- Node.js and npm
- MongoDB service running locally or a MongoDB Atlas connection
- Git
- A code editor such as Visual Studio Code
- Browser access for frontend testing

## 6.2 Clone the repository
```bash
git clone <repository-url>
cd Mat-app
```

## 6.3 Install backend dependencies
```bash
cd backend
npm install
```

## 6.4 Install frontend dependencies
```bash
cd ../frontend
npm install
```

## 6.5 Start MongoDB
The repository README recommends starting a local MongoDB container with Docker:

```bash
docker run -d --name matapp-mongodb --restart unless-stopped -p 27017:27017 -v matapp-mongo-data:/data/db mongo:7
```

If a container already exists:

```bash
docker start matapp-mongodb
```

---

# 7. ENVIRONMENT CONFIGURATION

The backend includes an example environment file in `backend/.env.example` and the server loads values using `dotenv`.

## 7.1 Backend environment variables
Key settings from the example file include:
- `PORT=5000`
- `NODE_ENV=development`
- `MONGO_URI=mongodb://127.0.0.1:27017/matapp`
- `JWT_SECRET=change_this_to_a_long_random_secret`
- `CLIENT_URL=http://localhost:5173`
- `TRUST_PROXY=false`
- `PAYMENT_MODE=DEMO`

The project validates M-Pesa configuration only when `PAYMENT_MODE=DARAJA`.

## 7.2 Demo credentials
The project README documents the following demo accounts:

| Role | Phone | Password |
| --- | --- | --- |
| Admin | 0700000000 | 123456 |
| Conductor | 0711111111 | 123456 |
| Passenger | 0722222222 | 123456 |

These values are intended for local demo use and must not be treated as production credentials.

## 7.3 Frontend environment variables
The frontend uses Vite and can read an API base URL from `VITE_API_URL` or uses the local proxy path `/api` by default. The Vite config proxies `/api` requests to `http://127.0.0.1:5000`.

---

# 8. RUNNING THE APPLICATION LOCALLY

## 8.1 Start the backend
```bash
cd backend
cp .env.example .env
npm run dev
```

The backend listens on `http://localhost:5000` and connects to MongoDB before starting the server.

## 8.2 Start the frontend
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

The frontend is served on `http://localhost:5173` by default.

## 8.3 Verify the app is running
- Open the frontend URL in a browser.
- Confirm the backend responds at `/api/health`.
- Try registering a new passenger.
- Create a booking and verify seat blocking.
- Log in as a conductor or admin if a demo account is seeded.

---

# 9. API ENDPOINTS SUMMARY

The project exposes API endpoints under the `/api` prefix. The following summary is based on the implemented backend routes:

| Area | Endpoint | Method | Access |
| --- | --- | --- | --- |
| Health | `/api/health` | GET | Public |
| Auth | `/api/auth/register` | POST | Public |
| Auth | `/api/auth/login` | POST | Public |
| Auth | `/api/auth/me` | GET | Authenticated |
| Routes | `/api/matatus` | GET | Public |
| Seats | `/api/matatus/:id/seats` | GET | Public |
| Bookings | `/api/bookings` | POST | Authenticated passenger |
| Bookings | `/api/bookings/mine` | GET | Authenticated passenger |
| Bookings | `/api/bookings/:id` | GET | Authenticated |
| Bookings | `/api/bookings/:id/cancel` | PATCH | Authenticated passenger |
| Payments | `/api/payments/stkpush` | POST | Authenticated passenger |
| Payments | `/api/payments/callback/:token` | POST | Callback endpoint |
| Payments | `/api/payments/:bookingId` | GET | Authenticated |
| Conductor | `/api/conductor/bookings` | GET | Conductor/admin |
| Conductor | `/api/conductor/bookings/:id/board` | PATCH | Conductor/admin |
| Admin | `/api/admin/dashboard` | GET | Admin |
| Admin | `/api/admin/routes` | GET/POST | Admin |
| Admin | `/api/admin/matatus` | GET/POST | Admin |
| Admin | `/api/admin/conductors` | POST | Admin |
| Admin | `/api/admin/users` | GET | Admin |

---

# 10. DATABASE DESIGN OVERVIEW

## 10.1 Core schema entities
The project uses MongoDB and Mongoose models.

### User model
The `User` schema contains:
- `name`
- `phone` (unique)
- `email`
- `password`
- `role` (`passenger`, `conductor`, `admin`)
- `active`
- timestamps

### Route model
The `Route` model stores route metadata such as:
- `name`
- `origin`
- `destination`
- `fare`
- `active`

### Matatu model
The `Matatu` model stores:
- registration number
- sacco name
- capacity
- route reference
- driver name
- conductor reference
- departure times
- active status

### Booking model
The `Booking` schema includes:
- `passenger` reference
- `matatu` reference
- `route` reference
- `travelDate`
- `departureTime`
- `seatNumber`
- `amount`
- `status` (`pending`, `confirmed`, `cancelled`, `completed`)
- `boardingStatus` (`not_boarded`, `boarded`)
- `bookingCode`

It also has a unique composite index to prevent duplicate seat bookings for the same matatu, date, time and seat while the status remains active.

### Payment model
The `Payment` model stores payment operations, including:
- booking reference
- phone number
- amount
- status
- checkout request IDs
- merchant request IDs
- receipt number
- raw gateway response

## 10.2 Relationship overview
- One `User` can have many `Booking` records.
- One `Matatu` is linked to a `Route` and may have multiple bookings.
- One `Payment` belongs to one `Booking`.
- A conductor can be assigned to a `Matatu`.

---

# 11. PAYMENT INTEGRATION NOTES

## 11.1 Payment flow
The backend payment route receives a payment request for a booking and performs the following:
1. Validates the booking and ownership.
2. Creates a payment record with a pending state.
3. Calls the M-Pesa STK push service if configured.
4. Updates the booking to confirmed in demo mode or when a valid callback confirms success.
5. Stores the gateway response and receipt information.

## 11.2 Demo payment mode
The README states that the default payment mode is `DEMO`, which simulates successful payment without moving money. This is suitable for local development and demonstration.

## 11.3 Daraja mode
If `PAYMENT_MODE=DARAJA`, the backend requires the M-Pesa credentials and callback configuration. The callback URL must be public HTTPS and the callback token must match the final path segment.

## 11.4 Security points
- Credentials are kept on the backend server.
- Callback validation is performed using a token in the URL path.
- Payment state is only updated after validation.
- Duplicate or invalid callback data is rejected.

---

# 12. SECURITY AND PRODUCTION CONSIDERATIONS

## 12.1 Authentication and authorisation
The app uses:
- `bcryptjs` for password hashing
- `jsonwebtoken` for token generation
- middleware-based route protection
- role checks for admin and conductor routes

## 12.2 Application security
Security measures implemented in the project include:
- password hashing before persistence
- JWT-based user sessions
- rate limiting for auth and payment endpoints
- Helmet headers for Express
- CORS configuration for trusted origins
- request validation before critical operations

## 12.3 Production recommendations
- Use a managed MongoDB service with backups.
- Set secure production environment variables.
- Keep `JWT_SECRET` random and private.
- Use HTTPS in production.
- Require valid public callback URLs for M-Pesa.
- Enforce strict role-based access on every protected endpoint.
- Do not use demo credentials or demo payment mode for live operations.

---

# 13. TESTING AND VALIDATION

The project includes backend tests via Node’s built-in test runner:

```bash
cd backend
npm test
```

The frontend can also be validated with a production build:

```bash
cd frontend
npm run build
```

The repository is intended to be tested for:
- authentication and role access
- route search and seat availability
- booking creation and duplicate booking protection
- conductor boarding update flow
- admin dashboard and route creation
- payment success/failure handling

---

# 14. TROUBLESHOOTING

| Problem | Possible cause | Solution |
| --- | --- | --- |
| Backend not starting | MongoDB not connected or environment issue | Confirm MongoDB is active and .env values are correct |
| Frontend cannot reach backend | Wrong proxy or API URL | Check Vite config and backend port |
| 401 Unauthorized | Missing or expired token | Log in again and confirm the token is sent |
| Seat booking fails | Duplicate seat or invalid seat value | Check existing bookings and server validation |
| Payment request fails | Missing Daraja config or invalid phone formatting | Check M-Pesa env values and phone format |

---

# 15. FUTURE ENHANCEMENTS
- Add real-time tracking for matatus
- Provide richer seat-map UI
- Add SMS or email notifications
- Add reporting and analytics dashboard
- Add refund and reconciliation workflows
- Add stronger CI/CD and automated end-to-end tests
- Add multi-operator support and route scheduling improvements

---

# 16. CONCLUSION
Mat App is a practical full-stack web application that models core operations for a Kenyan matatu booking system. It includes passenger booking, role-based conductor and admin workflows, database persistence, and optional M-Pesa integration. The project demonstrates how a transport booking platform can be built using the React + Express + MongoDB stack while maintaining security, user roles, and operational logic in a clean and maintainable structure.

---

## APPENDIX A: SCREENSHOT TEMPLATES

### Figure A1. Application landing page
[Insert screenshot here]

### Figure A2. Passenger register / login
[Insert screenshot here]

### Figure A3. Route search and trip selection
[Insert screenshot here]

### Figure A4. Seat booking flow
[Insert screenshot here]

### Figure A5. Conductor manifest and boarding action
[Insert screenshot here]

### Figure A6. Admin dashboard and route creation
[Insert screenshot here]

### Figure A7. Payment demo or sandbox result
[Insert screenshot here]

### Figure A8. Backend routes and controllers
[Insert screenshot here]

### Figure A9. Database models
[Insert screenshot here]

### Figure A10. Backend and frontend running in terminal
[Insert screenshot here]

---

## APPENDIX B: TEAM VERIFICATION CHECKLIST
- [ ] Insert repository URL and branch details.
- [ ] Fill in registration numbers.
- [ ] Confirm supervisor and academic year.
- [ ] Verify technology stack matches actual package manifests.
- [ ] Verify route names and model names against the repository.
- [ ] Confirm demo credentials from the README or seed script.
- [ ] Validate at least one successful test for each major role.
- [ ] Confirm whether payment is demo or live integration.
- [ ] Insert all screenshots into the appendix.

---

## REFERENCES
- React: https://react.dev/
- Vite: https://vite.dev/guide/
- Node.js: https://nodejs.org/docs/
- Express: https://expressjs.com/
- MongoDB: https://www.mongodb.com/docs/
- JWT: https://jwt.io/introduction
- Safaricom Daraja: https://developer.safaricom.co.ke/

---

## PROJECT STATUS
This documentation reflects the current repository implementation and the design intent of the application. The system is structured to support local development, demo payment flow, and a migration path to production-grade deployment with secure configuration and monitoring.
