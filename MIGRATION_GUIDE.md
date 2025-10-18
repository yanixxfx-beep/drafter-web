# Migration Guide: Python to Next.js + Tauri

This guide explains how we migrated your Python/PySide6 desktop app to a modern web-based architecture using Next.js, TypeScript, Tailwind CSS, and Tauri.

## 🎯 Migration Overview

### What We Migrated
- ✅ **Main Window Structure** - Recreated with React components
- ✅ **Sidebar Navigation** - Modern sidebar with theme support
- ✅ **Theme System** - Dark/light theme switching
- ✅ **3-Step Generate Workflow** - Complete workflow recreation
- ✅ **Settings Page** - All settings sections migrated
- ✅ **Sessions Management** - Session listing and management
- ✅ **Aurora Background** - Animated background effects
- ✅ **Design System** - Colors, typography, and components
- ✅ **Assets** - All fonts, icons, and images copied

### Architecture Changes

| Python/PySide6 | Next.js + Tauri |
|----------------|-----------------|
| PySide6 widgets | React components |
| QSS styling | Tailwind CSS |
| Python classes | TypeScript interfaces |
| Qt signals/slots | React state/hooks |
| QVBoxLayout | CSS Flexbox/Grid |
| Custom titlebar | Tauri window controls |

## 🏗️ Project Structure

```
drafter-web/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx         # Root layout with theme provider
│   │   ├── page.tsx           # Main page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   └── GlowingCard.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── MainWindow.tsx
│   │   │   ├── TitleBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ContentArea.tsx
│   │   │   └── AuroraBackground.tsx
│   │   └── pages/             # Page components
│   │       ├── HomePage.tsx
│   │       ├── GeneratePage.tsx
│   │       ├── SessionsPage.tsx
│   │       └── SettingsPage.tsx
│   ├── context/
│   │   └── ThemeContext.tsx   # Theme management
│   └── types/                 # TypeScript definitions
├── public/assets/             # Static assets
│   ├── fonts/                # All your fonts
│   ├── icons/                # All your icons
│   └── images/               # Images and backgrounds
├── src-tauri/                # Tauri configuration
└── package.json              # Dependencies
```

## 🎨 Design System Migration

### Colors
Your original Python color scheme has been preserved:

```typescript
// Dark theme colors (from your Python app)
const darkColors = {
  background: '#12081B',      // INK_BG
  surface: '#1A0F27',         // SURFACE
  surfaceSecondary: '#211436', // SURFACE_2
  accent: '#7C5CFF',          // ACCENT
  accentDim: '#3A2B66',       // ACCENT_DIM
  textPrimary: '#F3EEFF',     // TEXT
  textSecondary: '#C9C2E8',   // TEXT_MUTED
  // ... more colors
}
```

### Components Mapping

| Python Component | React Component | Notes |
|------------------|-----------------|-------|
| `DrafterApp` | `MainWindow` | Main application wrapper |
| `CollapsibleSidebar` | `Sidebar` | Navigation sidebar |
| `ContentArea` | `ContentArea` | Main content area |
| `Pages` | `HomePage`, `GeneratePage`, etc. | Individual pages |
| `GlowingCard` | `GlowingCard` | Dashboard cards |
| `Step2TextStyle` | `GeneratePage` | 3-step workflow |

## 🚀 Getting Started

### Prerequisites
1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Rust** (for desktop app) - [Install here](https://rustup.rs/)

### Quick Setup
```bash
# Navigate to the project
cd drafter-web

# Run setup script (Windows)
setup.bat
# OR
powershell -ExecutionPolicy Bypass -File setup.ps1

# Or manually:
npm install
npm run dev
```

### Development Commands

```bash
# Web development (browser)
npm run dev

# Desktop development (Tauri)
npm run tauri:dev

# Build web version
npm run build

# Build desktop app
npm run tauri:build
```

## 🔄 Migration Benefits

### Performance Improvements
- **Faster UI rendering** - React's virtual DOM vs Qt's widget system
- **Better memory management** - No Python GIL limitations
- **Smoother animations** - CSS animations vs Qt animations
- **Faster startup** - Web technologies load faster than Python

### Development Experience
- **Hot reload** - Instant updates during development
- **Better debugging** - Browser dev tools + React DevTools
- **Type safety** - TypeScript prevents runtime errors
- **Modern tooling** - ESLint, Prettier, etc.

### Deployment Options
- **Web app** - Deploy to Vercel, Netlify, etc.
- **Desktop app** - Single executable with Tauri
- **Cross-platform** - Works on Windows, macOS, Linux
- **Auto-updates** - Easy to push updates

## 🎯 Next Steps

### Immediate Tasks
1. **Test the web version** - Run `npm run dev` and test all features
2. **Install Rust** - For desktop app development
3. **Test desktop version** - Run `npm run tauri:dev`

### Future Enhancements
1. **Add shadcn/ui components** - For more polished UI
2. **Implement file handling** - Tauri file system APIs
3. **Add authentication** - NextAuth.js or similar
4. **Database integration** - SQLite or PostgreSQL
5. **Stripe integration** - For subscription management

### Business Logic Migration
The core business logic from your Python app can be gradually migrated:

1. **Session management** - Move to React state or database
2. **File processing** - Use Tauri's file system APIs
3. **AI integration** - API calls to your AI services
4. **Export functionality** - Use Tauri's shell APIs

## 🐛 Troubleshooting

### Common Issues

**Node.js not found:**
```bash
# Install Node.js from https://nodejs.org/
# Or use a version manager like nvm
```

**Rust not found:**
```bash
# Install Rust from https://rustup.rs/
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Tauri build fails:**
```bash
# Make sure Rust is installed
rustc --version

# Install Tauri CLI
npm install -g @tauri-apps/cli
```

**Port 3000 in use:**
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

## 🤝 Support

If you encounter any issues during migration:

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure Node.js and Rust are properly installed
4. Check the browser's developer tools for React errors

The new architecture provides a solid foundation for building a modern, scalable application that's much easier to maintain and extend than the original Python version.


