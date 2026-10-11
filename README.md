# Get Fed 🍽️

**Real-Time Surplus Food Coordination & Recovery Platform**

A mobile-first, role-based, location-aware web application that connects institutions holding time-sensitive surplus food with verified recipients who can collect it before the pickup window expires.

> Surplus food isn't wasted because nobody wants it. It's wasted because nobody coordinates in time. This platform is a **real-time allocation engine** — not a donation-posting website.

---

## Problem Statement

College events and canteens regularly end up with usable surplus food while potential recipients lack timely information. Food gets wasted because:

- surplus is discovered late;
- recipients are not immediately known;
- quantities and pickup deadlines are unclear;
- multiple organisations unknowingly claim the same food;
- cancellations, expiry and collection are never verified or measured.

**Food surplus is fundamentally a coordination, timing and allocation problem.**

## Solution

Get Fed manages the complete lifecycle:

```
SURPLUS IDENTIFIED → LISTING CREATED → VALIDATED → PUBLISHED → MATCHED
→ CLAIMED → RESERVED → PICKUP → QR VERIFIED → COLLECTED → IMPACT RECORDED
```

The core engine coordinates **time + location + quantity + matching + partial allocation + cancellation recovery + expiry + verified collection**.

---

## Architecture

A clean **modular monolith** (Next.js full-stack) — no microservices, no Kafka, no blockchain, no ML infrastructure. Correctness first.

```
┌────────────────────────────────────────────┐
│         Next.js 14 (App Router) UI          │
│   Mobile-first React + Tailwind CSS         │
└───────────────────┬────────────────────────┘
                    │ HTTPS
┌───────────────────▼────────────────────────┐
│      Next.js Route Handlers (Node.js)       │
│  Auth.js sessions · Zod validation · RBAC   │
└───┬───────────────┬───────────────┬────────┘
    │               │               │
┌───▼────┐   ┌──────▼──────┐  ┌─────▼─────────┐
│Postgres│   │  Services   │  │ Notifications │
│+Prisma │   │ listing ·   │  │ in-app (+FCM  │
│        │   │ claim ·     │  │   optional)   │
│ FOR    │   │ matching ·  │  └───────────────┘
│ UPDATE │   │ analytics   │
└───┬────┘   └─────────────┘
    │
┌───▼─────────────────────────┐
│  Vercel Cron (every minute) │
│  Expiry · Pickup reminders  │
└─────────────────────────────┘
```

### Layered separation (UI → API → Service → Transaction → DB)

| Layer | Location | Responsibility |
|---|---|---|
| UI | `app/**/page.tsx`, `components/` | Mobile-first screens, loading/error states |
| API | `app/api/**/route.ts` | Auth, RBAC, rate limiting, response shape |
| Validation | `lib/validators.ts` | Shared Zod schemas (frontend + backend) |
| Services | `services/` | Business logic, transactions, state machines |
| Engine libs | `lib/` | Matching, distance, expiry, notifications, audit |

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, React Hook Form, Zod, Lucide React, Recharts |
| Backend | Next.js Route Handlers (Node.js runtime) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (NextAuth v4) + bcrypt |
| Maps | Leaflet + OpenStreetMap + Browser Geolocation API |
| QR | `qrcode` (generation), `html5-qrcode` (scanning) |
| Notifications | In-app (MVP), Firebase Cloud Messaging (optional) |
| Scheduled jobs | Vercel Cron |
| Charts | Recharts |
| Deployment | Vercel + Neon/Supabase PostgreSQL |

---

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install **or** Docker)

### 1. Clone & install

```bash
npm install          # also runs `prisma generate` via postinstall
```

### 2. Start PostgreSQL (Docker one-liner)

```bash
docker run -d --name fws-postgres \
  -e POSTGRES_USER=fws \
  -e POSTGRES_PASSWORD=fws_dev_password \
  -e POSTGRES_DB=getfed \
  -p 5432:5432 postgres:16-alpine
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit DATABASE_URL if your port/user differs; set a strong AUTH_SECRET:
#   openssl rand -base64 32
```

### 4. Migrate & seed

