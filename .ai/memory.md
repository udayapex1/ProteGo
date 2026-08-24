# PROTEGO — Agent Memory File
# Complete project context, decisions, progress, and conventions
# Last updated: July 2026

---

## WHAT IS PROTEGO

A **family safety tracking mobile app** built for Indian families.
- Parent tracks child/elderly in real-time
- Custom geofence zones with entry/exit alerts
- SOS emergency button
- Location history with route replay
- Background tracking on Android

**App name:** Protego (from Latin "I protect", also Harry Potter shield spell)
**Developer:** Uday Pareta | udaypareta645@gmail.com | GitHub: udayapex1 | Portfolio: uday-woad-mu.vercel.app
**Status:** MVP functional, tested on real Android device

---

## REPOSITORIES

- Backend: `protego-server/` — Node.js + Express (ES Modules)
- Frontend: `protego-client/` — React Native + Expo + TypeScript (SDK 54)

---

## TECH STACK

### Backend (`protego-server/`)
```
Node.js + Express (ES Modules — "type": "module")
MongoDB (Mongoose, Atlas free tier)
Redis (Redis Cloud free tier)
Socket.IO (real-time events)
JWT (access: 15min, refresh: 7 days)
bcryptjs (password hashing)
Speakeasy + qrcode (TOTP 2FA)
Nodemailer (Gmail SMTP — needs dedicated email)
Architecture: Controller → Service → Repository
```

### Frontend (`protego-client/`)
```
React Native + Expo SDK 54 (TypeScript)
React Navigation (Stack + Bottom Tabs)
react-native-maps (MapView, Marker, Circle, Polyline)
expo-location + expo-task-manager (foreground + background tracking)
@expo/vector-icons Ionicons
axios (HTTP client with interceptors)
socket.io-client
@react-native-async-storage/async-storage
expo-linear-gradient
@react-native-community/slider
@react-native-community/datetimepicker
expo-image (for Cloudinary logo)
OpenRouteService API (direct client call, free routing)
```

---

## ENVIRONMENT VARIABLES

### Backend `.env`
```
PORT=8000
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<64-byte hex>
JWT_REFRESH_SECRET=<64-byte hex>
REDIS_URL=redis://default:PASSWORD@HOST:PORT
EMAIL_USER=<gmail>
EMAIL_PASS=<gmail app password>
```

### Frontend
- `BASE_URL` hardcoded in `src/api/client.ts`: `http://10.36.219.50:8000/api`
- Changes when WiFi changes (IP changes)
- Production: replace with deployed URL
- `EXPO_PUBLIC_API_URL` env var planned but not implemented yet

---

## USER ROLES

Two roles selected at registration:
- **parent** — tracks child, creates zones, receives all alerts, views map + history
- **child** — shares location, triggers SOS, sees own map + zones

Single app, role-based navigation:
- Parent → 4 tabs: Home (map), Zones, History, Profile
- Child → 3 tabs: Home (own map + SOS), History, Profile

---

## DATABASE MODELS

### User
```js
{ name, email, password (bcrypt), role: 'parent'|'child',
  pairedWith: ObjectId|null, pairingCode: String|null,
  pairingCodeExpiry: Date, refreshToken: String,
  twoFactorSecret: String, isTwoFactorEnabled: Boolean,
  timestamps: true }
```

### Location
```js
{ userId: ObjectId, location: { type: 'Point', coordinates: [lng, lat] },
  battery: Number(0-100), network: 'online'|'offline',
  isSOS: Boolean, createdAt: Date }
// 7-day TTL auto-delete
// Indexes: 2dsphere on location, compound(userId, createdAt:-1), index on isSOS
```

### Geofence
```js
{ parentId: ObjectId, childId: ObjectId, name: String,
  center: { type: 'Point', coordinates: [lng, lat] },
  radius: Number(30-10000 meters), isActive: Boolean, timestamps: true }
// Indexes: 2dsphere on center, compound(childId, isActive), compound(parentId, isActive)
```

---

