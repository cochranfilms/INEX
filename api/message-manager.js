const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const messagesFile = 'inex-messages.json';
  const messagesPath = path.join(process.cwd(), messagesFile);

  try {
    // Ensure messages file exists
    if (!fs.existsSync(messagesPath)) {
      fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
    }

    if (req.method === 'GET') {
      // Get messages with optional filters
      const { status, priority, category, limit = 50, offset = 0 } = req.query;
      
      const messagesData = fs.readFileSync(messagesPath, 'utf8');
      let messages = JSON.parse(messagesData);

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

      const messagesData = fs.readFileSync(messagesPath, 'utf8');
      const messages = JSON.parse(messagesData);

      const messageIndex = messages.findIndex(msg => msg.id === id);
      if (messageIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      // Update message fields
      if (status !== undefined) messages[messageIndex].status = status;
      if (read !== undefined) messages[messageIndex].read = read;
      if (responded !== undefined) messages[messageIndex].responded = responded;
      if (priority !== undefined) messages[messageIndex].priority = priority;
      if (category !== undefined) messages[messageIndex].category = category;
      
      // Add response if provided
      if (response) {
        if (!messages[messageIndex].responses) {
          messages[messageIndex].responses = [];
        }
        messages[messageIndex].responses.push({
          text: response,
          timestamp: new Date().toISOString(),
          responder: 'Development Team'
        });
        messages[messageIndex].responded = true;
        messages[messageIndex].status = 'responded';
      }

      // Update timestamp
      messages[messageIndex].lastUpdated = new Date().toISOString();

      // Save back to file
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

      res.status(200).json({
        success: true,
        message: 'Message updated successfully',
        data: messages[messageIndex]
      });

    } else if (req.method === 'DELETE') {
      // Delete message (soft delete by marking as archived)
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      const messagesData = fs.readFileSync(messagesPath, 'utf8');
      const messages = JSON.parse(messagesData);

      const messageIndex = messages.findIndex(msg => msg.id === id);
      if (messageIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      // Soft delete by marking as archived
      messages[messageIndex].status = 'archived';
      messages[messageIndex].archivedAt = new Date().toISOString();

      // Save back to file
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

      res.status(200).json({
        success: true,
        message: 'Message archived successfully'
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowed: ['GET', 'PUT', 'DELETE']
      });
    }

  } catch (error) {
    console.error('Message manager API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
