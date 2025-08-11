import fs from 'fs';
import path from 'path';

const GITHUB_OWNER = 'cochranfilms';
const GITHUB_REPO = 'INEX';
const MESSAGES_FILE = 'inex-messages.json';

async function fetchMessagesFromGitHub() {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${MESSAGES_FILE}`;
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  if (!response.ok) {
    return [];
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function commitMessagesToGitHub(updatedMessages) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Missing GITHUB_TOKEN for GitHub write access');
  }

  const contentsApi = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MESSAGES_FILE}`;

  // Get current file SHA
  const getResp = await fetch(contentsApi, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });
  if (!getResp.ok) {
    const text = await getResp.text();
    throw new Error(`GitHub GET contents failed: ${getResp.status} ${text}`);
  }
  const getJson = await getResp.json();
  const sha = getJson.sha;

  const content = Buffer.from(JSON.stringify(updatedMessages, null, 2)).toString('base64');
  const putResp = await fetch(contentsApi, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `chore: update ${MESSAGES_FILE} (${new Date().toISOString()})`,
      content,
      sha,
      branch: 'main'
    })
  });
  if (!putResp.ok) {
    const text = await putResp.text();
    throw new Error(`GitHub PUT contents failed: ${putResp.status} ${text}`);
  }
}

export default async function handler(req, res) {
  // Enable CORS for global access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const messagesPath = path.join(process.cwd(), MESSAGES_FILE);

  try {
    // Ensure messages file exists
    // On Vercel/serverless, prefer GitHub as the source of truth
    const runningOnVercel = !!process.env.VERCEL;

    if (req.method === 'GET') {
      // Get all messages
      let messages = [];
      if (runningOnVercel) {
        messages = await fetchMessagesFromGitHub();
      } else {
        if (!fs.existsSync(messagesPath)) {
          fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
        }
        const messagesData = fs.readFileSync(messagesPath, 'utf8');
        messages = JSON.parse(messagesData);
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        success: true,
        messages,
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

      const runningOnVercel = !!process.env.VERCEL;
      let messages = [];
      if (runningOnVercel) {
        messages = await fetchMessagesFromGitHub();
      } else {
        if (!fs.existsSync(messagesPath)) {
          fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
        }
        const messagesData = fs.readFileSync(messagesPath, 'utf8');
        messages = JSON.parse(messagesData);
      }

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

      // Persist updates
      if (runningOnVercel) {
        await commitMessagesToGitHub(messages);
      } else {
        fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
        // Also save a local backup
        const backupFile = `inex-messages-backup-${new Date().toISOString().split('T')[0]}.json`;
        const backupPath = path.join(process.cwd(), backupFile);
        fs.writeFileSync(backupPath, JSON.stringify(messages, null, 2));
      }

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
};
