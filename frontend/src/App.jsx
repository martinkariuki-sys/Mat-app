import React, { useEffect, useState } from "react";
import {
  Armchair, BusFront, CalendarDays, CheckCircle2, ChevronRight, CreditCard,
  LayoutDashboard, LogIn, MapPin, Menu, Search, ShieldCheck, Ticket, UserPlus,
  Users, X
} from "lucide-react";
import api from "./api";

function money(value) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const effectiveRole = user?.role === "conductor" ? "driver" : user?.role;

  useEffect(() => {
    const saved = localStorage.getItem("matapp_user");
    const token = localStorage.getItem("matapp_token");
    if (saved && token) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("matapp_user");
        localStorage.removeItem("matapp_token");
      }
    }
    setLoading(false);
  }, []);

  function notify(message, type = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  function loginSuccess(data) {
    localStorage.setItem("matapp_token", data.token);
    localStorage.setItem("matapp_user", JSON.stringify(data.user));
    setUser(data.user);
    const continueBooking = sessionStorage.getItem("matapp_continue_booking") === "true";
    sessionStorage.removeItem("matapp_continue_booking");
    setPage(data.user.role === "passenger" ? (continueBooking ? "book" : "home") : "dashboard");
  }

  function logout() {
    localStorage.removeItem("matapp_token");
    localStorage.removeItem("matapp_user");
    setUser(null);
    setPage("home");
  }

  if (loading) return <div className="loading-screen">Starting Mat App...</div>;

  return (
    <div className="app-shell">
      <Header user={user} page={page} setPage={setPage} logout={logout} />
      <main>
        {page === "home" && <Home user={user} setPage={setPage} notify={notify} />}
        {page === "guide" && <UserGuide setPage={setPage} />}
        {page === "login" && <Login onSuccess={loginSuccess} setPage={setPage} notify={notify} />}
        {page === "register" && <Register onSuccess={loginSuccess} setPage={setPage} notify={notify} />}
        {page === "book" && effectiveRole === "passenger" && <BookingPage notify={notify} />}
        {page === "my-bookings" && effectiveRole === "passenger" && <MyBookings notify={notify} />}
        {page === "dashboard" && (effectiveRole === "driver" || effectiveRole === "conductor") && <DriverDashboard notify={notify} />}
        {page === "dashboard" && effectiveRole === "admin" && <AdminDashboard notify={notify} />}
        {page === "dashboard" && !user && <Login onSuccess={loginSuccess} setPage={setPage} notify={notify} />}
      </main>
      <footer>
        <div><strong>MAT APP</strong><span> Digital transport for Kenyan matatus.</span></div>
        <span>Built for routes, seats, payments and people.</span>
      </footer>
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Header({ user, page, setPage, logout }) {
  const [open, setOpen] = useState(false);
  const effectiveRole = user?.role === "conductor" ? "driver" : user?.role;
  const navigate = next => {
    setPage(next);
    setOpen(false);
  };

  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")} aria-label="Mat App home">
        <span className="brand-icon"><BusFront size={23} /></span>
        <span>MAT<span>APP</span></span>
      </button>
      <nav className={open ? "nav open" : "nav"}>
        <button className={page === "home" ? "active" : ""} onClick={() => navigate("home")}>Home</button>
        <button className={page === "guide" ? "active" : ""} onClick={() => navigate("guide")}>User guide</button>
        {effectiveRole === "passenger" && <>
          <button onClick={() => navigate("book")}>Book a Matatu</button>
          <button onClick={() => navigate("my-bookings")}>My Bookings</button>
        </>}
        {user && effectiveRole !== "passenger" && <button onClick={() => navigate("dashboard")}>Dashboard</button>}
        {!user ? <>
          <button onClick={() => navigate("login")}>Login</button>
          <button className="nav-cta" onClick={() => navigate("register")}>Create account</button>
        </> : <button onClick={logout}>Logout</button>}
      </nav>
      <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

function Home({ user, setPage, notify }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(today());
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    setSearching(true);
    try {
      const response = await api.get("/matatus", { params: { origin, destination, date } });
      setResults(response.data.matatus);
      setSearched(true);
      notify(`${response.data.matatus.length} matatu(s) found`);
    } catch (error) {
      notify(error.response?.data?.message || "Could not search", "error");
    } finally {
      setSearching(false);
    }
  }

  return <>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><ShieldCheck size={16} /> BUILT FOR KENYAN TRANSPORT</div>
        <h1>Move through Kenya without the <span>guesswork.</span></h1>
        <p>Find a matatu, choose your route, reserve your seat and pay through M-Pesa. One system for passengers, drivers and Saccos.</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => user ? setPage("book") : setPage("register")}>Book a seat <ChevronRight size={18} /></button>
          <button className="ghost-btn" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
        </div>
      </div>
      <div className="hero-card">
        <div className="card-label">Find your trip</div>
        <div className="route-input"><MapPin size={18} /><div><small>From</small><input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Nairobi" /></div></div>
        <div className="route-line" />
        <div className="route-input"><MapPin size={18} /><div><small>To</small><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Nakuru" /></div></div>
        <div className="date-input"><CalendarDays size={18} /><div><small>Travel date</small><input type="date" value={date} min={today()} onChange={e => setDate(e.target.value)} /></div></div>
        <button className="search-btn" onClick={search} disabled={searching}><Search size={18} /> {searching ? "Searching..." : "Search matatus"}</button>
      </div>
    </section>

    {searched && <section className="section">
      <div className="section-head"><div><div className="eyebrow">TRIP SEARCH</div><h2>Your matching matatus</h2></div></div>
      {results.length > 0
        ? <div className="matatu-grid">{results.map(m => <MatatuCard key={m._id} matatu={m} date={date} setPage={setPage} user={user} />)}</div>
        : <div className="empty">No matatus found for this route and date. Try another destination or travel date.</div>}
    </section>}

    <section className="stats-strip">
      <div><strong>01</strong><span>Choose your route</span></div><div><strong>02</strong><span>Pick your seat</span></div>
      <div><strong>03</strong><span>Pay with M-Pesa</span></div><div><strong>04</strong><span>Board confidently</span></div>
    </section>
    <section id="how" className="section how-section">
      <div className="eyebrow">THE SYSTEM</div><h2>One platform. Three sides of the journey.</h2>
      <div className="role-grid">
        <RoleCard icon={<Ticket />} title="Passenger" text="Search routes, see available seats, book, pay and keep your digital ticket." />
        <RoleCard icon={<Users />} title="Driver" text="See today's passengers, verify confirmed bookings and mark people as boarded." />
        <RoleCard icon={<LayoutDashboard />} title="Sacco Admin" text="Manage routes, fares, vehicles, drivers and system activity." />
      </div>
    </section>
  </>;
}

function UserGuide({ setPage }) {
  return <section className="section guide-page">
    <div className="eyebrow">MAT APP FIELD GUIDE</div>
    <h1>How to use Mat App</h1>
    <p className="guide-intro">A quick guide for passengers, drivers and Sacco administrators.</p>
    <div className="guide-notice"><ShieldCheck size={21} /><div><strong>Demo payments do not move money.</strong><span>In DEMO mode, checkout confirms the booking without sending an M-Pesa request. Real payments require Safaricom Daraja credentials and a reachable callback URL.</span></div></div>
    <div className="guide-grid">
      <article className="panel">
        <div className="eyebrow">01 · PASSENGER</div><h2>Book a seat</h2>
        <ol><li>Search by origin, destination and travel date. You can browse before signing in.</li><li>Select a vehicle and departure time. Sign in or create a passenger account to continue.</li><li>Choose an available seat, enter the M-Pesa phone number and book.</li><li>Find the booking code, status and trip details under My Bookings.</li></ol>
        <button className="ghost-btn" onClick={() => setPage("home")}>Find a trip</button>
      </article>
      <article className="panel">
        <div className="eyebrow">02 · DRIVER</div><h2>Manage boarding</h2>
        <ol><li>Sign in with a driver account to open the dashboard.</li><li>Check the passenger name, route, departure, seat and payment status.</li><li>Mark a passenger as boarded only after confirming their trip.</li><li>Only confirmed bookings can be marked as boarded.</li></ol>
        <button className="ghost-btn" onClick={() => setPage("login")}>Driver login</button>
      </article>
      <article className="panel">
        <div className="eyebrow">03 · SACCO ADMIN</div><h2>Set up the fleet</h2>
        <ol><li>Create routes with an origin, destination and fare.</li><li>Add each matatu, assign its route, capacity and departure times.</li><li>Review fleet, account counts, bookings and recorded revenue in Overview.</li><li>Use real Daraja credentials only in a secured deployment.</li></ol>
        <button className="ghost-btn" onClick={() => setPage("login")}>Admin login</button>
      </article>
    </div>
    <div className="panel guide-accounts">
      <h2>Local demo accounts</h2>
      <p>Available after the backend demo seed is run. Password for each account: <strong>123456</strong>.</p>
      <div className="guide-account-row"><strong>Passenger</strong><span>0722222222</span><strong>Driver</strong><span>0711111111</span><strong>Admin</strong><span>0700000000</span></div>
      <p className="muted">These shared credentials are for local testing only. Replace them and configure private credentials before deployment.</p>
    </div>
  </section>;
}

function RoleCard({ icon, title, text }) {
  return <div className="role-card"><div className="role-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;
}

function MatatuCard({ matatu, date, setPage, user }) {
  const [time, setTime] = useState(matatu.departureTimes?.[0] || "");
  return <div className="matatu-card">
    <div className="matatu-top"><div className="matatu-logo"><BusFront /></div><div><strong>{matatu.registration}</strong><span>{matatu.sacco}</span></div><span className="available">{matatu.availableSeats} seats</span></div>
    <div className="route-display"><strong>{matatu.route?.origin}</strong><span>→</span><strong>{matatu.route?.destination}</strong></div>
    <div className="muted">{money(matatu.route?.fare)} · {matatu.capacity} seats</div>
    <select aria-label="Departure time" value={time} onChange={e => setTime(e.target.value)}>{matatu.departureTimes?.map(t => <option key={t}>{t}</option>)}</select>
    <button className="primary-btn full" onClick={() => {
      localStorage.setItem("matapp_selected_matatu", JSON.stringify({ ...matatu, selectedDate: date, selectedTime: time }));
      if (user) setPage("book");
      else {
        sessionStorage.setItem("matapp_continue_booking", "true");
        setPage("login");
      }
    }}>Select vehicle <ChevronRight size={17} /></button>
  </div>;
}

function Login({ onSuccess, setPage, notify }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { phone, password });
      onSuccess(data);
    } catch (error) {
      notify(error.response?.data?.message || "Login failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Welcome back" subtitle="Log in to manage your journey.">
    <form onSubmit={submit} className="form">
      <label>Phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></label>
      <button className="primary-btn full" disabled={busy}>{busy ? "Logging in..." : "Login"} <LogIn size={17} /></button>
      <p className="form-switch">No account? <button type="button" onClick={() => setPage("register")}>Create one</button></p>
    </form>
  </AuthShell>;
}

function Register({ onSuccess, setPage, notify }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/register", form);
      onSuccess(data);
    } catch (error) {
      notify(error.response?.data?.message || "Registration failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Create your account" subtitle="Passenger accounts are free. Naturally, the matatu is not.">
    <form onSubmit={submit} className="form">
      <label>Full name<input name="name" value={form.name} onChange={update} required /></label>
      <label>Phone number<input name="phone" value={form.phone} onChange={update} placeholder="0712345678" required /></label>
      <label>Email <span className="optional">(optional)</span><input name="email" type="email" value={form.email} onChange={update} /></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={update} minLength="6" required /></label>
      <button className="primary-btn full" disabled={busy}>{busy ? "Creating..." : "Create account"} <UserPlus size={17} /></button>
      <p className="form-switch">Already registered? <button type="button" onClick={() => setPage("login")}>Login</button></p>
    </form>
  </AuthShell>;
}

function AuthShell({ title, subtitle, children }) {
  return <section className="auth-page"><div className="auth-panel">
    <div className="brand large"><span className="brand-icon"><BusFront size={25} /></span>MAT<span>APP</span></div>
    <h1>{title}</h1><p>{subtitle}</p>{children}
  </div></section>;
}

function BookingPage({ notify }) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("matapp_selected_matatu") || "null"); } catch { /* Ignore invalid local state. */ }
  const [matatus, setMatatus] = useState([]);
  const [matatu, setMatatu] = useState(saved);
  const [date, setDate] = useState(saved?.selectedDate || today());
  const [time, setTime] = useState(saved?.selectedTime || saved?.departureTimes?.[0] || "");
  const [seats, setSeats] = useState([]);
  const [seat, setSeat] = useState(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/matatus", { params: { date } }).then(r => setMatatus(r.data.matatus)).catch(() => {});
  }, [date]);

  useEffect(() => {
    if (!matatu || !time) return;
    api.get(`/matatus/${matatu._id}/seats`, { params: { date, time } })
      .then(r => setSeats(r.data.seats)).catch(() => {});
  }, [matatu, date, time]);

  async function book() {
    if (!matatu || !seat || !date || !time || !phone) {
      notify("Select a vehicle, time, seat and M-Pesa phone", "error");
      return;
    }
    setBusy(true);
    try {
      const bookingRes = await api.post("/bookings", {
        matatuId: matatu._id, travelDate: date, departureTime: time, seatNumber: seat
      });
      const booking = bookingRes.data.booking;
      const paymentRes = await api.post("/payments/stkpush", { bookingId: booking._id, phone });
      notify(paymentRes.data.message || "Payment started");
      setSeat(null);
      const refreshed = await api.get(`/matatus/${matatu._id}/seats`, { params: { date, time } });
      setSeats(refreshed.data.seats);
    } catch (error) {
      notify(error.response?.data?.message || "Booking/payment failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return <section className="section booking-page">
    <div className="section-head"><div><div className="eyebrow">PASSENGER BOOKING</div><h1>Reserve your seat</h1><p className="muted">The system locks the seat for this vehicle, date and departure time.</p></div></div>
    <div className="booking-layout">
      <div className="booking-main">
        <div className="panel"><h3>1. Journey</h3><div className="two-col">
          <label>Vehicle<select value={matatu?._id || ""} onChange={e => {
            const selected = matatus.find(x => x._id === e.target.value);
            setMatatu(selected || null); setTime(selected?.departureTimes?.[0] || ""); setSeat(null);
          }}>
            <option value="">Choose matatu</option>{matatus.map(m => <option key={m._id} value={m._id}>{m.registration} · {m.route?.origin} → {m.route?.destination}</option>)}
          </select></label>
          <label>Date<input type="date" min={today()} value={date} onChange={e => { setDate(e.target.value); setSeat(null); }} /></label>
          <label>Departure<select value={time} onChange={e => { setTime(e.target.value); setSeat(null); }}>
            {(matatu?.departureTimes || []).map(t => <option key={t}>{t}</option>)}
          </select></label>
        </div></div>
        <div className="panel">
          <div className="panel-title"><h3>2. Choose a seat</h3><span><Armchair size={16} /> {seats.filter(s => !s.booked).length} available</span></div>
          <div className="seat-map">{seats.map(s => <button key={s.number} disabled={s.booked} className={`seat ${s.booked ? "booked" : ""} ${seat === s.number ? "selected" : ""}`} onClick={() => setSeat(s.number)} aria-label={`Seat ${s.number}${s.booked ? ", booked" : ""}`}>
            <Armchair size={18} />{s.number}
          </button>)}</div>
          <div className="seat-legend"><span><i className="seat-dot available-dot" /> Available</span><span><i className="seat-dot selected-dot" /> Selected</span><span><i className="seat-dot booked-dot" /> Booked</span></div>
        </div>
      </div>
      <aside className="summary-card">
        <h3>Booking summary</h3>
        <div className="summary-route"><strong>{matatu?.route?.origin || "Origin"}</strong><span>→</span><strong>{matatu?.route?.destination || "Destination"}</strong></div>
        <div className="summary-row"><span>Date</span><b>{date}</b></div><div className="summary-row"><span>Departure</span><b>{time || "—"}</b></div><div className="summary-row"><span>Seat</span><b>{seat || "—"}</b></div>
        <div className="summary-total"><span>Total</span><strong>{money(matatu?.route?.fare)}</strong></div>
        <label>M-Pesa phone<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678" /></label>
        <button className="primary-btn full" onClick={book} disabled={busy}><CreditCard size={17} /> {busy ? "Processing..." : "Book & pay"}</button>
        <small className="demo-note">Demo mode: payment is simulated unless Daraja is configured.</small>
      </aside>
    </div>
  </section>;
}

function MyBookings({ notify }) {
  const [bookings, setBookings] = useState([]);
  async function load() {
    try { const { data } = await api.get("/bookings/mine"); setBookings(data.bookings); }
    catch (error) { notify(error.response?.data?.message || "Could not load bookings", "error"); }
  }
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    try { await api.patch(`/bookings/${id}/cancel`); notify("Booking cancelled"); load(); }
    catch (error) { notify(error.response?.data?.message || "Could not cancel", "error"); }
  }

  return <section className="section"><div className="eyebrow">YOUR JOURNEYS</div><h1>My bookings</h1><div className="booking-list">
    {bookings.length === 0 && <div className="empty">No bookings yet.</div>}
    {bookings.map(b => <div className="booking-card" key={b._id}>
      <div className="booking-code">{b.bookingCode}</div>
      <div><strong>{b.route?.origin} → {b.route?.destination}</strong><span>{b.travelDate} · {b.departureTime} · Seat {b.seatNumber}</span></div>
      <div><strong>{money(b.amount)}</strong><span className={`status ${b.status}`}>{b.status}</span></div>
      {b.status === "pending" && <button className="danger-btn" onClick={() => cancel(b._id)}>Cancel</button>}
    </div>)}
  </div></section>;
}

function DriverDashboard({ notify }) {
  const [bookings, setBookings] = useState([]);
  async function load() {
    try { const { data } = await api.get("/conductor/bookings"); setBookings(data.bookings); }
    catch (error) { notify(error.response?.data?.message || "Could not load driver data", "error"); }
  }
  useEffect(() => { load(); }, []);

  async function board(id) {
    try { await api.patch(`/conductor/bookings/${id}/board`); notify("Passenger marked as boarded"); load(); }
    catch (error) { notify(error.response?.data?.message || "Could not update boarding", "error"); }
  }

  return <section className="section"><div className="eyebrow">DRIVER CONTROL</div><h1>Today's passenger manifest</h1><div className="table-wrap">
    <table><thead><tr><th>Passenger</th><th>Trip</th><th>Seat</th><th>Payment</th><th>Boarding</th></tr></thead><tbody>
      {bookings.map(b => <tr key={b._id}>
        <td><strong>{b.passenger?.name}</strong><small>{b.passenger?.phone}</small></td>
        <td>{b.route?.origin} → {b.route?.destination}<small>{b.travelDate} · {b.departureTime}</small></td>
        <td>{b.seatNumber}</td><td><span className={`status ${b.status}`}>{b.status}</span></td>
        <td>{b.boardingStatus === "boarded" ? <span className="status confirmed">Boarded</span> : <button className="small-btn" onClick={() => board(b._id)} disabled={b.status !== "confirmed"}>Board</button>}</td>
      </tr>)}
    </tbody></table>
  </div></section>;
}

function AdminDashboard({ notify }) {
  const [stats, setStats] = useState({});
  const [routes, setRoutes] = useState([]);
  const [matatus, setMatatus] = useState([]);
  const [tab, setTab] = useState("overview");
  const [routeForm, setRouteForm] = useState({ name: "", origin: "", destination: "", fare: "" });
  const [matatuForm, setMatatuForm] = useState({ registration: "", sacco: "", capacity: 14, route: "", driverName: "", departureTimes: "07:00,10:00,14:00,17:00" });

  async function load() {
    try {
      const [s, r, m] = await Promise.all([api.get("/admin/dashboard"), api.get("/admin/routes"), api.get("/admin/matatus")]);
      setStats(s.data.stats); setRoutes(r.data.routes); setMatatus(m.data.matatus);
    } catch (error) { notify(error.response?.data?.message || "Could not load admin data", "error"); }
  }
  useEffect(() => { load(); }, []);

  async function createRoute(e) {
    e.preventDefault();
    try {
      await api.post("/admin/routes", { ...routeForm, fare: Number(routeForm.fare) });
      notify("Route created"); setRouteForm({ name: "", origin: "", destination: "", fare: "" }); load();
    } catch (error) { notify(error.response?.data?.message || "Could not create route", "error"); }
  }

  async function createMatatu(e) {
    e.preventDefault();
    try {
      await api.post("/admin/matatus", { ...matatuForm, capacity: Number(matatuForm.capacity), departureTimes: matatuForm.departureTimes.split(",").map(x => x.trim()).filter(Boolean) });
      notify("Matatu created");
      setMatatuForm({ registration: "", sacco: "", capacity: 14, route: "", driverName: "", departureTimes: "07:00,10:00,14:00,17:00" });
      load();
    } catch (error) { notify(error.response?.data?.message || "Could not create matatu", "error"); }
  }

  return <section className="section admin-page">
    <div className="eyebrow">SACCO ADMINISTRATION</div><h1>Control centre</h1>
    <div className="metric-grid"><Metric label="Passengers" value={stats.passengers} icon={<Users />} /><Metric label="Drivers" value={stats.drivers} icon={<Users />} /><Metric label="Active matatus" value={stats.matatus} icon={<BusFront />} /><Metric label="Bookings" value={stats.bookings} icon={<Ticket />} /><Metric label="Revenue" value={money(stats.revenue)} icon={<CreditCard />} /></div>
    <div className="tabs"><button className={tab === "overview" ? "selected-tab" : ""} onClick={() => setTab("overview")}>Overview</button><button className={tab === "routes" ? "selected-tab" : ""} onClick={() => setTab("routes")}>Routes</button><button className={tab === "matatus" ? "selected-tab" : ""} onClick={() => setTab("matatus")}>Matatus</button></div>
    {tab === "overview" && <div className="admin-overview">
      <div className="panel"><h3>What the admin controls</h3><ul className="feature-list"><li>Passenger accounts and driver accounts</li><li>Routes and fares</li><li>Matatu registration, capacity and departure times</li><li>Booking and payment records</li><li>Revenue visibility</li></ul></div>
      <div className="panel"><h3>Live fleet</h3>{matatus.slice(0, 5).map(m => <div className="mini-row" key={m._id}><span><strong>{m.registration}</strong> · {m.route?.name}</span><span>{m.capacity} seats</span></div>)}</div>
    </div>}
    {tab === "routes" && <div className="admin-grid">
      <form className="panel form" onSubmit={createRoute}><h3>Create route</h3>
        <label>Name<input value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })} placeholder="Nairobi - Nakuru" required /></label>
        <label>Origin<input value={routeForm.origin} onChange={e => setRouteForm({ ...routeForm, origin: e.target.value })} required /></label>
        <label>Destination<input value={routeForm.destination} onChange={e => setRouteForm({ ...routeForm, destination: e.target.value })} required /></label>
        <label>Fare<input type="number" min="0" value={routeForm.fare} onChange={e => setRouteForm({ ...routeForm, fare: e.target.value })} required /></label><button className="primary-btn">Create route</button>
      </form>
      <div className="panel"><h3>Routes</h3>{routes.map(r => <div className="mini-row" key={r._id}><span><strong>{r.name}</strong><small>{r.origin} → {r.destination}</small></span><b>{money(r.fare)}</b></div>)}</div>
    </div>}
    {tab === "matatus" && <div className="admin-grid">
      <form className="panel form" onSubmit={createMatatu}><h3>Add matatu</h3>
        <label>Registration<input value={matatuForm.registration} onChange={e => setMatatuForm({ ...matatuForm, registration: e.target.value })} placeholder="KDA 123A" required /></label>
        <label>Sacco<input value={matatuForm.sacco} onChange={e => setMatatuForm({ ...matatuForm, sacco: e.target.value })} required /></label>
        <label>Capacity<input type="number" value={matatuForm.capacity} onChange={e => setMatatuForm({ ...matatuForm, capacity: e.target.value })} min="1" required /></label>
        <label>Route<select value={matatuForm.route} onChange={e => setMatatuForm({ ...matatuForm, route: e.target.value })} required><option value="">Choose route</option>{routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}</select></label>
        <label>Driver name<input value={matatuForm.driverName} onChange={e => setMatatuForm({ ...matatuForm, driverName: e.target.value })} /></label>
        <label>Departure times<input value={matatuForm.departureTimes} onChange={e => setMatatuForm({ ...matatuForm, departureTimes: e.target.value })} /></label><button className="primary-btn">Add matatu</button>
      </form>
      <div className="panel"><h3>Fleet</h3>{matatus.map(m => <div className="fleet-row" key={m._id}><div className="matatu-logo"><BusFront /></div><div><strong>{m.registration}</strong><small>{m.sacco} · {m.route?.name}</small></div><span>{m.capacity} seats</span></div>)}</div>
    </div>}
  </section>;
}

function Metric({ label, value, icon }) {
  return <div className="metric-card"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value ?? 0}</strong></div>;
}
