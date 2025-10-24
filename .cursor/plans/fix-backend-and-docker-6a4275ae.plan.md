<!-- 6a4275ae-0da7-471c-b2cb-fdb99be80e05 382b172d-efbb-4836-ad8f-f89a65842fee -->
# Deep Analysis & Cleanup Plan

## Current Status Analysis

### What's Working

- **Server**: Running from `server/src/index.ts` on port 5002 (confirmed by terminal output)
- **Frontend**: Running on port 3000 with hot module reload
- **Database**: Connected via SQLiteWrapper in `server/src/database/connection.ts`
- **API Structure**: Proper modular structure with `api/`, `middleware/`, `services/` folders
- **All Page Components**: HomePage and ProgramViewPage exist and are working
- **React Router**: Fixed with future flags to eliminate warnings

### What's Not Working

1. **Authentication**: Password hash mismatch - database has wrong hash from `simple-seed.ts`

- Database shows: `ADMINISTRATOR` and `PROGRAM_EDITOR` roles
- Main seed expects: `ADMIN` and `EDITOR` roles
- Admin hash: `$2a$10$mKtMOtBfBhp65kPCBAdSxOz...` (from simple-seed.ts, wrong password)
- Correct hash: `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (password="password")

2. **Duplicate Files**: Multiple unused server files causing confusion

- `server/src/simple-server.ts` (235 lines) - standalone server with inline DB
- `server/src/working-server.ts` (322 lines) - another standalone server
- `server/src/refactored-server.ts` (empty file)
- `server/src/database/simple-seed.ts` (198 lines) - creates wrong password hashes and roles

## Root Cause

The database was seeded with `simple-seed.ts` which:

- Creates different password hashes using `bcrypt.hashSync('password', 10)` each time
- Uses different role names: `ADMINISTRATOR` vs `ADMIN`, `PROGRAM_EDITOR` vs `EDITOR`
- The authentication service expects roles `ADMIN` and `EDITOR` (see `server/src/middleware/authenticate.ts`)

## Cleanup & Fix Strategy

### Phase 1: Delete Duplicate Files

Remove 4 duplicate/unused files:

- `server/src/simple-server.ts`
- `server/src/working-server.ts`  
- `server/src/refactored-server.ts`
- `server/src/database/simple-seed.ts`

### Phase 2: Fix Database Authentication

1. Stop the server (or it will lock the database)
2. Delete the corrupted database file: `server/dev.db`
3. Run the correct seed: `npm run db:seed` (uses `server/src/database/seed.ts`)
4. This will create users with:

- Correct password hash for "password"
- Correct roles: `ADMIN` and `EDITOR`

### Phase 3: Verify Everything Works

1. Restart the server
2. Test health endpoint: `http://localhost:5002/health`
3. Test login API with username="admin", password="password"
4. Test frontend login at `http://localhost:3000/admin/login`
5. Verify programs API works

### Phase 4: Update TODOs

- Mark completed: "Create DatabaseConnection class" (already done)
- Mark completed: "Fix authentication issue"
- Mark completed: "Verify all components working"

## Files to Modify

### Delete

1. `server/src/simple-server.ts`
2. `server/src/working-server.ts`
3. `server/src/refactored-server.ts`
4. `server/src/database/simple-seed.ts`

### Database Reset

1. Delete: `server/dev.db`
2. Run: `cd server && npm run db:seed`

## Expected Outcome

After cleanup:

- Clean server structure with only necessary files
- Working authentication with username="admin", password="password"
- All API endpoints functional
- Frontend can log in and manage programs
- No more confusion about which files are actually used

### To-dos

- [ ] Create DatabaseConnection class in server/src/database/connection.ts with getConnection() method
- [ ] Add better-sqlite3 to server/package.json dependencies
- [ ] Test server starts locally without TypeScript errors