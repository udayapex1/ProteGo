# Protego Backend Documentation

This document describes the current backend implementation in this repository. It is based on the source code under `src/`, `server.js`, `package.json`, and the environment variable names in `.env`.

## Project Overview

Protego is an Express.js backend for a parent-child safety and tracking application. It supports user authentication, JWT refresh tokens, optional 2FA, parent-child pairing, live and historical location tracking, SOS alerts, geofence management, email notifications, Redis, MongoDB, and Socket.IO real-time events.

## Runtime Stack

- Runtime: Node.js with ES modules (`"type": "module"`)
- API framework: Express 5
- Database: MongoDB through Mongoose
- Cache: Redis
- Realtime: Socket.IO
- Auth: JSON Web Tokens
- Password hashing: bcryptjs
- Email: Nodemailer using Gmail service
- 2FA: speakeasy TOTP plus QR code generation

## Scripts

```bash
npm start
npm run dev
npm test
```

- `npm start`: runs `node server.js`
- `npm run dev`: runs `nodemon server.js`
- `npm test`: currently exits with `Error: no test specified`

## Entry Point

File: `server.js`

Startup flow:

1. Loads environment variables with `dotenv.config()`.
2. Imports and initializes Redis from `src/config/redis.js`.
3. Connects MongoDB with `connedtDB()` from `src/config/db.js`.
4. Creates an HTTP server from the Express app.
5. Initializes Socket.IO.
6. Listens on `process.env.PORT || 5000`.

## Express App

File: `src/app.js`

Global middleware:

- `helmet()`
- `cors()`
- `express.json()`

Mounted routes:

- `/api/auth` -> `src/routes/auth.routes.js`
- `/api/pair` -> `src/routes/pairing.routes.js`
- `/api/location` -> `src/routes/location.routes.js`
- `/api/geofence` -> `src/routes/geofence.routes.js`
- `/api/user` -> `src/routes/user.routes.js`

Health/root endpoint:

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | No | Returns `{ "message": "Protego API running" }` |

## Environment Variables

The `.env` file should define these variable names. Do not commit real secret values.

| Variable | Used By | Purpose |
| --- | --- | --- |
| `PORT` | `server.js` | HTTP port; defaults to `5000` |
| `MONGO_URI` | `src/config/db.js` | MongoDB connection string |
| `REDIS_URL` | `src/config/redis.js` | Redis connection URL |
| `EMAIL_USER` | `src/utils/mailer.js` | Gmail sender account |
| `EMAIL_PASS` | `src/utils/mailer.js` | Gmail app password or auth password |
| `JWT_ACCESS_SECRET` | `src/utils/jwt.js` | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | `src/utils/jwt.js` | JWT refresh token signing secret |
| `CLIENT_URL` | `src/services/auth.service.js` | Optional frontend URL for password reset links; defaults to `http://localhost:3000` |

## Authentication

Protected REST routes use `src/middlewares/auth.middleware.js`.

Required request header:

```http
Authorization: Bearer <accessToken>
```

Behavior:

- Reads the bearer token from `req.headers.authorization`.
- Verifies it with `JWT_ACCESS_SECRET`.
- Adds decoded token data to `req.user`.
- Expected decoded fields: `userId`, `role`.
- Returns `401 { "message": "No token provided" }` when missing.
- Returns `401 { "message": "Invalid or expired token" }` when invalid or expired.

Access token lifetime: `15m`

Refresh token lifetime: `7d`

## API Endpoints

Base URL locally is usually:

```text
http://localhost:5000
```

### Auth API

Base path: `/api/auth`

#### Register

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | No |

Request body:

```json
{
  "name": "Parent User",
  "email": "parent@example.com",
  "password": "password123",
  "role": "parent"
}
```

`role` must be either `parent` or `child`.

Success response: `201`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "name": "Parent User",
    "role": "parent"
  }
}
```

Errors:

- `400 { "message": "Email already registered.." }`
- Other validation or database errors return `400`.

Service method: `authService.register({ name, email, password, role })`

#### Login

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/login` | No |

