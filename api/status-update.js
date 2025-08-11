import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Only POST requests are supported.'
    });
  }

  try {
    const { progress, phase, status } = req.body;
    
    // Validate input
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid progress value. Must be a number between 0 and 100.' 
      });
    }
    
    if (!phase || typeof phase !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phase value. Must be a string.' 
      });
    }
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value. Must be a string.' 
      });
    }
    
    // Read existing consolidated data
    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(process.cwd(), liveDataFile);
    
    let liveData = {};
    
    try {
      // Try to read existing data
      if (fs.existsSync(liveDataPath)) {
        const existingData = fs.readFileSync(liveDataPath, 'utf8');
        liveData = JSON.parse(existingData);
      }
    } catch (readError) {
      console.log('No existing data found, starting fresh');
    }
    
    // Update the consolidated data
    const updatedData = {
      ...liveData,
      progress,
      phase,
      status,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(liveDataPath, JSON.stringify(updatedData, null, 2));
      console.log('Status data updated in consolidated inex-live-data.json');
    } catch (writeError) {
      console.error('Error saving consolidated data:', writeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save consolidated data'
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'Status update received and saved successfully to consolidated file',
      data: updatedData
    });
    
  } catch (error) {
    console.error('Error processing status update:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error processing status update' 
    });
  }
}
