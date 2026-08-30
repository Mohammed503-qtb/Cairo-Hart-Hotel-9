# Task 6 — Reception Mode Builder

**Agent:** reception-mode-builder
**Task ID:** 6
**Task:** Build the Reception mode of the hotel mobile app (APIs + UI).

## Context
Previous agents (Task ID 1, main agent) had completed the schema foundation:
- Extended `prisma/schema.prisma` with the full app domain: Stay, PhysicalRoom, AccessCode, GuestRequest, Charge, Conversation, Staff, Service, ExtensionRequest, RoomTransferRequest, CheckoutRequest, AppNotification, etc.
- Seeded 1 admin, 2 reception staff, 12 physical rooms across 3 floors, 4 service categories, 14 services, sample stays + access codes.
- Built `src/lib/app/auth.ts` (code generation + hashing + rate limiting) and `src/lib/app/session.ts` (resolveSession / requireSession helpers).
- Built `src/app/api/app/auth/validate/route.ts`, `src/app/api/app/session/route.ts`, `src/app/api/app/auth/logout/route.ts`.
- Built `src/components/app/app-login.tsx`, `src/components/app/shared.tsx`, `src/components/app/app-shell.tsx` (which statically imports ReceptionApp from `./reception/reception-app`).

Tasks 2–5 (Guest mode, Admin mode, etc.) were not yet recorded in the worklog when this task ran; the Reception persona is independent and self-contained.

## Work Log

### APIs (under `/home/z/my-project/src/app/api/app/reception/`)

Created **21 route files** covering all 19 endpoints in the spec:

1. `dashboard/route.ts` — `GET` KPIs (todayArrivals, todayDepartures, inHouseGuests, pendingRequests, urgentRequests) + top-6 arrivals/departures/pendingRequests lists. Includes reservation.guest + items.roomType for arrivals; stay.guest + room.roomType for departures; stay.guest + stay.room for pending requests.
2. `arrivals/route.ts` — `GET` Today's arrivals (reservations with checkIn today, status in [CONFIRMED, PAYMENT_PENDING]). Supports `?date=YYYY-MM-DD`.
3. `arrivals/[id]/checkin/route.ts` — `POST` Full check-in workflow inside a transaction:
   - Validates reservation status is CONFIRMED/PAYMENT_PENDING and checkIn is today.
   - Validates room matches reservation.items[0].roomTypeId and is AVAILABLE/RESERVED.
   - Creates Stay (status CHECKED_IN, balance = grandTotal − paidTotal, stayNumber ST-YYYY-NNNNNN).
   - Updates reservation status → CHECKED_IN.
   - Updates room status → OCCUPIED + RoomStatusHistory.
   - Creates room charge (category=ROOM, source=ROOM, qty=nights, unitPrice=items[0].nightlyRate, grossAmount=subtotal, netAmount=subtotal).
   - Generates GUEST access code via `generateAccessCode("GUEST")`, hashes with `hashAccessCode`, creates AccessCode valid until end-of-checkout-day.
   - Creates StayStatusHistory (EXPECTED → CHECKED_IN).
   - Creates AppNotification for all ADMIN/MASTER_ADMIN staff (type=CHECKIN).
   - Writes AuditLog (action=CHECK_IN).
   - Returns `{ stayId, stayNumber, accessCode, roomNumber, guestName }` (raw code shown once).
