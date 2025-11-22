# Auth — Next.js Example

Lightweight Next.js (App Router) example app demonstrating email/password sign-up and session handling with an encrypted session store backed by SQLite. Encrypted session payloads (JWE strings) are persisted in the `sessions` table (`session_data` column) of the local SQLite database.

This repository contains a minimal auth flow used for learning and small projects. It uses:

- Next.js (app directory)
- better-sqlite3 for a simple local database (`src/lib/db.js`)
- Node `crypto` + `jose` for encrypting session payloads (`src/lib/session.js`)
- Server Actions for signup/login + cookie management (`src/lib/action.js`)

Key files

- `src/lib/db.js` — initializes SQLite schema (`users`, `sessions`, `trainings`).
- `src/lib/hash.js` — password hashing and verification using Node `scrypt`.
- `src/lib/user.js` — create user and lookup helpers.
- `src/lib/session.js` — encrypt/decrypt session payloads and helpers to create/validate sessions.
- `src/lib/action.js` — server actions: `signup`, `login`, `logout` that wire UI forms to the backend.
- `src/components/auth-form.js` — basic sign-up / login form used by pages.
- `src/components/logout.js` — logout form (Server Action wired via a client component).

Setup

1. Install dependencies

```powershell
npm install
```

2. Environment

Create a `.env.local` at the project root with these variables (example):

```
SESSION_SECRET=change_this_to_a_long_random_string_at_least_32_chars
SESSION_SALT=optional_app_salt_default_used_when_missing
```

- `SESSION_SECRET` is required and used to derive the symmetric key for JWE session encryption.
- `SESSION_SALT` is optional but recommended for key derivation/versioning.

3. Run the dev server

```powershell
npm run dev
```

How it works

- Sign-up: the Server Action `signup` calls `createUser` to hash the password and insert a user record, then creates a session. The session payload is encrypted with `jose` and stored in the `sessions` table; an HttpOnly cookie is set.
- Login: `login` verifies the password and creates a session the same way.
- Sessions: session payloads include `userId` and `expiresAt`. The app provides helpers to validate and refresh sessions. For security, cookie mutations (set/delete) are performed inside Server Actions or Route Handlers only.
- Sessions: session payloads include `userId` and `expiresAt`. The encrypted session JWE is stored in the `sessions` table (column `session_data`) in the SQLite database; helpers are provided to validate and refresh sessions. For security, cookie mutations (set/delete) are performed inside Server Actions or Route Handlers only.

Notes & recommendations

- Passwords are hashed with Node `scrypt` (see `src/lib/hash.js`). You may switch to `argon2` for a modern KDF if desired.
- The session storage uses JWE (via `jose`) to encrypt session payloads before storing them in the DB. Keep `SESSION_SECRET` safe and rotate carefully (rotating invalidates existing sessions).
- Consider storing only a `sessionId` in the cookie and keeping session data server-side if you want smaller cookies.
- The project includes a top-centered toast style (`#error-message-toast`) — see `src/app/globals.css`.

Common troubleshooting

- "Cookies can only be modified in a Server Action or Route Handler": ensure any `cookies().set()`/`cookies().delete()` calls are inside a Server Action (look for `"use server"`) or a route handler.
- Server redirects (`redirect()`) throw a special control exception — do not silently catch it in your action's `try/catch` or rethrow it so Next can handle navigation.
- If middleware/proxy is not triggering, ensure the file is named `middleware.js` at project root (or `src/middleware.js`) and exports `middleware`/`config.matcher`.

Next steps you might want

- Wire the session ID into the cookie (store `sessionId` only) and keep encrypted payload in DB.
- Add scheduled cleanup for expired sessions.
- Add tests for `hashPassword`, `verifyPassword`, and session encryption/decryption.

License

This example is provided as-is for learning purposes.
