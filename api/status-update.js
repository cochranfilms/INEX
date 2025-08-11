// Vercel API function for status updates - Single writer to inex-live-data.json
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
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
    const { 
      progress, 
      phase, 
      status, 
      phaseName, 
      eta, 
      scope, 
      owner, 
      client, 
      phases, 
      updates, 
      nextActions 
    } = req.body;
    
    // Validate required input
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
    
    try {
      const jsonPath = path.join(process.cwd(), 'inex-live-data.json');
      let existingData = {};
      
      try {
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        existingData = JSON.parse(jsonData);
      } catch (fileError) {
        console.log('No existing file, starting fresh');
      }
      
      // Update the consolidated data with all available parameters
      const updatedData = {
        ...existingData,
        progress,
        phase,
        phaseName: phaseName || existingData.phaseName || 'Prototype Polish',
        status,
        lastUpdated: new Date().toISOString(),
        eta: eta || existingData.eta || 'Sep 11-18, 2025',
        scope: scope || existingData.scope || 'Scope v1.0',
        owner: owner || existingData.owner || 'Cochran Full Stack Solutions',
        client: client || existingData.client || 'INEX',
        phases: phases || existingData.phases || [],
        updates: updates || existingData.updates || [],
        nextActions: nextActions || existingData.nextActions || []
      };
      
      // Write to file (single write)
      await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
      
      console.log('Status data updated in inex-live-data.json');
      
      return res.json({ 
        success: true, 
        message: 'Status update received and saved successfully',
        data: updatedData
      });
      
    } catch (writeError) {
      console.error('Error saving status data:', writeError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save status data: ' + writeError.message 
      });
    }
    
  } catch (error) {
    console.error('Error processing status update:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error processing status update: ' + error.message 
    });
  }
}
