// Vercel API function for status updates
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
      // Trigger GitHub workflow to update the status
      await triggerGitHubWorkflow('status-update', {
        progress: progress.toString(),
        phase: phase,
        status: status
      });
      
      console.log('Status update workflow triggered successfully');
      
      return res.json({ 
        success: true, 
        message: 'Status update workflow triggered successfully. Changes will be pushed to GitHub automatically.',
        data: {
          progress,
          phase,
          phaseName: phaseName || 'Discovery Phase',
          status,
          lastUpdated: new Date().toISOString(),
          eta: eta || 'Sep 11-18, 2025',
          scope: scope || 'Scope v1.0',
          owner: owner || 'Cochran Full Stack Solutions',
          client: client || 'INEX'
        }
      });
      
    } catch (workflowError) {
      console.error('Error triggering status update workflow:', workflowError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to trigger status update workflow: ' + workflowError.message 
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

// Helper function to trigger GitHub workflows
async function triggerGitHubWorkflow(workflowType, inputs) {
  try {
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('No GitHub token found, skipping workflow trigger');
      return;
    }

    // GitHub API configuration
    const owner = 'cochranfilms'; // GitHub organization name
    const repo = 'INEX'; // Repository name
    const workflowId = workflowType === 'messages' ? 'messages.yml' : 'status-update.yml';

    // Trigger the workflow
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'INEX-Portal-API'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: inputs
        })
      }
    );

    if (response.ok) {
      console.log('✅ Successfully triggered GitHub workflow:', workflowType);
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to trigger GitHub workflow:', errorData);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Failed to trigger GitHub workflow:', error.message);
    throw error; // Re-throw so the calling function can handle it
  }
}
