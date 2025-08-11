// Vercel API function for messages - Uses GitHub API to update inex-live-data.json with robust error handling
import { promises as fs } from 'fs';
import path from 'path';

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'cochranfilms/INEX';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_API_BASE = 'https://api.github.com';

// Helper function to update file via GitHub API
async function updateFileViaGitHub(filePath, content, commitMessage) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  try {
    // First, get the current file to get its SHA
    const getFileResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'INEX-Portal-API'
      }
    });

    let currentSha = null;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      currentSha = fileData.sha;
    }

    // Update the file
    const updateResponse = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'INEX-Portal-API'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
        branch: GITHUB_BRANCH,
        ...(currentSha && { sha: currentSha })
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || updateResponse.statusText}`);
    }

    return await updateResponse.json();
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

// Helper function to read file via GitHub API
async function readFileViaGitHub(filePath) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'INEX-Portal-API'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist, return default structure
        return {
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
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('GitHub API read error:', error);
    throw error;
  }
}

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
      // GET /api/messages - Retrieve all messages from the JSON file via GitHub
      try {
        console.log('📁 Reading messages from GitHub repository');
        
        const data = await readFileViaGitHub('inex-live-data.json');
        
        console.log(`✅ Successfully read ${(data.messages || []).length} messages from GitHub`);
        
        return res.status(200).json({
          success: true,
          messages: data.messages || [],
          count: (data.messages || []).length,
          lastUpdated: data.lastUpdated || new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error reading from GitHub:', error);
        return res.status(200).json({
          success: true,
          messages: [],
          count: 0,
          lastUpdated: new Date().toISOString(),
          warning: 'Using empty message list due to GitHub API error'
        });
      }
    }

    if (req.method === 'POST') {
      // POST /api/messages - Add new message via GitHub API
      const { name, text, email, priority, category, action, messages } = req.body;
      
      // Handle bulk sync action
      if (action === 'sync' && messages && Array.isArray(messages)) {
        try {
          console.log('📁 Syncing messages via GitHub API');
          
          let existingData = {};
          
          try {
            existingData = await readFileViaGitHub('inex-live-data.json');
            console.log('✅ Read existing data from GitHub');
          } catch (error) {
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
          
          // Update via GitHub API
          await updateFileViaGitHub(
            'inex-live-data.json',
            JSON.stringify(updatedData, null, 2),
            `Sync ${messages.length} messages - ${new Date().toISOString()}`
          );
          
          console.log(`✅ Successfully synced ${messages.length} messages via GitHub, total: ${allMessages.length}`);
          
          return res.status(200).json({
            success: true,
            message: 'Messages synced successfully via GitHub',
            count: allMessages.length,
            messages: allMessages
          });
        } catch (error) {
          console.error('❌ Error syncing messages via GitHub:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to sync messages via GitHub: ' + error.message,
            details: {
              errorType: error.constructor.name,
              errorMessage: error.message
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
        console.log('📁 Adding message via GitHub API');
        
        let existingData = {};
        
        try {
          existingData = await readFileViaGitHub('inex-live-data.json');
          console.log('✅ Read existing data from GitHub');
        } catch (error) {
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
        
        // Update via GitHub API
        await updateFileViaGitHub(
          'inex-live-data.json',
          JSON.stringify(updatedData, null, 2),
          `Add message from ${newMessage.name} - ${new Date().toISOString()}`
        );
        
        console.log('✅ Message added successfully via GitHub:', {
          id: newMessage.id,
          name: newMessage.name,
          totalMessages: updatedMessages.length
        });
        
        return res.status(200).json({
          success: true,
          message: 'Message added successfully via GitHub',
          data: newMessage,
          allMessages: updatedMessages
        });
      } catch (error) {
        console.error('❌ Error adding message via GitHub:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to add message via GitHub: ' + error.message,
          details: {
            errorType: error.constructor.name,
            errorMessage: error.message,
            messageData: newMessage
          }
        });
      }
    }

    if (req.method === 'PUT') {
      // PUT /api/messages - Update message via GitHub API
      const { messageId, action, responseText, responder } = req.body;
      
      if (!messageId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Message ID and action are required',
          received: { messageId: !!messageId, action: !!action }
        });
      }

      try {
        console.log('📁 Updating message via GitHub API');
        
        const existingData = await readFileViaGitHub('inex-live-data.json');
        
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
        
        // Update via GitHub API
        await updateFileViaGitHub(
          'inex-live-data.json',
          JSON.stringify(updatedData, null, 2),
          `Update message ${messageId} - ${action} - ${new Date().toISOString()}`
        );
        
        console.log('✅ Message updated successfully via GitHub:', {
          messageId: messageId,
          action: action
        });
        
        return res.status(200).json({
          success: true,
          message: 'Message updated successfully via GitHub',
          data: messages[messageIndex]
        });
      } catch (error) {
        console.error('❌ Error updating message via GitHub:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update message via GitHub: ' + error.message,
          details: {
            errorType: error.constructor.name,
            errorMessage: error.message,
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
        errorMessage: error.message,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    });
  }
}