Request body:

```json
{
  "email": "parent@example.com",
  "password": "password123"
}
```

Success response without 2FA: `200`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "name": "Parent User",
    "role": "parent"
  }
}
```

Success response when 2FA is enabled:

```json
{
  "requiresTwoFactor": true,
  "userId": "..."
}
```

Errors:

- `400 { "message": "Invalid Credentials.." }`
- `400 { "message": "Invalid credentials" }`

Service method: `authService.login({ email, password })`

#### Validate 2FA

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/2fa/validate` | No |

Request body:

```json
{
  "userId": "...",
  "token": "123456"
}
```

Success response: `200`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "name": "Parent User",
    "role": "parent"
  }
}
```

Errors:

- `400 { "message": "User not found" }`
- `400 { "message": "Invalid 2FA code" }`

Service method: `authService.validateTwoFactor({ userId, token })`

#### Refresh Access Token

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/refresh` | No |

Request body:

```json
{
  "refreshToken": "..."
}
```

Success response: `200`

```json
{
  "accessToken": "..."
}
```

Errors:

- `401 { "message": "Invalid refresh token" }`
- JWT verification errors return `401`.

Service method: `authService.refresh(refreshToken)`

#### Logout

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/logout` | Yes |

Request body: none required.

Success response: `200`

```json
{
  "message": "Logged out successfully"
}
```

Behavior:

- Clears the stored refresh token for the authenticated user.

Service method: `authService.logout(userId)`

#### Setup 2FA

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/2fa/setup` | Yes |

Request body: none required.

Success response: `200`

```json
{
  "qrCode": "data:image/png;base64,...",
  "secret": "BASE32SECRET"
}
```

Behavior:

- Generates a TOTP secret for `Protego:<email>`.
- Stores the secret on the user.
- Returns a QR code data URL and the base32 secret.

Service method: `authService.setupTwoFactor(userId)`

#### Enable 2FA

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/2fa/enable` | Yes |

Request body:

```json
{
  "token": "123456"
}
```

Success response: `200`

```json
{
  "message": "2FA enabled successfully"
}
```

Errors:

- `400 { "message": "Invalid 2FA code" }`

Service method: `authService.enableTwoFactor({ userId, token })`

#### Forgot Password

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/forgot-password` | No |

Request body:

```json
{
  "email": "user@example.com"
}
```

Success response: `200`

```json
{
  "message": "If an account exists for that email, a password reset link has been sent"
}
```

Behavior:

- Requires `email`.
- If a user exists, creates a random reset token.
- Stores a SHA-256 hash of the reset token.
- Sets expiry to 15 minutes.
- Sends an email with a frontend reset URL.
- Does not reveal whether the account exists.

Errors:

- `400 { "message": "Email is required" }`
- `400 { "message": "Unable to send password reset email" }`

Service method: `authService.forgotPassword(email)`

#### Reset Password

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/reset-password/:token` | No |

Request body:

```json
{
  "password": "newPassword123"
}
```

Success response: `200`

```json
{
  "message": "Password reset successfully"
}
```

Behavior:

- Hashes the URL token and finds a matching non-expired reset token.
- Requires password length of at least 8 characters.
- Updates the user password.
- Clears reset token, reset expiry, and refresh token.

Errors:

- `400 { "message": "Reset token is required" }`
- `400 { "message": "Password must be at least 8 characters" }`
- `400 { "message": "Reset token is invalid or has expired" }`

Service method: `authService.resetPassword({ token, password })`

### User API

Base path: `/api/user`

All user routes require `Authorization: Bearer <accessToken>`.

#### Get Profile

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/user/profile` | Yes |

Success response: `200`

```json
{
  "id": "...",
  "name": "Parent User",
  "email": "parent@example.com",
  "role": "parent",
  "pairedWith": null,
  "isTwoFactorEnabled": false,
  "createdAt": "..."
}
```

Errors:

- `404 { "message": "User not found" }`

Service method: `userService.getProfile(userId)`

#### Update Profile

