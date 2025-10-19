# Drafter App - ChatGPT Analysis Request

## 🎯 Project Overview

**Drafter** is a modern web application for creating professional slides with AI-generated content. Users can upload images, generate content from Google Sheets, apply advanced text styling, and export high-quality slides.

## 🏗️ Current Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Storage**: OPFS (Origin Private File System)
- **Canvas**: HTML5 Canvas API
- **Authentication**: NextAuth.js with Google OAuth
- **State Management**: React Context + Custom Hooks

### Key Components

#### 1. GeneratePage (`src/components/pages/GeneratePage.tsx`)
- **Purpose**: Main slide generation interface
- **Features**: 
  - Google Sheets integration for content
  - Image upload and management
  - Text styling controls (font, size, outline, positioning)
  - Slide preview with thumbnails
  - Image randomization system
  - Export functionality (PNG, ZIP)
- **Issues**: 
  - Thumbnail text rendering problems
  - Complex state management
  - Performance issues with large image sets

#### 2. SlideEditor (`src/components/pages/SlideEditor.tsx`)
- **Purpose**: Individual slide editing
- **Features**:
  - Real-time text preview
  - Drag-to-position text
  - Font and styling controls
  - Background transformations
- **Issues**: 
  - Text positioning accuracy
  - Canvas rendering performance

#### 3. Canvas Rendering System
- **Files**: `useCanvasRender.ts`, `SlideEditorCanvas.tsx`, `canvas.ts`
- **Purpose**: High-performance image and text rendering
- **Features**:
  - Image loading and caching
  - Text layout and positioning
  - HiDPI support
  - Task queue management
- **Issues**: 
  - Complex scaling logic
  - Memory management
  - Performance bottlenecks

## 🐛 Current Issues

### 1. Thumbnail Text Rendering
- **Problem**: Text in slide thumbnails is cropped or positioned incorrectly
- **Location**: `GeneratePage.tsx` thumbnail `drawOverlay` function
- **Impact**: Users can't see how slides will look when exported

### 2. Image Loading Performance
- **Problem**: Images don't load immediately in thumbnails
- **Location**: `useCanvasRender.ts`, image caching system
- **Impact**: Poor user experience, requires clicking to load images

### 3. Complex State Management
- **Problem**: State is scattered across multiple components and hooks
- **Location**: Throughout the app
- **Impact**: Hard to maintain, bugs, performance issues

### 4. Port Management
- **Problem**: Development server conflicts with port 3000
- **Location**: `package.json` scripts, port management
- **Impact**: Development workflow disruption

## 🎯 Desired Improvements

### 1. Clean Architecture
- **Goal**: Restructure code for better maintainability
- **Requirements**:
  - Clear separation of concerns
  - Reusable components
  - Centralized state management
  - Better error handling

### 2. Performance Optimization
- **Goal**: Faster image loading and rendering
- **Requirements**:
  - Optimized image caching
  - Efficient canvas rendering
  - Memory management
  - Lazy loading

### 3. Better Text Rendering
- **Goal**: Accurate text positioning and scaling
- **Requirements**:
  - Consistent text rendering across all views
  - Proper scaling for thumbnails
  - Better font loading system

### 4. Enhanced User Experience
- **Goal**: Smooth, intuitive interface
- **Requirements**:
  - Immediate image loading
  - Responsive design
  - Better error messages
  - Loading states

## 📋 Specific Questions for ChatGPT

### Architecture & Structure
1. **How should I restructure this React/Next.js app for better maintainability?**
2. **What's the best way to handle complex state management in this type of application?**
3. **How can I improve the component hierarchy and reduce prop drilling?**

### Canvas & Rendering
4. **What's the optimal architecture for a canvas-based slide generation app?**
5. **How can I improve the text layout system for consistent rendering across different canvas sizes?**
6. **What's the best approach for handling image caching and memory management?**

### Performance
7. **How can I optimize image loading and rendering performance?**
8. **What are the best practices for handling large image collections in the browser?**
9. **How can I implement efficient lazy loading for thumbnails?**

### Code Quality
10. **How can I simplify the complex scaling logic in the thumbnail rendering?**
11. **What's the React way to handle canvas rendering and updates?**
12. **How can I improve error handling and user feedback throughout the app?**

## 🔧 Current File Structure

```
src/
├── components/
│   ├── pages/
│   │   ├── GeneratePage.tsx      # Main generation interface (4000+ lines)
│   │   ├── SlideEditor.tsx       # Individual slide editor
│   │   └── OPFSUploadPage.tsx    # Image upload interface
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── ContentArea.tsx       # Main content area
│   └── ui/                       # Reusable UI components
├── hooks/
│   ├── useCanvasRender.ts        # Canvas rendering hook
│   └── useCanvasRegistry.ts      # Canvas management
├── utils/
│   ├── canvas.ts                 # Canvas utilities
│   ├── image.ts                  # Image processing
│   ├── taskQueue.ts              # Task queue management
│   └── bitmapCache.ts            # Image caching
├── storage/
│   └── opfs.ts                   # OPFS storage utilities
└── lib/
    ├── textLayout.ts             # Text layout engine
    └── googleSheets.ts           # Google Sheets integration
```

## 🎨 Key Features to Maintain

1. **Google Sheets Integration**: OAuth-based content generation
2. **OPFS Storage**: Client-side image storage
3. **Advanced Text Editor**: Font, size, positioning, effects
4. **Image Randomization**: Smart image selection and deduplication
5. **Export System**: High-quality PNG and ZIP export
6. **Responsive Design**: Works on desktop and mobile

## 🚀 Future Enhancements

1. **Cloud Storage**: User accounts and cloud sync
2. **Advanced AI**: Better content generation
3. **Collaboration**: Real-time editing
4. **Templates**: Pre-designed slide templates
5. **Analytics**: Usage tracking and insights

## 💡 Success Criteria

- **Clean Code**: Maintainable, readable, well-structured
- **Performance**: Fast loading, smooth interactions
- **Reliability**: No bugs, proper error handling
- **Scalability**: Easy to add new features
- **User Experience**: Intuitive, responsive, fast

---

**Please provide a comprehensive refactoring plan with specific code examples and architectural recommendations.**

