export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return basic info about the API
  res.status(200).json({
    success: true,
    message: 'INEX API is working',
    method: req.method,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    endpoints: {
      test: '/api/test',
      statusUpdate: '/api/status-update',
      firebase: '/api/firebase/public-config'
    },
    help: 'Use POST /api/status-update to update project status'
  });
}