| Method | Path | Auth |
| --- | --- | --- |
| PATCH | `/api/user/profile` | Yes |

Request body:

```json
{
  "name": "New Name"
}
```

Only `name` is accepted by the service.

Success response: `200`

```json
{
  "id": "...",
  "name": "New Name",
  "email": "parent@example.com",
  "role": "parent"
}
```

Errors:

- Controller returns `400` for update errors.

Service method: `userService.updateProfile(userId, data)`

#### Delete Account

| Method | Path | Auth |
| --- | --- | --- |
| DELETE | `/api/user/account` | Yes |

Success response: `200`

```json
{
  "message": "Account deleted successfully"
}
```

Behavior:

- If the user is paired, clears `pairedWith` on the other user.
- Deletes the authenticated user.

Errors:

- Controller returns `500` for delete errors.

Service method: `userService.deleteAccount(userId)`

### Pairing API

Base path: `/api/pair`

All pairing routes require `Authorization: Bearer <accessToken>`.

#### Generate Pairing Code

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/pair/generate` | Yes |

Allowed role: `parent`

Success response: `200`

```json
{
  "code": "123456",
  "expiresAt": "..."
}
```

Behavior:

- Only a parent can generate a code.
- User must not already be paired.
- Code is a random 6-digit number.
- Code expires after 15 minutes.
- Stores `pairingCode` and `pairingCodeExpiry` on the parent user.

Errors:

- `400 { "message": "Only parent can generate pairing code" }`
- `400 { "message": "Already paired" }`

Service method: `pairingService.generateCode(userId)`

#### Join With Pairing Code

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/pair/join` | Yes |

Allowed role: `child`

Request body:

```json
{
  "code": "123456"
}
```

Success response: `200`

```json
{
  "message": "Paired successfully"
}
```

Behavior:

- Only a child can join using a code.
- Child must not already be paired.
- Finds a parent with a matching non-expired code.
- Sets `parent.pairedWith = child._id`.
- Clears parent pairing code fields.
- Sets `child.pairedWith = parent._id`.

Errors:

- `400 { "message": "Only child can join with code" }`
- `400 { "message": "Already paired" }`
- `400 { "message": "Invalid or expired code" }`

Service method: `pairingService.joinWithCode(userId, code)`

#### Unpair

| Method | Path | Auth |
| --- | --- | --- |
| DELETE | `/api/pair/unpair` | Yes |

Success response: `200`

```json
{
  "message": "Unpaired successfully"
}
```

Behavior:

- Requires the authenticated user to be paired.
- Clears `pairedWith` on both users.

Errors:

- `400 { "message": "Not paired" }`

Service method: `pairingService.unpair(userId)`

#### Get Paired User

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/pair/paired-user` | Yes |

Success response: `200`

```json
{
  "id": "...",
  "name": "Child User",
  "role": "child"
}
```

Errors:

- `400 { "message": "Not paired" }`

Service method: `pairingService.getPairedUser(userId)`

### Location API

Base path: `/api/location`

All location routes require `Authorization: Bearer <accessToken>`.

#### Update Location

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/location/update` | Yes |

Typical caller: child device.

Request body:

```json
{
  "latitude": 28.6139,
  "longitude": 77.209,
  "battery": 87,
  "network": "online",
  "isSOS": false,
  "timestamp": "2026-06-17T10:00:00.000Z"
}
```

Fields:

- `latitude`: used as GeoJSON coordinate latitude.
- `longitude`: used as GeoJSON coordinate longitude.
- `battery`: required by schema, number from 0 to 100.
- `network`: required by schema, either `online` or `offline`.
- `isSOS`: optional boolean, defaults to `false`.
- `timestamp`: optional, used as `createdAt`; defaults to current time.

Success response: `200`

Returns the saved MongoDB location document.

Behavior:

- Saves a `Location` document with GeoJSON coordinates `[longitude, latitude]`.
- Attempts to cache latest location in Redis with key `location:<userId>` and 5 minute TTL.
- If the user is paired, emits `location:update` to the pair room.
- If `isSOS` is true, emits `sos:alert` and emails the paired parent.

