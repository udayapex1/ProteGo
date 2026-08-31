# Protego Backend Audit

Audit scope: `protego-server/` (the repository does not contain a top-level `server/` directory). This document reflects the code currently present in the backend and the verification performed on 31 August 2026.

## Executive summary

Protego has a working Express/Mongoose backend foundation for a parent-child safety application. The implemented areas are:

- JWT access and refresh-token authentication.
- Registration, login, logout, password reset, and optional TOTP-based 2FA.
- Parent-child pairing through a six-digit, 15-minute pairing code.
- Live and historical location storage with GeoJSON coordinates.
- Redis caching for the latest location.
- SOS persistence, Socket.IO alerts, and email notifications.
- Parent-managed geofences, child geofence retrieval, breach events, and email alerts.
- User profile read/update and account deletion.
- Helmet, CORS, JSON parsing, MongoDB indexes, a location TTL, and a layered route/controller/service/repository structure.

The backend is not production-ready yet. The most important outstanding work is request validation, role enforcement on every endpoint, centralized error handling, transaction-safe pairing/deletion flows, reliable startup/shutdown handling, and automated tests.

## Project structure

| Area | Files | Responsibility |
|---|---|---|
| Startup | `protego-server/server.js` | Loads configuration, connects MongoDB/Redis, creates HTTP server, initializes Socket.IO, listens on the configured port. |
| Express app | `protego-server/src/app.js` | Security middleware, JSON parsing, route mounting, root health response. |
| Configuration | `src/config/db.js`, `redis.js`, `socket.js` | MongoDB, Redis, and authenticated Socket.IO setup. |
| Routes | `src/routes/*.routes.js` | HTTP method/path definitions and authentication middleware placement. |
| Controllers | `src/controllers/*.controller.js` | Request handling, service invocation, response status mapping. |
| Services | `src/services/*.service.js` | Business rules and orchestration. |
| Repositories | `src/repositories/*.repository.js` | Mongoose persistence and Redis-backed location access. |
| Models | `src/models/*.model.js` | User, location, and geofence schemas/indexes. |
| Middleware | `src/middlewares/auth.middleware.js` | Bearer access-token verification. `validate.middleware.js` is empty. |
| Utilities | `src/utils/*.js` | JWT, TOTP/QR generation, and email delivery. |

`node_modules/` is present locally and is not part of the application source audit.

## Runtime and dependencies

- Node.js ES modules (`"type": "module"`).
- Express 5.
- Mongoose 9 / MongoDB.
- Redis client 6.
- Socket.IO 4.
- `jsonwebtoken` for access and refresh tokens.
- `bcryptjs` for password hashing.
- `speakeasy` and `qrcode` for TOTP 2FA.
- Nodemailer with Gmail transport.
- Helmet, CORS, and `express-rate-limit` are listed in dependencies, but rate limiting is not currently wired into the app.
- `npm start` runs `node server.js`.
- `npm run dev` runs `nodemon server.js`.
- `npm test` is still the default failing placeholder (`Error: no test specified`).

## Startup and infrastructure

`server.js` loads `.env`, imports Redis (which connects during module loading), starts MongoDB, creates an HTTP server from the Express app, initializes Socket.IO, and listens on `PORT` or `5000`.

`db.js` connects to `MONGO_URI`; on failure it logs the error and exits the process.

`redis.js` connects to `REDIS_URL`, logs connect/error events, and exports the client. Redis connection failure is logged, but the startup path can still fail because the module uses top-level `await redisClient.connect()`.

`socket.js`:

- Accepts a token in `socket.handshake.auth.token`.
- Verifies it with the access-token secret.
- Stores `userId` and `role` on the socket.
- Looks up the user pairing and joins a deterministic room: sorted user IDs joined with `-`.
- Exposes `getIO()` for services to emit events.
- Allows all origins (`origin: '*'`), which should be restricted for deployment.

The root endpoint is `GET /` and returns `{ "message": "Protego API running" }`.

## Environment configuration

The backend reads these variable names from `protego-server/.env`:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port; defaults to `5000`. |
| `REDIS_URL` | Redis connection URL. |
| `MONGO_URI` | MongoDB connection string. |
| `EMAIL_USER` | Gmail sender account. |
| `EMAIL_PASS` | Gmail password/app password. |
| `JWT_ACCESS_SECRET` | Access-token signing/verifying secret. |
| `JWT_REFRESH_SECRET` | Refresh-token signing/verifying secret. |