## COMPLETE API ROUTES

Base: `http://10.36.219.50:8000/api` (local dev)

### Auth (`/api/auth`)
```
POST /register      { name, email, password, role } → { accessToken, refreshToken, user:{id,name,role,pairedWith} }
POST /login         { email, password } → { accessToken, refreshToken, user } | { requiresTwoFactor:true, userId }
POST /logout        [auth] → 200
POST /refresh       { refreshToken } → { accessToken }
POST /2fa/setup     [auth] → { qrCode(base64), secret }
POST /2fa/enable    [auth] { token } → 200
POST /2fa/validate  { userId, token } → { accessToken, refreshToken, user }
```

### Pairing (`/api/pair`)
```
POST /generate      [auth, parent only] → { code, expiresAt }
POST /join          [auth, child only] { code } → { message: 'Paired successfully' }
DELETE /unpair      [auth] → { message }
GET /paired-user    [auth] → { id, name, role }
```

### Location (`/api/location`)
```
POST /update        [auth, child] { latitude, longitude, battery, network, isSOS?, timestamp? }
                    → saves MongoDB + Redis cache + emits Socket 'location:update'
                    → if isSOS: emits 'sos:alert' + email to parent (fire-and-forget)

POST /sync-batch    [auth, child] { locations: [...] } → { synced: N }
GET /latest/:userId [auth, parent] → from Redis cache first, then MongoDB
GET /history/:userId [auth, parent] ?hours=24 (max 168) → array of location docs
GET /sos/:userId    [auth, parent] → SOS-flagged locations
```

**KNOWN BUG:** history/:userId and sos/:userId security guard only allows paired parent.
Child cannot fetch their OWN history. Fix needed:
```js
const isSelf = req.user.userId === targetUserId;
const isPairedParent = requester?.pairedWith?.toString() === targetUserId;
if (!isSelf && !isPairedParent) return 403;
```
Same fix needed in getLatest and getSOSLocations.

### Geofence (`/api/geofence`)
```
POST /create        [auth, parent] { name, latitude, longitude, radius }
GET /parent         [auth, parent] → active zones owned by parent
GET /child          [auth, child] → active zones for child (name, center, radius only)
PUT /:id            [auth, parent] { name, latitude, longitude, radius }
DELETE /:id         [auth, parent] → soft delete (isActive: false)
POST /breach        [auth, child] { geofenceId, geofenceName, type:'enter'|'exit', latitude, longitude }
                    → emits 'geofence:breach' Socket event + email to parent
```

### User (`/api/user`)
```
GET /profile        [auth] → { id, name, email, role, pairedWith, isTwoFactorEnabled, createdAt }
PATCH /profile      [auth] { name } → updated user
DELETE /account     [auth] → deletes account + unlinks pairedWith
```

---

## SOCKET.IO ARCHITECTURE

**Server URL:** `http://10.36.219.50:8000` (no /api)
**Auth:** `socket.handshake.auth.token` = JWT access token
**Transport:** websocket

### Room System
```js
// Private room per family pair:
const roomId = [parentId, childId].sort().join('-')
// CRITICAL: Must be sorted — same room regardless of who generates it
// Both parent and child join this room on connect
```

### Events (Server → Client)
```
'location:update'   { userId, latitude, longitude, battery, network, isSOS, timestamp }
'sos:alert'         { userId, latitude, longitude, battery, timestamp }
'geofence:breach'   { childId, geofenceId, geofenceName, type:'enter'|'exit', latitude, longitude, timestamp }
```

---

## FRONTEND FOLDER STRUCTURE

