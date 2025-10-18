# Port 3000 Fix Documentation

## Problem
The Next.js development server kept defaulting to port 3001 instead of 3000, with the message "Port 3000 is in use, trying 3001 instead."

## Root Cause Analysis
Multiple Node.js processes were running simultaneously, causing port conflicts. The main issues were:
- Stale Node.js processes from previous development sessions
- No automatic cleanup of port 3000 before starting new development servers
- Next.js silently falling back to port 3001 instead of failing fast

## Solution Implemented

### 1. Port Monitoring Script
Created `scripts/port-watcher.ps1` to identify processes grabbing port 3000:
```powershell
# Run this to watch for port 3000 usage
.\scripts\port-watcher.ps1
```

### 2. Preflight Check Script
Created `scripts/preflight/lock-port-3000.mjs` that:
- Attempts to bind to port 3000 before starting Next.js
- If port is taken, identifies the owner process with detailed information
- Exits with clear error message if port is unavailable

### 3. Enhanced Package Scripts
Updated `package.json` with new scripts:
- `npm run dev:strict` - Fails fast if port 3000 is taken, forces port 3000 on localhost
- `npm run dev:try` - Attempts to kill port 3000 occupants, then starts on localhost:3000
- `npm run dev` - Original script (may still fallback to 3001)

### 4. Dependencies Added
- `kill-port` - For automatically clearing port 3000

## Usage

### For Reliable Port 3000 Development:
```bash
npm run dev:strict
```
This will:
1. Check if port 3000 is available
2. If taken, show detailed process information and exit
3. If available, start Next.js on port 3000

### For Automatic Port Clearing:
```bash
npm run dev:try
```
This will:
1. Kill any process on port 3000
2. Start Next.js on port 3000

## Verification
After implementing this fix:
- `npm run dev:strict` successfully binds to port 3000
- Clear error messages when port is taken
- No more silent fallback to port 3001

## Rollback
To revert changes:
1. Remove the new scripts from `package.json`
2. Delete `scripts/` directory
3. Uninstall `kill-port`: `npm uninstall kill-port`

## Prevention
- Always use `npm run dev:strict` for development
- Kill all Node.js processes before starting: `taskkill /F /IM node.exe`
- Check for port usage: `netstat -ano | findstr ":3000"`
