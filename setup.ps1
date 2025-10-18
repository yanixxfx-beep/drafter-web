Write-Host "Setting up Drafter Web..." -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check Rust
Write-Host "Checking Rust installation..." -ForegroundColor Yellow
try {
    $rustVersion = rustc --version
    Write-Host "Rust found: $rustVersion" -ForegroundColor Green
    
    Write-Host "Installing Tauri CLI..." -ForegroundColor Yellow
    try {
        npm install -g @tauri-apps/cli
        Write-Host "Tauri CLI installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Failed to install Tauri CLI!" -ForegroundColor Yellow
        Write-Host "You can still run the web version with: npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Rust is not installed!" -ForegroundColor Yellow
    Write-Host "To build the desktop app, you need Rust." -ForegroundColor Yellow
    Write-Host "Install it from https://rustup.rs/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For now, you can run the web version with: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available commands:" -ForegroundColor White
Write-Host "  npm run dev          - Start web development server" -ForegroundColor Gray
Write-Host "  npm run build        - Build web version" -ForegroundColor Gray
Write-Host "  npm run tauri:dev    - Start desktop development (requires Rust)" -ForegroundColor Gray
Write-Host "  npm run tauri:build  - Build desktop app (requires Rust)" -ForegroundColor Gray
Write-Host ""
Write-Host "To start development:" -ForegroundColor White
Write-Host "  1. Run: npm run dev" -ForegroundColor Gray
Write-Host "  2. Open: http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"