```
src/
├── api/
│   ├── client.ts          axios instance, BASE_URL, auth interceptor, 401→refresh→retry
│   ├── auth.api.ts
│   ├── location.api.ts
│   ├── geofence.api.ts
│   └── directions.api.ts  OpenRouteService direct call (NOT proxied through backend)
├── components/
│   ├── common/
│   └── ThemeToggle.tsx
├── context/
│   ├── AuthContext.tsx     user:{id,name,role,pairedWith}, login/register/logout
│   └── ThemeContext.tsx    theme.colors.*, theme.isDark
├── navigation/
│   ├── AppNavigator.tsx    isLoading spinner → user ? TabNavigator : AuthNavigator
│   ├── AuthNavigator.tsx   Login → Register → TwoFactor → Pairing
│   ├── TabNavigator.tsx    role-based tabs (parent:4, child:3)
│   └── ZonesStackNavigator.tsx  ZonesList → CreateZone
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx        ✅ COMPLETE
│   │   ├── RegisterScreen.tsx     ✅ COMPLETE
│   │   ├── TwoFactorScreen.tsx    ⏳ PLACEHOLDER
│   │   └── PairingScreen.tsx      ✅ COMPLETE (both parent + child sides)
│   ├── parent/
│   │   ├── ParentHomeScreen.tsx   ✅ COMPLETE
│   │   ├── ZonesScreen.tsx        ✅ COMPLETE
│   │   ├── CreateZoneScreen.tsx   ✅ COMPLETE
│   │   ├── HistoryScreen.tsx      ✅ COMPLETE
│   │   └── ProfileScreen.tsx      ✅ COMPLETE
│   └── child/
│       ├── ChildHomeScreen.tsx    ✅ COMPLETE
│       ├── ChildHistoryScreen.tsx ✅ COMPLETE
│       └── ChildProfileScreen.tsx ✅ COMPLETE
├── services/
│   ├── socket.service.ts          connectSocket(), getSocket(), disconnectSocket()
│   ├── locationTask.service.ts    LOCATION_TASK_NAME, TaskManager.defineTask()
│   └── locationTracking.service.ts startBackgroundLocationTracking(), stop...()
├── types/
│   ├── user.types.ts     User, AuthResponse, LoginPayload, RegisterPayload, UserRole
│   └── location.types.ts LocationUpdatePayload, LocationData, Geofence, GeofenceBreachPayload
└── constants/
    └── theme.ts          colors, spacing, radius, fontSize
```

---

## DESIGN SYSTEM

### Colors
```ts
// Light mode
background: '#F5F5F5', surface: '#FFFFFF',
text: '#000000', textMuted: '#999999', textSubtle: '#AAAAAA',
border: '#EEEEEE', tabBar: '#1A1A1A',
accent: '#7A1CAC', inputFocused: '#F3E8FA'

// Dark mode
background: '#000000', surface: '#1A1A1A',
text: '#FFFFFF', textMuted: '#999999', textSubtle: '#666666',
border: '#2A2A2A', tabBar: '#000000',
accent: '#7A1CAC', inputFocused: 'rgba(122,28,172,0.18)'

// Brand (never change between themes)
primary: '#7A1CAC'     purple — zones, accents, CTAs
primaryLight: '#F3E8FA' / 'rgba(122,28,172,0.18)'
danger: '#E8003D'      red — SOS, delete, outside zone
dangerLight: '#FFE8EE' / 'rgba(232,0,61,0.15)'
success: '#1D9E75'     green — online, inside zone, battery
successLight: '#E8F7F1' / 'rgba(29,158,117,0.15)'
```

### Spacing / Radius / Font
```ts
spacing: { xs:4, sm:8, md:12, lg:16, xl:20, xxl:24 }
radius:  { sm:8, md:12, lg:16, xl:20, xxl:24, pill:28 }
fontSize:{ xs:10, sm:12, base:14, md:15, lg:18, xl:22, xxl:24 }
```

### UI Patterns
```
Auth screens:     Black gradient header (top 40-50%), white card floats up (borderTopRadius: xxl, marginTop:-30)
                  Pill inputs with Ionicons, black CTA button
App screens:      Light #F5F5F5 bg, white surface cards, #EEEEEE borders
                  Floating dark pill navbar (position:absolute, marginHorizontal:20, marginBottom:10, height:60)
Map cards:        Dark #1A1A1A bg, borderRadius:xxl, height:240-280
                  Purple markers/circles, gradient overlay at bottom
Markers:          Child: purple 28x28 glow + 14x14 inner dot
                  Parent: black 28x28 with person icon
                  History start: green, end: red
Navbar clearance: ScrollView paddingBottom:100, SOS button marginBottom:90
```

