import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const liveDataFile = 'inex-live-data.json';
  const liveDataPath = path.join(__dirname, '..', liveDataFile);

  try {
    // Ensure live data file exists with default structure
    if (!fs.existsSync(liveDataPath)) {
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
        phases: [
          {
            "name": "Phase 1",
            "progress": 5,
            "status": "active",
            "tasks": [
              {
                "id": "inex-branding",
                "name": "INEX branding integration and color tokens",
                "status": "in-progress"
              },
              {
                "id": "ui-framework",
                "name": "Basic UI framework (Dark/Light themes)",
                "status": "pending"
              },
              {
                "id": "dashboard-structure",
                "name": "Core dashboard structure and navigation",
                "status": "pending"
              },
              {
                "id": "project-docs",
                "name": "Project documentation and specs",
                "status": "pending"
              },
              {
                "id": "deployment-prep",
                "name": "Deployment preparation and testing",
                "status": "pending"
              }
            ]
          }
        ],
        updates: [
          {
            "date": "Jan 8",
            "update": "Phase 1 initiated - INEX branding integration started",
            "status": "In Progress"
          }
        ],
        nextActions: [
          "Complete INEX branding integration",
          "Finalize basic UI framework and themes",
          "Prepare core dashboard structure"
        ],
        messages: []
      };
      fs.writeFileSync(liveDataPath, JSON.stringify(defaultData, null, 2));
    }

    if (req.method === 'GET') {
      // GET /api/messages - Retrieve all messages from consolidated file
      const liveData = fs.readFileSync(liveDataPath, 'utf8');
      const data = JSON.parse(liveData);
      const messages = data.messages || [];
      
      return res.status(200).json({
        success: true,
        messages: messages,
        count: messages.length,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      // POST /api/messages - Create new message
      const { name, text, email, priority = 'normal', category = 'general' } = req.body;
      
      // Validate required fields
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message text is required'
        });
      }
      
      // Read existing live data
      const liveData = fs.readFileSync(liveDataPath, 'utf8');
      const data = JSON.parse(liveData);
      const messages = data.messages || [];
      
      // Create new message with proper structure
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
      
      // Update the consolidated data
      data.messages = messages;
      data.lastUpdated = new Date().toISOString();
      
      // Save back to consolidated file
      fs.writeFileSync(liveDataPath, JSON.stringify(data, null, 2));
      
      // Create comprehensive backup with timestamp
      const backupFile = `inex-live-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      const backupPath = path.join(__dirname, '..', backupFile);
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      
      // Also save messages-only backup
      const messagesBackupFile = `inex-messages-backup-${new Date().toISOString().split('T')[0]}.json`;
      const messagesBackupPath = path.join(__dirname, '..', messagesBackupFile);
      fs.writeFileSync(messagesBackupPath, JSON.stringify(messages, null, 2));
      
      console.log('Message saved and backups created:', {
        liveData: liveDataFile,
        dataBackup: backupFile,
        messagesBackup: messagesBackupFile
      });
      
      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: newMessage,
        totalMessages: messages.length
      });
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error processing messages request:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing messages request'
    });
  }
}
