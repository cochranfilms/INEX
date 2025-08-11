export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { progress, phase, status, update, update_status } = req.body;

    // Validate required fields
    if (!progress || !phase || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: progress, phase, status' 
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
        details: error
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
      details: error.message 
    });
  }
}
