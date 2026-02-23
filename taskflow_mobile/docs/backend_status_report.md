# Backend Status Report - Taskflow Mobile (Step 1)

Date: 2026-02-23
Environment: local backend Node/Express (`backend/`) + local MySQL

## Verification Summary

- `GET /api/health`: reachable and returns HTTP 200.
- `POST /api/auth/login`: not stable in this environment because backend process crashes on MySQL authentication (`ER_ACCESS_DENIED_ERROR` for `root@localhost`).
- `GET /api/auth/profile`: blocked because login token cannot be obtained when crash occurs.

## Observed Responses

- Health response body:
  - `{"status":"OK","database":"taskflow","timezone":"+01:00"}`

- Login attempt (user from existing backend test script) results in connection close due backend crash while querying DB.

## Documented API vs Actual Backend Differences

1. Refresh token behavior
- Expected in project brief: login returns `JWT + refresh token`; refresh endpoint uses refresh token.
- Actual implementation:
  - `POST /api/auth/login` returns `data.token` (no explicit `refreshToken` field).
  - `POST /api/auth/refresh-token` expects current JWT in `Authorization: Bearer <token>` header and issues a new JWT.

2. Profile role payload
- Expected in brief: profile includes role (operator/technician).
- Actual implementation (`auth.controller.js`): `GET /api/auth/profile` returns `data.roles` array from `utilisateurs_roles` + `roles` tables (not a single normalized `role` field).

3. Route protection note in `routes/index.js`
- File comments mention routes are temporarily non-protected, but route modules themselves apply `authMiddleware` on most endpoints.
- Net effect: endpoints are effectively protected route-by-route.

## Known Blocking Issue

- Backend startup logs show:
  - `Error: Access denied for user 'root'@'localhost' (using password: YES)`
- Impact:
  - Health endpoint can respond.
  - DB-backed endpoints (auth/login and others) are not reliable until DB credentials/permissions are fixed.

## Recommendations Before Step 2

1. Fix local MySQL credentials/permissions for the backend `.env` account.
2. Decide and standardize token contract for mobile:
   - Option A: keep session-based refresh via `Authorization` header.
   - Option B: introduce explicit `refreshToken` in login and refresh flows.
3. Normalize role contract for mobile (`role` string or `roles[]`) and document it in API spec.