```bash
npm run db:migrate   # prisma migrate dev (creates schema + generates client)
npm run db:seed      # demo accounts + listings + analytics history
```

### 5. Run

```bash
npm run dev          # http://localhost:3000
```

### Local cron (optional)

The expiry worker runs automatically on Vercel. Locally you can poll it:

```bash
while true; do curl -s http://localhost:3000/api/cron/expiry -H "Authorization: Bearer $CRON_SECRET"; sleep 60; done
```

Discovery also lazily filters by deadline, so expiry is enforced even without the worker.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Auth.js JWT/session signing (also signs QR payloads) |
| `NEXTAUTH_URL` | ✅ | App base URL |
| `CRON_SECRET` | recommended | Bearer token protecting `/api/cron/expiry` |
| `FCM_PROJECT_ID` | optional | Enables FCM push delivery |
| `FCM_SERVICE_ACCOUNT_JSON` | optional | Service account JSON for FCM |

Never commit `.env`. All secrets stay server-side.

## Database Commands

```bash
npm run db:migrate    # create/apply dev migration
npm run db:deploy     # apply migrations in production/CI
npm run db:seed       # seed development/demo data
npm run db:studio     # Prisma Studio GUI
npx prisma generate   # regenerate client after schema edits
```

## Development & Testing

```bash
npm run dev             # dev server
npm run build           # prisma generate + production build
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm test                # unit + integration suites
npm run test:unit       # state machines, matching, QR, validation
npm run test:integration# 10 PRD edge cases + demo scenario (needs DB)
npm run verify:demo     # live HTTP end-to-end check (needs running server)
```

The integration suite covers **all 10 critical PRD edge cases**: concurrent claims, oversized claims, expired listings, cancellation before/after deadline, QR double-scan, wrong token, unauthorized scanner, unverified recipients, self-claims, unauthorized edits, provider cancellation cascade — plus the full §54 demo scenario.

---

## User Roles

| Role | Capabilities |
|---|---|
| **PROVIDER** | Create/edit/cancel listings, monitor available quantity, view claims, scan recipient QR, no-show handling, analytics |
| **RECIPIENT** | Discover nearby food (map + filters), claim partial quantities, cancel claims, show QR, track pickups, collection history, preferences |
| **ADMIN** | Verify/suspend users, manage listings & claims, monitor no-shows, platform analytics, audit trail & CSV export |
| **SYSTEM** | Matching, expiry, reminders, notifications, analytics, state transitions |

## Demo Accounts (seeded — password for all: `Password123!`)

| Role | Email | Notes |
|---|---|---|
| ADMIN | `admin@getfed.dev` | Verify recipients from `/admin/recipients` |
| PROVIDER | `events@college.edu` | Has the 60-meal Biryani listing |
| PROVIDER | `canteen@college.edu` | Sandwich platters (partially reserved) |
| PROVIDER | `mess@hostel.edu` | Bakery surplus |
| RECIPIENT | `hope@kitchen.org` | **Verified** — primary demo claimer |
| RECIPIENT | `contact@greenplate.org` | **Verified** |
| RECIPIENT | `hello@annashelter.org` | **Verified** |
| RECIPIENT | `new@ngo.org` | **PENDING** — for the admin verification demo |

## Hackathon Demo Flow (~3 minutes, PRD §109)

1. **Problem** — “An event just ended; 60 meals must go within 90 minutes.”
2. **Provider** (`events@college.edu`) → *New Listing* → Vegetable Biryani, 60 portions, deadline +90 min → Publish.
3. **Recipient** (`hope@kitchen.org`, second device/browser) → *Discover Food* → sees the listing with live countdown and distance.
4. **Claim 40** → provider dashboard instantly shows **40 reserved / 20 available**, status `PARTIALLY_RESERVED`.
5. **QR** — recipient opens *My QR*; provider opens *Scanner* and scans → **server verifies token** → `COLLECTED`.
6. **Dashboard** — “40 meals recovered” on provider & admin impact analytics.
7. Optional: cancel a claim before deadline → watch quantity restore live.

---

## API Overview

