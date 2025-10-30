# Frontend-Backend API Endpoint Mapping

## URL Configuration

### Frontend (client/src/services/api.ts)
- **Production**: `baseURL = 'https://program-pro.onrender.com/api'`
- **Local**: `baseURL = '/api'` (Vite proxy forwards to `http://localhost:8000`)

### Backend (server/src/index.ts)
- **Base Path**: `/api`
- **CORS Origins**: 
  - Production: `['https://program-pro-1.onrender.com', 'https://program-pro.onrender.com']`
  - Local: `['http://localhost:3000', 'http://localhost:5173']`

## Endpoint Mapping

### Authentication (`/api/auth`) [legacy]

| Frontend Call | Full URL (Production) | Backend Route | Method | Status |
|--------------|----------------------|---------------|--------|--------|
| `POST /auth/login` | `https://program-pro.onrender.com/api/auth/login` | `router.post('/login')` mounted at `/api/auth` | ✅ MATCH |
| `POST /auth/logout` | `https://program-pro.onrender.com/api/auth/logout` | `router.post('/logout')` mounted at `/api/auth` | ✅ MATCH |
| `GET /auth/me` | (Not used by frontend) | `router.get('/me')` mounted at `/api/auth` | ⚠️ Available but unused |

### Authentication v1 (`/api/v1/auth`)

| Frontend Call | Full URL (Production) | Backend Route | Method | Status |
|--------------|----------------------|---------------|--------|--------|
| `POST /auth/login` | `https://program-pro.onrender.com/api/v1/auth/login` | controller `login` | ✅ NEW |
| `POST /auth/refresh` | `https://program-pro.onrender.com/api/v1/auth/refresh` | controller `refresh` | ✅ NEW |
| `POST /auth/logout` | `https://program-pro.onrender.com/api/v1/auth/logout` | controller `logout` | ✅ NEW |
| `GET /auth/me` | `https://program-pro.onrender.com/api/v1/auth/me` | controller `me` | ✅ NEW |
| `POST /auth/register` | `https://program-pro.onrender.com/api/v1/auth/register` | controller `register` | ✅ NEW |

### Programs (`/api/programs`) [legacy] and (`/api/v1/programs`)

| Frontend Call | Full URL (Production) | Backend Route | Method | Status |
|--------------|----------------------|---------------|--------|--------|
| `GET /programs?params` | `https://program-pro.onrender.com/api/programs?church_id=X&is_active=true` | `router.get('/')` mounted at `/api/programs` | ✅ MATCH |
| `GET /programs/:id` | `https://program-pro.onrender.com/api/programs/1` | `router.get('/:id')` mounted at `/api/programs` | ✅ MATCH |
| `POST /programs` | `https://program-pro.onrender.com/api/programs` | `router.post('/')` mounted at `/api/programs` | ✅ MATCH |
| `PUT /programs/:id` | `https://program-pro.onrender.com/api/programs/1` | `router.put('/:id')` mounted at `/api/programs` | ✅ MATCH |
| `DELETE /programs/:id` | `https://program-pro.onrender.com/api/programs/1` | `router.delete('/:id')` mounted at `/api/programs` | ✅ MATCH |
| `POST /programs/:id/schedule` | `https://program-pro.onrender.com/api/programs/1/schedule` | `router.post('/:id/schedule')` mounted at `/api/programs` | ✅ MATCH |
| `POST /programs/:id/guests` | `https://program-pro.onrender.com/api/programs/1/guests` | `router.post('/:id/guests')` mounted at `/api/programs` | ✅ MATCH |
| `POST /programs/bulk-import` | `https://program-pro.onrender.com/api/programs/bulk-import` | `router.post('/bulk-import')` mounted at `/api/programs` | ✅ MATCH |

### Templates (`/api/templates`) [legacy] and (`/api/v1/templates`)

| Frontend Call | Full URL (Production) | Backend Route | Method | Status |
|--------------|----------------------|---------------|--------|--------|
| `GET /templates` | `https://program-pro.onrender.com/api/templates` | `router.get('/')` mounted at `/api/templates` | ✅ MATCH |
| `GET /templates/:id` | `https://program-pro.onrender.com/api/templates/1` | `router.get('/:id')` mounted at `/api/templates` | ✅ MATCH |
| `POST /templates` | `https://program-pro.onrender.com/api/templates` | `router.post('/')` mounted at `/api/templates` | ✅ MATCH |
| `PUT /templates/:id` | `https://program-pro.onrender.com/api/templates/1` | `router.put('/:id')` mounted at `/api/templates` | ✅ MATCH |
| `DELETE /templates/:id` | `https://program-pro.onrender.com/api/templates/1` | `router.delete('/:id')` mounted at `/api/templates` | ✅ MATCH |

### Church (`/api/church`) [legacy] and (`/api/v1/church`)

| Frontend Call | Full URL (Production) | Backend Route | Method | Status |
|--------------|----------------------|---------------|--------|--------|
| `GET /church/info` | `https://program-pro.onrender.com/api/church/info` | `router.get('/info')` mounted at `/api/church` | ✅ MATCH |
| `GET /church/settings` | `https://program-pro.onrender.com/api/church/settings` | `router.get('/settings')` mounted at `/api/church` | ✅ MATCH |
| `PUT /church/settings` | `https://program-pro.onrender.com/api/church/settings` | `router.put('/settings')` mounted at `/api/church` | ✅ MATCH |

## Route Registration Order (Critical!)

```typescript
// server/src/index.ts
app.get('/api', ...)  // Root API endpoint
app.use('/api/auth', authRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/church', churchRoutes)
app.use(notFound)  // 404 handler - MUST be last
app.use(errorHandler)
```

## Issue Found: Route Order for `/api`

⚠️ **Potential Issue**: The catch-all `/api` route comes BEFORE the specific route handlers, but since it's `app.get('/api')` (not `app.use('/api')`), it should only match GET requests to `/api` exactly, not `/api/*` paths. This should be OK.

However, there's a potential issue with route matching order:

1. `/api` - matches `GET /api` exactly ✅
2. `/api/auth/login` - should match `app.use('/api/auth', authRoutes)` then `router.post('/login')` ✅

## Potential 404 Causes

1. **Route not found handler** - If `/api/auth/login` doesn't match, it hits `notFound` middleware
2. **CORS preflight failure** - POST requests require OPTIONS preflight which might be blocked
3. **Wrong baseURL** - Frontend might be using wrong URL despite runtime detection

## Verification Checklist

- [x] All frontend endpoints have corresponding backend routes
- [x] HTTP methods match (GET, POST, PUT, DELETE)
- [x] Route paths match correctly
- [x] CORS origins include frontend URL
- [x] Backend routes are registered in correct order
- [ ] Verify POST requests aren't being blocked by catch-all route
- [ ] Verify CORS preflight (OPTIONS) requests are handled

## Recommendations

1. **Add explicit OPTIONS handler** for CORS preflight:
```typescript
app.options('*', cors()) // Handle all OPTIONS requests
```

2. **Ensure `/api/auth/login` route is registered before catch-all** (already correct)

3. **Add route logging middleware** to see what requests hit which routes