Errors:

- Controller returns `500 { "message": "Internal server error updating telemetry." }` for failures.

Service method: `locationService.updateLocation(userId, data)`

#### Sync Batch

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/location/sync-batch` | Yes |

Typical caller: child device after offline tracking.

Request body:

```json
{
  "locations": [
    {
      "latitude": 28.6139,
      "longitude": 77.209,
      "battery": 87,
      "network": "online",
      "isSOS": false,
      "timestamp": "2026-06-17T10:00:00.000Z"
    }
  ]
}
```

Success response: `200`

```json
{
  "synced": 1
}
```

Behavior:

- Requires `locations` to be an array.
- Inserts all locations with `Location.insertMany`.
- Does not emit socket events for each historical point.

Errors:

- `400 { "message": "Invalid payload format. Expected 'locations' array." }`
- Controller returns `500 { "message": "Internal server error processing historical sync batch." }` for processing failures.

Service method: `locationService.syncBatch(userId, locations)`

#### Get Latest Location

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/location/latest/:userId` | Yes |

Authorization rule:

- The authenticated user must have `pairedWith` equal to `:userId`.
- If not, returns `403`.

Success response: `200`

Current implementation returns the latest MongoDB location document for the target user.

Example response:

```json
{
  "_id": "...",
  "userId": "...",
  "location": {
    "type": "Point",
    "coordinates": [77.209, 28.6139]
  },
  "battery": 87,
  "network": "online",
  "isSOS": false,
  "createdAt": "..."
}
```

Errors:

- `403 { "message": "Access Denied: You are not paired with this device." }`
- Controller returns `500 { "message": "Internal server error fetching latest telemetry." }`

Service method: `locationService.getLatest(userId)`

#### Get Location History

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/location/history/:userId?hours=24` | Yes |

Authorization rule:

- The authenticated user must have `pairedWith` equal to `:userId`.
- If not, returns `403`.

Query parameters:

| Name | Required | Default | Notes |
| --- | --- | --- | --- |
| `hours` | No | `24` | Must parse as an integer. Repository caps it at `168` hours, or 7 days. |

Success response: `200`

Returns an array sorted by `createdAt` ascending.

Each item includes:

- `location`
- `battery`
- `network`
- `isSOS`
- `createdAt`

Errors:

- `400 { "message": "Query parameter 'hours' must be a valid integer." }`
- `403 { "message": "Access Denied: You are not paired with this device." }`
- Controller returns `500 { "message": "Internal server error fetching route history." }`

Service method: `locationService.getHistory(userId, hours)`

#### Get SOS Locations

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/location/sos/:userId` | Yes |

Authorization rule:

- The authenticated user must have `pairedWith` equal to `:userId`.
- If not, returns `403`.

Success response: `200`

Returns SOS location records sorted by `createdAt` descending.

Each item includes:

- `location`
- `battery`
- `createdAt`

Errors:

- `403 { "message": "Access Denied: You are not paired with this device." }`
- Controller returns `500 { "message": "Internal server error fetching emergency logs." }`

Service method: `locationService.getSOSLocations(userId)`

### Geofence API

Base path: `/api/geofence`

All geofence routes require `Authorization: Bearer <accessToken>`.

#### Create Geofence

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/geofence/create` | Yes |

Typical caller: parent.

Request body:

```json
{
  "name": "School",
  "latitude": 28.6139,
  "longitude": 77.209,
  "radius": 500
}
```

Fields:

- `name`: required.
- `latitude`: required.
- `longitude`: required.
- `radius`: required; schema allows 30 to 10000.

Success response: `201`

Returns the created geofence document.

Behavior:

- Requires the authenticated user to be paired with a child.
- Stores `parentId` as the authenticated user.
- Stores `childId` as `parent.pairedWith`.
- Stores center as GeoJSON `[longitude, latitude]`.

Errors:

- `400 { "message": "Validation Failed: Missing required parameters for zone setup." }`
- `400 { "message": "Action Denied: Not paired with any child account." }`
- Other validation errors return `400`.

Service method: `geofenceService.create(parentId, data)`

#### Get Parent Zones

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/geofence/parent` | Yes |

