<!-- 6a4275ae-0da7-471c-b2cb-fdb99be80e05 faa3355c-9aab-49ad-9194-13e5443db969 -->
# Fix CORS Issues with Vite Proxy (No Docker Required)

## Problem

Frontend on Render is still connecting to old backend URL `church-program-pro-server.onrender.com` instead of `program-pro.onrender.com`, causing CORS errors.

## Solution

Use Vite's built-in proxy feature for local development and trigger a frontend rebuild on Render to pick up correct environment variables.

## Implementation Steps

### 1. Update Vite Configuration

**File: `client/vite.config.ts`**

Add proxy configuration to forward `/api/*` requests to backend:

```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ /* existing config */ })
  ],
  
  // Add proxy configuration
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 2. Update Frontend API Service

**File: `client/src/services/api.ts`**

Change to use relative URL (line 8):

```typescript
constructor() {
  // Use relative URL - Vite proxy (dev) or Render (prod) will handle routing
  const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api'
  console.log('🌐 API Service initialized with URL:', apiUrl)
  
  this.api = axios.create({
    baseURL: apiUrl,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  // ... rest unchanged
}
```

### 3. Force Render Frontend Rebuild

**File: `client/vite.config.ts`**

Add comment at top to trigger rebuild:

```typescript
// Force rebuild - Updated: 2025-10-29 - Use correct backend URL
import { defineConfig } from 'vite'
```

### 4. Commit and Deploy

```bash
git add client/vite.config.ts client/src/services/api.ts
git commit -m "Fix: Add Vite proxy for local dev and fix Render API URL"
git push origin main
```

## How It Works

### Local Development

```
Browser → http://localhost:3000/api/auth/login
         ↓
Vite Proxy intercepts /api/*
         ↓
Forwards to http://localhost:8000/api/auth/login
```

### Production (Render)

```
Browser → https://program-pro-1.onrender.com/api/auth/login
         ↓
VITE_API_URL=https://program-pro.onrender.com/api
         ↓
Request goes to https://program-pro.onrender.com/api/auth/login
```

## Benefits

- No CORS issues (same origin in development)
- No Docker complexity
- Works immediately
- Hot reloading still functional
- Production-ready with environment variables

## Testing

After deployment:

1. Visit `http://localhost:3000` (local)
2. Check console: "API Service initialized with URL: /api"
3. No CORS errors
4. Visit `https://program-pro-1.onrender.com` (production)
5. Should connect to correct backend

### To-dos

- [ ] Update .gitignore to stop excluding client/src/pages/public/ directory
- [ ] Stage and commit public page files to Git repository
- [ ] Change imports in App.tsx and main.tsx from @ alias to standard relative paths
- [ ] Commit all changes and push to trigger Render deployment
- [ ] Verify Render build succeeds and application deploys correctly