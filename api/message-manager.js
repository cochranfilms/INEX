import fs from 'fs';
import path from 'path';

const GITHUB_OWNER = 'cochranfilms';
const GITHUB_REPO = 'INEX';
const MESSAGES_FILE = 'inex-messages.json';

async function fetchMessagesFromGitHub() {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${MESSAGES_FILE}`;
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) return [];
  const text = await response.text();
  try { return JSON.parse(text); } catch { return []; }
}

async function commitMessagesToGitHub(updatedMessages) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Missing GITHUB_TOKEN for GitHub write access');
  const contentsApi = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MESSAGES_FILE}`;
  const getResp = await fetch(contentsApi, { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
  if (!getResp.ok) throw new Error(`GitHub GET contents failed: ${getResp.status}`);
  const getJson = await getResp.json();
  const sha = getJson.sha;
  const content = Buffer.from(JSON.stringify(updatedMessages, null, 2)).toString('base64');
  const putResp = await fetch(contentsApi, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `chore: update ${MESSAGES_FILE} (${new Date().toISOString()})`, content, sha, branch: 'main' })
  });
  if (!putResp.ok) throw new Error(`GitHub PUT contents failed: ${putResp.status}`);
}

export default async function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const messagesPath = path.join(process.cwd(), MESSAGES_FILE);

  try {
    const runningOnVercel = !!process.env.VERCEL;

    if (req.method === 'GET') {
      // Get messages with optional filters
      const { status, priority, category, limit = 50, offset = 0 } = req.query;
      
      let messages = [];
      if (runningOnVercel) {
        messages = await fetchMessagesFromGitHub();
      } else {
        if (!fs.existsSync(messagesPath)) fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
        const messagesData = fs.readFileSync(messagesPath, 'utf8');
        messages = JSON.parse(messagesData);
      }

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

      let messages = [];
      if (runningOnVercel) {
        messages = await fetchMessagesFromGitHub();
      } else {
        if (!fs.existsSync(messagesPath)) fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
        const messagesData = fs.readFileSync(messagesPath, 'utf8');
        messages = JSON.parse(messagesData);
      }

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

      // Save back
      if (runningOnVercel) {
        await commitMessagesToGitHub(messages);
      } else {
        fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
      }

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

      let messages = [];
      if (runningOnVercel) {
        messages = await fetchMessagesFromGitHub();
      } else {
        if (!fs.existsSync(messagesPath)) fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
        const messagesData = fs.readFileSync(messagesPath, 'utf8');
        messages = JSON.parse(messagesData);
      }

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

      // Save back
      if (runningOnVercel) {
        await commitMessagesToGitHub(messages);
      } else {
        fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
      }

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
