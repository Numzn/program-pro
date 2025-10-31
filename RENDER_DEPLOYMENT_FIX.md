# Render Deployment Configuration Fix

## Issues Fixed
1. Render was detecting Node.js instead of Python
2. Python 3.13 compatibility issues with SQLAlchemy

## Solution Applied

### 1. Updated `render.yaml`
- Set `env: python` to explicitly specify Python runtime
- Build Command: `cd server && pip install -r requirements.txt`
- Start Command: `cd server && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Added `PYTHON_VERSION=3.11.9` environment variable

### 2. Created Python Runtime Detection
- Added `runtime.txt` at root with `python-3.11.9`
- Added `server/runtime.txt` with `python-3.11.9`
- Using Python 3.11.9 instead of 3.13 for SQLAlchemy compatibility

## Required Dashboard Settings

If `render.yaml` still doesn't work automatically, manually update in Render Dashboard:

### For `program-pro` Service:

1. **Settings → Build & Deploy**
   - **Runtime**: `Python 3` (NOT Node.js)
   - **Python Version**: `3.11.9` (set manually if env var doesn't work)
   - **Build Command**: `cd server && pip install -r requirements.txt`
   - **Start Command**: `cd server && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Environment Variables**
   - `ENVIRONMENT` = `production`
   - `PORT` = `10000`
   - `PYTHON_VERSION` = `3.11.9` (fixes SQLAlchemy compatibility)
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

