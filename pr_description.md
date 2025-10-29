# 🚀 Drafter - Complete Application Overview & Feature Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [User Workflows](#user-workflows)
5. [Key Components](#key-components)
6. [Multi-Sheet Generation System](#multi-sheet-generation-system)
7. [Image Management System](#image-management-system)
8. [Export System](#export-system)
9. [Session Management](#session-management)
10. [Text Styling & Canvas Rendering](#text-styling--canvas-rendering)
11. [Deployment & Next Steps](#deployment--next-steps)

---

## 🎯 Project Overview

**Drafter** is a modern, AI-powered slide generation application that transforms Google Sheets content into professional, visually appealing slides. The app combines content automation, image management, advanced text styling, and batch export capabilities into a seamless workflow.

### Purpose
Enable users to:
- Import content from Google Sheets (multiple sheets supported)
- Generate professional slides with AI-curated images
- Customize text styling, positioning, and effects
- Export high-quality images individually or as ZIP archives
- Manage multiple projects/sessions

### Current Status: **90% Complete** - Ready for final polish and launch

---

## ✨ Core Features

### 1. **Session Management**
- **Create Named Sessions**: Start new projects with custom names
- **Load Existing Sessions**: Resume work on saved projects
- **Session Persistence**: All data saved to browser storage (OPFS/IndexedDB)
- **Project History**: View and manage all sessions from Sessions page

### 2. **Google Sheets Integration**
- **OAuth Authentication**: Secure Google OAuth 2.0 authentication
- **Spreadsheet Selection**: Browse and select Google Spreadsheets
- **Multi-Sheet Support**: Select single or multiple sheets for batch processing
- **Automatic Content Fetching**: Retrieves ideas/data from selected sheets
- **Column Mapping**: Automatically detects slide content columns (Slide 1, Slide 2, etc.)

### 3. **3-Step Generation Workflow**

#### **Step 1: Content Selection**
- Select Google Spreadsheet
- Choose single or multiple sheets (Multi-select mode)
- View ideas summary and slide columns
- Fetch and validate data from Google Sheets API

#### **Step 2: Text Styling Configuration**
- **Font Selection**: Choose from extensive font library (DM Sans, Inter, League Spartan, Manrope, Outfit, TikTok Sans)
- **Text Size Control**: Adjustable font sizing
- **Text Positioning**: X/Y coordinates with drag-to-position in preview
- **Text Styling**:
  - Outline/Stroke width and color
  - Text color and opacity
  - Letter spacing
  - Text alignment (left, center, right)
  - Text rotation
  - Background color with opacity
- **Live Preview**: Real-time preview of text changes on canvas
- **Format Presets**: Apply predefined 9:16 or 3:4 aspect ratios
- **Mixed Format Mode**: Alternate between formats per slide

#### **Step 3: Generate & Review**
- **Batch Generation**: Generate all slides with assigned images
- **Progress Tracking**: Real-time progress with ETA and slide counts
- **Idea Organization**: 
  - Sheet-based grouping (when multi-sheet mode)
  - Sheet selector/navigator (tab-style UI)
  - Expandable/collapsible idea cards
- **Thumbnail Gallery**: Visual preview of all slides
- **Image Randomization**: Randomize images for individual slides or entire ideas
- **Image Categories**: Automatic categorization (Affiliate Content, AI Method)
- **Last Slide Logic**: AI Method images only on final slide per idea
- **Per-Sheet Image Assignment**: Unique image shuffling per sheet with seeded randomization

### 4. **Slide Editor**
- **Individual Slide Editing**: Edit each slide independently
- **Real-Time Canvas Preview**: Live preview of changes
- **Drag-to-Position Text**: Visual text positioning
- **Style Override**: Per-slide style customization
- **Background Transformations**: Flip horizontal, rotate 180°
- **Caption Editing**: Direct text editing with live preview

### 5. **Image Management**
- **OPFS Storage**: Client-side file storage using Origin Private File System
- **Image Upload**: Drag-and-drop or file picker upload
- **Image Categories**: 
  - **Affiliate Content**: Used for all slides except the last
  - **AI Method**: Used exclusively for final slide of each idea
- **Automatic Assignment**: Smart image selection based on slide position
- **Image Randomization**: Seeded random shuffling for consistent results
- **Category Filtering**: Ensures correct image types per slide
- **Thumbnail Generation**: Automatic thumbnail creation with task queue

### 6. **Export System**
- **Individual PNG Export**: Export single slides as high-quality PNG
- **Batch ZIP Export**: Export all slides organized by:
  - Sheet folders (multi-sheet mode)
  - Idea folders
  - Slide files
- **High-Resolution**: Canvas-based rendering at optimal quality
- **Progress Tracking**: Export progress indicator

### 7. **Multi-Sheet Generation** (Latest Feature)
- **Select Multiple Sheets**: Choose any combination of sheets from a spreadsheet
- **Independent Processing**: Each sheet processed separately
- **Per-Sheet Idea Numbering**: Ideas numbered 1-N per sheet (not globally)
- **Unique Image Assignment**: Different images per sheet using seeded randomization
- **Sheet Navigator**: Tab-style selector to switch between sheets in Step 3
- **Organized Export**: ZIP exports organized by sheet folders

### 8. **Theme System**
- **Dark Theme**: Modern dark theme with custom color palette
- **Theme Persistence**: Saves theme preference
- **Dynamic Colors**: Theme-aware components throughout the app

### 9. **Pages & Navigation**

#### **Home Page**
- Dashboard with quick access cards
- Recent projects
- Quick actions

#### **Generate Page**
- Main slide generation interface
- 3-step workflow
- Session creation form

#### **Sessions Page**
- List all saved sessions/projects
- Load existing sessions
- Session metadata (name, creation date)

#### **Settings Page**
- Application settings
- User preferences
- Configuration options

---

## 🏗️ Technical Architecture

### **Tech Stack**
- **Frontend Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: React Hooks (useState, useContext, custom hooks)
- **Storage**: 
  - OPFS (Origin Private File System) for images
  - IndexedDB for session data
- **Canvas Rendering**: HTML5 Canvas API
- **Authentication**: NextAuth.js with Google OAuth
- **Image Processing**: Web Workers for thumbnails

### **Key Dependencies**
- `next-auth`: Google OAuth authentication
- `jszip`: ZIP file generation
- `googleapis`: Google Sheets API integration
- Custom canvas utilities for rendering

### **File Structure**
```
drafter-web/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes (auth, sheets, upload)
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── pages/                # Main page components
│   │   │   ├── GeneratePage.tsx # Main generation interface
│   │   │   ├── SlideEditor.tsx   # Individual slide editor
│   │   │   ├── SessionsPage.tsx # Sessions management
│   │   │   └── SettingsPage.tsx  # Settings
│   │   ├── generate/parts/       # Step components
│   │   │   ├── Step1Pane.tsx    # Content selection
│   │   │   ├── Step2Pane.tsx    # Text styling
│   │   │   └── Step3Pane.tsx    # Generation & review
│   │   ├── layout/               # Layout components
│   │   │   ├── MainWindow.tsx    # Main app wrapper
│   │   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   │   └── TitleBar.tsx      # App title bar
│   │   ├── ui/                   # Reusable UI components
│   │   └── SlideEditorCanvas.tsx # Canvas rendering component
│   ├── lib/                      # Core libraries
│   │   ├── auth.ts               # Authentication utilities
│   │   ├── googleSheets.ts       # Sheets API wrapper
│   │   ├── supabase.client.ts    # Supabase client (if used)
│   │   └── ensureFontReady.ts    # Font loading utilities
│   ├── utils/                    # Utility functions
│   │   ├── canvas.ts             # Canvas utilities
│   │   ├── image.ts              # Image processing
│   │   ├── rng.ts                # Seeded random number generation
│   │   ├── opfsImageLoader.ts    # OPFS image loading
│   │   └── safeZones.ts          # Safe zone rendering
│   ├── hooks/                    # Custom React hooks
│   │   ├── useCanvasRender.ts    # Canvas rendering hook
│   │   └── useCanvasRegistry.ts  # Canvas registry
│   ├── session/                  # Session management
│   │   ├── sessionStore.ts       # Session storage
│   │   └── usePersistentSession.ts # Session persistence hook
│   ├── storage/                   # Storage providers
│   │   └── opfs.ts               # OPFS storage utilities
│   └── context/
│       └── ThemeContext.tsx      # Theme management
└── public/
    ├── assets/
    │   ├── fonts/                # Font files
    │   ├── icons/                 # Icon library
    │   └── backgrounds/           # Background images
```

---

## 🔄 User Workflows

### **Workflow 1: New Project (Single Sheet)**
1. Launch app → Home page
2. Click "Generate" → Create new session
3. **Step 1**: Select spreadsheet → Choose single sheet → Fetch ideas
4. **Step 2**: Configure text styling (font, size, colors, positioning)
5. Click "Generate Drafts" → Wait for processing
6. **Step 3**: Review generated slides → Randomize images if needed
7. Edit individual slides → Export PNGs or ZIP

### **Workflow 2: Multi-Sheet Weekly Content**
1. Create session named "Weekly Content"
2. **Step 1**: Select spreadsheet → Enable multi-select → Choose Monday-Sunday sheets
3. **Step 2**: Configure styling
4. Generate drafts (processes all sheets independently)
5. **Step 3**: Use sheet navigator to view Monday, Tuesday, etc.
6. Each sheet has independent ideas (numbered 1-12 per day)
7. Export ZIP → Organized by day folders

### **Workflow 3: Edit Existing Project**
1. Go to Sessions page
2. Load existing session
3. Review/regenerate/export as needed

---

## 🧩 Key Components

### **GeneratePage.tsx** (Main Component)
- **Size**: ~2,860 lines (comprehensive slide generation logic)
- **Responsibilities**:
  - Session management
  - Google Sheets integration
  - Multi-sheet processing
  - Image assignment with seeded randomization
  - Slide generation
  - Export coordination
- **Key Functions**:
  - `startGeneration()`: Main generation orchestrator
  - `assignImagesToIdeas()`: Image assignment with seeding
  - `handleMultiSheetSelect()`: Multi-sheet selection handler
  - `exportAllDraftsAsZIP()`: Batch export
  - `exportDraftAsPNG()`: Single slide export

### **Step1Pane.tsx**
- Spreadsheet and sheet selection
- Multi-select toggle
- Data fetching and validation
- Summary display

### **Step2Pane.tsx**
- Text styling controls
- Font selection
- Size, positioning, color controls
- Live preview
- Format presets

### **Step3Pane.tsx**
- Generated ideas display
- Sheet navigator (multi-sheet mode)
- Idea expansion/collapse
- Image randomization
- Export buttons

### **SlideEditor.tsx**
- Individual slide editing
- Canvas preview
- Style overrides
- Text positioning

---

## 📊 Multi-Sheet Generation System

### **How It Works**

1. **Selection Phase** (Step 1):
   - User enables multi-select toggle
   - Selects multiple sheets from dropdown/checkboxes
   - Each sheet's data fetched independently
   - Ideas tagged with `_sheetName` property

2. **Processing Phase** (startGeneration):
   ```typescript
   // Per-sheet processing loop
   for (const [sheetName, sheetData] of Object.entries(step1Data.sheetsData)) {
     // Process ideas for this sheet
     // Assign ideaId = 1, 2, 3... (per sheet, not global)
     // Generate slides with sheet-prefixed IDs
   }
   ```

3. **Image Assignment**:
   ```typescript
   // Unique seed per sheet
   const sheetSeed = `${runId}:${sheetName}`
   await assignImagesToIdeas(sheetIdeas, sheetSeed)
   ```
   - Each sheet gets unique random seed
   - Ensures different images across sheets
   - Deterministic (same seed = same shuffle)

4. **UI Organization** (Step 3):
   - Ideas grouped by `sheetName`
   - Tab-style navigator to switch sheets
   - Display only current sheet's ideas

### **Data Structure**
```typescript
interface Step1Data {
  spreadsheetId: string
  spreadsheetName: string
  selectedSheets: string[]           // Array of sheet names
  sheetsData: Record<string, SheetData>  // Per-sheet data
  ideas: any[]                       // Merged (for backward compat)
  slideColumns: string[]
}

interface SheetData {
  sheetName: string
  ideas: any[]
  slideColumns: string[]
}
```

### **Seeded Randomization**
- **Location**: `src/utils/rng.ts`
- **Algorithm**: FNV-1a hash + LCG (Linear Congruential Generator)
- **Purpose**: Deterministic shuffling with unique seeds per sheet
- **Result**: Same content → same shuffle, different sheets → different images

---

## 🖼️ Image Management System

### **Storage**
- **OPFS**: Origin Private File System (browser-native file system)
- **Benefits**: 
  - Fast file access
  - Persistent storage
  - No server required
- **Location**: Browser's private file system

### **Image Categories**
1. **Affiliate Content**:
   - Filtered by: `img.category === 'affiliate'` OR filename pattern
   - Used for: All slides except the last in each idea
   - Pool size: ~1,580 images

2. **AI Method**:
   - Filtered by: `img.category === 'ai-method'` OR filename pattern
   - Used for: Last slide only (final slide of each idea)
   - Pool size: ~77 images

### **Assignment Logic**
```typescript
// Per slide in an idea
const desiredSource = slide.imageSource || 
  (idx === totalSlides - 1 ? 'ai-method' : 'affiliate')

// Filter images by category
const availableImages = images.filter(img => {
  const category = img.category || detectCategoryFromName(img.name)
  return category === desiredSource
})

// Shuffle with seed
const shuffled = seededShuffle(availableImages, seed)

// Assign to slide
slide.image = shuffled[index % shuffled.length]
```

### **Thumbnail System**
- **Worker-Based**: Uses Web Workers for async thumbnail generation
- **Task Queue**: Prevents UI blocking
- **Caching**: Thumbnails cached and reused
- **Revocation**: Old thumbnail URLs revoked to free memory

---

## 📦 Export System

### **Single Slide Export** (PNG)
```typescript
exportDraftAsPNG(slide)
```
- Renders slide to canvas at high resolution
- Converts canvas to blob
- Downloads as PNG file
- File naming: Based on idea/slide IDs

### **Batch Export** (ZIP)
```typescript
exportAllDraftsAsZIP()
```
- Creates JSZip instance
- **Single Sheet Mode**: `Idea {id}/Slide {id}.png`
- **Multi-Sheet Mode**: `{SheetName}/Idea {id}/Slide {id}.png`
- Progress tracking during export
- Downloads ZIP file when complete

### **Export Structure**
```
export.zip
├── WEDNESDAY/
│   ├── Idea 1/
│   │   ├── Slide 1.png
│   │   ├── Slide 2.png
│   │   └── Slide 3.png
│   └── Idea 2/
│       └── ...
├── THURSDAY/
│   └── ...
└── ...
```

---

## 💾 Session Management

### **Session Structure**
```typescript
interface SessionData {
  id: string
  name: string
  createdAt: number
  step1Data?: Step1Data
  step2Data?: Step2Data
  step3Data?: GeneratedIdea[]  // generatedIdeas
}
```

### **Storage**
- **IndexedDB**: Persistent browser storage
- **Session Store**: Custom store with CRUD operations
- **Auto-Save**: Sessions saved on key state changes

### **Session Lifecycle**
1. **Create**: User enters name → Creates new session
2. **Load**: Select from Sessions page → Restores all state
3. **Save**: Auto-saves on step completion/changes
4. **Close**: Confirmation modal before closing unsaved work

---

## 🎨 Text Styling & Canvas Rendering

### **Canvas Rendering Pipeline**
1. **Load Images**: OPFS → Canvas Image
2. **Calculate Layout**: Safe zones, text positioning
3. **Draw Background**: Image + transformations (flip, rotate)
4. **Draw Text**: Font loading → Text rendering with style
5. **Draw Overlays**: Safe zones, watermarks (optional)

### **Text Styling Properties**
- **Font**: Family selection with font loading
- **Size**: Absolute pixel sizing
- **Position**: X/Y coordinates (drag-to-position in editor)
- **Color**: RGB with opacity
- **Outline**: Stroke width and color
- **Letter Spacing**: Character spacing
- **Alignment**: Left/Center/Right
- **Rotation**: Text angle
- **Background**: Rectangular background with opacity

### **Font Loading**
- **Font Files**: TTF files in `public/assets/fonts/`
- **Dynamic Loading**: `ensureFontReady()` ensures fonts loaded before rendering
- **Font Families**:
  - DM Sans (74 variants)
  - Inter (56 variants)
  - League Spartan (10 variants)
  - Manrope (8 variants)
  - Outfit (10 variants)
  - TikTok Sans (169 variants)

### **Canvas Performance**
- **Caching**: Rendered canvases cached
- **Task Queue**: Thumbnail rendering queued
- **Workers**: Heavy processing offloaded to Web Workers
- **Memory Management**: URL revocation for old blobs

---

## 🚀 Deployment & Next Steps

### **Current Status: 90% Complete**

#### **✅ Completed**
- Core generation workflow
- Multi-sheet support
- Image management
- Export system
- Session management
- Text styling
- Canvas rendering
- Google Sheets integration
- Authentication

#### **🔨 Remaining Work (10%)**
1. **Performance Optimization**
   - Thumbnail rendering optimization
   - Large dataset handling
   - Memory leak prevention

2. **UI/UX Polish**
   - Loading states
   - Error handling
   - Accessibility improvements
   - Mobile responsiveness

3. **Testing**
   - Multi-sheet edge cases
   - Export validation
   - Session persistence
   - Image assignment edge cases

4. **Documentation**
   - User guide
   - Developer documentation
   - API documentation

5. **Production Setup**
   - Environment variables
   - Deployment configuration
   - Analytics setup
   - Error tracking

### **Recommended Next Steps with ChatGPT**

1. **Performance Review**
   - Analyze thumbnail flickering issues
   - Optimize canvas rendering
   - Memory management audit

2. **Feature Enhancement**
   - Additional export formats (PDF, video)
   - Template system
   - Batch operations improvements

3. **Quality Assurance**
   - Comprehensive testing plan
   - Edge case handling
   - User acceptance testing

4. **Launch Preparation**
   - Marketing materials
   - Onboarding flow
   - Help documentation

---

## 📝 Technical Notes

### **Multi-Sheet Image Assignment**
- Uses seeded randomization (`src/utils/rng.ts`)
- Each sheet gets unique seed: `${runId}:${sheetName}`
- Ensures consistent results per sheet
- Different sheets get different image assignments

### **Idea Numbering**
- **Multi-Sheet**: Per-sheet numbering (1-N per sheet)
- **Single-Sheet**: Global numbering (1-N overall)
- Idea IDs used in filenames and display

### **Image Source Logic**
- Respects `slide.imageSource` if already set
- Defaults to 'ai-method' for last slide, 'affiliate' for others
- Prevents randomization from overriding intended sources

### **State Management**
- React hooks for local state
- Persistent session storage
- Context for theme
- Custom hooks for canvas operations

---

## 🔗 Related PRs & Commits

### **Recent Major Changes**
- Multi-sheet selection implementation
- Per-sheet image assignment with seeding
- Sheet navigator UI in Step 3
- Export organization by sheet folders
- Fix: Step 3 not showing after generation
- Fix: Duplicate variable definition

### **Key Commits**
- `50040695`: Progress to Step 3/4 after multi-sheet generation
- `d881c55c`: Remove duplicate isMultiSheet variable
- `be5b3fc2`: Implement per-sheet image assignment with unique seeding

---

## 📞 Support & Questions

For questions about implementation, features, or next steps, refer to:
- `CHATGPT_ANALYSIS.md`: Previous analysis and recommendations
- `MIGRATION_GUIDE.md`: Architecture migration details
- `README.md`: Setup and installation

---

**Ready for Launch**: The application is feature-complete and ready for final polish, testing, and deployment. The multi-sheet generation system works exactly as intended, and all core features are functional.
