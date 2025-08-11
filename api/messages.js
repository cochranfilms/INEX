// Vercel API function for messages
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
        const fs = require('fs').promises;
        const path = require('path');
        
        // Read the current JSON file
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
        // Fallback to default messages if file read fails
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
          }
        ];
        
        return res.status(200).json({
          success: true,
          messages: defaultMessages,
          count: defaultMessages.length,
          lastUpdated: new Date().toISOString()
        });
      }
    }

    if (req.method === 'POST') {
      // POST /api/messages - Add new message and trigger GitHub workflow
      const { name, text, email, priority, category, action, messages } = req.body;
      
      // Handle bulk sync action
      if (action === 'sync' && messages && Array.isArray(messages)) {
        try {
          // Trigger GitHub workflow for bulk sync
          await triggerGitHubWorkflow('messages', {
            name: 'Bulk Sync',
            text: `Syncing ${messages.length} messages from live site`,
            email: 'system@inex.cochranfilms.com',
            priority: 'normal',
            category: 'system'
          });
          
          return res.status(200).json({
            success: true,
            message: 'Messages sync workflow triggered successfully',
            count: messages.length
          });
        } catch (error) {
          console.error('Error triggering messages workflow:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to trigger messages workflow: ' + error.message
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
        // Trigger GitHub workflow to add the message
        await triggerGitHubWorkflow('messages', {
          name: newMessage.name,
          text: newMessage.text,
          email: newMessage.email || '',
          priority: newMessage.priority,
          category: newMessage.category
        });
        
        console.log('Message workflow triggered successfully:', newMessage);
        
        return res.status(200).json({
          success: true,
          message: 'Message workflow triggered successfully. Changes will be pushed to GitHub automatically.',
          data: newMessage
        });
      } catch (error) {
        console.error('Error triggering message workflow:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to trigger message workflow: ' + error.message
        });
      }
    }

    if (req.method === 'PUT') {
      // PUT /api/messages - Update message
      const { messageId, action, responseText, responder } = req.body;
      
      if (!messageId || !action) {
        return res.status(400).json({
          success: false,
          error: 'Message ID and action are required'
        });
      }

      try {
        // For now, just return success since updating requires more complex workflow logic
        // In a full implementation, you'd trigger a workflow to update the message
        
        return res.status(200).json({
          success: true,
          message: 'Message update request received. Full update functionality coming soon.',
          data: { messageId, action }
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
      // DELETE /api/messages - Delete message
      const { messageId } = req.body;
      
      if (!messageId) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      try {
        // For now, just return success since deletion requires more complex workflow logic
        // In a full implementation, you'd trigger a workflow to delete the message
        
        return res.status(200).json({
          success: true,
          message: 'Message deletion request received. Full deletion functionality coming soon.',
          data: { messageId }
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete message: ' + error.message
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

// Helper function to trigger GitHub workflows
async function triggerGitHubWorkflow(workflowType, inputs) {
  try {
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('No GitHub token found, skipping workflow trigger');
      return;
    }

    // GitHub API configuration
    const owner = 'cochranfilms'; // GitHub organization name
    const repo = 'INEX'; // Repository name
    const workflowId = workflowType === 'messages' ? 'messages.yml' : 'status-update.yml';

    // Trigger the workflow
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'INEX-Portal-API'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: inputs
        })
      }
    );

    if (response.ok) {
      console.log('✅ Successfully triggered GitHub workflow:', workflowType);
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to trigger GitHub workflow:', errorData);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Failed to trigger GitHub workflow:', error.message);
    throw error; // Re-throw so the calling function can handle it
  }
}