No secret values are reproduced in this audit. The `.env` file should remain untracked and deployment secrets should be supplied by the runtime environment.

## Authentication and account features

### JWT

- Access tokens contain `userId` and `role`; lifetime is 15 minutes.
- Refresh tokens contain `userId`; lifetime is 7 days.
- The refresh token is stored on the user record and checked for exact equality during refresh.
- Logout clears the stored refresh token.
- Refresh returns a new access token but does not rotate the refresh token.
- `authMiddleware` reads `Authorization: Bearer <token>`, verifies the access token, and sets `req.user`.

### Auth endpoints

| Method | Path | Auth | Implemented behavior |
|---|---|---:|---|
| `POST` | `/api/auth/register` | No | Creates a parent or child, hashes the password via the User pre-save hook, stores a refresh token, and returns tokens plus basic user data. |
| `POST` | `/api/auth/login` | No | Validates email/password; returns tokens or `{ requiresTwoFactor: true, userId }` when 2FA is enabled. |
| `POST` | `/api/auth/forgot-password` | No | Stores a hashed, 15-minute reset token and sends a reset email. Uses a generic success response for unknown emails. |
| `POST` | `/api/auth/reset-password/:token` | No | Validates the token and an 8-character minimum password, updates the password, clears reset data, and revokes the refresh token. |
| `POST` | `/api/auth/2fa/validate` | No | Verifies a TOTP code and issues tokens. |
| `POST` | `/api/auth/refresh` | No | Verifies the signed refresh token and stored-token match, then issues an access token. |
| `POST` | `/api/auth/logout` | Yes | Clears the stored refresh token. |
| `POST` | `/api/auth/2fa/setup` | Yes | Generates a TOTP secret, saves it, and returns the secret plus a QR-code data URL. |
| `POST` | `/api/auth/2fa/enable` | Yes | Verifies a supplied TOTP code and enables 2FA. |
| `POST` | `/api/auth/2fa/disable` | Yes | Clears the TOTP secret and disables 2FA. |

## Pairing features

| Method | Path | Auth | Implemented behavior |
|---|---|---:|---|
| `POST` | `/api/pair/generate` | Yes | Parent-only; creates a random six-digit code valid for 15 minutes. |
| `POST` | `/api/pair/join` | Yes | Child-only; validates the active code and writes each user’s `pairedWith` reference. |
| `DELETE` | `/api/pair/unpair` | Yes | Clears `pairedWith` on both accounts. |
| `GET` | `/api/pair/paired-user` | Yes | Returns the paired user’s ID, name, and role. |

Pairing data is stored on the `User` document. The join operation uses two independent updates rather than a MongoDB transaction, so a partial update is possible if the second write fails.

## Location and SOS features

| Method | Path | Auth | Implemented behavior |
|---|---|---:|---|
| `POST` | `/api/location/update` | Yes | Stores one location, updates the Redis latest-location cache for 5 minutes, emits `location:update`, and for SOS emits `sos:alert` and sends an email to the paired parent. |
| `POST` | `/api/location/sync-batch` | Yes | Accepts a `locations` array and inserts historical locations in bulk. |
| `GET` | `/api/location/latest/:userId` | Yes | Returns the latest location from Redis or MongoDB. Allows the requester to access self or the paired user. |
| `GET` | `/api/location/history/:userId` | Yes | Returns chronological history; `hours` defaults to 24 and is capped at 168 hours. Allows self or paired-user access. |
| `GET` | `/api/location/sos/:userId` | Yes | Returns stored SOS locations for self or the paired user. |

Location coordinates are stored as GeoJSON `[longitude, latitude]`. Location documents have a `2dsphere` index, a `{ userId, createdAt }` query index, and a 7-day TTL on `createdAt`.

The single-location path sends notifications asynchronously after persistence, isolating Socket.IO/email failures from the telemetry response. Batch sync currently only persists records: it does not populate Redis, emit live events, or send SOS notifications.

## Geofence features

| Method | Path | Auth | Implemented behavior |
|---|---|---:|---|
| `POST` | `/api/geofence/create` | Yes | Creates an active GeoJSON Point zone for the currently paired child. Radius limits are enforced by the schema: 30–10,000 meters. |
| `GET` | `/api/geofence/parent` | Yes | Returns active zones created by the requester as parent. |
| `GET` | `/api/geofence/child` | Yes | Returns active zones associated with the requester’s child ID; selected fields are limited to name, center, and radius. |
| `DELETE` | `/api/geofence/:id` | Yes | Soft-deactivates a zone only when its `parentId` matches the requester. |
| `PUT` | `/api/geofence/:id` | Yes | Updates name, coordinates, and radius only when the requester owns the zone. |
| `POST` | `/api/geofence/breach` | Yes | Looks up the child’s pair, emits `geofence:breach` to the paired room, and asynchronously emails the parent. |