All responses use `{ success, data }` / `{ success: false, code, message }` with standardized error codes (`LISTING_EXPIRED`, `INSUFFICIENT_QUANTITY`, `RECIPIENT_NOT_VERIFIED`, `INVALID_TOKEN`, `ALREADY_COLLECTED`, `INVALID_STATE`, `VALIDATION_ERROR`, …).

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register provider/recipient |
| POST | `/api/auth/login` (NextAuth credentials) | Sign in |
| POST | `/api/auth/logout` | Sign out |

### Listings
| Method | Path | Description |
|---|---|---|
| POST | `/api/listings` | Create listing (validated, triggers matching) |
| GET | `/api/listings` | Discovery with filters (distance, quantity, category, deadline window, pagination) |
| GET | `/api/listings/:id` | Listing detail |
| PATCH | `/api/listings/:id` | Provider edit (owner-only) |
| POST | `/api/listings/:id/cancel` | Provider cancellation cascade |
| GET | `/api/listings/:id/matches` | Ranked recipient matches |

### Claims
| Method | Path | Description |
|---|---|---|
| POST | `/api/listings/:id/claims` | **Transaction-safe partial claim** |
| GET | `/api/claims/me` | My claims (+status filter) |
| POST | `/api/claims/:id/cancel` | Cancel (restores only before deadline) |
| POST | `/api/claims/:id/pickup` | Recipient “on the way” |
| POST | `/api/claims/:id/confirm` | QR collection confirm (URL-id bound) |
| POST | `/api/claims/scan/verify` | Scanner endpoint (signed QR envelope) |
| GET | `/api/claims/:id/qr` | Signed QR payload for recipient |
| POST | `/api/claims/:id/noshow` | Provider no-show handling |

### Dashboards & admin
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/provider` / `recipient` / `admin` | Role dashboards |
| GET | `/api/provider/listings` · `/api/provider/claims` · `/api/provider/analytics` | Provider workspace |
| GET | `/api/admin/users` · `/listings` · `/claims` · `/analytics` | Admin console |
| POST | `/api/admin/users/:id/verify` | Verification status changes |
| GET/PATCH | `/api/notifications` | In-app notifications |
| GET | `/api/cron/expiry` | Expiry + reminder worker (cron-secret protected) |

---

## Important Business Rules

1. **Transaction-safe allocation** — claims run inside a PostgreSQL transaction with `SELECT … FOR UPDATE` row locking plus a guarded conditional `UPDATE`. Concurrent claims can never overbook; quantity can never go negative.
2. **Partial claims** — 60 meals can serve several recipients; the listing stays `PARTIALLY_RESERVED` until availability hits zero.
3. **Centralized state machines** — listing (`DRAFT→AVAILABLE→PARTIALLY_RESERVED→FULLY_RESERVED→PICKUP_IN_PROGRESS→COLLECTED`, plus `EXPIRED`/`CANCELLED`) and claim (`REQUESTED→RESERVED→PICKUP_IN_PROGRESS→COLLECTED`, plus `CANCELLED`/`NO_SHOW`/`EXPIRED`). Invalid transitions are impossible.
4. **Only VERIFIED recipients claim** — enforced at the API layer *and* re-checked inside the claim transaction.
5. **Expired listings vanish** — the cron worker marks `EXPIRED`, zeroes availability and closes outstanding claims; discovery filters by deadline as a second guard.
6. **Cancellation recovery** — before deadline: quantity restored and re-notified; after deadline: nothing restored (PRD §24).
7. **Secure QR** — 256-bit random claim token + HMAC-signed envelope; verified server-side with constant-time comparison. Double scans → `ALREADY_COLLECTED`; tampered codes → `INVALID_TOKEN`; non-owner scans → `FORBIDDEN`.
8. **Privacy** — recipients see organisation names only; phones/emails never exposed across roles.
9. **Auditability** — listing/claim/collection/expiry/verification events land in `AuditLog` with actor + JSON metadata.
10. **North-star metric** — successfully *collected* surplus quantity, not listing count.

## Security Summary

- bcrypt password hashing (cost 12), never plaintext
- Auth.js JWT sessions; identity always derived server-side (never from request bodies)
- Role checks in middleware **and** every protected route handler
- Zod validation on both client and server (backend authoritative)
- Rate limiting on auth, listing creation, claiming and QR scanning
- Error sanitization — raw database errors never reach clients
- QR tokens cryptographically bound to claims; server-side verification only

---

## Deployment (Vercel + Neon/Supabase)

1. **Database** — create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) and copy the connection string.
2. **Push & import** — push the repo to GitHub and import it into Vercel.
3. **Environment variables** (Vercel → Settings → Environment Variables):
   - `DATABASE_URL` (Neon/Supabase pooled connection string)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` (`https://your-app.vercel.app`)
   - `CRON_SECRET` (random string)
