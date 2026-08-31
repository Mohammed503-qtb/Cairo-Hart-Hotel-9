# Dar Al-Yasmin Royal Hotel — Integrated Hotel Platform

<p align="center">
  <strong>منصة فندقية متكاملة — موقع + تطبيق جوال (ضيف / استقبال / إدارة)</strong><br/>
  <strong>Integrated hotel platform — website + mobile app (Guest / Reception / Admin)</strong>
</p>

A production-ready, Arabic-first (RTL) luxury hotel platform built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, and Prisma. Includes a public website with booking engine and a mobile app for three personas (Guest, Reception, Admin) with dynamic code-based authentication.

## ✨ Features

### Public Website
- **Home** with parallax hero + booking widget
- **13 content sections**: Featured Rooms, Favorites, Recently Viewed, Room Comparison, Facilities, Gallery, Offers, Availability Calendar, Reviews, About, Location, Contact, FAQ, Policies
- **Booking engine**: Search → Availability → Guest Info → Review → Payment → Confirmation
- **Manage Booking**: lookup (phone-verified) → modify → cancel
- **Multi-currency** display (YER/USD/SAR/AED)
- **Promo codes** with percentage/fixed discounts
- **Seasonal pricing** with weekend surcharges
- **Confirmation PDF** (printable HTML)
- **WhatsApp + Email** share

### Mobile App (PWA — installable as native app)
Three personas, one codebase, dynamic code-based auth:

**Guest Mode** (in-house guests):
- Home dashboard with quick actions
- Service catalog (17 services across 4 categories)
- Create + track requests with status timeline
- Reception chat (real-time polling)
- Bill view (charges, payments, balance)
- Extension + Checkout requests
- Notifications

**Reception Mode** (front-desk staff):
- Dashboard KPIs (arrivals, departures, in-house, pending requests)
- Check-in workflow (4-step: verify → confirm → assign room → generate guest code)
- In-house guest management
- Request queue with acknowledge/assign/progress/complete actions
- Room status board (3 floors, color-coded)
- Payment recording
- Extension approval
- Guest chat

**Admin Mode** (hotel owners):
- Dashboard with occupancy, revenue, alerts
- Access code generation (Guest/Reception/Admin)
- Hotel settings management
- Staff management
- Reports (occupancy, revenue, requests) with charts
- Audit log viewer
- Reservations + Guests overview

### PWA / Native App Feel
- 📱 **Installable** on Android, iOS, desktop (Add to Home Screen)
- 📲 **Standalone display** (no browser chrome when installed)
- 🔒 **Safe-area insets** for notch / dynamic island / home indicator
- 📴 **Offline-capable** via service worker (app shell + API cache)
- 🎨 **Native-feeling** tap feedback, sheet animations, momentum scrolling
- 🌐 **RTL Arabic** primary + English secondary
- 🖼️ **Custom app icons** (192, 256, 384, 512, maskable, apple-touch)

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM (SQLite) |
| State | Zustand + TanStack Query |
| Fonts | Cairo (Arabic) + Playfair Display |
| Icons | Lucide React |
| PWA | manifest.json + service worker + app icons |
| Auth | Dynamic access codes (H/R/A prefixes) + SHA-256 hashing + HTTP-only session cookies |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ or Bun 1.1+
- npm or bun

### Installation

```bash
# Clone
git clone https://github.com/Mohammed503-qtb/Cairo-Hart-Hotel-9.git
cd Cairo-Hart-Hotel-9

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Generate Prisma Client
bunx prisma generate

# Initialize database
bunx prisma db push --accept-data-loss

# Seed website content
bunx tsx src/lib/seed.ts

# Seed app data (staff, rooms, services, stays, access codes)
bunx tsx src/lib/seed-app.ts

# Start development server
bun run dev
```

Visit `http://localhost:3000` — the app is also accessible via the floating "Smartphone" button or `?app=1` deep link.

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start
```

### Docker

```bash
# Build image
docker build -t dar-al-yasmin-hotel .

