# Render Deployment Configuration Fix

## Issue
Render was detecting Node.js instead of Python, causing build failures.

## Solution Applied

### 1. Updated `render.yaml`
- Set `rootDir: server` to tell Render to use the `server/` directory as the working directory
- Simplified build commands (removed `cd server &&` since rootDir is set)
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2. Created Python Runtime Detection
- Added `server/runtime.txt` with `python-3.11.0`

## Required Dashboard Settings

If `render.yaml` still doesn't work automatically, manually update in Render Dashboard:

### For `program-pro` Service:

1. **Settings → Build & Deploy**
   - **Runtime**: `Python 3` (NOT Node.js)
   - **Root Directory**: `server` (if available as an option)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Environment Variables**
   - `ENVIRONMENT` = `production`
   - `PORT` = `10000`
   - `JWT_SECRET` = (auto-generated or set manually)
   - `DATABASE_URL` = (linked from database)

3. **Save and Trigger Manual Deploy**

## Verification

After deployment, test:
- `https://program-pro.onrender.com/health` - should return `{"success": true, "status": "healthy"}`
- `https://program-pro.onrender.com/api/v1` - should return API info

## Troubleshooting

If still getting Node.js errors:
1. Disconnect and reconnect the GitHub repository in Render
2. Or delete and recreate the service to force reading `render.yaml`

