# Agent Task: Generate `remainingwork.md` for Protego Project

## Your Role
You are a senior full-stack engineer doing a **complete audit** of the Protego project — a React Native family safety app with a Node.js backend. Your job is to:

1. Read `memory.md` (provided below or in context) thoroughly
2. Audit EVERY file in `protego-server/` and `protego-client/`
3. Generate a detailed `remainingwork.md` that documents:
   - What is incomplete or missing
   - What is wrongly implemented or has bugs
   - Which APIs are fully integrated (both server route + client call)
   - Which APIs exist on server but are NOT called from client
   - Which client calls exist but have NO corresponding server route
   - What needs to be built from scratch

---

## How To Audit

### Step 1 — Read memory.md first
The `memory.md` file has complete project context. Read it fully before touching any code file.

### Step 2 — Audit Backend (`protego-server/src/`)
For each route file, check:
- Does the route exist in `routes/*.js`?
- Does the controller handler exist in `controllers/*.js`?
- Does the service method exist in `services/*.js`?
- Does the repository method exist in `repositories/*.js`?
- Is the middleware (`authMiddleware`) applied correctly?
- Are there any obvious logic bugs (wrong field names, missing await, wrong status codes)?

### Step 3 — Audit Frontend (`protego-client/src/`)
For each screen file, check:
- Is it a placeholder (returns just `<View><Text>Screen Name</Text></View>`) or fully implemented?
- Does it use `theme.colors.*` from `useAppTheme()` or hardcoded hex colors?
- Does it have `ThemeToggle` component in the header?
- If it has a `MapView`, does it have a fullscreen expand button + Modal?
- Does it handle loading/error states?
- Are all API calls using the correct typed functions from `src/api/*.ts`?

### Step 4 — API Integration Matrix
Create a table like this for EVERY API endpoint:

| Endpoint | Server Route | Server Handler | Client API fn | Called In Screen | Status |
|----------|-------------|----------------|---------------|-----------------|--------|
| POST /auth/register | ✅ | ✅ | ✅ authApi.register | RegisterScreen | ✅ COMPLETE |
| POST /auth/login | ✅ | ✅ | ✅ authApi.login | LoginScreen | ✅ COMPLETE |
| ... | | | | | |

Status values:
- ✅ COMPLETE — server + client + UI all working
- ⚠️ PARTIAL — exists but has known bugs or incomplete implementation
- 🔴 SERVER ONLY — route exists, no client call
- 🔵 CLIENT ONLY — client calls it, no server route
- ❌ MISSING — neither server nor client, needs to be built

### Step 5 — Screen Audit Matrix
For each screen:

| Screen | Status | Theme-aware | ThemeToggle | Fullscreen Map | API Calls | Issues |
|--------|--------|-------------|-------------|----------------|-----------|--------|

### Step 6 — Bug Catalog
List every bug found with:
- File path
- Line number (if possible)
- Description
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Fix suggestion

---

## Known Issues to Verify (from memory.md — confirm these in actual code)

1. **Child history security guard** — `location.controller.js` getHistory only allows `pairedWith === targetUserId`, blocks child from fetching own history
2. **Duplicate location saves** — check if `ChildHomeScreen.tsx` watchPositionAsync callback calls `locationApi.updateLocation()` (should NOT — only `setMyLocation`)
3. **Theme inconsistency** — which screens still have hardcoded `'#fff'` or `'#000'` or import from `constants/theme.ts` instead of `useAppTheme()`
4. **ThemeToggle missing** — which screens are missing the toggle
5. **Fullscreen map** — which MapView screens lack the expand modal
6. **mapStyles duplication** — darkMapStyle/lightMapStyle defined multiple times across screens
7. **ORS API key** — hardcoded in `directions.api.ts` (security issue)
8. **BASE_URL** — hardcoded in `client.ts` (should be env var)
9. **locationTask.service.ts import** — verify it's imported at App.tsx root level
10. **pairedWith in auth response** — verify ALL auth service methods return pairedWith in user object
11. **Socket room ID** — verify EXACTLY `[parentId, childId].sort().join('-')` in ALL 3 places: socket.js, location.service.js, geofence.service.js

---

## Output Format for `remainingwork.md`

Structure the output EXACTLY like this:

```markdown
# Protego — Remaining Work & Audit Report
Generated: [date]

## Executive Summary
[2-3 sentences on overall project health and what's left]

## 1. API Integration Matrix
[Full table of every endpoint — server + client status]

## 2. Screen Audit Matrix  
[Full table of every screen — completeness + issues]

## 3. Bug Catalog
[Every bug found, severity, fix]

## 4. Missing Features (not started)
[Things that need to be built from scratch]

## 5. Wrong Implementations (built but incorrect)
[Things that exist but work incorrectly]

## 6. Security Issues
[Exposed keys, missing auth guards, etc.]

## 7. Performance Issues
[Redundant calls, missing caching, etc.]

## 8. Priority Queue (what to fix first)
[Ordered list: CRITICAL → HIGH → MEDIUM → LOW]

## 9. Estimated Effort
[Rough time estimate per remaining task]
```

---

## Important Rules

- **Do NOT modify any code** — this is an audit-only task
- **Do NOT assume something works** — check the actual file
- If a file is not accessible, note it as "could not verify"
- Be specific: include file paths and function/variable names
- If you find something NOT in `memory.md`'s known bugs, flag it as "newly discovered"
- Check `app.json` for correct permissions (ACCESS_BACKGROUND_LOCATION, FOREGROUND_SERVICE)
- Check package.json versions for both projects — flag any mismatched peer dependencies

---

## Reference: All Expected API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login  
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/2fa/setup
- POST /api/auth/2fa/enable
- POST /api/auth/2fa/validate

### Pairing
- POST /api/pair/generate
- POST /api/pair/join
- DELETE /api/pair/unpair
- GET /api/pair/paired-user

### Location
- POST /api/location/update
- POST /api/location/sync-batch
- GET /api/location/latest/:userId
- GET /api/location/history/:userId
- GET /api/location/sos/:userId

### Geofence
- POST /api/geofence/create
- GET /api/geofence/parent
- GET /api/geofence/child
- PUT /api/geofence/:id
- DELETE /api/geofence/:id
- POST /api/geofence/breach

### User
- GET /api/user/profile
- PATCH /api/user/profile
- DELETE /api/user/account

### External APIs (client-side)
- OpenRouteService POST directions (directions.api.ts)

---

## Reference: All Expected Screens

### Auth
- LoginScreen
- RegisterScreen
- TwoFactorScreen
- PairingScreen

### Parent
- ParentHomeScreen
- ZonesScreen
- CreateZoneScreen
- HistoryScreen
- ProfileScreen

### Child
- ChildHomeScreen
- ChildHistoryScreen
- ChildProfileScreen

---

Begin the audit now. Read all files systematically before writing anything. Generate `remainingwork.md` only after completing the full audit.
