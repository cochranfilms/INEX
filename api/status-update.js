// Vercel API function for status updates - Single writer to inex-live-data.json with robust error handling
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
      error: 'Method not allowed. Only POST requests are supported.',
      allowedMethods: ['POST', 'OPTIONS']
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
        error: 'Invalid progress value. Must be a number between 0 and 100.',
        received: { progress, type: typeof progress }
      });
    }
    
    if (!phase || typeof phase !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phase value. Must be a string.',
        received: { phase, type: typeof phase }
      });
    }
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value. Must be a string.',
        received: { status, type: typeof status }
      });
    }
    
    try {
      // Use absolute path and ensure file exists
      const jsonPath = path.resolve(process.cwd(), 'inex-live-data.json');
      console.log('📁 Updating status in:', jsonPath);
      
      let existingData = {};
      
      try {
        // Check if file exists
        await fs.access(jsonPath);
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        existingData = JSON.parse(jsonData);
        console.log('✅ Read existing data file');
      } catch (fileError) {
        console.log('⚠️ No existing file, creating default structure');
        existingData = {
          progress: 5,
          phase: "Phase 1",
          phaseName: "Prototype Polish",
          status: "Phase 1 (Prototype Polish) in progress. Working on INEX branding integration and basic UI framework. On track for Aug 22 completion.",
          lastUpdated: new Date().toISOString(),
          eta: "Sep 11-18, 2025",
          scope: "Scope v1.0",
          owner: "Cochran Full Stack Solutions",
          client: "INEX",
          phases: [],
          updates: [],
          nextActions: [],
          messages: []
        };
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
      
      // Write to file with error handling
      await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
      
      console.log('✅ Status data updated successfully:', {
        progress: updatedData.progress,
        phase: updatedData.phase,
        lastUpdated: updatedData.lastUpdated
      });
      
      return res.json({ 
        success: true, 
        message: 'Status update received and saved successfully',
        data: updatedData
      });
      
    } catch (writeError) {
      console.error('❌ Error saving status data:', writeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save status data: ' + writeError.message,
        details: {
          filePath: path.resolve(process.cwd(), 'inex-live-data.json'),
          errorType: writeError.constructor.name,
          errorCode: writeError.code,
          receivedData: { progress, phase, status, phaseName, eta, scope, owner, client }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Status update API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message,
      details: {
        errorType: error.constructor.name,
        errorCode: error.code,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
}
