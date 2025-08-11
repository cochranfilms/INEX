import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      // Get all messages
      const messagesData = fs.readFileSync(messagesPath, 'utf8');
      const messages = JSON.parse(messagesData);
      
      res.status(200).json({
        success: true,
        messages: messages,
        count: messages.length,
        lastUpdated: new Date().toISOString()
      });

    } else if (req.method === 'POST') {
      // Add new message
      const { name, text, email, priority = 'normal', category = 'general' } = req.body;

      // Validate required fields
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message text is required'
        });
      }

      // Read existing messages
      const messagesData = fs.readFileSync(messagesPath, 'utf8');
      const messages = JSON.parse(messagesData);

      // Create new message
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

      // Add to beginning of array (newest first)
      messages.unshift(newMessage);

      // Save back to file
      fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));

      // Also save to a backup file with timestamp
      const backupFile = `inex-messages-backup-${new Date().toISOString().split('T')[0]}.json`;
      const backupPath = path.join(process.cwd(), backupFile);
      fs.writeFileSync(backupPath, JSON.stringify(messages, null, 2));

      // Return success with the new message
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: newMessage,
        totalMessages: messages.length
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        allowed: ['GET', 'POST']
      });
    }

  } catch (error) {
    console.error('Messages API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
