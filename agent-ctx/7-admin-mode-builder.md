# Task 7 — Admin Mode Builder

**Agent:** admin-mode-builder
**Task ID:** 7
**Task:** Build the Admin mode of the hotel mobile app (APIs + UI). Admin persona is a staff member with role ADMIN or MASTER_ADMIN. 4-tab bottom nav (Dashboard / Setup / Guests / Reports) + 3 supporting sheets (Code Generation, Audit Log, Staff Detail/Add). Recharts-based occupancy chart on Reports tab.

## Context
Previous agents completed:
- **Task 1 (main):** Prisma schema foundation (Staff, AccessCode, GuestSession, Stay, PhysicalRoom, RoomType, GuestRequest, Charge, Payment, AppNotification, AuditLog, Hotel) + auth lib + session lib + app-shell + seed.
- **Task 5 (guest-mode-builder):** Guest mode — 11 APIs + 13 UI files. Bilingual i18n + RTL + emerald/gold/cream palette. Polling intervals per tab.
- **Task 6 (reception-mode-builder):** Reception mode — 21 APIs + 11 UI files. Same i18n + RTL + palette conventions. Left a stub at `src/components/app/admin/admin-app.tsx` for app-shell imports to resolve (which I overwrote).

Conventions I followed:
- `requireSession(req, "ADMIN")` returns SessionContext (with `staffId` + `role`) or SessionError (401/403)
- `generateAccessCode(type)` returns `{ raw }`, `hashAccessCode(raw)` returns SHA-256 hex
- Bilingual: every UI string through `t(key, locale)` using `useUIStore.locale` (default "ar")
- RTL via `dir={isRTL ? "rtl" : "ltr"}` on all containers, lucide directional icons rotated `rtl:rotate-180`
- Color tokens: emerald (primary), gold/amber (accent), cream (background). No indigo/blue.
- shadcn/ui for Sheet, Tabs, Select, Button, Input components
- Polling: dashboard 30s, lists 60s, audit only when sheet open (via `enabled` flag)
- All write paths in `db.$transaction` with AuditLog

## Work Log

### APIs (under `/home/z/my-project/src/app/api/app/admin/`)

