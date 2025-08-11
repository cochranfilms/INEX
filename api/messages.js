// Vercel API function for messages - Single writer to inex-live-data.json
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // GET /api/messages - Retrieve all messages from the JSON file
      try {
        const jsonPath = path.join(process.cwd(), 'inex-live-data.json');
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const data = JSON.parse(jsonData);
        
        return res.status(200).json({
          success: true,
          messages: data.messages || [],
          count: (data.messages || []).length,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        });
      } catch (fileError) {
        console.error('Error reading JSON file:', fileError);
        return res.status(200).json({
          success: true,
          messages: [],
          count: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    }

    if (req.method === 'POST') {
      // POST /api/messages - Add new message directly to JSON file
      const { name, text, email, priority, category, action, messages } = req.body;
      
      // Handle bulk sync action
      if (action === 'sync' && messages && Array.isArray(messages)) {
        try {
          const jsonPath = path.join(process.cwd(), 'inex-live-data.json');
          let existingData = {};
          
          try {
            const jsonData = await fs.readFile(jsonPath, 'utf8');
            existingData = JSON.parse(jsonData);
          } catch (fileError) {
            console.log('No existing file, starting fresh');
          }
          
          // Add all messages to the beginning
          const existingMessages = existingData.messages || [];
          const allMessages = [...messages, ...existingMessages];
          
          // Update the data
          const updatedData = {
            ...existingData,
            messages: allMessages,
            lastUpdated: new Date().toISOString()
          };
          
          // Write back to file (single write)
          await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
          
          return res.status(200).json({
            success: true,
            message: 'Messages synced successfully',
            count: allMessages.length,
            messages: allMessages
          });
        } catch (error) {
          console.error('Error syncing messages:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to sync messages: ' + error.message
          });
        }
      }
      
      // Handle single message creation
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

      try {
        const jsonPath = path.join(process.cwd(), 'inex-live-data.json');
        let existingData = {};
        
        try {
          const jsonData = await fs.readFile(jsonPath, 'utf8');
          existingData = JSON.parse(jsonData);
        } catch (fileError) {
          console.log('No existing file, starting fresh');
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
        
        // Write back to file (single write)
        await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
        
        console.log('Message added successfully:', newMessage);
        
        return res.status(200).json({
          success: true,
          message: 'Message added successfully',
          data: newMessage,
          allMessages: updatedMessages
        });
      } catch (error) {
        console.error('Error adding message:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to add message: ' + error.message
        });
      }
    }

    if (req.method === 'PUT') {
      // PUT /api/messages - Update message (add response)
      const { messageId, action, responseText, responder } = req.body;
      
      if (!messageId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Message ID and action are required'
        });
      }

      try {
        const jsonPath = path.join(process.cwd(), 'inex-live-data.json');
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const existingData = JSON.parse(jsonData);
        
        // Find and update the message
        const messages = existingData.messages || [];
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        
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
        
        // Write back to file (single write)
        await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
        
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

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in messages API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
