# Implementation Plan: JWT Authentication

Implement JSON Web Token (JWT) based authentication for the system with a 10-minute expiration period. To ensure scalability and maintainability, we will also introduce a centralized API utility in the frontend.

## User Review Required

> [!IMPORTANT]
> This change will require all frontend API calls to include an `Authorization` header. I recommend centralizing API logic into a utility file (`api.js`) to simplify this and future updates.

## Proposed Changes

### Backend

#### [MODIFY] [package.json](file:///c:/Users/dulee/Desktop/SDP%20UI/Backend/package.json)
- Add `jsonwebtoken` dependency.

#### [MODIFY] [.env](file:///c:/Users/dulee/Desktop/SDP%20UI/Backend/.env)
- [NEW] Add `JWT_SECRET` (a secure random string).
- [NEW] Add `JWT_EXPIRES_IN=10m`.

#### [NEW] [authMiddleware.js](file:///c:/Users/dulee/Desktop/SDP%20UI/Backend/middleware/authMiddleware.js)
- Implement a middleware to verify JWT from the `Authorization` header.
- Provide a clear 401/403 response for expired or invalid tokens.

#### [MODIFY] [authController.js](file:///c:/Users/dulee/Desktop/SDP%20UI/Backend/controllers/authController.js)
- Update `login` to generate and return a JWT upon successful authentication.
- Set token expiration to 10 minutes.

#### [MODIFY] [server.js](file:///c:/Users/dulee/Desktop/SDP%20UI/Backend/server.js)
- Apply `authMiddleware` to all `/api/` routes except `/api/auth/login`, `/api/auth/register`, and public OTP routes.

---

### Frontend (Berendina UI)

#### [NEW] [api.js](file:///c:/Users/dulee/Desktop/SDP%20UI/Berendina%20UI/src/utils/api.js) [NEW]
- Create a centralized Axios instance that automatically adds the `Authorization` bearer token from `localStorage` to every request.
- Add an interceptor to handle 401 (Unauthorized) errors by clearing local storage and redirecting to `/login`.

#### [MODIFY] [Login.jsx](file:///c:/Users/dulee/Desktop/SDP%20UI/Berendina%20UI/src/pages/Auth/Login.jsx)
- Update to store the returned `token` in `localStorage`.

#### [MODIFY] Pages (Beneficiaries, Projects, etc.)
- Refactor `fetch`/`axios` calls to use the new `api.js` utility.

## Open Questions

- Would you like me to refactor all existing `fetch` calls across all pages to use the new centralized `api.js` utility immediately, or should I just update them manually one by one? (Refactoring is highly recommended).

## Verification Plan

### Automated Tests
- None.

### Manual Verification
1. Log in and confirm the token is saved in `localStorage`.
2. Verify access to protected pages (Beneficiaries, Projects).
3. Wait 10 minutes (or temporarily shorten the expiry to 1m for testing) and confirm the user is logged out automatically upon the next API call.