Created **11 route files** (10 listed in task spec + 1 helper `stays/route.ts` for the CodeSheet's GUEST dropdown):

1. **`dashboard/route.ts`** — `GET` Admin dashboard:
   - `occupancyRate` = occupiedRooms/totalRooms × 100 (rounded to 2 decimal places)
   - `inHouseGuests` = count of CHECKED_IN stays
   - `totalRooms` = count of PhysicalRoom
   - `revenueThisMonth` = sum of Payment.amount where status=SUCCEEDED and completedAt in current month
   - `totalBookingsThisMonth` = count of reservations with createdAt in current month
   - `recentBookings` (last 5): reservation + guest.fullName + first item's roomType name (Ar + En) + grandTotal + status + paymentStatus + createdAt
   - `activeCodesCount`: `{ guest, reception, admin }` counts of ACTIVE codes per type
   - `alerts`: array of `{ type, message, count }` — out-of-order rooms (status OUT_OF_ORDER or OUT_OF_SERVICE), stale pending requests (created > 30 min ago, status in [NEW/ACKNOWLEDGED/ASSIGNED/IN_PROGRESS/WAITING])

2. **`codes/route.ts`** — `GET` + `POST`:
   - `GET`: List access codes, supports `?status=ACTIVE|EXPIRED|REVOKED|ALL` (default ACTIVE) and `?type=GUEST|RECEPTION|ADMIN` filters. Ordered by createdAt desc, take 200. Includes staff fullName (if staffId) and stay stayNumber + guest fullName (if stayId).
   - `POST`: Generate a new access code. Body `{ codeType: GUEST|RECEPTION|ADMIN, staffId?, stayId?, validHours? }`. Rules:
     - GUEST: requires stayId (must be CHECKED_IN stay); validUntil = end-of-checkout-day (23:59:59 local) OR now + validHours if provided
     - RECEPTION: requires staffId (staff with role RECEPTION, isActive); validUntil = now + (validHours || 8)h
     - ADMIN: requires staffId (staff with role ADMIN or MASTER_ADMIN, isActive); validUntil = now + (validHours || 24)h
     - Uses `generateAccessCode` + `hashAccessCode`. Creates AccessCode record inside `db.$transaction`. Writes AuditLog (action=CODE_GENERATED). Returns `{ rawCode, codeId, codeType, validUntil, targetType, targetName }`.

3. **`codes/[id]/revoke/route.ts`** — `POST` Revoke access code. Updates status=REVOKED, revokedAt=now, revokedBy=admin fullName. Revokes active GuestSessions using this code (via `updateMany`). Audit log (action=CODE_REVOKED). Returns `{ ok }`.

4. **`staff/route.ts`** — `GET` + `POST`:
   - `GET`: List all staff with their active code count (via `accessCodes: { where: { status: "ACTIVE" } }`), active session count (via `groupBy` aggregate on GuestSession where revokedAt is null and expiresAt > now), and last session (most recent non-revoked session). Ordered by createdAt desc.
   - `POST`: Create new staff. Body `{ fullName, phone, email?, role: RECEPTION|ADMIN }`. Validates phone uniqueness. Only MASTER_ADMIN can create ADMIN role (defense in depth — checked via ctx.role). Audit log (action=STAFF_CREATED).

5. **`staff/[id]/route.ts`** — `GET` + `POST`:
   - `GET`: Staff detail with recent codes (last 10, includes stay.stayNumber + stay.guest.fullName) + recent sessions (last 10).
   - `POST`: Update staff. Body `{ isActive?, role? }`. Validates role enum. Only MASTER_ADMIN can assign ADMIN/MASTER_ADMIN roles. Cannot change own role (defense against self-lockout). Audit log (action=STAFF_UPDATED) with before/after diff.

6. **`audit/route.ts`** — `GET` Audit log list (last 100). Supports `?action=...&entityType=...` filters. Ordered by createdAt desc. Parses JSON details (falls back to raw string on parse failure).

7. **`reports/route.ts`** — `GET` Reports data. Supports `?from=YYYY-MM-DD&to=YYYY-MM-DD` (default last 30 days). Returns:
   - `occupancy`: `[{ date, occupancyRate }]` for each day in range. Computed by scanning all stays with status in [CHECKED_IN, CHECKED_OUT, CLOSED] overlapping the range, then for each day counting distinct rooms occupied (checkIn < dayEnd AND checkOut > dayStart).
   - `revenue`: `{ totalRevenue, roomRevenue (category=ROOM), serviceRevenue (category=SERVICE + ROOM_SERVICE + LAUNDRY + EXTRA_BED), paymentsCollected (SUCCEEDED payments completed in range) }`
   - `requests`: `{ total, byStatus (object), avgResponseMinutes (first ACKNOWLEDGED event - createdAt, averaged over acknowledged requests), avgCompletionMinutes (completedAt - createdAt, averaged over completed requests) }`. The first-ack lookup is a single `guestRequestEvent.findMany` query with `requestId IN (...)` and `eventType=ACKNOWLEDGED`, ordered asc.
   - `reservations`: `{ total, confirmed, cancelled, noShow }` based on reservations with createdAt in range

8. **`hotel/route.ts`** — `GET` + `POST`:
   - `GET`: Current hotel settings (all editable fields + id).
   - `POST`: Update hotel settings. Body fields (all optional): `nameAr, nameEn, phone, whatsapp, email, addressAr, addressEn, checkInTime, checkOutTime, taxRatePercent (0-100), serviceChargePercent (0-100), minStayNights (1-365), maxStayNights (1-365), bookingHorizonDays (1-730), maxAdultsPerRoom (1-20)`. Validates all ranges. Audit log (action=HOTEL_SETTINGS_UPDATED) with before/after diff (full hotel object + changed fields).

9. **`reservations/route.ts`** — `GET` All reservations (last 100). Supports `?status=...` filter. Includes guest.fullName, guest.phone, guest.email, first item's roomType name (Ar/En) + slug, payment status, payment method, currency, source, createdAt. Ordered by createdAt desc.

10. **`guests/route.ts`** — `GET` All guests (last 100) with reservation count + stay count via Prisma `_count` on `reservations` and `stays` relations. Ordered by createdAt desc.

11. **`stays/route.ts`** — `GET` (helper) In-house stays (default `?status=CHECKED_IN`) with guest name, phone, room number, roomType name. Used by the CodeSheet's GUEST dropdown.

### UI (under `/home/z/my-project/src/components/app/admin/`)

Created **10 UI files** (admin-app + i18n + use-fetch + 4 tabs + 3 sheets):

1. **`i18n.ts`** — Bilingual AR/EN strings, ~120 keys (app, tabs, KPIs, setup fields, sub-tabs, staff sheet, code sheet, reports, audit, toasts, errors). `t(key, locale)` helper.

2. **`use-fetch.ts`** — `useFetch<T>(url | null, { intervalMs?, enabled? })` hook with optional polling (intervalMs triggers a tick that re-runs the fetch effect). `apiPost(url, body?)` helper returns `{ ok, data?, error?, status? }`. URL can be `null` to disable fetching (used by audit-sheet which only fetches when open).

3. **`admin-app.tsx`** (OVERWROTE the stub) — Main component:
   - Top bar: emerald-900 gradient, gold avatar circle with ShieldCheck icon, persona label (Admin + role), staff fullName, logout/close buttons (LogOut icon rotated `rtl:rotate-180`)
   - 4-tab bottom nav (LayoutDashboard / Settings / Users / BarChart3), 64px height, gold active color (`text-amber-600` + scale-110 on icon), inactive `text-slate-400`
   - Sheet state managed via local useState: CodeSheet (from Dashboard [Generate Code] button), AuditSheet (from Reports [Audit Log] button). StaffSheet is internal to tab-guests.
   - Props: `{ onLogout, onClose }` — passed from app-shell.

4. **`tab-dashboard.tsx`** — Dashboard tab:
   - Sticky header strip with app title + welcome + refresh button (spins while loading)
   - 4 KPI cards in 2x2 grid (Occupancy % with sub "occupied/total", In-House, Total Rooms, Revenue Month) — each with accent color (emerald/amber/teal/rose)
   - Active Codes summary card with [Generate Code] button (Plus icon, amber-500). Below: 3 columns showing per-type counts (GUEST emerald, RECEPTION amber, ADMIN rose) with large tabular-nums.
   - Recent Bookings list (top 5): guest name, booking reference, room type name (locale-aware), StatusBadge for status + paymentStatus, Money grand total, DateStr createdAt
   - Alerts card: list of alerts (AlertCircle icon), each with message + type + count badge (rose)

5. **`tab-setup.tsx`** — Setup tab:
   - Sticky header with Settings icon
   - 3 form cards (FormCard component with Building2 icon header):
     - Identity card: nameAr, nameEn, phone, whatsapp, email, addressAr, addressEn (all text inputs with proper dir attr)
     - Times & Rates: checkInTime, checkOutTime, taxRatePercent, serviceChargePercent (2-col grid, type="number" for rates)
     - Stay Limits: minStayNights, maxStayNights, bookingHorizonDays, maxAdultsPerRoom (2-col grid, all type="number")
   - Save button (amber-500, h-12, full width, with Save icon, shows spinner while saving)
   - Form error toast (red-50 card with AlertCircle) on validation failures
   - Room Types section (read-only, fetched from /api/rooms): list with name (locale-aware), inventory + adults count, basePrice (Money), active status badge
   - Form is hydrated from /api/app/admin/hotel GET; saving POSTs to same endpoint with numeric conversions

6. **`tab-guests.tsx`** — Guests tab with 3 sub-tabs (shadcn Tabs):
   - **Reservations pane**: status filter dropdown (Select with all statuses), list of reservation cards (guest name, booking reference + room type, StatusBadge for status + paymentStatus, Money grandTotal, DateStr createdAt). Polls 60s.
   - **Guests pane**: list of guest cards (full name, phone with Phone icon, optional email with Mail icon, reservation count badge (emerald), stay count badge (amber)). Polls 60s.
   - **Staff pane**: header with count + [Add Staff] button (amber-500), list of staff cards (avatar with initial letter, full name + active indicator, phone, role badge (color-coded: MASTER_ADMIN rose, ADMIN amber, RECEPTION emerald) with ShieldCheck icon, active code count badge (slate)). Tap row opens StaffSheet in edit mode. Polls 60s.

7. **`tab-reports.tsx`** — Reports tab:
   - Sticky header with BarChart3 icon, title, refresh button + [Audit Log] button (slate-100 chip with FileClock icon)
   - Range selector: 3 buttons (7/30/90 days) with Calendar icon, amber-500 active
   - Occupancy chart card (recharts): BarChart with CartesianGrid, XAxis (date formatted M/D), YAxis (0-100% with % formatter), Tooltip (locale-aware label formatter), Bar with per-cell color (Cell component, color tier: ≥80 emerald, ≥50 amber, ≥20 orange, <20 rose). Chart height h-56. Data compressed to ~14 points if range has more days (sampling).
   - Revenue summary card (2x2 grid of Metric components): totalRevenue (emerald), roomRevenue (amber), serviceRevenue (teal), paymentsCollected (rose) — all Money-formatted
   - Requests summary card (2x2 grid + by-status chip cloud): total, avgResponse (minutes or — if 0), avgCompletion (minutes or —), by-status chip cloud (e.g. "NEW: 5", "COMPLETED: 12")
   - Reservations summary card (4-col grid): total, confirmed, cancelled, noShow
   - URL computed via useMemo from range (default last 30 days). Polls 60s.

8. **`code-sheet.tsx`** — Bottom sheet (h-88dvh) for code generation:
   - Form view:
     - Code type radio (3 buttons: GUEST emerald, RECEPTION amber, ADMIN rose — with description text). Active state has 2px colored border + bg.
     - Conditional dropdown (Select):
       - GUEST: in-house stays from `/api/app/admin/stays?status=CHECKED_IN` (shows stayNumber + guestName + roomNumber)
       - RECEPTION: active reception staff (role RECEPTION, isActive) from `/api/app/admin/staff`
       - ADMIN: active admin/master staff (role ADMIN or MASTER_ADMIN, isActive)
     - If no items, shows amber notice (e.g. "No in-house stays")
     - Validity hours input (type="number", min 1 max 720) with hint about defaults (end-of-stay for GUEST, 8h for RECEPTION, 24h for ADMIN)
     - Footer: Generate button (amber-500, h-12, full width, with KeyRound icon + arrow icon, disabled if canSubmit is false, shows spinner while submitting)
   - Success view:
     - Large emerald check (CheckCircle2 in emerald-100 circle)
     - "Code Generated" title + target type/name
     - Raw code in dashed amber card (font-mono, text-3xl, tracking-wider, dir="ltr")
     - Valid-until date (locale-aware)
     - "Shown only once" hint
     - Copy button (variant=outline, calls navigator.clipboard?.writeText, toast on success)
     - Send WhatsApp button (emerald-600): resolves phone from selected stay/staff, opens wa.me with bilingual body
     - Done button (amber-500) closes sheet
   - Error messages per error code (errMap)
   - Resets form when sheet opens; clears stayId/staffId when code type changes

9. **`audit-sheet.tsx`** — Full-screen bottom sheet (h-92dvh) for audit log:
   - Header: FileClock icon + title + entry count + Refresh button
   - List of audit log entries (max 100), each in white card:
     - Colored action chip (per ACTION_COLORS map: CODE_GENERATED emerald, CODE_REVOKED rose, STAFF_CREATED amber, STAFF_UPDATED blue, HOTEL_SETTINGS_UPDATED purple, CHECK_IN emerald, CHECK_OUT slate, PAYMENT_RECORDED teal)
     - Entity type + entity ID (last 6 chars, mono font)
     - Performed by
     - Formatted date (locale-aware, year + month + day + hour + minute)
     - Details JSON preview (truncated to 200 chars with …, dir="ltr", mono font)
   - Empty state if no logs
   - Polls when open (url is `null` when closed, so `enabled` flag is false)

10. **`staff-sheet.tsx`** — Bottom sheet (h-88dvh) for creating OR editing staff:
    - Create mode (staffId null): fullName, phone, email (optional), role (Select: RECEPTION/ADMIN). Footer: "Add New Staff" button (amber-500, h-12, disabled if no fullName/phone).
    - Edit mode (staffId set):
      - Staff summary card (slate-50 background) with fullName, phone, email, role (label: MASTER_ADMIN → roleMaster, ADMIN → roleAdmin, RECEPTION → roleReception), active status
      - 2 metric tiles (active codes / active sessions) — placeholder "—" since the detail API doesn't return counts (could be added in a future iteration)
      - Role Select (RECEPTION/ADMIN)
      - Active toggle button: green if currently active (label "Deactivate", red), red if inactive (label "Activate", green)
      - Recent codes list (read-only): code type + stay number + date + status chip
    - Form errors per error code (errMap)
    - Toasts: STAFF_CREATED / STAFF_UPDATED

## Verification

- **Lint:** `bun run lint` → exit 0 (0 errors)
- **TypeScript:** `bunx tsc --noEmit` → 0 errors in admin files. (24 pre-existing errors remain in audit/, examples/, skills/, src/lib/i18n.ts, src/app/api/availability/calendar/route.ts — all unrelated, ignored per task spec)
- **API smoke tests:** All 11 endpoints return 401 for unauthenticated requests — confirming routes are wired up and the `requireSession(req, "ADMIN")` auth gate works. Test output:
  ```
  Dashboard: 401
  Codes: 401
  Staff: 401
  Audit: 401
  Reports: 401
  Hotel: 401
  Reservations: 401
  Guests: 401
  Stays: 401
  POST Revoke: 401
  POST Hotel: 401
  POST Staff: 401
  POST Codes: 401
  GET Staff detail: 401
  POST Staff detail: 401
  ```
- **Dev log:** Clean compilation after all admin files written: `✓ Compiled in 11.1s`. All admin API requests compile on first hit (~1000ms cold compile, then ~30-100ms cached).

## Files Created (Total: 21)

### APIs (11):
- `src/app/api/app/admin/dashboard/route.ts`
- `src/app/api/app/admin/codes/route.ts`
- `src/app/api/app/admin/codes/[id]/revoke/route.ts`
- `src/app/api/app/admin/staff/route.ts`
- `src/app/api/app/admin/staff/[id]/route.ts`
- `src/app/api/app/admin/audit/route.ts`
- `src/app/api/app/admin/reports/route.ts`
- `src/app/api/app/admin/hotel/route.ts`
- `src/app/api/app/admin/reservations/route.ts`
- `src/app/api/app/admin/guests/route.ts`
- `src/app/api/app/admin/stays/route.ts` (helper for code-sheet GUEST dropdown)

### UI (10):
- `src/components/app/admin/admin-app.tsx` (OVERWROTE stub)
- `src/components/app/admin/i18n.ts`
- `src/components/app/admin/use-fetch.ts`
- `src/components/app/admin/tab-dashboard.tsx`
- `src/components/app/admin/tab-setup.tsx`
- `src/components/app/admin/tab-guests.tsx`
- `src/components/app/admin/tab-reports.tsx`
- `src/components/app/admin/code-sheet.tsx`
- `src/components/app/admin/audit-sheet.tsx`
- `src/components/app/admin/staff-sheet.tsx`

## Gaps / TODOs

- Reports occupancy: per-day occupancy computed from in-memory stay overlap scan (correct, O(N×D) — fine for ≤90-day ranges with ≤200 stays; for longer ranges, would need a server-side aggregate query).
- Reports avg response/completion: one-shot batch query for all ACKNOWLEDGED events of requests in range. For very large request sets, could be slow; acceptable for last 30/90-day windows.
- Staff sheet edit mode: "Active Codes" / "Active Sessions" metric tiles show placeholder "—" because the staff detail endpoint doesn't return active counts (could extend the staff detail API to include `activeCodeCount` and `activeSessionCount`).
- Staff deactivation does NOT revoke their active access codes or sessions (cascade revoke on `isActive=false` could be a follow-up).
- Hotel settings form has no "currency" field (only the 15 fields listed in task spec are editable). Currency + city + country + tagline + description could be added if needed.
- No "Generate Reception Code" / "Generate Admin Code" quick action from Dashboard — all generation goes through the CodeSheet's radio selector (single entry point for all code types).
- No WebSocket-based push for alerts — admin must refresh or wait for the 30s/60s poll.
- No CSV export of audit log or reports.
- The `audit` GET endpoint returns `details` as parsed JSON (object) when valid JSON, otherwise the raw string. UI displays this as `JSON.stringify(details)` truncated to 200 chars.
