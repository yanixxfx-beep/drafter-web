# TikTok Sans Font Setup

The original Drafter desktop app uses **TikTok Sans** font for text rendering. To get the exact same look in the web version:

## Option 1: Copy from Drafter MVP (Recommended)

If you have the original Drafter MVP with fonts:

1. **Find the fonts** in your Drafter MVP directory:
   ```
   D:\TokMatic\fonts\TikTok_Sans\static\
   ```

2. **Copy these files** to the web app:
   - Copy `TikTokSans_18pt_Medium.ttf` → `drafter-web/public/fonts/TikTokSans-Medium.ttf`
   - Copy `TikTokSans_18pt_SemiBold.ttf` → `drafter-web/public/fonts/TikTokSans-SemiBold.ttf`

3. **Restart the dev server** - the font will load automatically!

## Option 2: Download TikTok Sans

1. **Download** from FontShare:
   - Go to: https://www.fontshare.com/fonts/tiktok
   - Or search "TikTok Sans download"

2. **Extract** the font files (.ttf or .woff2)

3. **Place in**: `drafter-web/public/fonts/`
   - Rename to match the expected names:
     - `TikTokSans-Medium.ttf` (or .woff2)
     - `TikTokSans-SemiBold.ttf` (or .woff2)

4. **Restart** the Next.js dev server

## Verify Font is Loaded

Open browser DevTools (F12) → Console, and run:
```javascript
document.fonts.check('500 16px "TikTok Sans"')
// Should return: true (if font is loaded)
```

## Current Fallback

Without TikTok Sans, the app uses:
- System UI fonts (Arial, Segoe UI, etc.)
- Similar weight and styling
- Still looks good, but not pixel-perfect

## File Structure

```
drafter-web/
├── public/
│   └── fonts/
│       ├── TikTokSans-Medium.ttf
│       ├── TikTokSans-SemiBold.ttf
│       └── README.md
└── src/
    └── app/
        └── fonts.css  (already configured ✅)
```

The font CSS is already set up and will automatically load the fonts when you place them in the correct location!


