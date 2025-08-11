export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return basic health check info
  res.status(200).json({
    success: true,
    message: 'INEX API Health Check',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL,
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    endpoints: [
      '/api/health',
      '/api/test',
      '/api/messages',
      '/api/message-manager',
      '/api/status-update'
    ]
  });
}
