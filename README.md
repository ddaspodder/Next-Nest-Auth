## Project: Next + Nest Authentication

This repository contains a Next.js application (`Next/`) and a NestJS REST API (`nest-auth/`) implementing a cookie-based JWT authentication system with access & refresh tokens. This README documents the full authentication interaction: how the browser (Next client), Next server runtime (server actions, middleware), and Nest backend cooperate to sign up, sign in, authorize protected resources, refresh sessions, and manage token rotation.

---

## 1. Architecture Overview

| Layer                                    | Responsibilities                                                                               | Relevant Code                                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Browser (Next Client)                    | Renders UI, submits forms, triggers server actions / fetch calls. Sends cookies automatically. | Components in `Next/src/components/`, pages in `Next/src/app/`                                                    |
| Next Server (Server Actions, Middleware) | Reads/writes HTTP-only cookies, pre-validates sessions, initiates refresh, redirects.          | `Next/src/lib/action.js`, `Next/src/proxy.js` (or middleware)                                                     |
| Nest REST API                            | User auth endpoints (signup/signin/refresh), token issuance & validation, protected data.      | `nest-auth/src/user/*.ts`, guards in `nest-auth/src/guards/auth.guard.ts`, utils in `nest-auth/src/utils/sign.ts` |

Data flow is predominantly request/response with cookies as state carriers; no client-side token storage in `localStorage` or `sessionStorage` (security: prevents direct JS access).

---

## 2. Token Types & Purpose

| Token         | Format                 | Typical Expiry   | Stored                          | Purpose                                  |
| ------------- | ---------------------- | ---------------- | ------------------------------- | ---------------------------------------- |
| Access Token  | JWT                    | Short (e.g. 15m) | HttpOnly cookie `access-token`  | Authorize protected API/page access      |
| Refresh Token | JWT (or opaque future) | Long (days)      | HttpOnly cookie `refresh-token` | Obtain new access token without re-login |

Minimal claims (e.g., `sub`, `iat`, `exp`, optional roles) keep token light and reduce leakage risk.

---

## 3. High-Level Authentication Lifecycle

1. Sign Up: User posts credentials; Nest creates user, issues access+refresh cookies.
2. Sign In: Credentials validated; Nest issues fresh tokens (invalidating prior session optionally).
3. Page/API Access: Browser sends `access-token` automatically; Next or Nest validates.
4. Expiry Approaches: Next middleware detects near/expired access token; triggers refresh using `refresh-token`.
5. Refresh: Nest validates refresh token, rotates (issues new access & refresh tokens) -> Set-Cookie.
6. Logout: Server clears cookies (Set-Cookie with expired `Max-Age=0`) & optionally invalidates stored refresh token.

---

## 4. Detailed Interaction by Layer

### 4.1 Browser (Next Client)

- Submits forms (e.g. signup/signin) via server actions or `fetch()` with `credentials: 'include'` if cross-origin.
- Never reads token values (HttpOnly). Relies on automatic cookie attachment.
- Navigations after login rely on middleware/server validation to gate protected routes.

### 4.2 Next Server Runtime

- Server Actions (`Next/src/lib/action.js`):
  - Call Nest endpoints (`/user/signup`, `/user/signin`, `/user/refresh-token`).
  - Parse responses, set `access-token` & `refresh-token` cookies using Next's `cookies()` API.
- Middleware / Proxy (`Next/src/proxy.js`):
  - Intercepts requests to private routes (e.g. `/training`).
  - Validates access token (either locally or via backend call).
  - If invalid due to expiry (not tampering), calls refresh logic; sets new cookies on the **current** response; may redirect to ensure client receives them before rendering.
- Ensures refreshed tokens are immediately available instead of only on subsequent requests (must set cookies on the response it returns, not just inside a server action).

### 4.3 Nest Backend

- Endpoints:
  - `POST /user/signup` – create user, issue tokens.
  - `POST /user/signin` – validate credentials, issue tokens.
  - `POST /user/refresh-token` – validate refresh token, rotate tokens.
- Guards (`auth.guard.ts`): Extract token from cookies or `Authorization` header, validate via `validateJwt`.
- Utilities (`sign.ts`): `signJwt(payload, options)` and `validateJwt(token)` read `JWT_SECRET` at call time (ensures `.env` loaded).
- Future enhancement: persist hashed refresh token(s) per user/session for revocation & reuse detection.

---

## 5. Request / Response Examples

### 5.1 Sign In

Request:

```http
POST /user/signin HTTP/1.1
Content-Type: application/json

{"email":"me@example.com","password":"secret"}
```

Response (headers excerpt):

```http
HTTP/1.1 200 OK
Set-Cookie: access-token=<jwt>; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=900
Set-Cookie: refresh-token=<jwt>; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=604800
Content-Type: application/json
```

### 5.2 Access Protected Resource

```http
GET /training HTTP/1.1
Cookie: access-token=<jwt>; refresh-token=<jwt>
```

Nest Guard validates; returns 200 or 401.

### 5.3 Refresh Tokens

```http
POST /user/refresh-token HTTP/1.1
Cookie: refresh-token=<jwt>
```

Response rotates both:

```http
Set-Cookie: access-token=<new-jwt>; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=900
Set-Cookie: refresh-token=<new-jwt>; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=604800
```