Success response: `200`

Returns active geofences where `parentId` is the authenticated user.

Service method: `geofenceService.getParentZones(parentId)`

#### Get Child Zones

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/geofence/child` | Yes |

Success response: `200`

Returns active geofences where `childId` is the authenticated user.

Each item includes:

- `name`
- `center`
- `radius`

Service method: `geofenceService.getChildZones(childId)`

#### Delete/Deactivate Geofence

| Method | Path | Auth |
| --- | --- | --- |
| DELETE | `/api/geofence/:id` | Yes |

Success response: `200`

```json
{
  "message": "Zone deleted successfully"
}
```

Behavior:

- Soft deletes by setting `isActive` to `false`.
- Only succeeds when `_id` matches `:id` and `parentId` is the authenticated user.

Errors:

- `400 { "message": "Zone not found or unauthorized deletion request." }`

Service method: `geofenceService.deactivate(geofenceId, parentId)`

#### Handle Geofence Breach

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/geofence/breach` | Yes |

Typical caller: child device.

Request body:

```json
{
  "geofenceId": "...",
  "geofenceName": "School",
  "type": "exit",
  "latitude": 28.6139,
  "longitude": 77.209
}
```

Fields:

- `geofenceId`: geofence identifier.
- `geofenceName`: display name used in event and email.
- `type`: expected to be `enter` or `exit`.
- `latitude`: current latitude.
- `longitude`: current longitude.

Success response: `200`

```json
{
  "message": "Breach alert metrics routed successfully."
}
```

Behavior:

- Requires the authenticated child to be paired.
- Emits `geofence:breach` to the pair room.
- Sends a background email notification to the paired parent.

Errors:

- `500 { "message": "Action Denied: Device is unlinked." }`
- Other controller failures return `500`.

Service method: `geofenceService.handleBreach(childId, data)`

## Socket.IO

File: `src/config/socket.js`

Socket authentication:

Clients must pass an access token in the Socket.IO auth payload:

```js
io("http://localhost:5000", {
  auth: {
    token: accessToken
  }
});
```

Connection middleware:

- Verifies the token with `JWT_ACCESS_SECRET`.
- Sets `socket.userId` and `socket.role`.
- Rejects missing tokens with `No token provided`.
- Rejects invalid tokens with `Invalid token`.

Room behavior:

- On connection, the server loads the connected user.
- If the user has `pairedWith`, the socket joins a room.
- Room ID format:

```text
<smaller/sorted-user-id>-<larger/sorted-user-id>
```

The room is made by sorting the authenticated user ID and paired user ID as strings and joining them with `-`.

### Emitted Events

#### `location:update`

Emitted by `locationService.updateLocation` to the paired room.

Payload:

```json
{
  "userId": "...",
  "latitude": 28.6139,
  "longitude": 77.209,
  "battery": 87,
  "network": "online",
  "isSOS": false,
  "timestamp": "..."
}
```

#### `sos:alert`

Emitted by `locationService.updateLocation` when `isSOS` is true.

Payload:

```json
{
  "userId": "...",
  "latitude": 28.6139,
  "longitude": 77.209,
  "battery": 87,
  "timestamp": "..."
}
```

Also triggers a background email to the paired parent if the parent has an email.

#### `geofence:breach`

Emitted by `geofenceService.handleBreach`.

Payload:

```json
{
  "childId": "...",
  "geofenceId": "...",
  "geofenceName": "School",
  "type": "exit",
  "latitude": 28.6139,
  "longitude": 77.209,
  "timestamp": 1781690400000
}
```

Also triggers a background email to the paired parent if the parent has an email.

### Listened Events

The server currently listens only for:

- `disconnect`

There are no custom client-to-server socket events currently registered.

## Data Models

### User

File: `src/models/user.model.js`

