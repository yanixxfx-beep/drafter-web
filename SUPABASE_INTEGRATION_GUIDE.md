# Supabase Cloud Integration Guide

## 🚀 **What's Been Implemented**

### **1. Supabase Clients**
- `src/lib/supabase.client.ts` - Browser-safe client
- `src/lib/supabase.server.ts` - Server-only admin client

### **2. Database Schema**
- `supabase/schema.sql` - Complete database schema
- Tables: `workspaces`, `media_files`, `quotas`
- Indexes for performance

### **3. API Routes**
- `/api/upload-intent` - Get signed upload URL
- `/api/upload-confirm` - Confirm upload and save metadata
- `/api/signed-url` - Get signed download URL
- `/api/quota` - Get user storage quota

### **4. Storage Service**
- `src/services/storage/StorageService.ts` - Interface
- `src/services/storage/SupabaseStorageService.ts` - Implementation

### **5. Usage Meter**
- `src/components/UsageMeter.tsx` - Storage usage display

## 🔧 **Setup Required**

### **1. Environment Variables**
Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key
```

### **2. Database Setup**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the SQL from `supabase/schema.sql`

### **3. Storage Buckets**
Create these private buckets in Supabase Storage:
- `user` - For user uploads
- `system` - For system content (Content Vault)

## 🧪 **Testing the Integration**

### **1. Add the Example Component**
Add this to any page to test:

```tsx
import CloudUploadExample from '@/components/CloudUploadExample'

// In your component:
<CloudUploadExample />
```

### **2. Test Upload Flow**
1. Sign in with Google
2. Select files to upload
3. Files will be uploaded to Supabase
4. Click "View" to get signed URLs

## 🔄 **Integrating with Existing Code**

### **Replace SimpleStorage with SupabaseStorageService**

In your `UploadPage.tsx`, replace:

```tsx
// OLD: Using SimpleStorage
import * as SimpleStorage from '@/lib/simpleStorage'

// NEW: Using Supabase
import { SupabaseStorageService } from '@/services/storage/SupabaseStorageService'

const storageService = new SupabaseStorageService()
```

### **Update Upload Logic**

```tsx
// OLD: SimpleStorage
const savedFiles = await SimpleStorage.saveFiles(validFiles, categoryKey)

// NEW: Supabase
const workspaceId = 'default-workspace' // Get from your workspace management
for (const file of validFiles) {
  const result = await storageService.uploadFile({
    workspaceId,
    kind: 'source',
    file
  })
  // Handle result
}
```

### **Update File Loading**

```tsx
// OLD: SimpleStorage
const allStoredFiles = await SimpleStorage.getAllFiles()

// NEW: Supabase
// You'll need to create an API route to list files by workspace
const response = await fetch(`/api/files?workspaceId=${workspaceId}`)
const files = await response.json()
```

## 📊 **Usage Meter Integration**

Add the usage meter to your settings page:

```tsx
import UsageMeter from '@/components/UsageMeter'

// In your component:
<UsageMeter />
```

## 🔒 **Security Features**

- **Authentication**: All API routes require NextAuth session
- **Authorization**: Users can only access their own files
- **Quota Management**: Storage limits enforced
- **Signed URLs**: No direct access to storage buckets
- **Private Buckets**: All files are private by default

## 🚀 **Next Steps**

1. **Test the integration** with the example component
2. **Replace SimpleStorage** in your upload page
3. **Add workspace management** for multi-workspace support
4. **Implement file listing** API route
5. **Add the usage meter** to your UI

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Unauthorized" errors**: Check if user is signed in
2. **"Workspace not found"**: Create a workspace first
3. **"Storage quota exceeded"**: Check quota limits
4. **Upload fails**: Check Supabase credentials

### **Debug Steps**

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables
4. Test API routes directly

## 📝 **API Reference**

### **Upload Intent**
```typescript
POST /api/upload-intent
{
  "workspaceId": "uuid",
  "kind": "source|export|thumb",
  "mime": "image/jpeg",
  "bytes": 1024,
  "filename": "image.jpg"
}
```

### **Upload Confirm**
```typescript
POST /api/upload-confirm
{
  "workspaceId": "uuid",
  "storageKey": "path/to/file",
  "kind": "source",
  "mime": "image/jpeg",
  "bytes": 1024
}
```

### **Get Signed URL**
```typescript
GET /api/signed-url?bucket=user&storageKey=path/to/file&expiresIn=900
```

## 🎯 **Ready to Test!**

The integration is complete and ready for testing. Start with the example component to verify everything works, then gradually replace your existing storage logic.
