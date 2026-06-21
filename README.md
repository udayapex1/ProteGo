# Protego 🛡️

> Family safety tracking app for Indian families — real-time location, geofencing, SOS alerts, and device monitoring.

Protego helps parents stay connected with their children and elderly family members through live location tracking, custom safety zones (geofences), and instant emergency alerts — built specifically with Indian families and Indian network/device realities in mind.

---

## ✨ Features

- **Live Location Tracking** — Real-time location updates via Socket.IO, with adaptive ping intervals based on movement speed.
- **Geofencing** — Parents can create custom safety zones (home, school, etc.). Both parent and child are notified the moment a zone is entered or exited.
- **Slide-to-SOS** — A deliberate, accidental-trigger-resistant emergency button on the child's device that instantly alerts the parent via real-time push + email.
- **Battery & Network Monitoring** — Parents can see their child's device battery level and connectivity status at a glance.
- **Two-Factor Authentication** — Optional TOTP-based 2FA (Google Authenticator compatible) for account security.
- **Simple Pairing** — A 6-digit, time-limited code links a parent and child account — no complex setup.
- **Offline-First Sync** — Location data is queued locally when offline and batch-synced once connectivity returns.

---

## 🧩 The Problem

| Pain Point | How Protego Solves It |
|---|---|
| Life360 / global apps are priced for Western markets | Affordable, India-first pricing |
| Google's built-in family tools lack geofencing, SOS, and device health alerts | Purpose-built safety feature set |
| WhatsApp "Live Location" is manual and not persistent | Always-on, automated tracking |
| No good solution for tracking elderly parents | Simple, low-friction UI designed for any age group |

---

## 🏗️ Tech Stack

### Backend (`protego-server`)
- **Node.js + Express** — REST API (ES Modules)
- **Socket.IO** — Real-time bidirectional location & alert events
- **MongoDB** (Mongoose) — Primary data store, with TTL & geospatial (`2dsphere`) indexes
- **Redis** — Live location caching (cache-aside pattern) for fast reads
- **JWT** — Access + refresh token authentication
- **Speakeasy + QRCode** — TOTP-based two-factor authentication
- **Nodemailer** — Email alerts for SOS and geofence breaches (MVP transport layer)

**Architecture pattern:** Controller → Service → Repository, designed for scalability and easy migration (e.g. REST → GraphQL, Nodemailer → Resend) as the product grows.

### Mobile App (`protego-client`)
- **React Native (Expo, TypeScript)**
- **React Navigation** — Stack + bottom tabs, role-based routing (Parent / Child)
- **Socket.IO Client** — Real-time sync with backend
- **Expo Location / Task Manager / Battery / Network** — Background tracking & device telemetry
- **AsyncStorage** — Session persistence & offline location queueing
- **expo-linear-gradient**, **@expo/vector-icons** — UI

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Parent** | View live location, create/manage geofence zones, view battery & network status, receive all alerts |
| **Child** | Share location, view their own active zones, trigger SOS via slide gesture |

---

## 🔐 Pairing Flow

1. Parent registers and generates a 6-digit pairing code (valid 15 minutes).
2. Code is shared with the child (via any channel — WhatsApp, call, etc).
3. Child registers/logs in and enters the code.
4. Accounts are linked — child now appears on the parent's live map.

---

## 📡 Real-Time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `location:update` | Server → Room | Live coordinates, battery, network status |
| `sos:alert` | Server → Room | Emergency trigger with location snapshot |
| `geofence:breach` | Server → Room | Zone enter/exit notification |

Each paired parent-child forms a private Socket.IO room (`[parentId, childId].sort().join('-')`), ensuring updates are isolated per family.

---

## 🗺️ Roadmap

- [x] Auth (JWT + optional 2FA)
- [x] Parent-child pairing
- [x] Live location (REST + Socket.IO + Redis cache)
- [x] Geofencing (create/breach/real-time alerts)
- [x] SOS (slide gesture + email + push)
- [ ] Interactive route replay (last 7 days)
- [ ] SMS fallback for SOS (Fast2SMS / Twilio)
- [ ] Smartwatch (WearOS) companion app
- [ ] Elderly mode — simplified UI, auto check-ins
- [ ] REST → GraphQL migration for location-heavy endpoints
- [ ] Nodemailer → Resend migration

---

## 💰 Monetization

| Tier | Price | Includes |
|---|---|---|
| Free | ₹0 | 1 family pair, basic live tracking |
| Pro | ₹99/month | Unlimited zones, location history, SOS alerts |
| Family+ | ₹149/month | Elderly mode, offline fallback, priority alerts |

---

## ⚙️ Local Setup

### Backend
```bash
cd protego-server
npm install
# Configure .env: MONGO_URI, REDIS_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, EMAIL_USER, EMAIL_PASS
npm run dev
```

### Mobile App
```bash
cd protego-client
npm install
# Update BASE_URL in src/api/client.ts to your local IP + backend port
npx expo start
```

> **Note:** When testing on a physical device via Expo Go, your phone and computer must be on the same Wi-Fi network, and `localhost` must be replaced with your machine's local network IP.

---

## 📄 License

This project is currently private and under active development.

---

Built by **Uday Pareta** 🚀