Collection model: `User`

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | String | Yes | Trimmed |
| `email` | String | Yes | Unique, lowercase, trimmed |
| `password` | String | Yes | Hashed with bcrypt before save |
| `role` | String | Yes | Enum: `parent`, `child` |
| `pairedWith` | ObjectId ref `User` | No | Defaults to `null` |
| `pairingCode` | String | No | Defaults to `null` |
| `pairingCodeExpiry` | Date | No | Defaults to `null` |
| `refreshToken` | String | No | Stored current refresh token |
| `resetPasswordToken` | String | No | SHA-256 hash of reset token |
| `resetPasswordExpiry` | Date | No | Expiry for password reset |
| `twoFactorSecret` | String | No | Base32 TOTP secret |
| `isTwoFactorEnabled` | Boolean | No | Defaults to `false` |
| `biometricEnabled` | Boolean | No | Defaults to `false`; only parent users can enable |
| `createdAt` | Date | Auto | From timestamps |
| `updatedAt` | Date | Auto | From timestamps |

Methods:

- `comparePassword(password)`: compares plaintext password with stored hash.

Hooks:

- `pre('save')`: hashes `password` when modified.

### Location

File: `src/models/location.model.js`

Collection model: `Location`

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `userId` | ObjectId ref `User` | Yes | Indexed |
| `location.type` | String | Yes | Enum: `Point`; defaults to `Point` |
| `location.coordinates` | Number array | Yes | GeoJSON order: `[longitude, latitude]` |
| `battery` | Number | Yes | Min `0`, max `100` |
| `network` | String | Yes | Enum: `online`, `offline` |
| `isSOS` | Boolean | No | Defaults to `false`; indexed |
| `createdAt` | Date | No | Defaults to now; TTL expires after 604800 seconds, or 7 days |

Indexes:

- `{ location: "2dsphere" }`
- `{ userId: 1, createdAt: -1 }`
- TTL on `createdAt`

Note: `src/models/loaction.model.js` exists and appears to be a duplicate of `location.model.js` with a misspelled filename. The active imports use `location.model.js`.

### Geofence

File: `src/models/geofence.model.js`

Collection model: `Geofence`

Fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `parentId` | ObjectId ref `User` | Yes | Indexed |
| `childId` | ObjectId ref `User` | Yes | Covered by compound index |
| `name` | String | Yes | Trimmed |
| `center.type` | String | Yes | Enum: `Point`; defaults to `Point` |
| `center.coordinates` | Number array | Yes | GeoJSON order: `[longitude, latitude]` |
| `radius` | Number | Yes | Min `30`, max `10000`; meters |
| `isActive` | Boolean | No | Defaults to `true` |
| `createdAt` | Date | Auto | From timestamps |
| `updatedAt` | Date | Auto | From timestamps |

Indexes:

- `{ childId: 1, isActive: 1 }`
- `{ parentId: 1, isActive: 1 }`

## Internal Methods

### Controllers

`src/controllers/auth.controller.js`

- `register(req, res)`
- `login(req, res)`
- `validateTwoFactor(req, res)`
- `refresh(req, res)`
- `logout(req, res)`
- `setupTwoFactor(req, res)`
- `enableTwoFactor(req, res)`
- `forgotPassword(req, res)`
- `resetPassword(req, res)`

`src/controllers/user.controller.js`

- `getProfile(req, res)`
- `updateProfile(req, res)`
- `deleteAccount(req, res)`

`src/controllers/pairing.controller.js`

- `generateCode(req, res)`
- `joinWithCode(req, res)`
- `unpair(req, res)`
- `getPairedUser(req, res)`

`src/controllers/location.controller.js`

- `updateLocation(req, res)`
- `syncBatch(req, res)`
- `getLatest(req, res)`
- `getHistory(req, res)`
- `getSOSLocations(req, res)`

`src/controllers/geofence.controller.js`

- `create(req, res)`
- `getParentZones(req, res)`
- `getChildZones(req, res)`
- `deactivate(req, res)`
- `handleBreach(req, res)`

### Services

`src/services/auth.service.js`

