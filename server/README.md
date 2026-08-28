# UPS One Logistics Experience — Backend API

A production-ready Node.js / Express / MongoDB REST API powering the UPS One Logistics Experience platform. It handles authentication, shipment lifecycle (including cross-channel draft persistence), public tracking, ML-powered route recommendations, an LLM-ready AI chat layer, vehicle fleet management, and a full admin dashboard — all with JWT security and an immutable audit log.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Layer                                 │
│          React (Web)               React Native (Mobile)            │
└────────────────────────┬────────────────────────────────────────────┘
                         │  HTTPS / REST + Bearer JWT
┌────────────────────────▼────────────────────────────────────────────┐
│                   Express API (server.js)                           │
│  Helmet · CORS · Morgan · Rate Limiters · Swagger UI                │
│                                                                     │
│  /api/auth      /api/shipments    /api/tracking   /api/vehicles     │
│  /api/recommendation   /api/chat  /api/conversations  /api/admin    │
│                                                                     │
│  Middleware: authenticateUser → requireAdmin → validate → handler   │
└──────┬─────────────────┬─────────────────────────┬──────────────────┘
       │                 │                         │
┌──────▼──────┐  ┌───────▼────────┐     ┌─────────▼──────────┐
│  MongoDB    │  │  ML Service    │     │  LLM (future)      │
│  Mongoose   │  │  FastAPI/Py    │     │  provider-agnostic │
│             │  │  /recommend    │     │  + Function Calls  │
│  6 Collections│  │  (axios proxy) │     │  (chat scaffold)   │
└─────────────┘  └────────────────┘     └────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | >= 18 |
| Framework | Express | ^4.18 |
| Database | MongoDB + Mongoose | ^8.2 |
| Auth | JSON Web Tokens (jsonwebtoken) | ^9.0 |
| Password Hashing | bcryptjs | ^2.4 (12 rounds) |
| Validation | Joi | ^17.12 |
| HTTP Client | axios | ^1.6 (ML service proxy) |
| Security | helmet, cors, express-rate-limit | latest |
| API Docs | swagger-jsdoc + swagger-ui-express | latest |
| Logging | morgan | ^1.10 |
| Testing | Jest + Supertest + mongodb-memory-server | ^29 |
| Dev | nodemon | ^3.1 |

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** >= 6 (local instance or Atlas URI)
- (Optional) Python FastAPI ML service running on port 8000

---

## Installation

```bash
cd server
npm install
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | HTTP port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ups_logistics` |
| `JWT_SECRET` | HMAC secret (>= 64 chars) | `a-very-long-random-string...` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `ML_SERVICE_URL` | Base URL of the Python ML service | `http://localhost:8000` |
| `LLM_API_KEY` | Future: LLM provider API key | `sk-...` |
| `LLM_API_URL` | Future: LLM provider endpoint | `https://api.openai.com/v1` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,http://localhost:5173` |

---

## MongoDB Setup

**Local:**
```bash
mongod --dbpath /data/db
```

**Atlas:** Replace `MONGODB_URI` in `.env` with your Atlas connection string.

The application creates all collections and indexes automatically on first start.

---

## Running in Development

```bash
cd server
npm run dev
```

Starts the server with `nodemon` — auto-restarts on file changes.

---

## Running in Production

```bash
cd server
NODE_ENV=production npm start
```

> **Note:** Set a strong `JWT_SECRET` (>= 64 random characters) in your production environment.

---

## API Endpoints

| # | Method | Path | Auth | Description |
|---|--------|------|------|-------------|
| 1 | `POST` | `/api/auth/register` | Public | Register a new user |
| 2 | `POST` | `/api/auth/login` | Public | Login, receive JWT |
| 3 | `GET` | `/api/auth/me` | JWT | Get authenticated user profile |
| 4 | `POST` | `/api/shipments` | JWT | Create a confirmed shipment |
| 5 | `GET` | `/api/shipments` | JWT | List user's shipments (filter by status/active) |
| 6 | `GET` | `/api/shipments/:id` | JWT | Get a single shipment |
| 7 | `PUT` | `/api/shipments/:id` | JWT | Update shipment (or promote draft to booked) |
| 8 | `DELETE` | `/api/shipments/:id` | JWT | Cancel shipment / physically delete draft |
| 9 | `POST` | `/api/shipments/draft` | JWT | Save an incomplete shipment as a draft |
| 10 | `GET` | `/api/shipments/drafts` | JWT | Get all drafts for the authenticated user |
| 11 | `GET` | `/api/tracking/:trackingNumber` | **Public** | Track any shipment by tracking number |
| 12 | `GET` | `/api/vehicles/available` | JWT | Find available vehicles (filter by location and weight) |
| 13 | `POST` | `/api/recommendation` | JWT | Get ML-powered shipping mode recommendation |
| 14 | `POST` | `/api/chat` | JWT | Send a message to the AI assistant |
| 15 | `GET` | `/api/conversations` | JWT | List user's conversation summaries |
| 16 | `GET` | `/api/conversations/:id` | JWT | Get a full conversation with all messages |
| 17 | `GET` | `/api/admin/dashboard` | JWT + Admin | Aggregated platform metrics |
| 18 | `GET` | `/api/admin/audit-logs` | JWT + Admin | Paginated audit log viewer |
| 19 | `GET` | `/api/admin/vehicles` | JWT + Admin | List all vehicles (filter by status/type/location) |
| 20 | `POST` | `/api/admin/vehicles` | JWT + Admin | Create a vehicle |
| 21 | `PUT` | `/api/admin/vehicles/:id` | JWT + Admin | Update a vehicle |

