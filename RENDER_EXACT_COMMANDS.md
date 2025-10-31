# Render Deployment - Exact Commands & Directory Structure

## Current Repository Structure

```
church-program-pro/              ← Repository root
├── server/                       ← Backend directory
│   ├── requirements.txt          ← Python dependencies (EXISTS ✓)
│   ├── runtime.txt               ← Python 3.11.9
│   └── app/                      ← FastAPI application
│       ├── main.py               ← Entry point (EXISTS ✓)
│       ├── config.py
│       ├── auth/
│       ├── database/
│       ├── models/
│       └── middleware/
└── client/                        ← Frontend directory
```

## ✅ CORRECT Render Dashboard Settings

**Service Name:** `program-pro`

### Build & Deploy Settings:

1. **Runtime**: `Python 3` (NOT Node.js)

2. **Python Version**: `3.11.9` (NOT 3.13.4)

3. **Build Command** (EXACT):
   ```bash
   cd server && pip install -r requirements.txt
   ```

4. **Start Command** (EXACT):
   ```bash
   cd server && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **Root Directory**: Leave EMPTY or set to repository root (default)

### Environment Variables:

- `ENVIRONMENT` = `production`
- `PORT` = `10000`
- `PYTHON_VERSION` = `3.11.9` (optional, but recommended)
- `JWT_SECRET` = (auto-generated or set manually)
- `JWT_REFRESH_SECRET` = (set manually - use the generated secrets)
- `DATABASE_URL` = (linked from `church-program-pro-db` database)

## ❌ WRONG Settings (What Render Is Currently Using)

**Current (WRONG):**
- Build Command: `cd app && pip install -r requirements.txt` ❌
  - Should be: `cd server && ...` ✓

- Start Command: `cd app && uvicorn app.main:app ...` ❌
  - Should be: `cd server && ...` ✓

- Python Version: `3.13.4` ❌
  - Should be: `3.11.9` ✓

## How to Fix in Render Dashboard

### Step 1: Go to Service Settings
1. Open https://dashboard.render.com
2. Click on `program-pro` service
3. Click **Settings** tab

### Step 2: Update Build & Deploy
1. Scroll to **Build & Deploy** section
2. Find **Build Command** field
3. **DELETE** existing command: `cd app && pip install -r requirements.txt`
4. **ENTER** correct command: `cd server && pip install -r requirements.txt`

5. Find **Start Command** field
6. **DELETE** existing command: `cd app && uvicorn app.main:app ...`
7. **ENTER** correct command: `cd server && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Update Python Version
1. Find **Python Version** or **Runtime Version** field
2. Change from `3.13.4` or `default` to `3.11.9`
3. If there's no Python version selector, add `PYTHON_VERSION=3.11.9` in Environment Variables

### Step 4: Save & Deploy
1. Click **Save Changes**
2. Go to **Manual Deploy** tab
3. Click **Deploy latest commit**

## Verification

After updating, check the build logs. You should see:
- ✅ `Using Python version 3.11.9` (or similar)
- ✅ `Running build command 'cd server && pip install -r requirements.txt'...`
- ✅ `Installing collected packages: fastapi, uvicorn, sqlalchemy...`
- ✅ `Running 'cd server && uvicorn app.main:app --host 0.0.0.0 --port $PORT'...`
- ✅ No errors about "No such file or directory: 'requirements.txt'"

## File Locations (Verified)

- ✅ `server/requirements.txt` exists
- ✅ `server/app/main.py` exists  
- ✅ `server/runtime.txt` exists with `python-3.11.9`
- ✅ `render.yaml` has correct commands (but dashboard overrides it)

## Why Dashboard Override Happens

If `render.yaml` is correct but Render uses wrong commands, it means:
1. Service was created before `render.yaml` existed, OR
2. Service has manual dashboard settings that override YAML, OR
3. Render isn't detecting the YAML file properly

**Solution:** Manually update dashboard settings as shown above.