- `register({ name, email, password, role })`
- `login({ email, password })`
- `validateTwoFactor({ userId, token })`
- `refresh(token)`
- `logout(userId)`
- `setupTwoFactor(userId)`
- `enableTwoFactor({ userId, token })`
- `forgotPassword(email)`
- `resetPassword({ token, password })`

`src/services/user.service.js`

- `getProfile(userId)`
- `updateProfile(userId, data)`
- `deleteAccount(userId)`

`src/services/pairing.service.js`

- `generateCode(userId)`
- `joinWithCode(userId, code)`
- `unpair(userId)`
- `getPairedUser(userId)`

`src/services/location.service.js`

- `updateLocation(userId, data)`
- `syncBatch(userId, locations)`
- `getLatest(userId)`
- `getHistory(userId, hours)`
- `getSOSLocations(userId)`

`src/services/geofence.service.js`

- `create(parentId, data)`
- `getParentZones(parentId)`
- `getChildZones(childId)`
- `deactivate(geofenceId, parentId)`
- `handleBreach(childId, data)`

### Repositories

`src/repositories/user.repository.js`

- `create(data)`
- `findByEmail(email)`
- `findById(id)`
- `findByValidResetToken(resetPasswordToken)`
- `updateById(id, data)`
- `deleteById(id)`
- `findByPairingCode(code)`

`src/repositories/pairing.repository.js`

- `findByPairingCode(code)`
- `updateById(id, data)`
- `findById(id)`

`src/repositories/location.repository.js`

- `save(data)`
- `saveBatch(locations)`
- `getLatest(userId)`
- `getHistory(userId, hours = 24)`
- `getSOSLocations(userId)`

Current implementation note:

- `save` is defined twice in the object. In JavaScript object literals, the later `save` overrides the earlier one. The active `save` persists to MongoDB and writes a Redis key `location:<userId>` for 300 seconds.
- `getLatest` is also defined twice. The later `getLatest` overrides the earlier cached version, so the active implementation reads directly from MongoDB and does not use the Redis cache.

`src/repositories/geofence.repository.js`

- `create(data)`
- `findByParentId(parentId)`
- `findByChildId(childId)`
- `findById(id)`
- `deactivate(id, parentId)`

### Utilities

`src/utils/jwt.js`

- `generateAccessToken(userId, role)`: JWT with `{ userId, role }`, expires in 15 minutes.
- `generateRefreshToken(userId)`: JWT with `{ userId }`, expires in 7 days.
- `verifyAccessToken(token)`
- `verifyRefreshToken(token)`

`src/utils/totp.js`

- `generateTOTPSecret(email)`: creates a TOTP secret named `Protego:<email>`.
- `verifyTOTP(secret, token)`: verifies a base32 TOTP token with `window: 1`.
- `generateQRCode(otpauthUrl)`: returns a QR code data URL.

`src/utils/mailer.js`

- `sendMail({ to, subject, html })`: sends HTML email using Gmail service and `EMAIL_USER` / `EMAIL_PASS`.

### Config

`src/config/db.js`

- `connedtDB()`: connects to MongoDB using `MONGO_URI`.
- Logs MongoDB host on success.
- Exits the process on connection failure.

`src/config/redis.js`

- Creates a Redis client using `REDIS_URL`.
- Logs Redis connect and error events.
- Calls `await redisClient.connect()` at module load.
- Exports the Redis client.

`src/config/socket.js`

- `initSocket(server)`: creates the Socket.IO server, configures auth middleware, and joins paired rooms.
- `getIO()`: returns the initialized Socket.IO instance or throws if not initialized.

## Security and Authorization Rules

- REST protected routes use JWT access tokens.
- Refresh token rotation is partial: a new refresh token is issued on register/login/2FA validation and stored on the user; refresh requires the provided token to match the stored token.
- Logout clears the stored refresh token.
- Parent-child pairing is stored bidirectionally using `pairedWith`.
- Location read endpoints require the requester to be directly paired with the target `userId`.
- Geofence deletion requires the requester to be the geofence `parentId`.
- Password reset tokens are stored hashed and expire after 15 minutes.
- 2FA secrets are stored on the user document.