### 5.4 Logout

```http
POST /user/logout HTTP/1.1
Cookie: access-token=<jwt>; refresh-token=<jwt>
```

Response clears:

```http
Set-Cookie: access-token=; HttpOnly; Path=/; Max-Age=0
Set-Cookie: refresh-token=; HttpOnly; Path=/; Max-Age=0
```

---

## 6. Validation & Error Handling

| Scenario                             | Response                      | Recommended Action                                   |
| ------------------------------------ | ----------------------------- | ---------------------------------------------------- |
| Expired access token                 | 401 (if no refresh attempted) | Attempt refresh silently in middleware.              |
| Expired refresh token                | 401 / 403                     | Redirect to sign-in; force re-auth.                  |
| Invalid signature                    | 401                           | Clear cookies; possible tampering; require re-login. |
| Refresh token reuse (after rotation) | 403                           | Revoke session set; alert user; re-login.            |

Distinguish between expected expiry vs suspicious invalidity to decide UX (silent refresh vs forceful logout).

---

## 7. Session Management & Rotation

Rotation steps (recommended future state):

1. Store hashed refresh token + metadata (issuedAt, device info, optional IP) in DB.
2. On refresh request, hash presented token; compare to stored.
3. Issue new access + refresh tokens; store new hash; remove old hash (or mark invalidated).
4. If incoming token does not match current and is not marked previous, treat as reuse; revoke all.

Benefits: Enables forced logout, device-specific sessions, anomaly detection.

---

## 8. Security Practices

- `HttpOnly`, `Secure`, `SameSite=Lax` (or `None` if cross-site + HTTPS).
- Short access token TTL (minutes). Longer refresh TTL but not indefinite.
- Least-privilege claims (avoid embedding sensitive data in JWT).
- Use TLS end-to-end; never transmit tokens over plaintext.
- Implement refresh token rotation + reuse detection.
- Log authentication events (sign-in, refresh, logout, failed attempts).
- Rate-limit credential + refresh endpoints.

---

## 9. Common Pitfalls & Solutions

| Pitfall                           | Cause                                               | Solution                                                       |
| --------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Cookies only visible next request | Set in server action but not on middleware response | Set cookies on `NextResponse` / redirect after refresh.        |
| Missing `JWT_SECRET` at runtime   | Read before `.env` loaded                           | Access env at call time (`process.env.JWT_SECRET`) in helpers. |
| Lost query params on redirect     | Using `new URL(pathname, base)`                     | Clone URL, mutate `pathname`, preserve `search`.               |
| Cross-origin cookies not set      | Missing `SameSite=None; Secure` + CORS credentials  | Configure CORS, use `credentials: 'include'`.                  |

---

## 10. Quick Reference (Cheat Sheet)

| Task            | Where | Function / File                                 |
| --------------- | ----- | ----------------------------------------------- |
| Sign JWT        | Nest  | `utils/sign.ts` `signJwt`                       |
| Validate JWT    | Nest  | `utils/sign.ts` `validateJwt`                   |
| Issue Tokens    | Nest  | `user/auth.service.ts` methods                  |
| Validate Route  | Nest  | `guards/auth.guard.ts`                          |
| Client Login    | Next  | `lib/action.js` `login()`                       |
| Refresh Session | Next  | `lib/action.js` `refreshSession()` + `proxy.js` |

---

## 11. Future Enhancements

- Refresh token DB storage & rotation.
- Multi-device session listing & revocation UI.
- Role/permission claims with fine-grained guard logic.
- Structured logging + audit trail for auth events.
- Opaque refresh tokens (non-JWT) to reduce replay surface.

---

## 12. Glossary

| Term            | Definition                                                                      |
| --------------- | ------------------------------------------------------------------------------- |
| JWT             | JSON Web Token, signed claims (header.payload.signature).                       |
| HttpOnly Cookie | Cookie inaccessible to JS `document.cookie`; mitigates XSS token theft.         |
| Rotation        | Replacing refresh token each use to prevent silent theft reuse.                 |
| Reuse Detection | Identifying a previously rotated refresh token used again (signals compromise). |

---

## 13. Development Notes

- Ensure `.env` in `nest-auth/` includes `JWT_SECRET=<value>`.
- Run Nest: `npm run start:dev` inside `nest-auth/` (adjust port with `process.env.PORT`).
- Run Next: `npm run dev` inside `Next/`.
- For local multi-origin testing, align cookie attributes & CORS.

---

## 14. Minimal Flow Diagram (Text)

```
Browser --(signin form)--> Next Server Action --(POST /user/signin)--> Nest
Nest --(Set-Cookie access+refresh)--> Next Server Action --(Set-Cookie)--> Browser
Browser --(GET /training + cookies)--> Next Middleware (valid?)--(if expired refresh)--> Nest refresh
Nest --(Set-Cookie new tokens)--> Middleware --(redirect with Set-Cookie)--> Browser
Browser --(GET /training with new access token)--> Nest protected endpoint
```

---

## 15. Summary

This setup isolates token handling to secure server contexts (Nest & Next server runtime), uses HttpOnly cookies to shield tokens from direct client-side access, and establishes a foundation for robust session management via refresh token rotation.
