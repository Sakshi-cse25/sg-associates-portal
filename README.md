# S.G. Associates — Full Stack Business Operations Portal

An original, self-contained **Full Stack Web Application** built to demonstrate the architecture, engineering practices, security controls, and learnings from the Industrial Internship **"Full Stack Website Development for Business Operations"** (Sakshi Kumari, Roll No. `241302220`, B.Tech CSE, SGT University).

---

## 1. Quick Start (Run in 10 Seconds)

**Prerequisites:** Node.js `v22+` / `v24+` (uses built-in `node:sqlite` — no external database server setup needed for examination demos).

```bash
cd sg-associates-portal
npm install
npm start
```

Open in your browser:
- **Public Website:** `http://127.0.0.1:3000/`
- **Admin Login:** `http://127.0.0.1:3000/admin-login.html`
- **Default Demo Credentials:** Username `admin` | Password `Admin@123` (configurable via `ADMIN_DEFAULT_PASSWORD` environment variable)

Run automated unit, integration, and security tests:
```bash
npm test
```

---

## 2. Three-Tier System Architecture

```text
+---------------------------------------------------------------+
| PRESENTATIONAL TIER (public/)                                 |
| Semantic HTML5 | Mobile-First CSS3 (Grid/Flex) | ES6+ Fetch   |
+---------------------------------------------------------------+
                                | HTTP / JSON
                                v
+---------------------------------------------------------------+
| APPLICATION TIER (src/)                                       |
| Express 5 | Routes -> Controllers -> Models | Auth Middleware |
| Input Validation | Salted scrypt Hashing | Central Errors     |
+---------------------------------------------------------------+
                                | Parameterized SQL (?)
                                v
+---------------------------------------------------------------+
| DATA TIER (src/db/)                                           |
| SQLite (node:sqlite) with Foreign Keys & Indexes              |
| Tables: services, enquiries, projects, gallery, admins        |
| (Reference MySQL DDL also provided in src/db/schema.mysql.sql)|
+---------------------------------------------------------------+
```

---

## 3. Project Structure

```text
sg-associates-portal/
├── server.js                    # Entry point (initializes DB and starts HTTP server)
├── src/
│   ├── app.js                   # Express app setup, security headers, static serving
│   ├── config/env.js            # Environment-based configuration
│   ├── db/
│   │   ├── database.js          # DB connection, schema runner, initial seed data
│   │   ├── schema.sqlite.sql    # Active SQLite schema with FK & CHECK constraints
│   │   └── schema.mysql.sql     # Reference MySQL schema from internship report
│   ├── middleware/
│   │   ├── auth.js              # HMAC-signed HttpOnly session cookies & requireAdmin
│   │   ├── securityHeaders.js   # CSP, X-Frame-Options, X-Content-Type-Options
│   │   └── errorHandler.js      # Centralized safe error handling
│   ├── models/                  # Prepared statement SQL queries per table
│   ├── controllers/             # Request validation, business rules, status codes
│   ├── routes/                  # REST endpoint mapping (/api & /api/admin)
│   └── utils/
│       ├── password.js          # crypto.scryptSync + timingSafeEqual verification
│       └── validators.js        # Shared server-side field validators
├── public/                      # Responsive front-end pages, CSS, JS, SVG assets
└── tests/app.test.js            # Automated tests mapping to Report Table 4.8 (TC-1..TC-8)
```

---

## 4. API Data Contract

