// API endpoint for listing files from Google Cloud Storage
import { NextApiRequest, NextApiResponse } from 'next';
import { listFiles } from '@/lib/cloudStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, format } = req.query;

  if (!category || !format) {
    return res.status(400).json({ error: 'Category and format are required' });
  }

  try {
    const files = await listFiles(category as string, format as string);
    
    res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}