## Current Implementation Notes

- `src/config/db.js` exports `connedtDB`, which appears to be a misspelling of `connectDB`, but it is imported consistently.
- `src/models/loaction.model.js` appears to be a duplicate misspelled copy of `location.model.js` and is not used by current imports.
- `src/middlewares/validate.middleware.js` is empty.
- `express-rate-limit` is installed but no rate limiting middleware is currently configured.
- `authMiddleware` is imported in `src/app.js` but global auth is commented out.
- Geofence create validation uses `if (!data.longitude || !data.latitude || !data.radius || !data.name)`, so valid zero coordinates would be rejected.
- Location repository writes latest location to Redis in `save`, but active `getLatest` currently reads from MongoDB because of the duplicate `getLatest` method definition.
- Redis connects during module import. If Redis is unavailable, startup may fail or repeatedly log connection errors depending on client behavior.
- Email sends for SOS and geofence breach are background fire-and-forget operations.

## Example Client Flow

Parent flow:

1. `POST /api/auth/register` with role `parent`.
2. `POST /api/pair/generate` with parent access token.
3. Share the returned code with the child.
4. Connect Socket.IO using the access token.
5. Use location and geofence read endpoints after pairing.

Child flow:

1. `POST /api/auth/register` with role `child`.
2. `POST /api/pair/join` with child access token and parent code.
3. Connect Socket.IO using the access token.
4. Send `POST /api/location/update` for live location.
5. Send `POST /api/location/sync-batch` after offline tracking.
6. Send `POST /api/geofence/breach` when entering or exiting a monitored geofence.

## Endpoint Summary

| Method | Path | Auth | Main Handler |
| --- | --- | --- | --- |
| GET | `/` | No | Root health response |
| POST | `/api/auth/register` | No | `authControllers.register` |
| POST | `/api/auth/login` | No | `authControllers.login` |
| POST | `/api/auth/forgot-password` | No | `authControllers.forgotPassword` |
| POST | `/api/auth/reset-password/:token` | No | `authControllers.resetPassword` |
| POST | `/api/auth/2fa/validate` | No | `authControllers.validateTwoFactor` |
| POST | `/api/auth/refresh` | No | `authControllers.refresh` |
| POST | `/api/auth/logout` | Yes | `authControllers.logout` |
| POST | `/api/auth/2fa/setup` | Yes | `authControllers.setupTwoFactor` |
| POST | `/api/auth/2fa/enable` | Yes | `authControllers.enableTwoFactor` |
| GET | `/api/user/profile` | Yes | `userController.getProfile` |
| PATCH | `/api/user/profile` | Yes | `userController.updateProfile` |
| DELETE | `/api/user/account` | Yes | `userController.deleteAccount` |
| POST | `/api/pair/generate` | Yes | `pairingController.generateCode` |
| POST | `/api/pair/join` | Yes | `pairingController.joinWithCode` |
| DELETE | `/api/pair/unpair` | Yes | `pairingController.unpair` |
| GET | `/api/pair/paired-user` | Yes | `pairingController.getPairedUser` |
| POST | `/api/location/update` | Yes | `locationController.updateLocation` |
| POST | `/api/location/sync-batch` | Yes | `locationController.syncBatch` |
| GET | `/api/location/latest/:userId` | Yes | `locationController.getLatest` |
| GET | `/api/location/history/:userId` | Yes | `locationController.getHistory` |
| GET | `/api/location/sos/:userId` | Yes | `locationController.getSOSLocations` |
| POST | `/api/geofence/create` | Yes | `geofenceController.create` |
| GET | `/api/geofence/parent` | Yes | `geofenceController.getParentZones` |
| GET | `/api/geofence/child` | Yes | `geofenceController.getChildZones` |
| DELETE | `/api/geofence/:id` | Yes | `geofenceController.deactivate` |
| POST | `/api/geofence/breach` | Yes | `geofenceController.handleBreach` |
