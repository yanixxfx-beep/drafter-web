# Google Cloud Storage Setup Guide

This guide will help you set up Google Cloud Storage for the Drafter application.

## Prerequisites

- Google Cloud Platform account
- Basic knowledge of Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `drafter-app` (or your preferred name)
4. Click "Create"
5. Note down your Project ID (you'll need this later)

## Step 2: Enable Cloud Storage API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Cloud Storage API"
3. Click on it and press "Enable"

## Step 3: Create a Storage Bucket

1. Go to "Cloud Storage" → "Buckets"
2. Click "Create Bucket"
3. Enter bucket name: `drafter-files` (must be globally unique)
4. Choose location: `us-central1` (or your preferred region)
5. Choose storage class: `Standard`
6. Choose access control: `Uniform`
7. Click "Create"

## Step 4: Create a Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - Name: `drafter-storage-service`
   - Description: `Service account for Drafter file storage`
4. Click "Create and Continue"
5. Add role: `Storage Admin`
6. Click "Continue" → "Done"

## Step 5: Generate Service Account Key

1. Find your service account in the list
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" → "Create New Key"
5. Choose "JSON" format
6. Click "Create"
7. Download the JSON file and save it securely

## Step 6: Configure Environment Variables

1. Copy the downloaded JSON file to your project root: `service-account-key.json`
2. Create `.env.local` file in the project root:
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=drafter-files
GOOGLE_CLOUD_KEY_FILE=./service-account-key.json
```

Replace `your-project-id` with your actual Project ID from Step 1.

## Step 7: Set Bucket Permissions

1. Go to "Cloud Storage" → "Buckets"
2. Click on your bucket name
3. Go to "Permissions" tab
4. Click "Grant Access"
5. Add principal: `allUsers`
6. Role: `Storage Object Viewer`
7. Click "Save"

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Try uploading a file in the Drafter app
3. Check the browser console for any errors
4. Verify files appear in your Google Cloud Storage bucket

## Troubleshooting

### Common Issues:

1. **Authentication Error**: Make sure the service account key file path is correct
2. **Bucket Not Found**: Verify the bucket name matches your environment variable
3. **Permission Denied**: Ensure the service account has Storage Admin role
4. **CORS Issues**: Make sure bucket permissions allow public access

### Security Notes:

- Never commit the service account key file to version control
- Add `service-account-key.json` to your `.gitignore` file
- Consider using environment variables for production deployment

## File Organization

Files will be organized in the bucket as follows:
```
drafter-files/
├── users/
│   └── default/
│       ├── affiliate/
│       │   ├── 9x16/
│       │   └── 3x4/
│       └── ai-method/
│           ├── 9x16/
│           └── 3x4/
```

## Cost Considerations

- Google Cloud Storage offers 15GB free tier
- Standard storage: $0.020 per GB per month
- Network egress: $0.12 per GB (first 1GB free per month)
- Operations: $0.05 per 10,000 operations

For the free tier, you can store approximately:
- 15,000 small images (1MB each)
- 3,000 medium images (5MB each)
- 1,500 large images (10MB each)

## Next Steps

After completing this setup:
1. Test file uploads in the Drafter app
2. Verify files are accessible via public URLs
3. Monitor usage in Google Cloud Console
4. Set up billing alerts if needed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the service account has proper permissions
4. Check Google Cloud Console for any service issues