# Run container (with persistent database volume)
docker run -p 3000:3000 -v $(pwd)/data:/app/db dar-al-yasmin-hotel
```

## 📦 GitHub Actions Release

This repository includes two GitHub Actions workflows:

### CI (`.github/workflows/ci.yml`)
Runs on every push/PR to `main`:
- Lint check (ESLint)
- Build test (Next.js standalone)

### Release (`.github/workflows/release.yml`)
Triggered by version tag push (`v1.0.0`) or manual dispatch:
1. **Build** Next.js standalone bundle
2. **Package** as `.tar.gz` + `.zip` archives
3. **Docker** image pushed to GHCR (`ghcr.io/mohammed503-qtb/cairo-hart-hotel-9`)
4. **TWA APK** (optional, requires `ASSET_URL` secret) via Bubblewrap
5. **GitHub Release** with all artifacts attached

### Triggering a Release

```bash
# Create a version tag
git tag v1.0.0
git push origin v1.0.0

# Or trigger manually from GitHub Actions tab
# (set `build_twa` to true if ASSET_URL secret is configured)
```

### Required Secrets for TWA APK
- `ASSET_URL` — the HTTPS URL where the app is deployed (e.g. `https://hotel.example.com`)

Without `ASSET_URL`, the TWA APK build is skipped (PWA still works via "Add to Home Screen").

## 🗄️ Database Schema

The application uses SQLite with these key model groups:

**Website domain**: Hotel, RoomType, Amenity, RatePlan, SeasonalRate, Facility, GalleryItem, Offer, Policy, Faq, Review, PromoCode, Guest, Reservation, ReservationItem, ReservationPriceSnapshot, Payment, BookingModification, Notification, Newsletter, AuditLog

**App domain**: Staff, PhysicalRoom, RoomStatusHistory, Stay, StayStatusHistory, AccessCode, GuestSession, ServiceCategory, Service, GuestRequest, GuestRequestEvent, Charge, Conversation, ConversationMessage, ExtensionRequest, RoomTransferRequest, CheckoutRequest, AppNotification

## 🔐 Authentication — Dynamic Access Codes

The mobile app uses a code-based auth system (per `PLAN_ MOBILE-APK.md`):

| Code Type | Prefix | Format | Use Case | Validity |
|-----------|--------|--------|----------|----------|
| Guest | `H` | `H` + 6 digits + 2-char checksum | In-house guest login | Until checkout |
| Reception | `R` | `R` + 6 digits + 2-char checksum | Front-desk staff | 8 hours (configurable) |
| Admin | `A` | `A` + 6 digits + 2-char checksum | Hotel admin | 24 hours (configurable) |

- Codes are **hashed (SHA-256)** before storage
- **Rate limiting**: 5 attempts/minute, lockout after 10 failures
- **Checksum** prevents typo-based collisions
- **Server-side** validation only
- Guest codes **auto-expire** at checkout

## 🌐 Localization

- **Arabic (RTL)** — primary language
- **English (LTR)** — secondary language
- Language toggle in website header + app login
- All content stored in both languages in the database
- ~730 i18n keys for the website + ~110 per app persona

## 📱 Installing as a Mobile App (PWA)

### Android (Chrome)
1. Open the deployed URL in Chrome
2. Menu (⋮) → "Add to Home screen"
3. Launch from home screen — opens full-screen, no browser chrome

### iOS (Safari)
1. Open the deployed URL in Safari
2. Share button → "Add to Home Screen"
3. Launch from home screen — opens in standalone mode

### Desktop (Chrome/Edge)
1. Open the deployed URL
2. Install icon (⊕) in address bar → Install

## 🧪 Test Access Codes

After running `seed-app.ts`, the following codes are generated (printed to console):

```
Guest:     H********  (tied to an in-house stay)
Reception: R********  (8-hour shift)
Admin:     A********  (24 hours)
Master:    A********  (24 hours)
```

Use these to test each persona in the app.

## 📝 License

This project is proprietary. All rights reserved.

## 🔗 Links

- **Repository**: [Cairo-Hart-Hotel-9](https://github.com/Mohammed503-qtb/Cairo-Hart-Hotel-9)
- **Container Registry**: `ghcr.io/mohammed503-qtb/cairo-hart-hotel-9`
