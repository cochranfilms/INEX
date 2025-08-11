module.exports = function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
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
    },
    {
      id: "1754887660760",
      name: "Test User",
      text: "This is a test message to verify the messaging system is working correctly.",
      email: "test@example.com",
      priority: "low",
      category: "test",
      timestamp: "2025-08-11T04:47:40.760Z",
      status: "new",
      read: false,
      responded: false
    },
    {
      id: "1754887660757",
      name: "Zebadiah Henry",
      text: "Hi team! I wanted to check on the progress of the INEX portal development. Everything looking good?",
      email: "zeb@inexsystemsdesigns.com",
      priority: "normal",
      category: "client-feedback",
      timestamp: "2025-08-11T04:47:40.757Z",
      status: "new",
      read: false,
      responded: false
    },
    {
      id: "1754887531321",
      name: "Zebadiah Henry",
      text: "Hi team! I wanted to check on the progress of the INEX portal development. Everything looking good?",
      email: "zeb@inexsystemsdesigns.com",
      priority: "normal",
      category: "client-feedback",
      timestamp: "2025-08-11T04:47:31.321Z",
      status: "responded",
      read: true,
      responded: true,
      lastUpdated: "2025-08-11T04:47:43.247Z",
      responses: [
        {
          text: "Thank you for your message! We are working hard on the INEX portal development. Everything is progressing well and we should have Phase 1 completed soon.",
          timestamp: "2025-08-11T04:47:43.247Z",
          responder: "Development Team"
        }
      ]
    }
  ];

  try {
    if (req.method === 'GET') {
      // GET /api/messages - Retrieve all messages
      return res.status(200).json({
        success: true,
        messages: defaultMessages,
        count: defaultMessages.length,
        lastUpdated: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      // POST /api/messages - Add new message
      const { name, text, email, priority, category } = req.body;
      
      if (!name || !text) {
        return res.status(400).json({
          success: false,
          error: 'Name and text are required fields'
        });
      }

      const newMessage = {
        id: Date.now().toString(),
        name: name.trim(),
        text: text.trim(),
        email: email ? email.trim() : null,
        priority: priority || 'normal',
        category: category || 'general',
        timestamp: new Date().toISOString(),
        status: 'new',
        read: false,
        responded: false
      };

      // For Vercel, we'll return the new message but can't persist it
      // In a real implementation, you'd use a database
      console.log('New message received:', newMessage);
      
      return res.status(200).json({
        success: true,
        message: 'Message received successfully (demo mode - not persisted)',
        data: newMessage
      });
    }

    if (req.method === 'PUT') {
      // PUT /api/messages - Update message (e.g., mark as read, add response)
      const { messageId, action, responseText, responder } = req.body;
      
      if (!messageId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Message ID and action are required'
        });
      }

      // Find the message to update
      const messageIndex = defaultMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      const message = defaultMessages[messageIndex];
      
      if (action === 'mark-read') {
        message.read = true;
        message.lastUpdated = new Date().toISOString();
      } else if (action === 'add-response' && responseText && responder) {
        if (!message.responses) {
          message.responses = [];
        }
        message.responses.push({
          text: responseText.trim(),
          timestamp: new Date().toISOString(),
          responder: responder.trim()
        });
        message.responded = true;
        message.status = 'responded';
        message.lastUpdated = new Date().toISOString();
      }

      console.log('Message updated:', message);
      
      return res.status(200).json({
        success: true,
        message: 'Message updated successfully (demo mode - not persisted)',
        data: message
      });
    }

    if (req.method === 'DELETE') {
      // DELETE /api/messages - Delete message
      const { messageId } = req.body;
      
      if (!messageId) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      const messageIndex = defaultMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      const deletedMessage = defaultMessages[messageIndex];
      console.log('Message deleted:', deletedMessage);
      
      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully (demo mode - not persisted)',
        data: deletedMessage
      });
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in messages API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