### Map Styles
```ts
// Both defined in most map screens — SHOULD be extracted to src/constants/mapStyles.ts
darkMapStyle  = [ geometry:#1a1a1a, road:#2a2a2a, water:#0d0d0d, POIs:off, transit:off ]
lightMapStyle = [ geometry:#f5f5f5, road:#ffffff, water:#e0e6f0, POIs:off, transit:off ]
```

### Logo
```
Cloudinary URL: https://res.cloudinary.com/dwemivxbp/image/upload/v1783399686/Logo_protego_dark_bbw5m7.png
Used via: expo-image <Image source={{uri:...}} contentFit="contain" />
Dark version (white shield on purple) — for dark/gradient backgrounds
Currently on: LoginScreen only
Needed on: RegisterScreen, ProfileScreens, Splash
```

---

## SCREEN DETAILS

### ParentHomeScreen ✅
- Live map (dark/light theme-aware custom style)
- Parent location: `expo-location watchPositionAsync` (5s/10m intervals)
- Child location: Socket.IO `location:update` event + REST fallback on load
- `hasReceivedSocketUpdate` ref — prevents REST from overwriting fresh Socket data
- `hasFitMap` ref — fitToCoordinates only fires once (prevents zoom jumping)
- Parent marker: black circle with person icon
- Child marker: purple glow dot
- Route: ORS road route when "Show route" tapped, else straight geodesic line
- Fullscreen map modal: expand button top-right, Modal with same content
- Stats: Battery (with progress bar), Network (with last-update time), Distance/Road distance
- Zones: fetched via geofenceApi.getParentZones(), inside/outside computed client-side Haversine

### ChildHomeScreen ✅
- Own location: `expo-location watchPositionAsync` → ONLY updates local state `setMyLocation`, NOT API
- Background tracking: `startBackgroundLocationTracking()` → sends to API
- Zone chips: tappable → shows ORS walking route to zone on map
- SOS: confirm dialog → locationApi.updateLocation with isSOS:true
- "Sharing live" chip: green when isTracking true

### HistoryScreen + ChildHistoryScreen ✅
- Date picker (max 7 days back)
- `downsamplePoints()`: keeps point only if >25m moved OR >5min gap (deduplicates dense data)
- Map: Polyline + timestamped markers (green start, red end, purple intermediate dots)
- Stop list: tap to animate map to that point
- ChildHistoryScreen uses `user.id` (own userId), NOT `user.pairedWith`
- NOTE: Backend security guard needs fix — currently blocks child from fetching own history

### PairingScreen ✅ (both sides)
- Parent: generates code via POST /pair/generate, countdown timer, copy to clipboard
- Child: 6-box OTP input, POST /pair/join
- Triggered: after register (if role=parent) + from Profile screen (manual)

### CreateZoneScreen ✅
- Fixed center pin technique: map drags, pin stays centered, onRegionChangeComplete updates state
- Edit mode: loads existing zone via zoneId param
- Radius: @react-native-community/slider (100m-2000m)
- Create mode: initializes to current location via expo-location getCurrentPositionAsync

---

## BACKGROUND LOCATION TRACKING

```
Task name: 'protego-background-location-task'
Defined in: src/services/locationTask.service.ts
MUST be imported at App.tsx root BEFORE navigation renders

Task fires every: 30s OR 20m movement
On each fire: gets GPS fix, battery (expo-battery), network (expo-network)
Sends: locationApi.updateLocation({ lat, lng, battery, network, isSOS:false, timestamp: new Date().toISOString() })
NOTE: Uses new Date().toISOString() NOT location.timestamp (GPS fix time can be stale/cached)

Foreground Service notification:
  title: "Protego is tracking your location"
  body: "This keeps your family updated on your location."
  color: "#7A1CAC"

Android permissions needed (app.json):
  ACCESS_COARSE_LOCATION, ACCESS_FINE_LOCATION, ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE
```