4. `inhouse/route.ts` — `GET` in-house guests (stays with status CHECKED_IN) with guest + room + activeRequestsCount + balance.
5. `inhouse/[id]/route.ts` — `GET` full stay detail: stay, guest, room.roomType, payments (via linked reservation), requests, charges, financialSummary {chargesTotal, paymentsTotal, balance}.
6. `inhouse/[id]/checkout/route.ts` — `POST` checkout workflow. Body `{ note?, forceBalance? }`. Validates balance=0 or `forceBalance=true`. Updates stay → CHECKED_OUT + checkedOutAt, room → DIRTY + history, revokes active GUEST access codes (status=EXPIRED), updates linked reservation → CHECKED_OUT, StayStatusHistory, AppNotification for ADMIN (type=CHECKOUT), AuditLog (action=CHECK_OUT).
7. `requests/route.ts` — `GET` all requests ordered by createdAt desc, supports `?status=...&priority=...` filters. Includes stay.guest + stay.room.
8. `requests/[id]/route.ts` — `GET` single request with events timeline (asc order). Includes stay.guest + stay.room.
9. `requests/[id]/acknowledge/route.ts` — `POST` ACKNOWLEDGED transition + event + AppNotification for GUEST (REQUEST_ACKNOWLEDGED) + audit.
10. `requests/[id]/assign/route.ts` — `POST` ASSIGNED transition with `assignedTo` field + event + AppNotification + audit.
11. `requests/[id]/progress/route.ts` — `POST` IN_PROGRESS transition + event + AppNotification + audit.
12. `requests/[id]/complete/route.ts` — `POST` COMPLETED transition + completedAt + event + AppNotification + audit.
13. `requests/[id]/cancel/route.ts` — `POST` CANCELLED transition + cancelledAt + reason + event + AppNotification + audit.
14. `requests/[id]/message/route.ts` — `POST` adds NOTE event + AppNotification for GUEST (NEW_MESSAGE) + audit.
15. `rooms/route.ts` — `GET` room status board (all rooms ordered by floor then roomNumber, grouped by floor). Includes currentStay (if OCCUPIED) + statusCounts.
16. `rooms/[id]/status/route.ts` — `POST` updates room status with transition validation (allowed matrix). OUT_OF_ORDER / OUT_OF_SERVICE require ADMIN persona. Creates RoomStatusHistory + audit.
17. `conversation/[stayId]/route.ts` — `GET` (returns conversation with messages, creates one if missing) + `POST` (sends RECEPTION message, marks GUEST messages as read, AppNotification for GUEST, audit).
18. `payments/route.ts` — `POST` records a Payment linked to stay.reservationId. Updates reservation.paidTotal, recomputes paymentStatus (UNPAID/PARTIAL/PAID), updates stay.balance, audit (PAYMENT_RECORDED), AppNotification for ADMIN.
19. `extension/route.ts` — `GET` lists pending extension requests.
20. `extension/[id]/approve/route.ts` — `POST` approves extension: validates still pending, simple overlap check for the additional nights on the same room type, updates stay.checkOut + nights + balance (adds charge), updates linked reservation (subtotal/tax/serviceCharge/grandTotal + items), creates extension charge, marks APPROVED, extends guest access code validity, AppNotification for GUEST (EXTENSION_APPROVED), audit.
21. `extension/[id]/reject/route.ts` — `POST` rejects: marks REJECTED + reviewNote, AppNotification for GUEST (EXTENSION_REJECTED), audit.

Plus a shared helper `src/lib/app/request-actions.ts` with `loadRequestForTransition`, `notifyGuest`, `isTransitionAllowed` (matrix of allowed state transitions).

### UI (under `/home/z/my-project/src/components/app/reception/`)

Created **11 component files**:

1. `reception-app.tsx` — Main component with bottom navigation (4 tabs: Dashboard / Arrivals / In-House / Requests, 64px height, gold active color, lucide icons). Manages shared sheet state (check-in, guest detail, request detail, room board, chat, payment).
2. `i18n.ts` — Bilingual string table (AR/EN) with `t(key, locale)` helper for ~110 keys.
3. `use-fetch.ts` — `useFetch<T>(url, opts)` hook with polling + `apiPost(url, body)` helper.
4. `tab-dashboard.tsx` — Dashboard tab: 4 KPI cards (arrivals/departures/in-house/pending, color-coded), quick action buttons (Check-In / Check-Out / Room Status / Requests), top-6 arrivals list with [Check-In], departures list with [Check-Out], pending requests list with status badges.
5. `tab-arrivals.tsx` — Arrivals tab: full today's arrivals list with date selector (prev/today/next), each card shows guest, booking ref, room type, payment status, balance, [Check-In] button.
6. `tab-inhouse.tsx` — In-House tab: list of in-house stays with guest name, room number, check-out date, balance badge, requests count badge, [View] [Message] [Check-Out] buttons.
7. `tab-requests.tsx` — Requests tab: filter tabs (All/New/In Progress/Completed), each card has priority badge + status badge + room + guest + time-ago + [View].
8. `checkin-sheet.tsx` — 4-step bottom Sheet for the check-in workflow (Step 1 verify identity with ID input, Step 2 confirm reservation summary, Step 3 assign room dropdown of available rooms of matching type, Step 4 success screen with access code prominently displayed + copy button + WhatsApp share link).
9. `guest-detail-sheet.tsx` — In-house guest detail bottom Sheet: guest info card, stay details grid, financial summary (charges/payments/balance), payment history list, requests list, charges breakdown, footer actions (Message / Record Payment / Check-Out).
10. `request-detail-sheet.tsx` — Request detail bottom Sheet: header with priority+status badges + title + description + room/guest metadata, events timeline (icons per event type), action buttons (Acknowledge / In Progress / Complete / Cancel) based on current status, assign-to input + button, note/message input, reason input for cancellation.
11. `room-status-board.tsx` — Full-screen bottom Sheet for room status board: status legend with counts, floor sections with grid of room tiles (color-coded by status, current guest first-name on OCCUPIED), tap to open inline panel with status dropdown (allowed transitions only) + confirm button.
12. `chat-sheet.tsx` — Chat bottom Sheet with guest (RECEPTION side). Polls every 5s, shows messages as chat bubbles (RECEPTION messages right-aligned emerald, GUEST left-aligned white), auto-scroll to bottom, draft input with send button (Enter to send).
13. `payment-sheet.tsx` — Payment bottom Sheet: balance summary card (charges/payments/balance), amount input pre-filled with balance, method dropdown (Cash/Card/Online/Bank), optional note, submit button.

