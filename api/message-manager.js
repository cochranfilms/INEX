module.exports = function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Default messages data
  const defaultMessages = [
    {
      id: "1754906153138",
      name: "API Test",
      text: "Testing the comprehensive messaging system integration",
      email: null,
      priority: "high",
      category: "test",
      timestamp: "2025-08-11T09:55:53.138Z",
      status: "new",
      read: false,
      responded: false
    },
    {
      id: "1754892665931",
      name: "Test User",
      text: "This is a test message",
      email: null,
      priority: "normal",
      category: "general",
      timestamp: "2025-08-11T06:11:05.931Z",
      status: "new",
      read: false,
      responded: false
    }
  ];

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      messages: defaultMessages,
      count: defaultMessages.length,
      lastUpdated: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const { name, text, email, priority, category } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    const newMessage = {
      id: Date.now().toString(),
      name: (name || 'Anonymous').trim(),
      text: text.trim(),
      email: email ? email.trim() : null,
      priority: priority || 'normal',
      category: category || 'general',
      timestamp: new Date().toISOString(),
      status: 'new',
      read: false,
      responded: false
    };

    return res.status(201).json({
      success: true,
      message: 'Message created successfully (demo mode)',
      data: newMessage
    });
  }

  if (req.method === 'PUT') {
    const { id, action } = req.body;
    
    if (!id || !action) {
      return res.status(400).json({
        success: false,
        error: 'Message ID and action are required'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message updated successfully (demo mode)',
      data: { id, action }
    });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully (demo mode)',
      data: { id }
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
