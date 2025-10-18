// API endpoint for deleting files from Google Cloud Storage
import { NextApiRequest, NextApiResponse } from 'next';
import { deleteFile } from '@/lib/cloudStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const success = await deleteFile(filePath);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}



