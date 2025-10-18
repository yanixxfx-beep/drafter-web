# Drafter - AI-Powered Slide Generation App

A modern web application for creating professional slides with AI-generated content, image randomization, and advanced text editing capabilities.

## 🚀 Features

### Core Functionality
- **AI Content Generation**: Generate slide content using Google Sheets integration
- **Image Management**: Upload and manage images with OPFS (Origin Private File System) storage
- **Advanced Text Editor**: Comprehensive text styling with fonts, sizing, positioning, and effects
- **Slide Randomization**: Randomize images while maintaining content integrity
- **Individual Slide Editing**: Edit each slide independently with real-time preview
- **Export System**: Export slides as high-quality PNG images or ZIP archives

### Technical Features
- **Modern React Architecture**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Canvas Rendering**: High-performance canvas-based image and text rendering
- **OPFS Storage**: Client-side file storage for images and projects
- **Google Sheets Integration**: OAuth-based content management
- **Responsive Design**: Optimized for desktop and mobile viewing
- **Fast Image Loading**: Optimized image processing with caching and task queues

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom CSS
- **Storage**: OPFS (Origin Private File System)
- **Canvas**: HTML5 Canvas API with custom rendering utilities
- **Authentication**: NextAuth.js with Google OAuth
- **State Management**: React Context + Custom Hooks
- **Image Processing**: Custom utilities with Web Workers

## 📁 Project Structure

```
drafter-web/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── layout/           # Layout components (Sidebar, ContentArea)
│   │   ├── pages/            # Page components (GeneratePage, SlideEditor)
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── session/              # Session management
│   ├── storage/              # OPFS storage utilities
│   └── utils/                # Helper utilities
├── public/                   # Static assets
├── docs/                     # Documentation
└── scripts/                  # Build and utility scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Cloud Console project (for Sheets integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd drafter-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run dev:strict` - Start dev server on port 3000 only
- `npm run dev:clean` - Kill all Node processes and start fresh

## 🔧 Configuration

### Google Sheets Setup
1. Create a Google Cloud Console project
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Update environment variables

### Font Setup
The app uses TikTok Sans font family. Fonts are loaded dynamically and cached for performance.

## 🎨 Key Components

### GeneratePage
Main page for slide generation with:
- Content input and Google Sheets integration
- Image upload and management
- Text styling controls
- Slide preview and randomization
- Export functionality

### SlideEditor
Individual slide editing with:
- Real-time text preview
- Drag-to-position text
- Font and styling controls
- Background transformations
- Save and apply changes

### Canvas Rendering System
High-performance canvas rendering with:
- Image loading and caching
- Text layout and positioning
- HiDPI support
- Task queue management
- Memory optimization

## 🐛 Known Issues

1. **Thumbnail Text Rendering**: Text positioning in thumbnails needs optimization
2. **Port Management**: Occasional port conflicts on Windows
3. **Image Loading**: Some images may not load immediately in thumbnails
4. **Memory Usage**: Large image collections may impact performance

## 🚧 Roadmap

### Short Term
- Fix thumbnail text rendering issues
- Improve image loading performance
- Add more font options
- Enhance mobile responsiveness

### Long Term
- Cloud storage integration
- User authentication and projects
- Advanced AI content generation
- Collaborative editing features
- Export to various formats (PDF, PowerPoint)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the console logs for debugging information

## 🔍 Development Notes

### Performance Optimizations
- Image caching with LRU cache
- Task queue for concurrent operations
- Canvas rendering optimization
- Memory management for large datasets

### Code Quality
- TypeScript for type safety
- Custom hooks for reusable logic
- Component composition patterns
- Error boundaries and fallbacks

---

**Note**: This is a development version. Some features may be experimental or incomplete.