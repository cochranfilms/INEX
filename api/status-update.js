export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      method: req.method,
      allowed: ['POST'] 
    });
  }

  try {
    const { progress, phase, status, update, update_status } = req.body;

    // Log the request for debugging
    console.log('Status update request:', { progress, phase, status, update, update_status });

    // Validate required fields
    if (!progress || !phase || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: progress, phase, status',
        received: { progress, phase, status, update, update_status }
      });
    }

    // Check if GitHub token is available
    if (!process.env.GITHUB_TOKEN) {
      console.error('GitHub token not found in environment variables');
      return res.status(500).json({ 
        error: 'GitHub token not configured',
        details: 'Please set GITHUB_TOKEN environment variable'
      });
    }

    // Trigger GitHub Actions workflow
    const response = await fetch(
      `https://api.github.com/repos/cochranfilms/INEX/actions/workflows/status-update.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            progress: progress.toString(),
            phase,
            status,
            update: update || '',
            update_status: update_status || 'In Progress'
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub API error:', error);
      return res.status(500).json({ 
        error: 'Failed to trigger GitHub Actions workflow',
        details: error,
        status: response.status,
        statusText: response.statusText
      });
    }

    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Status update triggered successfully',
      data: { progress, phase, status, update, update_status }
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