---

## Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <token>
```

**JWT Payload:**
```json
{ "userId": "<ObjectId>", "role": "customer|admin" }
```

Tokens are issued on `/api/auth/register` and `/api/auth/login`. They expire after `JWT_EXPIRES_IN` (default 7 days).

The `userId` is **always** read from `req.user._id` (set by `authenticateUser` middleware) — never from the request body.

---

## Database Collections

| Collection | Model | Description |
|------------|-------|-------------|
| `users` | `User` | Platform accounts with bcrypt-hashed passwords; `passwordHash` excluded from all queries by default |
| `shipments` | `Shipment` | Shipment documents with embedded `events[]` timeline; `status: 'draft'` for incomplete entries |
| `package_details` | `PackageDetail` | Package dimensions and type, referenced by Shipment |
| `vehicles` | `Vehicle` | Fleet vehicles with type, location, capacity, and operational status |
| `conversations` | `Conversation` | Chat history with embedded `messages[]`; supports `user`, `assistant`, and `tool` roles |
| `auditlogs` | `AuditLog` | Immutable record of every platform action with userId, action type, resource, and metadata |

---

## Draft Shipments Flow

Drafts enable customers to start a shipment on one channel and complete it on another:

```
1. Customer on WEB → POST /api/shipments/draft
   Body: { from: 'Chennai', to: 'Delhi', channel: 'web' }
   → Shipment created with status: 'draft', lastChannel: 'web'
   → No trackingNumber assigned yet

2. Customer switches to MOBILE → GET /api/shipments/drafts
   → Same draft returned (userId-scoped query, channel-agnostic)

3. Customer completes the form on MOBILE → PUT /api/shipments/:id
   Body: { status: 'booked', package: {...}, deliveryOption: 'Express', ... }
   → Tracking number generated: UPS + 9-digit crypto random integer
   → status changes to 'booked'
   → First timeline event appended to events[]
   → lastChannel updated to 'mobile'

4. DELETE /api/shipments/:id on a draft     → physical deletion
   DELETE /api/shipments/:id on confirmed   → status: 'cancelled'
```

---

## ML Service Integration

The recommendation endpoint proxies to an external Python/FastAPI ML service:

**POST `/api/recommendation`** forwards to **`ML_SERVICE_URL/recommend`**

**Request body sent to ML service:**
```json
{
  "from": "Chennai",
  "to": "Mumbai",
  "weight": 5,
  "height": 15,
  "width": 20,
  "length": 30,
  "deliveryOption": "Express",
  "packageType": "parcel"
}
```

**Expected ML response:**
```json
{
  "recommendedMode": "Air",
  "options": [
    { "mode": "Road", "cost": 480, "time": 60 },
    { "mode": "Rail", "cost": 350, "time": 96 },
    { "mode": "Air",  "cost": 820, "time": 24 }
  ]
}
```

**Error handling:**
- `ECONNREFUSED` → 503 Service Unavailable
- `ETIMEDOUT` / `ECONNABORTED` → 504 Gateway Timeout
- ML 4xx/5xx → forwarded status + detail message

**To connect a Python FastAPI ML service:**
1. Set `ML_SERVICE_URL=http://localhost:8000` in `.env`
2. Ensure FastAPI exposes `POST /recommend` accepting the payload above
3. Start the ML service before the Node.js server

---

## Future LLM Integration

The `POST /api/chat` endpoint and `chatController.js` are scaffolded for full LLM + function-calling integration.

**LLM-callable service functions already built:**

| Function | Description |
|----------|-------------|
| `getShipmentStatus(trackingNumber)` | Public tracking lookup |
| `getUserShipments(userId, filters)` | User's shipment list |
| `getSavedDrafts(userId)` | User's draft list |
| `getAvailableVehicles(location, weight)` | Available fleet |
| `getShippingRecommendation(shipmentData)` | ML proxy |
| `createShipment(userId, shipmentData)` | Book a shipment |

