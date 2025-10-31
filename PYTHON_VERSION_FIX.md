# Python Version Fix for Render

## Issue
Render is using Python 3.13.4 which has compatibility issues with SQLAlchemy 2.0.23.

## Solution Applied
1. Upgraded SQLAlchemy to `>=2.0.36` which includes Python 3.13 compatibility fixes
2. Added `runtime.txt` files with `python-3.11.9` (fallback option)

## If Upgrade Doesn't Work - Manual Dashboard Fix Required

Since Render is ignoring `runtime.txt` files, you **MUST** manually set Python version in Render Dashboard:

### Steps:
1. Go to Render Dashboard → `program-pro` service
2. Click **Settings** → **Build & Deploy**
3. Scroll to **Python Version** or **Environment** section
4. Change from **Python 3.13** to **Python 3.11.9**
5. Save changes
6. Trigger **Manual Deploy**

### Alternative: Force Python 3.11 in Build Command

If dashboard doesn't have Python version selector, modify build command to:
```bash
cd server && python3.11 -m pip install -r requirements.txt && python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

But this requires Python 3.11 to be available in Render's environment (which it should be).

## Current Status
- SQLAlchemy upgraded to >=2.0.36 (should work with Python 3.13)
- If still failing, manually set Python 3.11.9 in dashboard