| Method | Endpoint | Access | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/services` | Public | List all civil services | `200` |
| `GET` | `/api/projects` | Public | List completed/ongoing projects | `200` |
| `GET` | `/api/gallery` | Public | List site gallery images with project titles | `200` |
| `POST` | `/api/enquiries` | Public | Submit validated client enquiry | `201`, `400` |
| `POST` | `/api/admin/login` | Public | Authenticate staff & issue session cookie | `200`, `400`, `401` |
| `POST` | `/api/admin/logout` | Admin | Destroy session & clear cookie | `200` |
| `GET` | `/api/admin/me` | Admin | Verify active admin session | `200`, `401` |
| `GET` | `/api/admin/enquiries` | Admin | View all submitted enquiries | `200`, `401` |
| `PATCH` | `/api/admin/enquiries/:id` | Admin | Update status (`New`, `In progress`, `Closed`) | `200`, `400`, `404` |
| `POST/PUT/DELETE` | `/api/admin/services(/:id)` | Admin | Add, edit, or delete services | `201`, `200`, `400`, `404` |
| `POST/PUT/DELETE` | `/api/admin/projects(/:id)` | Admin | Add, edit, or delete projects | `201`, `200`, `400`, `404` |
| `POST/DELETE` | `/api/admin/gallery(/:id)` | Admin | Add or delete gallery items | `201`, `200`, `400`, `404` |

---

## 5. External Examination / Viva Presentation Guide

### 2-Minute Live Demo Flow
1. **Show the Public Website (`index.html`, `services.html`, `projects.html`, `gallery.html`):**
   - Resize the browser window (or open DevTools Device Toolbar at `360px`, `768px`, `1024px`) to demonstrate **mobile-first responsive Grid/Flexbox** and the collapsible hamburger navigation (`TC-8`).
   - Show how services, projects, and lazy-loaded gallery images come dynamically from the database via `fetch('/api/...')`.
2. **Demonstrate Dual Validation & Enquiry Capture (`contact.html`):**
   - Submit an empty form or invalid email (`abc@`) to show **client-side inline error messages** (`TC-2`, `TC-3`).
   - Submit a valid enquiry (optionally include `<script>alert(1)</script>` or `' OR 1=1` in a test submission) and show the `201 Created` confirmation (`TC-1`).
3. **Demonstrate Protected Admin Area (`admin.html` & `admin-login.html`):**
   - Try visiting `/admin.html` before logging in — show that it automatically redirects to `/admin-login.html` (`TC-7`), and show `/api/admin/enquiries` returning `401 Unauthorized`.
   - Try an incorrect password (`TC-6`) to show the generic error message.
   - Log in with `admin` / `Admin@123`, view the newly submitted enquiry (showing script/SQL text rendered harmlessly via `escapeHtml`), change its status to `In progress`, and add/edit a service to prove live DB persistence.
4. **Run `npm test` in Terminal:**
   - Show all unit, integration, and security test cases passing live.

### Likely Viva Questions & Answers
- **Q1: Why is validation implemented on both client and server?**
  - *Answer:* Client-side validation (`public/js/contact.js`) gives instant feedback without a network round-trip, but can be bypassed via Postman/curl or disabled JS. Server-side validation (`src/utils/validators.js`) is the authoritative security boundary returning `400 Bad Request`.
- **Q2: How did you prevent SQL Injection and XSS?**
  - *Answer:* Every SQL query in `src/models/*.js` uses parameterized prepared statements (`?` placeholders), never string concatenation. For XSS, `escapeHtml()` escapes `< > & " '` before inserting database values into DOM (`public/js/common.js`), supported by a strict `Content-Security-Policy` header (`src/middleware/securityHeaders.js`).
- **Q3: How are admin passwords and sessions secured?**
  - *Answer:* Passwords are stored as salted `scrypt` hashes (`src/utils/password.js`) and compared with `crypto.timingSafeEqual`. Sessions use random 32-byte IDs signed with HMAC-SHA256 in `HttpOnly; SameSite=Lax` cookies with a 30-minute inactivity timeout (`src/middleware/auth.js`).
- **Q4: Why does this demo use SQLite while your internship report mentions MySQL?**
  - *Answer:* The schema (`src/db/schema.mysql.sql` vs `src/db/schema.sqlite.sql`), foreign keys, normalization (3NF), and parameterized SQL queries are identical. Built-in `node:sqlite` makes the demo portable so it runs immediately on any exam machine with `npm start` without installing or configuring a MySQL service.
