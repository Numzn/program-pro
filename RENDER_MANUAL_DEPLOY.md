# Manual Render Deployment

Render hasn't picked up the latest code. Here's how to force a redeploy:

## Option 1: Manual Deploy via Render Dashboard

1. Go to https://dashboard.render.com
2. Click on your `program-pro` service (the backend)
3. Click **"Manual Deploy"** button
4. Select **"Deploy latest commit"**
5. Wait for deployment to complete (2-3 minutes)

## Option 2: Verify Connection

1. Go to Render Dashboard → `program-pro` service
2. Click **Settings**
3. Scroll to **"Build & Deploy"**
4. Verify:
   - **Branch**: `main`
   - **Root Directory**: `server` (or leave blank)
   - **Build Command**: `cd server && pip install -r requirements.txt`
   - **Start Command**: `cd server && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Option 3: Force Push

If Render is stuck, try:

```bash
# In your terminal:
git commit --allow-empty -m "Trigger Render deployment"
git push origin main
```

## Check Deployment Status

1. Go to Render Dashboard → `program-pro` service → **Logs** tab
2. Look for:
   - "Building..."
   - "Using commit: 2f1c337"
   - "Build succeeded"
   - "Running uvicorn..."

## Latest Commits

- **2f1c337**: Fix bcrypt password handling (manual truncation)
- **153ae77**: Switch to bcrypt_sha256 (didn't work)
- **83d0c72**: First bcrypt fix attempt

**Current fix (2f1c337)** should work - it manually truncates passwords before calling bcrypt.

