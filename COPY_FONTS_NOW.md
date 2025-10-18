# 🚀 COPY TIKTOK FONTS NOW

## Quick Copy Commands

**Run these commands in PowerShell or Command Prompt:**

```powershell
# Navigate to the web app directory
cd "D:\Saas\Drafter\drafter-web"

# Create fonts directory
mkdir "public\fonts" -Force

# Copy the exact fonts from Drafter MVP
Copy-Item "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_Medium.ttf" "public\fonts\TikTokSans-Medium.ttf"
Copy-Item "D:\TokMatic\fonts\TikTok_Sans\static\TikTokSans_18pt_SemiBold.ttf" "public\fonts\TikTokSans-SemiBold.ttf"

# Verify files were copied
dir "public\fonts"
```

## Or Use the Batch File

```bash
# Run the font copying script
copy-tiktok-fonts.bat
```

## After Copying

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Check the Step 2 preview:**
   - Look for the green dot next to "TikTok Sans" 
   - The text should now use the exact same font as Drafter MVP

## What You'll See

**Before (System Font):**
- Yellow dot = "System Font"
- Generic sans-serif text

**After (TikTok Sans):**
- Green dot = "TikTok Sans" 
- Exact same font as desktop app
- Perfect text rendering

## Files to Copy

From: `D:\TokMatic\fonts\TikTok_Sans\static\`
- `TikTokSans_18pt_Medium.ttf` → `public\fonts\TikTokSans-Medium.ttf`
- `TikTokSans_18pt_SemiBold.ttf` → `public\fonts\TikTokSans-SemiBold.ttf`

**Copy these files now to get the exact TikTok Sans font in your Step 2 preview!** 🎯