**Integration plan:**
1. Add LLM SDK to dependencies (`openai`, `@google-ai/generativelanguage`, etc.)
2. Define tool schemas wrapping the service functions above
3. In `chatController.sendMessage`, replace the placeholder reply with:
   ```js
   const llmReply = await llmService.chat({
     messages: conversation.messages,
     tools: toolDefinitions,
     userId
   });
   ```
4. The LLM receives **only** the approved function interfaces — never direct DB access

---

## Future RAG Integration

A Retrieval-Augmented Generation layer can be added to answer:
- Shipping policy questions
- Route-specific FAQs
- Regulatory and customs information

**What RAG will handle:** Document-grounded questions with cited sources.
**What it will NOT handle:** Live shipment data (use function calling for that).

**Integration point:** `conversationService.addMessage` — inject retrieved context into the system prompt before calling the LLM.

---

## Running Tests

```bash
cd server
npm test
```

Tests use an in-memory MongoDB instance (no external DB needed). All suites run in band to avoid port conflicts. Rate limiters are disabled when `NODE_ENV=test`, since a suite legitimately performs hundreds of registrations in seconds.

**65 tests across 8 suites:**
- `tests/auth.test.js` — Registration, login, profile, token rejection
- `tests/shipment.test.js` — CRUD, ownership, drafts, draft→booked promotion
- `tests/tracking.test.js` — Public tracking, 404 handling
- `tests/vehicle.test.js` — Admin CRUD, availability filtering
- `tests/recommendation.test.js` — ML proxy with mocked axios (503/504 handling)
- `tests/audit.test.js` — Audit log creation, admin access control
- `tests/chat.test.js` — Chat flow, conversation ownership isolation
- `tests/admin.test.js` — Dashboard aggregation, role enforcement, injection hardening

**Cross-tenant isolation** is asserted explicitly: User A cannot read or mutate User B's shipments, drafts, or conversations (all return `403`), and every admin endpoint rejects a customer token.

---

## Running Seed Data

```bash
cd server
npm run seed
```

Seeds the database with demo users, vehicles, packages, and shipments.

**Demo credentials (password: `demo1234`):**

| Role | Email |
|------|-------|
| Admin | `admin@ups-demo.com` |
| Customer | `alice@ups-demo.com` |
| Customer | `bob@ups-demo.com` |
| Customer | `carol@ups-demo.com` |

> **Warning:** The seed script clears all existing data before inserting demo records.

---

## Swagger API Docs

Once the server is running, visit:

```
http://localhost:5000/api/docs
```

The Swagger UI provides interactive documentation for all 21 endpoints with request/response schemas, authentication setup, and example values.

---

## Security Notes

- **Passwords** are hashed with bcryptjs at **12 rounds**. The `passwordHash` field is excluded from all Mongoose queries by default (`select: false`) and stripped by `toJSON()`.
- **JWT** secrets must be >= 64 characters in production. Rotate periodically.
- **Rate limiting** protects credentials (`/api/auth/register` + `/api/auth/login`, 10 req / 15 min), recommendations (50 req / 15 min), and chat (30 req / min). `/api/auth/me` is deliberately outside the strict credential limiter because clients call it on every app load. Limiters are skipped when `NODE_ENV=test`.
- **NoSQL injection** — every query parameter that reaches a Mongo filter passes through `asQueryString` / `asQueryNumber` (`utils/validators.js`), which collapse objects and arrays to `undefined`. This defeats operator smuggling such as `?userId[$ne]=` or `?status[$ne]=draft`.
- **Regex injection / ReDoS** — free-text filters (vehicle `location`) are anchored and escaped via `escapeRegex`, so user input is always matched as a literal and can never widen the result set or trigger catastrophic backtracking.
- **Mass assignment** — Joi validates with `allowUnknown: false` and the sanitised result replaces `req.body`, so a client cannot smuggle extra fields (e.g. `userId`, `status`, `trackingNumber`) into a `Model.create()`.
- **Helmet** sets security headers (CSP, X-Frame-Options, HSTS, etc.).
- **CORS** is restricted to `ALLOWED_ORIGINS` — never open wildcard in production.
- **Admin routes** require both a valid JWT **and** `role === 'admin'` — two independent checks.
- **Body size** is limited to 10 KB to prevent payload flooding.
- **Audit logs** record every significant action — cannot be deleted via the API.
- **Tracking numbers** are generated with `crypto.randomInt` (CSPRNG) — never `Math.random()`.
