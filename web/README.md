# One Logistics Experience

A logistics platform in three parts: an Express/MongoDB API, a React web
client, and a React Native phone app. The organising idea is in the name —
a shipment begun on one device can be finished on another, because the work in
progress lives in the database rather than on a device.

```
React web (Vite)  ─┐
React Native (Expo)┴─►  Express API  ─┬─►  MongoDB (Mongoose)
                                      ├─►  Python ML service (FastAPI)
                                      ├─►  LLM            (future)
                                      └─►  RAG            (future)
```

Neither client ever contacts MongoDB, the ML service or an LLM provider
directly. Everything goes through Express.

---

## Repository layout

| Path | What it is |
|------|-----------|
| `server/` | Express + MongoDB API. 21 endpoints, JWT auth, role-based authorisation, audit logging, Swagger docs. |
| `src/` | React web client (Vite). Full customer app plus the admin console. |
| `mobile/` | React Native app (Expo). Customer essentials, built for the phone. |

Each part has its own `package.json` and its own `.env`.

---

## Running everything

You need Node 18+, npm 9+, and MongoDB running locally (or an Atlas URI).

**1. API — port 5000**

```bash
cd server && npm install && npm run seed && npm run dev
```

`npm run seed` loads demo users, vehicles and shipments. Sign in with any of
these, password `demo1234`:

| Role | Email |
|------|-------|
| Admin | `admin@ups-demo.com` |
| Customer | `alice@ups-demo.com` |
| Customer | `bob@ups-demo.com` |
| Customer | `carol@ups-demo.com` |

**2. Web — port 5173**

```bash
npm install && npm run dev
```

`VITE_API_URL` is empty by default, so `/api` is proxied to port 5000 by the
Vite dev server. Set it to point at a deployed API.

**3. Mobile**

```bash
cd mobile && npm install && npm start
```

Scan the QR code with Expo Go, or press `a` for an Android emulator. The app
derives your machine's LAN address from the Expo dev server, so it reaches the
API without configuration — `localhost` on a phone means the phone itself, which
is why this matters. Override with `EXPO_PUBLIC_API_URL` for a deployed backend.

---

## The two journeys

**Booking.** Sign in → dashboard → *Create shipment* → pickup → delivery →
package → service options (which calls the ML service for a recommendation) →
available vehicles → review → confirm. A tracking number is issued on
confirmation and the shipment gets its first timeline event.

**Cross-channel.** Start a booking on the web, hit *Save as draft*, and it is
written to MongoDB with `lastChannel: "web"`. Open the phone app and the same
draft is in the Drafts tab, labelled *Started on Web* with its completion
percentage. Confirm it there and `lastChannel` flips to `mobile`, because
every mobile request carries `X-Channel: mobile`.

---

## Web client

Vite + React + React Router, Axios, lucide-react. No CSS framework — a
token-based stylesheet system (`src/styles/tokens.css`) with component-level
CSS, which is the convention this repo already used.

```
src/
├── api/          axios instance + one module per resource
├── components/   UI primitives (ui/) and domain components
├── context/      AuthContext, ToastContext
├── hooks/        useAuth, useAsync, useToast, useMediaQuery, useChannel…
├── layouts/      CustomerLayout, AdminLayout, AuthLayout
├── pages/        auth/, customer/, admin/
├── routes/       route table + role guards
├── styles/       design tokens, base layer
└── utils/        formatting, shipment domain, validation
```

**Pages.** Login, Register, Dashboard, Create Shipment (6-step wizard),
Drafts, Tracking, Active Shipments, Shipment History, Shipment Detail, AI
Assistant, Profile — plus Admin Dashboard, Audit Logs and Vehicles.

**Responsive.** Not a shrunk desktop layout: below 768px the header nav is
replaced by a bottom tab bar, the history table becomes cards, and the
assistant becomes a full-screen conversation.

**Roles.** A customer who types `/admin` is redirected to their dashboard; an
admin is kept out of the customer app. Both guards are UX only — every admin
endpoint independently enforces `requireAdmin` server-side.

---

## Mobile client

Expo SDK 57 / React Native 0.86, expo-router file-based routing.

Four tabs — Home, Drafts, Track, Profile — plus sign-in. Deliberately narrower
than the web app: creating a shipment from scratch is a desk task, so the phone
focuses on checking on shipments and finishing what was already started.

```
mobile/
├── app/
│   ├── _layout.jsx      providers + signed-in gate
│   ├── login.jsx        sign in / create account
│   └── (tabs)/          index (home), drafts, track, profile
└── src/
    ├── api.js           the whole backend contract, one file
    ├── auth.jsx         session context
    ├── format.js        formatting + shipment helpers
    ├── theme.js         colours, spacing, radii
    └── ui.jsx           Button, Field, Card, StatusPill, states
```

A draft that is still missing details says which steps are outstanding and
points back to the web app, instead of offering a Confirm button that would
fail.

---

## Auth

The API issues a bearer JWT containing `{ userId, role }`. Both clients follow
that existing contract — web keeps the token in `localStorage`, mobile in
`AsyncStorage`. A 401 from any request clears the session once, centrally, and
redirects to sign-in.

`role` is never sent on registration; the backend assigns it.

---

## What the API does not support yet

These are surfaced honestly in the UI rather than faked:

| Gap | How the clients handle it |
|-----|---------------------------|
| No street/state/postal/contact on a shipment (`from`/`to` are city strings) | The wizard collects them for the review and says plainly that only the city is stored. The drop happens in one place, `src/api/shipmentApi.js`, which documents how to persist them. |
| No vehicle reference on a shipment | Selecting a vehicle is optional and labelled as not reserved. |
| `PackageDetail` requires all dimensions, so a partial package cannot be saved even though Joi allows one | Drafts omit the package until all five fields are filled; route, service and transport still save. |
| No profile-update route | Profile is read-only on both clients. |
| No Google OAuth, no password reset | The buttons exist, are disabled, and say why. No fake OAuth flow. |
| No notifications endpoint | The bell is built from real data — the latest timeline event on each active shipment. |
| LLM not connected | `POST /api/chat` persists the message and returns the backend's holding reply. The UI renders whatever the backend returns and invents nothing. |
| ML service unreachable | The recommendation step shows the backend's 503 and lets you pick a transport mode manually. No predictions are ever computed in the browser. |

---

## Verification

```bash
cd server && npm test        # 65 tests, 8 suites
npm run build                # web production build
npx oxlint src               # web lint
cd mobile && npx expo export --platform android
```

The API also has a live contract check covering the payloads the web wizard
sends and the web→mobile handover — see the notes in `server/README.md`.

---

## Security notes

- Only `VITE_API_URL` and `EXPO_PUBLIC_API_URL` are client-side config. Both
  are embedded in their bundles and readable by anyone; no secret belongs there.
- Neither client holds database credentials, the JWT secret, ML service
  credentials or LLM keys.
- Frontend route guards and form validation are UX layers. The Express API
  re-validates every field with Joi and re-checks ownership and role on every
  request — that is the boundary that counts.
