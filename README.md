# 🛡️ ExploreCeylon — Admin Panel

**React + Vite Admin Dashboard for Platform Management**

> ⚠️ **This is a separate, standalone Vite project** from the [traveler-facing frontend](../ExploreCeylon-frontend-web) — different `package.json`, different `node_modules`, deployed and run independently, and gated entirely behind admin login. It talks to the same [ExploreCeylon backend](../ExploreCeylon-backend).

Group 4 · COM3b33 · University of Ruhuna · 2026

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?logo=tailwindcss&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg">
</p>

> ℹ️ `package.json` pins **React 19.2.6**, not React 18 — the badge reflects the real installed version.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Admin Routes](#-admin-routes)
- [Admin Authentication](#-admin-authentication)
- [Contact Messages Feature](#-contact-messages-feature)
- [All Admin Features](#-all-admin-features)
- [API Endpoints Used](#-api-endpoints-used)
- [License](#-license)

---

## 📖 Project Overview

The ExploreCeylon Admin Panel is a **separate React + Vite single-page app** used exclusively by platform administrators to manage the ExploreCeylon tourism platform — it is not part of, and does not share a codebase or build with, the traveler-facing frontend. It is entirely gated behind an `ADMIN`-role login and talks to the same Spring Boot backend as the traveler app.

**What admins can manage:**

- 📊 Platform-wide dashboard stats and analytics
- 🚗 Local vehicle listings (create, edit, availability toggle, delete)
- 🧭 Tour guides (create, edit, availability toggle, delete)
- 📦 Guide & vehicle bookings (view, filter, cancel, bulk status update)
- 🏛️ Destinations content (create, edit, feature/unfeature, activate/deactivate, delete)
- 💎 Hidden gems moderation (approve/reject user submissions, edit, delete)
- 📅 Events calendar (create, edit, delete)
- ⭐ Reviews moderation across destinations/gems/guides/vehicles (delete, bulk delete)
- 👤 User accounts (activate/deactivate, change role, reset verification, bulk actions)
- 💬 Live chat with travelers (STOMP/SockJS) and a Gmail-style **contact messages inbox**
- 💰 Revenue and booking-status insight via `recharts`

---

## 🛠️ Tech Stack

| Category | Package | Version |
|---|---|---|
| UI Library | `react` / `react-dom` | ^19.2.6 |
| Routing | `react-router-dom` | ^7.18.0 |
| Build Tool | `vite` | ^8.0.12 |
| React Plugin | `@vitejs/plugin-react` | ^6.0.1 |
| Styling | `tailwindcss` + `@tailwindcss/vite` | ^4.3.1 |
| HTTP Client | `axios` | ^1.18.0 |
| Charts | `recharts` | ^2.15.4 |
| Live Chat (STOMP) | `@stomp/stompjs` | ^7.3.0 |
| Live Chat (WebSocket fallback) | `sockjs-client` | ^1.6.1 |
| Icons | `lucide-react` | ^1.20.0 |
| Linting | `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | ^10.3.0 / ^10.0.1 / ^7.1.1 / ^0.5.2 |
| Type Hints (JS + JSDoc) | `@types/react`, `@types/react-dom` | ^19.2.14 / ^19.2.3 |

---

## 📂 Project Structure

```
src/
├── main.jsx                        # App entry point
├── App.jsx                         # Router, AuthProvider, all /admin/* route definitions
├── App.css / index.css             # Global styles + Tailwind entry
│
├── pages/
│   ├── AdminLogin.jsx               # Public admin sign-in screen
│   ├── AdminDashboard.jsx           # Home — platform-wide stat tiles
│   ├── AdminAnalytics.jsx           # Charts / analytics (recharts)
│   ├── AdminUsers.jsx               # User account management
│   ├── AdminBookings.jsx            # Guide & vehicle bookings overview
│   ├── AdminVehicles.jsx            # Vehicle CRUD + availability toggle
│   ├── AdminGuides.jsx              # Guide CRUD + availability toggle
│   ├── AdminDestinations.jsx        # Destination content management
│   ├── AdminHiddenGems.jsx          # Hidden gem submissions + moderation
│   ├── AdminEvents.jsx              # Events calendar management
│   ├── AdminReviews.jsx             # Cross-entity review moderation
│   ├── AdminContactPage.jsx         # Gmail-style contact message inbox
│   ├── AdminLiveChatPage.jsx        # Live chat with travelers
│   └── AdminSettings.jsx            # Admin account/profile settings
│
├── components/
│   ├── AdminLayout.jsx              # Shared shell (sidebar + content outlet)
│   ├── AdminSidebar.jsx             # Nav sidebar
│   ├── AdminRoute.jsx               # Router-level auth+role gate (see below)
│   └── admin/
│       ├── DataTable.jsx
│       ├── Pagination.jsx
│       ├── SearchBar.jsx
│       ├── BulkActionBar.jsx
│       ├── StatTile.jsx
│       ├── StatusBadge.jsx
│       ├── ConfirmDialog.jsx
│       └── EmptyState.jsx
│
├── context/
│   └── AuthContext.jsx              # user, token, isAdmin, login/logout
│
├── services/                        # one file per backend resource
│   ├── adminApiClient.js            # shared fetch helper (adminGet/adminMutate/buildQuery)
│   ├── authService.js               # login/logout, token + role storage
│   ├── adminDashboardService.js
│   ├── adminAnalyticsService.js
│   ├── adminUserService.js
│   ├── adminBookingService.js
│   ├── adminReviewService.js
│   ├── vehicleService.js
│   ├── guideService.js
│   ├── destinationService.js
│   ├── hiddenGemsService.js
│   ├── eventService.js
│   ├── contactService.js
│   ├── chatService.js / chatSocket.js
│   ├── uploadService.js
│   └── profileService.js
│
├── utils/
│   └── csvExport.js                 # export admin table data to CSV
│
└── assets/
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- The [ExploreCeylon backend](../ExploreCeylon-backend) **must already be running** on `http://localhost:8080` — every page in this app fetches data from it immediately on load, and login will fail without it
- An existing `ADMIN`-role account in the database (see [Admin Authentication](#-admin-authentication))

### 1. Install dependencies

```bash
npm install
```

### 2. Create your `.env`

```bash
cp .env.example .env   # or create .env manually — see below
```

### 3. Run the dev server

```bash
npm run dev
```

`vite.config.js` doesn't set a custom `server.port`, so this runs on Vite's default — **`http://localhost:5173`**.

> ⚠️ **Port note:** the traveler frontend also defaults to `5173`. Don't run both dev servers at the same time without changing one's port (`vite --port 5174`), or the second one to start will silently shift to `5174` itself — check your terminal output to confirm which app is on which port.

### Other scripts

```bash
npm run build      # production build
npm run preview    # preview the production build locally
npm run lint       # ESLint
```

---

## ⚙️ Environment Variables

Every service file reads the backend URL via **`import.meta.env.VITE_API_BASE_URL`** (Vite's build-time env — never `process.env`, which doesn't exist in browser code bundled by Vite) and falls back to `http://localhost:8080` if unset.

`.env.example`:

```bash
# Base URL of the ExploreCeylon Spring Boot backend
VITE_API_BASE_URL=http://localhost:8080
```

| Variable | Used in | Required | Fallback |
|---|---|:---:|---|
| `VITE_API_BASE_URL` | `services/adminApiClient.js`, `authService.js`, `chatSocket.js`, `contactService.js`, `destinationService.js`, `eventService.js`, `guideService.js`, `hiddenGemsService.js`, `profileService.js`, `uploadService.js`, `vehicleService.js`, `pages/AdminDestinations.jsx`, `pages/AdminVehicles.jsx` | ⬜ | `http://localhost:8080` |

---

## 🧭 Admin Routes

All routes are declared in `src/App.jsx`. Every route except `/login` is nested under `<AdminRoute>` inside `<AdminLayout>`, so **every single admin page is protected by one router-level gate** — no page re-implements its own auth check.

| Route | Page | Description |
|---|---|---|
| `/login` | `AdminLogin` | Public — admin sign-in form |
| `/` | `AdminDashboard` | 🔒 Home dashboard — platform stat tiles, recent activity, top lists |
| `/analytics` | `AdminAnalytics` | 🔒 Charts and deeper analytics (`recharts`) |
| `/users` | `AdminUsers` | 🔒 User account management |
| `/bookings` | `AdminBookings` | 🔒 Guide & vehicle bookings overview |
| `/vehicles` | `AdminVehicles` | 🔒 Vehicle listing CRUD + availability toggle |
| `/guides` | `AdminGuides` | 🔒 Tour guide CRUD + availability toggle |
| `/destinations` | `AdminDestinations` | 🔒 Destination content management |
| `/hidden-gems` | `AdminHiddenGems` | 🔒 Hidden gem submission moderation |
| `/events` | `AdminEvents` | 🔒 Events calendar management |
| `/reviews` | `AdminReviews` | 🔒 Cross-entity review moderation |
| `/contact` | `AdminContactPage` | 🔒 Contact message inbox |
| `/live-chat` | `AdminLiveChatPage` | 🔒 Live chat with travelers |
| `/settings` | `AdminSettings` | 🔒 Admin account settings |
| `*` (unknown) | — | Redirects to `/` |

`AdminRoute` (`src/components/AdminRoute.jsx`) checks both `isAuthenticated` **and** `isAdmin` (`user.role === "ADMIN"`) — a logged-in non-admin traveler is redirected to `/login`, not granted access. Per its own code comment, this replaced a previous pattern where individual pages each ran their own `isAdmin`-then-navigate check, and some pages (Destinations, Hidden Gems, Events, Settings, Contact) had been missed entirely — this was a real access-control gap that the router-level gate closes.

---

## 🔐 Admin Authentication

**Login flow:**
1. `AdminLogin.jsx` submits `{ email, password }` to `POST /api/v1/auth/login` (via `authService.login`) — the same login endpoint used by the traveler app.
2. If the response's `role` is not `"ADMIN"`, the app immediately logs the session back out and shows "Access denied. Admin accounts only." — a valid traveler login is rejected here even though the backend call itself succeeded.
3. On success, the token/user are saved to `localStorage` and the app navigates to `/`.

**Token storage (`localStorage`):** for backward-compatibility with older code paths, the token and user are written under **multiple keys** on every login:

| Key | Purpose |
|---|---|
| `ec_admin_token` | Primary admin token key (checked first) |
| `exploreCeylonToken` / `token` | Legacy/shared keys, also read as fallbacks |
| `ec_admin_user` | Primary admin user object |
| `exploreCeylonUser` / `user` | Legacy/shared user object keys |
| `exploreCeylonRole` | Role string, used as a fallback if the user object is missing |

**Authorization header:** `services/adminApiClient.js`'s `getAuthHeader()` (and the equivalent helper in `authService.js`) reads `ec_admin_token` first, falling back to `exploreCeylonToken`, and attaches it as `Authorization: Bearer <token>` on every `adminGet`/`adminMutate` call and on the older per-service `fetch` calls alike.

**Default seed credentials** (from the backend's `data.sql`):

```
Email:    admin@exploreceylon.com
Password: admin123
```

> ⚠️ **Verify before relying on this password.** `data.sql` only stores a bcrypt hash for the seeded admin user (shared across all four demo accounts) — the plaintext `admin123` is the password convention documented for this project but could not be independently confirmed by decrypting the hash. **Change it before any production/public deployment regardless.**

---

## ✉️ Contact Messages Feature

`AdminContactPage.jsx` is a **Gmail-style split-pane inbox** for messages submitted through the traveler site's public contact form.

**Layout:** a searchable message list on the left (`w-80`), a full message detail + reply panel on the right — clicking a message selects it and loads its detail without a page navigation.

**Features:**
- 🔴 **Unread count badge** in the header, computed client-side from the loaded message list
- 👁️ **Auto mark-as-read** — selecting an unread message automatically calls `markAsRead(id)` before rendering its detail
- 💬 **Reply** — a reply textarea saves to the backend via `saveReply(id, text)`; a previously saved reply is shown highlighted, with a timestamp, and can be updated
- 📧 **Open in Email** — a `mailto:` link pre-filled with the traveler's address, a `Re:` subject, and the current reply draft, for replying via the admin's own email client
- 🗑️ **Delete** — permanently deletes a message after a confirm dialog
- 🔍 **Search** — client-side filter across name, email, subject, and message body
- 🗂️ **Filter tabs** — "All" vs "Unread", each showing a live count
- 🔄 **Manual refresh** button to reload the list

**API endpoints used** (`services/contactService.js`, all under `/api/v1/contact/admin`, `ADMIN`-only):

| Method | Path | Used for |
|---|---|---|
| GET | `/api/v1/contact/admin` | Load all messages |
| GET | `/api/v1/contact/admin/unread` | Load only unread messages ("Unread" tab) |
| GET | `/api/v1/contact/admin/count` | Unread count (used elsewhere, e.g. sidebar badge) |
| PATCH | `/api/v1/contact/admin/{id}/read` | Mark a message as read |
| POST | `/api/v1/contact/admin/{id}/reply` | Save/update the admin's reply |
| DELETE | `/api/v1/contact/admin/{id}` | Delete a message |

A `401 Unauthorized` on any of these calls triggers an automatic `logout("/login")` — the session is treated as expired rather than silently failing.

---

## 🧩 All Admin Features

| Feature | Page | Highlights |
|---|---|---|
| 📊 **Dashboard** | `AdminDashboard` | Stat tiles — active/verified/new users, trips created, destinations, hidden gems, events, vehicle & guide bookings, total & pending reviews, pending bookings — plus recent activity and top lists |
| 📈 **Analytics** | `AdminAnalytics` | Deeper platform analytics via `recharts` |
| 🚗 **Vehicle Management** | `AdminVehicles` | Full CRUD (`POST`/`PUT`/`DELETE /api/v1/admin/vehicles`), availability toggle (`PATCH`), live vehicle stats |
| 🧭 **Guide Management** | `AdminGuides` | Full CRUD, availability toggle, guide bookings/payment summaries |
| 📦 **Bookings Overview** | `AdminBookings` | Combined guide + vehicle bookings, filterable, individual & bulk status updates, cancellation |
| 🏛️ **Content Management** | `AdminDestinations`, `AdminEvents`, `AdminHiddenGems` | Destinations (CRUD, feature/active toggles), events (CRUD), hidden gems (approve/reject submissions, CRUD) |
| 👤 **User Management** | `AdminUsers` | Activate/deactivate (password-confirmed), role change, reset verification, bulk activate/deactivate |
| ⭐ **Reviews Moderation** | `AdminReviews` | Cross-entity (destination/gem/guide/vehicle) review deletion, bulk delete |
| 💰 **Revenue / Bookings Charts** | `AdminAnalytics`, `AdminDashboard` | Booking and revenue trends via `recharts` |
| ✉️ **Contact Messages Inbox** | `AdminContactPage` | See [above](#-contact-messages-feature) |
| 💬 **Live Chat** | `AdminLiveChatPage` | Real-time conversations with travelers over STOMP/SockJS (`/ws-chat`) |

---

## 🔌 API Endpoints Used

All endpoints below require the caller to hold the `ADMIN` role except where noted (traveler-scoped read endpoints reused by admin pages, e.g. `/api/v1/vehicles/local`, `/api/v1/destinations`, `/api/v1/guides`).

### Dashboard & Analytics
| Method | Path |
|---|---|
| GET | `/api/v1/admin/dashboard` |
| GET | `/api/v1/admin/dashboard/recent-activity` |
| GET | `/api/v1/admin/dashboard/top-lists` |
| GET | `/api/v1/admin/analytics` |

### Users
| Method | Path |
|---|---|
| GET | `/api/v1/admin/users` |
| GET | `/api/v1/admin/users/{id}` |
| PUT | `/api/v1/admin/users/{id}/activate` |
| PUT | `/api/v1/admin/users/{id}/deactivate` |
| PUT | `/api/v1/admin/users/{id}/role` |
| PUT | `/api/v1/admin/users/{id}/reset-verification` |
| POST | `/api/v1/admin/users/bulk-activate` |
| POST | `/api/v1/admin/users/bulk-deactivate` |

### Bookings
| Method | Path |
|---|---|
| GET | `/api/v1/admin/bookings` |
| GET | `/api/v1/vehicle-bookings/{id}` |
| GET | `/api/v1/guide-bookings/{id}` |
| PATCH | `/api/v1/vehicle-bookings/{id}/cancel` / `/api/v1/guide-bookings/{id}/cancel` |
| PATCH | `/api/v1/vehicle-bookings/{id}/status` / `/api/v1/guide-bookings/{id}/status` |
| POST | `/api/v1/admin/bookings/bulk-status` |

### Vehicles
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/vehicles/local` | Traveler-scoped read, reused by admin listing |
| GET | `/api/v1/admin/stats/vehicles` | |
| POST | `/api/v1/admin/vehicles` | Create |
| PUT | `/api/v1/admin/vehicles/{id}` | Update |
| PATCH | `/api/v1/admin/vehicles/{id}` | Availability toggle |
| DELETE | `/api/v1/admin/vehicles/{id}` | |

### Guides
| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/guides` / `/api/v1/guides/{id}` | Traveler-scoped read |
| GET | `/api/v1/guides/{guideId}/bookings` | |
| POST | `/api/v1/guides` | Create |
| PUT | `/api/v1/guides/{id}` | Update |
| PUT | `/api/v1/guides/{id}/availability` | Availability toggle |
| GET | `/api/v1/admin/guides/bookings` | |
| GET | `/api/v1/admin/guides/payments/summaries` | |
| GET | `/api/v1/admin/guides/{guideId}/payments` | |

### Destinations
| Method | Path |
|---|---|
| GET | `/api/v1/destinations`, `/featured`, `/search`, `/{id}` |
| POST | `/api/v1/destinations` |
| PUT | `/api/v1/destinations/{id}` |
| PUT | `/api/v1/destinations/{id}/featured` |
| PUT | `/api/v1/destinations/{id}/active` |
| DELETE | `/api/v1/destinations/{id}` |

### Hidden Gems
| Method | Path |
|---|---|
| GET | `/api/v1/gems`, `/pending`, `/{id}`, `/search` |
| POST | `/api/v1/gems`, `/submit` |
| PUT | `/api/v1/gems/{id}` |
| PUT | `/api/v1/gems/{id}/approve` |
| DELETE | `/api/v1/gems/{id}` |

### Events
| Method | Path |
|---|---|
| GET | `/api/v1/events`, `/upcoming`, `/trip-sync`, `/{id}` |
| POST | `/api/v1/events` |
| PUT | `/api/v1/events/{id}` |
| DELETE | `/api/v1/events/{id}` |

### Reviews
| Method | Path |
|---|---|
| GET | `/api/v1/admin/reviews` |
| DELETE | `/api/v1/admin/reviews/{entityType}/{id}` |
| POST | `/api/v1/admin/reviews/bulk-delete` |

### Contact Messages
See [Contact Messages Feature](#-contact-messages-feature).

### Live Chat
| Method | Path |
|---|---|
| GET | `/api/v1/chat/admin/conversations` |
| GET | `/api/v1/chat/admin/unread-count` |
| GET | `/api/v1/chat/admin/conversations/{id}/messages` |
| POST | `/api/v1/chat/admin/conversations/{id}/messages` |
| PATCH | `/api/v1/chat/admin/conversations/{id}/read` |
| WS | `/ws-chat?token=...` (SockJS/STOMP) |

### Auth & Profile
| Method | Path |
|---|---|
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/change-password` |
| GET | `/api/v1/users/me` |
| PUT | `/api/v1/users/me` |
| POST / DELETE | `/api/v1/users/me/photo` |
| POST | `/api/v1/users/me/deactivate` |

### Uploads
| Method | Path |
|---|---|
| POST | `/api/v1/upload/single?folder=...` |
| POST | `/api/v1/upload/multiple?folder=...` |
| DELETE | `/api/v1/upload?imageUrl=...` |

---

## 📄 License

Distributed under the **MIT License**.