4. **Migrate** — from your machine with the production `DATABASE_URL`:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
   Optionally seed demo data the same way (`npm run db:seed` with the prod URL — remove afterwards or keep for the demo).
5. **Cron** — `vercel.json` already registers `/api/cron/expiry` every minute; Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`.
6. Deploy 🚀 — subsequent pushes auto-deploy.

---

## Project Structure

```
get-fed/
├── app/
│   ├── api/                  # Route Handlers (auth, listings, claims, dashboards, admin, cron)
│   ├── provider/             # dashboard, listings, claims, scanner, analytics
│   ├── recipient/            # dashboard, food discovery, claims, qr, profile
│   ├── admin/                # overview, users, providers, recipients, listings, claims, analytics, reports
│   ├── login/ · register/    # public auth pages
│   └── about/ · how-it-works/
├── components/               # FoodCard, ClaimModal, MapView, QRGenerator, QRScanner, MetricCard, StatusBadge, CountdownTimer, NotificationBell, AppShell, Toast
├── services/                 # listing, claim (transactional core), matching, analytics, dashboard, discovery, qr
├── lib/                      # auth, prisma, api (errors/rate limit), validators, state-machine, distance, matching, expiry, notifications, audit
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/                    # unit + integration (10 PRD edge cases)
├── scripts/verify-demo.mjs   # live HTTP end-to-end verification
└── vercel.json               # cron schedule
```

---

Built for hackathon judging — every screen connects to real logic, every workflow to the database, every critical rule to server-side enforcement.

---

## Live Pickup Tracking (Zomato-style journeys)

Recipients can share their live location during an active pickup; the authorised provider follows the journey on a map with road-route ETA, and both sides get arrival / delay / stale-location alerts. Collection still requires the existing QR verification — arrival alone never completes a claim.

### How it works
1. Recipient opens **My Claims → Live track** and explicitly presses **Start sharing** (consent-first; permission-denied still allows navigation + QR).
2. `watchPosition` fixes are throttled to ~5 s and POSTed to `POST /api/claims/:id/tracking/location` (validated: ranges, accuracy, clock-skew, rate limits, payload size).
3. Server persists **only the latest fix** (no GPS history) and calls an OSRM-compatible routing service (`ROUTING_PROVIDER_URL`) for road distance/duration/geometry — failures degrade to an explicit "routing unavailable" state, never fake road numbers.
4. Arrival = 2 consecutive fixes within 100 m with ≤ 50 m accuracy (hysteresis prevents GPS-drift flapping); provider + recipient get one deduplicated alert.
5. Delay alert fires once when ETA + 10-min buffer exceeds the pickup deadline; a 30 s silent gap marks the location stale for both dashboards.
6. Tracking auto-stops on cancellation, expiry, no-show or QR-verified collection — live coordinates are cleared immediately (retention policy). The cron job also reaps silent sessions.

### Endpoints
`POST /api/claims/:id/tracking/start` · `POST .../tracking/location` · `GET .../tracking` (recipient or listing provider only) · `POST .../tracking/stop`

### Configuration (see `.env.example`)
`ROUTING_PROVIDER_URL`, `TRACKING_ARRIVAL_RADIUS_M`, `TRACKING_MAX_ACCURACY_M`, `TRACKING_STALE_SECONDS`, `TRACKING_PICKUP_BUFFER_MIN`, `TRACKING_AUTO_STOP_STALE_MIN`

### Privacy
Only the claim's recipient and the listing's provider can ever read a position, only while the claim is eligible and sharing is active. Coordinates never appear in URLs or logs, and are deleted when sharing stops.
