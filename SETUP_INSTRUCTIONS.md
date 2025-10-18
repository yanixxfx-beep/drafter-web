# Setup Instructions for Drafter Web

## Prerequisites Installation

### 1. Install Node.js
**You need to install Node.js first!**

1. Go to https://nodejs.org/
2. Download the **LTS version** (recommended for most users)
3. Run the installer and follow the setup wizard
4. **Important**: Make sure to check "Add to PATH" during installation

### 2. Verify Installation
Open a new Command Prompt or PowerShell and run:
```bash
node --version
npm --version
```

You should see version numbers like:
```
v18.17.0
9.6.7
```

### 3. Install Dependencies
Once Node.js is installed, run:
```bash
cd D:\Saas\Drafter\drafter-web
npm install
```

### 4. Start Development
```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Alternative: Manual Setup

If you prefer to set up manually:

### Step 1: Install Node.js
- Download from https://nodejs.org/
- Install with default settings
- Restart your computer after installation

### Step 2: Open Terminal
- Press `Win + R`
- Type `cmd` and press Enter
- Or use PowerShell

### Step 3: Navigate to Project
```bash
cd D:\Saas\Drafter\drafter-web
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Start Development
```bash
npm run dev
```

## Troubleshooting

### "npm is not recognized"
- Node.js is not installed or not in PATH
- Reinstall Node.js and make sure to check "Add to PATH"
- Restart your computer after installation

### "Port 3000 is already in use"
```bash
npm run dev -- -p 3001
```

### "Permission denied" errors
- Run Command Prompt as Administrator
- Or use PowerShell with execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## What's Next?

Once the setup is complete:

1. **Web Development**: `npm run dev` - Opens in browser
2. **Desktop App**: Install Rust first, then `npm run tauri:dev`
3. **Build**: `npm run build` for web, `npm run tauri:build` for desktop

## Need Help?

If you're still having issues:

1. Make sure Node.js is properly installed
2. Restart your computer after installing Node.js
3. Try running commands in a new terminal window
4. Check that you're in the correct directory (`D:\Saas\Drafter\drafter-web`)

The app will work in your browser first, and you can add desktop functionality later with Tauri.