Geofences have compound indexes on `{ childId, isActive }` and `{ parentId, isActive }`. The service performs basic presence checks, but does not fully validate numeric coordinate ranges, event type, ownership, or role at the service boundary.

## User features

| Method | Path | Auth | Implemented behavior |
|---|---|---:|---|
| `GET` | `/api/user/profile` | Yes | Returns public profile/account metadata without the password or token fields. |
| `PATCH` | `/api/user/profile` | Yes | Currently updates only `name`. |
| `DELETE` | `/api/user/account` | Yes | Unpairs the other account and deletes the requester. |

The User model supports parent/child roles, pairing state, reset-password state, refresh-token state, TOTP state, and parent-only biometric enablement. Passwords are hashed with bcryptjs before save.

## Parent child dashboard

| Method | Path | Auth | Implemented behavior |
|---|---|---:|---|
| `GET` | `/api/child/dashboard` | Parent JWT | Returns the authenticated parent's paired child's safe profile details, pairing status, latest location, complete retained location history, SOS logs, active geofences, and summary counts in one response. |

The dashboard history is currently limited to 168 hours because location documents expire after seven days. The endpoint never returns the child's password, refresh token, reset token, or 2FA secret. Child access is denied unless the authenticated account is a parent with a valid paired child.

## Security and reliability findings

Priority items to address:

1. Add schema/request validation. `validate.middleware.js` is empty. Location endpoints can receive missing/invalid coordinates, battery, network, timestamps, or SOS values. Geofence validation uses truthiness checks, which incorrectly rejects zero and does not enforce latitude/longitude bounds.
2. Enforce roles and ownership consistently. Several authenticated routes rely on IDs or service assumptions without explicitly checking parent/child role. In particular, geofence reads/breach handling and location self-access need clearly defined role rules.
3. Restrict CORS and Socket.IO origins. Both are currently open to every origin.
4. Add rate limiting to login, registration, password reset, pairing-code generation, and 2FA endpoints. The package is installed but unused.
5. Do not log sensitive request bodies or identifying telemetry unnecessarily. `updateLocation` logs telemetry and errors can include the full request body.
6. Use a MongoDB transaction or conditional/atomic update strategy for pairing, unpairing, and account deletion so both sides cannot become inconsistent.
7. Make startup resilient. Handle MongoDB/Redis readiness explicitly, add graceful shutdown for HTTP, MongoDB, and Redis, and avoid relying on top-level Redis connection side effects.
8. Rotate refresh tokens and consider storing a hash rather than the raw refresh token. Add issuer/audience/algorithm expectations to JWT verification.
9. Add centralized error handling and consistent status codes. Current controllers map many validation, authorization, database, and unexpected errors to the same 400/500 responses.
10. Escape or template-safely construct email HTML. User-controlled names and geofence fields are interpolated into HTML.
11. Revisit data retention and privacy. Location data expires after seven days, but Redis keys are not explicitly deleted on account deletion and there is no documented consent/audit policy.

## Testing and verification status

Completed during this audit:

- Read the complete application source under `protego-server/src/`, plus startup, package configuration, existing backend documentation, environment variable names, and the Socket.IO test script.
- Ran `node --check` against all backend JavaScript files outside `node_modules`: passed.
- Ran the configured npm test command: failed because `package.json` still defines the placeholder test that exits with `Error: no test specified`.

Existing `protego-server/test.js` is a manual Socket.IO listener, not an automated test suite. It uses `http://localhost:8000` while the server defaults to port `5000`, and it contains a hard-coded JWT; it should be replaced with safe, repeatable integration tests and environment-provided credentials.

## Recommended next implementation order

1. Add request validation and centralized error handling.
2. Add authorization helpers for role, pairing, and resource ownership.
3. Add automated unit/integration tests for auth, pairing, location access, SOS, and geofences.
4. Harden CORS, rate limits, secrets, logging, token rotation, and startup/shutdown behavior.
5. Add transaction-safe persistence and cleanup for paired accounts and location cache entries.
6. Update API documentation/OpenAPI examples and align the client with the final response/error contracts.
