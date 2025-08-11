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
      allowed: ['POST'],
      message: 'This endpoint only accepts POST requests. Please use POST method to update status.'
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
        details: 'Please set GITHUB_TOKEN environment variable in Vercel dashboard',
        help: 'Go to Vercel Dashboard > Project Settings > Environment Variables and add GITHUB_TOKEN'
      });
    }

    // Ensure fetch is available (Node 18+ has it built-in)
    if (typeof fetch === 'undefined') {
      console.error('Fetch is not available in this environment');
      return res.status(500).json({ 
        error: 'Fetch not available',
        details: 'This API requires Node.js 18+ or a fetch polyfill',
        nodeVersion: process.version
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
        statusText: response.statusText,
        help: 'Check GitHub token permissions and repository access'
      });
    }

    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Status update triggered successfully',
      data: { progress, phase, status, update, update_status },
      nextSteps: 'GitHub Actions workflow has been triggered. Check the Actions tab in your repository for progress.'
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      help: 'Check server logs for more details'
    });
  }
}
