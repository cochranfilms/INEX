// Vercel API function for message management - Hybrid approach with JSON files
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Use a separate messages file to keep inex-live-data.json untouched
      const messagesPath = path.join(process.cwd(), 'inex-messages.json');
      
      // Check if messages file exists, create if not
      if (!fs.existsSync(messagesPath)) {
        await fs.writeFile(messagesPath, JSON.stringify({ messages: [] }, null, 2));
      }
      
      const messagesData = await fs.readFile(messagesPath, 'utf8');
      const data = JSON.parse(messagesData);
      
      return res.status(200).json({
        success: true,
        messages: data.messages || [],
        count: (data.messages || []).length,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(200).json({
        success: true,
        messages: [],
        count: 0,
        lastUpdated: new Date().toISOString()
      });
    }
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

    try {
      // Use a separate messages file to keep inex-live-data.json untouched
      const messagesPath = path.join(process.cwd(), 'inex-messages.json');
      
      // Read existing messages or create new file
      let existingData = {};
      try {
        const messagesData = await fs.readFile(messagesPath, 'utf8');
        existingData = JSON.parse(messagesData);
      } catch (fileError) {
        console.log('No existing messages file, starting fresh');
      }
      
      // Add new message to beginning of messages array
      const existingMessages = existingData.messages || [];
      const updatedMessages = [newMessage, ...existingMessages];
      
      // Update the data
      const updatedData = {
        ...existingData,
        messages: updatedMessages,
        lastUpdated: new Date().toISOString()
      };
      
      // Write back to separate messages file
      await fs.writeFile(messagesPath, JSON.stringify(updatedData, null, 2));
      
      return res.status(201).json({
        success: true,
        message: 'Message created successfully',
        data: newMessage,
        allMessages: updatedMessages
      });
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create message: ' + error.message
      });
    }
  }

  if (req.method === 'PUT') {
    const { id, action, responseText, responder } = req.body;
    
    if (!id || !action) {
      return res.status(400).json({
        success: false,
        error: 'Message ID and action are required'
      });
    }

    try {
      // Use a separate messages file to keep inex-live-data.json untouched
      const messagesPath = path.join(process.cwd(), 'inex-messages.json');
      
      // Read existing messages
      const messagesData = await fs.readFile(messagesPath, 'utf8');
      const existingData = JSON.parse(messagesData);
      const messages = existingData.messages || [];
      
      // Find the message to update
      const messageIndex = messages.findIndex(msg => msg.id === id);
      
      if (messageIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }
      
      // Update the message based on action
      if (action === 'markRead') {
        messages[messageIndex].read = true;
      } else if (action === 'addResponse') {
        messages[messageIndex].responded = true;
        if (!messages[messageIndex].responses) {
          messages[messageIndex].responses = [];
        }
        messages[messageIndex].responses.push({
          text: responseText,
          responder: responder || 'Development Team',
          timestamp: new Date().toISOString()
        });
      }
      
      // Update lastUpdated
      const updatedData = {
        ...existingData,
        messages: messages,
        lastUpdated: new Date().toISOString()
      };
      
      // Write back to separate messages file
      await fs.writeFile(messagesPath, JSON.stringify(updatedData, null, 2));
      
      return res.status(200).json({
        success: true,
        message: 'Message updated successfully',
        data: messages[messageIndex]
      });
    } catch (error) {
      console.error('Error updating message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update message: ' + error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    try {
      // Use a separate messages file to keep inex-live-data.json untouched
      const messagesPath = path.join(process.cwd(), 'inex-messages.json');
      
      // Read existing messages
      const messagesData = await fs.readFile(messagesPath, 'utf8');
      const existingData = JSON.parse(messagesData);
      const messages = existingData.messages || [];
      
      // Find the message to archive
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
      
      // Update lastUpdated
      const updatedData = {
        ...existingData,
        messages: messages,
        lastUpdated: new Date().toISOString()
      };
      
      // Write back to separate messages file
      await fs.writeFile(messagesPath, JSON.stringify(updatedData, null, 2));
      
      return res.status(200).json({
        success: true,
        message: 'Message archived successfully'
      });
    } catch (error) {
      console.error('Error archiving message:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to archive message: ' + error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
