// Vercel API function for messages - Single writer to inex-live-data.json with robust error handling
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
        // Use absolute path and ensure file exists
        const jsonPath = path.resolve(process.cwd(), 'inex-live-data.json');
        console.log('📁 Reading messages from:', jsonPath);
        
        // Check if file exists
        try {
          await fs.access(jsonPath);
        } catch (accessError) {
          console.log('⚠️ File does not exist, creating default structure');
          const defaultData = {
            progress: 5,
            phase: "Phase 1",
            phaseName: "Prototype Polish",
            status: "Phase 1 (Prototype Polish) in progress. Working on INEX branding integration and basic UI framework. On track for Aug 22 completion.",
            lastUpdated: new Date().toISOString(),
            eta: "Sep 11-18, 2025",
            scope: "Scope v1.0",
            owner: "Cochran Full Stack Solutions",
            client: "INEX",
            phases: [],
            updates: [],
            nextActions: [],
            messages: []
          };
          await fs.writeFile(jsonPath, JSON.stringify(defaultData, null, 2));
          console.log('✅ Created default data file');
        }
        
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const data = JSON.parse(jsonData);
        
        console.log(`✅ Successfully read ${(data.messages || []).length} messages from file`);
        
        return res.status(200).json({
          success: true,
          messages: data.messages || [],
          count: (data.messages || []).length,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        });
      } catch (fileError) {
        console.error('❌ Error reading JSON file:', fileError);
        return res.status(200).json({
          success: true,
          messages: [],
          count: 0,
          lastUpdated: new Date().toISOString(),
          warning: 'Using empty message list due to file read error'
        });
      }
    }

    if (req.method === 'POST') {
      // POST /api/messages - Add new message directly to JSON file
      const { name, text, email, priority, category, action, messages } = req.body;
      
      // Handle bulk sync action
      if (action === 'sync' && messages && Array.isArray(messages)) {
        try {
          const jsonPath = path.resolve(process.cwd(), 'inex-live-data.json');
          console.log('📁 Syncing messages to:', jsonPath);
          
          let existingData = {};
          
          try {
            // Check if file exists
            await fs.access(jsonPath);
            const jsonData = await fs.readFile(jsonPath, 'utf8');
            existingData = JSON.parse(jsonData);
            console.log('✅ Read existing data file');
          } catch (fileError) {
            console.log('⚠️ No existing file, starting fresh');
            existingData = {
              progress: 5,
              phase: "Phase 1",
              phaseName: "Prototype Polish",
              status: "Phase 1 (Prototype Polish) in progress. Working on INEX branding integration and basic UI framework. On track for Aug 22 completion.",
              lastUpdated: new Date().toISOString(),
              eta: "Sep 11-18, 2025",
              scope: "Scope v1.0",
              owner: "Cochran Full Stack Solutions",
              client: "INEX",
              phases: [],
              updates: [],
              nextActions: [],
              messages: []
            };
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
          
          // Write back to file with error handling
          await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
          console.log(`✅ Successfully synced ${messages.length} messages, total: ${allMessages.length}`);
          
          return res.status(200).json({
            success: true,
            message: 'Messages synced successfully',
            count: allMessages.length,
            messages: allMessages
          });
        } catch (error) {
          console.error('❌ Error syncing messages:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to sync messages: ' + error.message,
            details: {
              filePath: path.resolve(process.cwd(), 'inex-live-data.json'),
              errorType: error.constructor.name,
              errorCode: error.code
            }
          });
        }
      }
      
      // Handle single message creation
      if (!name || !text) {
        return res.status(400).json({
          success: false,
          error: 'Name and text are required fields',
          received: { name: !!name, text: !!text }
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
        const jsonPath = path.resolve(process.cwd(), 'inex-live-data.json');
        console.log('📁 Adding message to:', jsonPath);
        
        let existingData = {};
        
        try {
          // Check if file exists
          await fs.access(jsonPath);
          const jsonData = await fs.readFile(jsonPath, 'utf8');
          existingData = JSON.parse(jsonData);
          console.log('✅ Read existing data file');
        } catch (fileError) {
          console.log('⚠️ No existing file, creating default structure');
          existingData = {
            progress: 5,
            phase: "Phase 1",
            phaseName: "Prototype Polish",
            status: "Phase 1 (Prototype Polish) in progress. Working on INEX branding integration and basic UI framework. On track for Aug 22 completion.",
            lastUpdated: new Date().toISOString(),
            eta: "Sep 11-18, 2025",
            scope: "Scope v1.0",
            owner: "Cochran Full Stack Solutions",
            client: "INEX",
            phases: [],
            updates: [],
            nextActions: [],
            messages: []
          };
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
        
        // Write back to file with error handling
        await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
        
        console.log('✅ Message added successfully:', {
          id: newMessage.id,
          name: newMessage.name,
          totalMessages: updatedMessages.length
        });
        
        return res.status(200).json({
          success: true,
          message: 'Message added successfully',
          data: newMessage,
          allMessages: updatedMessages
        });
      } catch (error) {
        console.error('❌ Error adding message:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to add message: ' + error.message,
          details: {
            filePath: path.resolve(process.cwd(), 'inex-live-data.json'),
            errorType: error.constructor.name,
            errorCode: error.code,
            messageData: newMessage
          }
        });
      }
    }

    if (req.method === 'PUT') {
      // PUT /api/messages - Update message (add response)
      const { messageId, action, responseText, responder } = req.body;
      
      if (!messageId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Message ID and action are required',
          received: { messageId: !!messageId, action: !!action }
        });
      }

      try {
        const jsonPath = path.resolve(process.cwd(), 'inex-live-data.json');
        console.log('📁 Updating message in:', jsonPath);
        
        // Check if file exists
        try {
          await fs.access(jsonPath);
        } catch (accessError) {
          return res.status(404).json({
            success: false,
            error: 'Data file not found'
          });
        }
        
        const jsonData = await fs.readFile(jsonPath, 'utf8');
        const existingData = JSON.parse(jsonData);
        
        // Find and update the message
        const messages = existingData.messages || [];
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        
        if (messageIndex === -1) {
          return res.status(404).json({
            success: false,
            error: 'Message not found',
            messageId: messageId,
            totalMessages: messages.length
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
        
        // Write back to file with error handling
        await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));
        
        console.log('✅ Message updated successfully:', {
          messageId: messageId,
          action: action
        });
        
        return res.status(200).json({
          success: true,
          message: 'Message updated successfully',
          data: messages[messageIndex]
        });
      } catch (error) {
        console.error('❌ Error updating message:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update message: ' + error.message,
          details: {
            filePath: path.resolve(process.cwd(), 'inex-live-data.json'),
            errorType: error.constructor.name,
            errorCode: error.code,
            messageId: messageId,
            action: action
          }
        });
      }
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'PUT', 'OPTIONS']
    });

  } catch (error) {
    console.error('❌ Unhandled error in messages API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message,
      details: {
        errorType: error.constructor.name,
        errorCode: error.code,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
}
