# Google Sheets Integration - Setup Instructions

## ✅ Backend is Ready!

The Google Sheets integration is fully implemented. If you're seeing "try signing in with a different account", follow these steps:

## 🔧 Fix OAuth Consent Screen

### Step 1: Add Test Users

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **drafter-473720**
3. Navigate to: **APIs & Services** → **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Add your Google email address (the one you want to use)
7. Click **SAVE**

### Step 2: Verify Scopes

Make sure these scopes are enabled:
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/spreadsheets.readonly`
- `https://www.googleapis.com/auth/drive.readonly`

### Step 3: Verify Redirect URIs

In **Credentials** → Your OAuth client:
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

## 🚀 How It Works

Once set up, users can:

1. **Click "Sign in with Google"** - Opens Google login in same tab
2. **Authorize Drafter** - Grant access to view spreadsheets
3. **Auto-Redirect Back** - Returns to Drafter automatically
4. **Select Spreadsheet** - Choose from dropdown of your Google Sheets
5. **Pick Day Sheet** - Select which tab (Monday, Tuesday, etc.)
6. **Ideas Loaded!** - Data pulled directly from the sheet

## 🎯 Benefits

- ✅ No file uploads needed
- ✅ Real-time data access
- ✅ Easy collaboration
- ✅ Automatic updates
- ✅ Secure OAuth flow

## 🔐 Security

- Credentials stored in `.env.local` (not committed to git)
- OAuth 2.0 secure authentication
- Read-only access to sheets
- Users can revoke access anytime

## 🐛 Troubleshooting

**Error: "try signing in with a different account"**
- → Add your email as a test user in OAuth consent screen

**Error: "redirect_uri_mismatch"**
- → Check redirect URI is exactly: `http://localhost:3000/api/auth/callback/google`

**Error: "access_denied"**
- → Make sure you granted all permissions during OAuth flow

**Spreadsheets not loading**
- → Check that Google Sheets API and Google Drive API are both enabled
- → Verify your account has access to the spreadsheets

## 📞 Need Help?

Check the browser console (F12) for detailed error messages with `debug: true` enabled.

