// Vercel API function for status updates - Uses GitHub API to update inex-live-data.json with robust error handling
import { promises as fs } from 'fs';
import path from 'path';

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'cochranfilms/INEX';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_API_BASE = 'https://api.github.com';

// Helper function to update file via GitHub API
async function updateFileViaGitHub(filePath, content, commitMessage) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  try {
    // First, get the current file to get its SHA
    const getFileResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'INEX-Portal-API'
      }
    });

    let currentSha = null;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      currentSha = fileData.sha;
    }

    // Update the file
    const updateResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'INEX-Portal-API'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        branch: GITHUB_BRANCH,
        ...(currentSha && { sha: currentSha })
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || updateResponse.statusText}`);
    }

    return await updateResponse.json();
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

// Helper function to read file via GitHub API
async function readFileViaGitHub(filePath) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'INEX-Portal-API'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist, return default structure
        return {
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
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('GitHub API read error:', error);
    throw error;
  }
}

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
      // Use GitHub API to read and update the file
      console.log('📁 Updating status via GitHub API');
      
      let existingData = {};
      
      try {
        existingData = await readFileViaGitHub('inex-live-data.json');
        console.log('✅ Read existing data from GitHub');
      } catch (error) {
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
      
      // Update via GitHub API
      await updateFileViaGitHub(
        'inex-live-data.json',
        JSON.stringify(updatedData, null, 2),
        `Status update: ${phase} - Progress ${progress}% - ${new Date().toISOString()}`
      );
      
      console.log('✅ Status data updated successfully via GitHub:', {
        progress: updatedData.progress,
        phase: updatedData.phase,
        lastUpdated: updatedData.lastUpdated
      });
      
      return res.json({ 
        success: true, 
        message: 'Status update received and saved successfully via GitHub',
        data: updatedData
      });
      
    } catch (writeError) {
      console.error('❌ Error saving status data via GitHub:', writeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save status data via GitHub: ' + writeError.message,
        details: {
          errorType: writeError.constructor.name,
          errorMessage: writeError.message,
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
        errorMessage: error.message,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
}
