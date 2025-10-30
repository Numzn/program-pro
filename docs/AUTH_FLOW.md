# Auth Flow (v1)

## Tokens
- Access Token: JWT, expires in 15 minutes, returned in response body as ccessToken.
- Refresh Token: JWT, expires in 7 days, stored as HttpOnly; Secure; SameSite=Strict cookie named efresh_token.
- Legacy: Cookie 	oken still set on login for backward compatibility.

## Endpoints
- POST /api/v1/auth/login
  - Body: { username, password }
  - Sets efresh_token cookie, returns { success, data: { user }, accessToken }.
- POST /api/v1/auth/refresh
  - Reads efresh_token cookie, rotates it, returns { success, accessToken }.
- POST /api/v1/auth/logout
  - Clears efresh_token and legacy 	oken cookies.
- GET /api/v1/auth/me
  - Requires Authorization: Bearer <accessToken> or valid legacy cookie.

## Client behavior
- Base URL (prod): https://program-pro.onrender.com/api/v1.
- On 401: call /auth/refresh once, then retry the original request. If refresh fails, redirect to /admin/login.
- Stores ccessToken in localStorage for Authorization header.

## CORS
- Allowed origins: https://program-pro-1.onrender.com, https://program-pro.onrender.com, http://localhost:5173, http://localhost:3000.
- CORS middleware runs before rate limiter and routes; global OPTIONS preflight enabled.

## Notes
- Ensure JWT_SECRET configured in environment.
- Future: consider server-side refresh token store for rotation/invalidation.