### Stubs for parallel-agent apps
The existing `app-shell.tsx` statically imports `GuestApp` from `./guest/guest-app` and `AdminApp` from `./admin/admin-app`. Those files did not exist when this task ran. Created minimal placeholder components:
- `src/components/app/guest/guest-app.tsx`
- `src/components/app/admin/admin-app.tsx`

These can be safely replaced by the Guest-mode and Admin-mode agents without affecting Reception mode.

### Eslint config tweak
Added `audit/**` to the eslint ignores (the audit folder is a snapshot backup with a pre-existing lint error in `examples/websocket/frontend.tsx` — unrelated to Reception work).

## Stage Summary

- **All 19 spec'd endpoints implemented**, fully transactional where required, with AppNotifications + AuditLogs + state-history records.
- **All 4 bottom-nav tabs implemented** (Dashboard, Arrivals, In-House, Requests) plus 5 supporting Sheets (Check-In, Guest Detail, Request Detail, Room Status Board, Chat, Payment).
- **Bilingual** (AR/EN) using `useUIStore.locale` (default AR); RTL layout via `dir={isRTL ? "rtl" : "ltr"}`.
- **Polling**: dashboard 30s, arrivals 30s, in-house 30s, requests 15s, chat 5s.
- **Lint passes cleanly** (`bun run lint` exit 0).
- **tsc has 0 errors in my files** (9 pre-existing errors in `src/lib/i18n.ts` and `src/app/api/availability/calendar/route.ts` are unrelated and explicitly allowed).
- **Stay lifecycle covered**: arrival → check-in (with access code issuance) → in-house (chat, requests, payments, extension) → checkout (with room→DIRTY, code revocation, reservation→CHECKED_OUT).
- **Reuse**: uses existing `@/components/app/shared` (StatusBadge, PriorityBadge, Money, DateStr, ScreenHeader, EmptyState, LoadingSpinner), shadcn/ui Sheet/Select/Input/Button/Label, Tailwind tokens (emerald+gold+cream).
- **Verification**: test access codes from Task 1 seed are: Guest `H<...>`, Reception `R<...>`, Admin `A<...>` (see `seed-app.ts` log output).

## Gaps / TODOs
- **Stay Transfer (RoomTransferRequest) UI**: backend schema exists; no API endpoints or UI sheets were built for room transfers in this task (spec mentioned a "Transfer" action in the in-house detail sheet but did not list a transfer API). Left for a future agent.
- **CheckoutRequest API**: model exists; reception-side workflow not exposed via API. Currently `inhouse/[id]/checkout` performs direct check-out which is sufficient.
- **Service catalog UI**: services are seeded but reception-side "create request on behalf of guest" is not built (would require a new sheet + APIs).
- **WebSocket realtime**: chat & request updates use polling per spec; a websocket mini-service could replace polling for production (examples/websocket has the scaffolding).
- **Notifications UI for reception**: AppNotifications are written but no reception-side notification feed is rendered yet (would be a 5th tab or top-bar dropdown).
