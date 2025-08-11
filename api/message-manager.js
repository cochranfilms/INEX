module.exports = function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Default messages data for Vercel deployment
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
    },
    {
      id: "1754887660763",
      name: "Urgent Client",
      text: "We have an urgent request for additional features. Please respond ASAP.",
      email: "urgent@client.com",
      priority: "urgent",
      category: "feature-request",
      timestamp: "2025-08-11T04:47:40.763Z",
      status: "responded",
      read: true,
      responded: true,
      lastUpdated: "2025-08-11T04:47:40.767Z",
      responses: [
        {
          text: "Thank you for your message! We are working on your request.",
          timestamp: "2025-08-11T04:47:40.767Z",
          responder: "Development Team"
        }
      ]
    }
  ];

  try {
    if (req.method === 'GET') {
      // Get messages with optional filters
      const { status, priority, category, limit = 50, offset = 0 } = req.query;
      
      let messages = [...defaultMessages];

      // Apply filters
      if (status) {
        messages = messages.filter(msg => msg.status === status);
      }
      if (priority) {
        messages = messages.filter(msg => msg.priority === priority);
      }
      if (category) {
        messages = messages.filter(msg => msg.category === category);
      }

      // Apply pagination
      const totalCount = messages.length;
      messages = messages.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        success: true,
        messages: messages,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < totalCount
        },
        filters: { status, priority, category },
        lastUpdated: new Date().toISOString()
      });

    } else if (req.method === 'PUT') {
      // Update message (mark as read, responded, change status, add response)
      const { id, status, read, responded, response, priority, category } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      // For Vercel, we can't persist changes, so just return success
      console.log('Message update requested:', { id, status, read, responded, response, priority, category });
      
      return res.status(200).json({
        success: true,
        message: 'Message update processed (demo mode - not persisted)',
        data: { id, status, read, responded, response, priority, category }
      });

    } else if (req.method === 'POST') {
      // Create new message
      const { name, text, email, priority = 'normal', category = 'general' } = req.body;

      if (!text || text.trim().length === 0) {
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
        priority: ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
        category: category || 'general',
        timestamp: new Date().toISOString(),
        status: 'new',
        read: false,
        responded: false
      };

      console.log('New message created:', newMessage);
      
      return res.status(201).json({
        success: true,
        message: 'Message created successfully (demo mode - not persisted)',
        data: newMessage
      });

    } else if (req.method === 'DELETE') {
      // Delete message
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      console.log('Message deletion requested:', id);
      
      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully (demo mode - not persisted)',
        data: { id }
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Error in message manager:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
