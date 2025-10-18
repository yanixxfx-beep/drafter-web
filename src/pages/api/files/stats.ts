// API endpoint for getting storage statistics
import { NextApiRequest, NextApiResponse } from 'next';
import { getStorageStats } from '@/lib/cloudStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = await getStorageStats();
    
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Storage stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}



