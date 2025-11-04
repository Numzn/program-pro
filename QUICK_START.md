# 🚀 Quick Start Guide

## Step-by-Step Setup

### 1. Install Dependencies

```powershell
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
pip install -r requirements.txt

cd ..
```

### 2. Set Up Environment

```powershell
# Create .env file
Copy-Item env.example .env
```

The default settings in `env.example` will work for local development!

### 3. Set Up Database

```powershell
# Database migrations run automatically on server startup
# Or manually:
cd server
alembic upgrade head
```

**Note:** On first server start, the system automatically creates:
- Default church: "Numz"
- Admin user: username=`admin`, password=`password`

### 4. Start the Application

```powershell
# From the root directory
npm run dev
```

This will start:
- **Backend API** on http://localhost:8000
- **Frontend PWA** on http://localhost:3000 (Vite dev server)
- **Backend Docs** on http://localhost:8000/docs (Swagger UI)

### 5. Open in Browser

- **Public View**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login

### Default Credentials
- Username: `admin`
- Password: `password`

## Troubleshooting

If you get errors, try:

```powershell
# Clear and reinstall
Remove-Item -Recurse -Force node_modules, client/node_modules, server/node_modules
npm run install:all
```

## What You'll See

1. **Home Page** - List of active programs
2. **Program View** - Detailed program with schedule
3. **Admin Dashboard** - Statistics and recent programs
4. **Program Editor** - Create/edit programs

Enjoy exploring your Church Program Pro! 🎉