---

## OPENROUTESERVICE (ROUTING)

```ts
// src/api/directions.api.ts
API_KEY: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY0NDVjNzA5Mzg2ZDQ1OGJhNTRkMjUyMjQ2YTJjNzZjIiwiaCI6Im11cm11cjY0In0='
Endpoint: POST https://api.openrouteservice.org/v2/directions/{profile}/geojson
Profiles: 'driving-car' | 'foot-walking'
Returns: { coordinates: [{latitude, longitude}[]], distanceText, durationText }
Free tier: 2000 req/day, 40 req/min
ISSUE: API key hardcoded in client bundle — should move to env or backend proxy
Called directly from React Native (no backend proxy)
```

---

## KNOWN BUGS (in priority order)

1. **Child cannot fetch own history** — backend security guard blocks it. Fix: allow `isSelf` OR `isPairedParent` in location.controller.js getHistory, getLatest, getSOSLocations

2. **Duplicate location saves** — foreground watch in ChildHomeScreen was previously also calling API. Current code is fixed (only setMyLocation). But background task + sync-batch may still cause some duplicates. Backend deduplication planned.

3. **Theme inconsistency** — many screens have hardcoded colors (#fff, #000) instead of theme.colors.*. ThemeToggle missing on several screens. Agent brief exists: `Protego_Theme_Fix_Agent_Brief.md`

4. **Fullscreen map missing** — ChildHomeScreen and HistoryScreen lack the expand button + modal that ParentHomeScreen has.

5. **ORS API key exposed** — hardcoded in client bundle. Move to env var or backend proxy.

6. **Email not dedicated** — using personal Gmail. Need protego.alerts@gmail.com or Resend.

7. **BASE_URL not env-based** — hardcoded local IP. Need EXPO_PUBLIC_API_URL.

8. **TwoFactorScreen** — placeholder only, no UI built yet.

9. **Client-side geofence detection** — Child app does NOT call POST /api/geofence/breach when entering/exiting zones. expo-location startGeofencingAsync not implemented. Agent brief: `Protego_Geofencing_Agent_Brief.md`

10. **In-app SOS notification** — parent gets email but no in-app banner when sos:alert Socket event fires.

11. **mapStyles duplication** — darkMapStyle/lightMapStyle defined in multiple screen files. Should be extracted to src/constants/mapStyles.ts.

---

## DECISIONS MADE (and why)

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Real-time | Socket.IO | REST polling | True bidirectional, efficient |
| Live location cache | Redis | MongoDB only | Fast reads, avoids DB hit on every parent refresh |
| Routing | OpenRouteService | Google Directions API | Free, no billing/card needed for MVP |
| ORS integration | Direct client call | Backend proxy | Speed of implementation; proxy planned for v2 |
| SMS alerts | Not implemented | Twilio/Fast2SMS | Nodemailer free, SMS adds cost and complexity |
| WhatsApp alerts | Rejected | Twilio sandbox | Sandbox requires manual join step, too much friction |
| Geofence detection | Client-side (planned) | Server-side Haversine | Battery efficient, native OS handles it |
| Location TTL | 7 days | Forever | Storage cost, privacy, MongoDB TTL index handles it |
| Background tracking | expo-task-manager + Foreground Service | react-native-background-fetch | More reliable on Indian OEM devices (Xiaomi etc.) |
| Family model | Removed | Kept | MVP only needs parent-child pair, not family groups |
| Kafka | Rejected | Redis | Overkill for MVP scale |
| Payment | Razorpay (planned) | Stripe | India-first, UPI support |

---

## PENDING FEATURES (priority order)

### MVP Completion
- [ ] Backend fix: child can fetch own location history
- [ ] TwoFactor Screen UI (OTP 6-box input, validate API call)
- [ ] Theme system full fix (all screens use theme.colors.*, ThemeToggle everywhere)
- [ ] Fullscreen map on ChildHomeScreen + HistoryScreen
- [ ] Client-side geofence detection (expo-location startGeofencingAsync on child)
- [ ] In-app SOS alert banner on parent screen

### Polish
- [ ] Custom Alert component (replace native Alert.alert())
- [ ] Dedicated app email (protego.alerts@gmail.com or Resend)
- [ ] mapStyles extracted to constants file
- [ ] ORS key to env var

### Pre-Launch
- [ ] Backend deployment (Render/Railway)
- [ ] BASE_URL → EXPO_PUBLIC_API_URL
- [ ] App icon + splash with new Protego logo (assets/)
- [ ] Logo propagated to all screens (Register, Profiles)
- [ ] Privacy Policy + Terms & Conditions pages (HTML built, need hosting)
- [ ] EAS Build config
- [ ] Play Store submission (package: com.udaypareta.protegoclient)

---

## MONETIZATION PLAN

| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0 | 1 family pair, basic tracking |
| Pro | ₹99/month | Unlimited zones, history, SOS |
| Family+ | ₹149/month | Elderly mode, offline fallback, priority alerts |

Payment: Razorpay (planned)
Target: 200 paying users = ₹19,800/month

---

## CRITICAL RULES FOR ANY AI AGENT

1. **ES Modules** — backend uses `import/export`, file extensions `.js` required in imports

2. **pairedWith in auth response** — ALL auth endpoints (register, login, validateTwoFactor) MUST return `pairedWith` field in user object. Frontend AuthContext stores it. ParentHomeScreen uses `user.pairedWith` to fetch child location. If missing, everything breaks.

3. **Socket room ID formula** — ALWAYS `[parentId, childId].sort().join('-')`. Never deviate. Used in socket.js, location.service.js, geofence.service.js — must be consistent.

4. **GeoJSON coordinate order** — MongoDB/GeoJSON: `[longitude, latitude]`. React Native Maps: `{latitude, longitude}`. Convert: `lat = coordinates[1]`, `lng = coordinates[0]`

5. **Background task import** — `locationTask.service.ts` MUST be imported at App.tsx root BEFORE navigation renders. Otherwise TaskManager silently fails.

6. **Expo SDK 54** — do NOT upgrade to SDK 55/56 without explicit approval. Caused Expo Go incompatibility previously.

7. **No OAuth** — Google/biometric login buttons are UI-only placeholders.

8. **No SMS** — Nodemailer only. Twilio not in scope.

9. **ORS not proxied** — called directly from React Native app.

10. **Navbar overlap** — all scrollable screens need `paddingBottom: 100` on ScrollView. SOS button needs `marginBottom: 90`.

11. **timestamp in location updates** — use `new Date().toISOString()` (current system time), NOT `location.timestamp` from Expo Location object (GPS fix time can be stale/cached).

12. **Do not modify working backend routes** — Auth, Location, Geofence, Pairing, User routes are all tested and working. Only add new routes, never rewrite existing ones.

---

## AGENT BRIEFS ALREADY WRITTEN

These markdown files exist with detailed implementation instructions:

- `Protego_Complete_Context.md` — full project reference
- `Protego_Geofencing_Agent_Brief.md` — client-side geofence detection + Google Directions integration
- `Protego_Theme_Fix_Agent_Brief.md` — theme system audit + ThemeToggle on all screens + fullscreen map

---

## LINKEDIN POST (drafted, ready to post)

"I built a family safety app from scratch..."
- Story-driven version references Socket.IO, Redis cache-aside, ORS routing, Foreground Service
- Screenshots needed: parent home (live map + route), zones screen, child home (sharing live chip)
- Best post time: Tuesday/Wednesday 9-11 AM IST

---

## PLAY STORE INFO

```
Package name: com.udaypareta.protegoclient
Category: Family / Safety
Privacy Policy URL: (needs hosting — HTML built, use GitHub Pages)
Target audience: Indian families, parents with children/elderly parents
```