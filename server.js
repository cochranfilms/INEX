import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Middleware to handle case-insensitive routing and file extensions
app.use((req, res, next) => {
  let url = req.url;
  
  // Remove leading slash
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  
  // If no file extension, try to find the file
  if (!path.extname(url)) {
    // Check if it's a directory
    if (url === '' || url === '/') {
      // Serve index.html for root
      return res.sendFile(path.join(__dirname, 'index.html'));
    }
    
    // Try to find the file with different extensions
    const possibleExtensions = ['.html', '.htm'];
    let fileFound = false;
    
    for (const ext of possibleExtensions) {
      const filePath = path.join(__dirname, url + ext);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
    
    // If no extension found, try to find a file that matches the name (case-insensitive)
    const dir = path.dirname(url);
    const baseName = path.basename(url);
    const fullDir = dir === '.' ? __dirname : path.join(__dirname, dir);
    
    if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
      try {
        const files = fs.readdirSync(fullDir);
        const matchingFile = files.find(file => 
          file.toLowerCase() === baseName.toLowerCase() ||
          file.toLowerCase() === baseName.toLowerCase() + '.html' ||
          file.toLowerCase() === baseName.toLowerCase() + '.htm'
        );
        
        if (matchingFile) {
          const fullPath = path.join(fullDir, matchingFile);
          return res.sendFile(fullPath);
        }
      } catch (err) {
        // Directory read error, continue to next middleware
      }
    }
  }
  
  next();
});

// Handle specific routes for common HTML files
const htmlFiles = [
  'index',
  'status',
  'inex-portal-agreement',
  'inex-proposal',
  'contract-reference',
  'test-api'
];

htmlFiles.forEach(file => {
  // Handle without extension
  app.get(`/${file}`, (req, res) => {
    const filePath = path.join(__dirname, `${file}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });
  
  // Handle with .html extension
  app.get(`/${file}.html`, (req, res) => {
    const filePath = path.join(__dirname, `${file}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });
  
  // Handle uppercase variations
  app.get(`/${file.toUpperCase()}`, (req, res) => {
    const filePath = path.join(__dirname, `${file}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });
  
  app.get(`/${file.toUpperCase()}.HTML`, (req, res) => {
    const filePath = path.join(__dirname, `${file}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  });
});

// Test endpoint to verify server is working
app.get('/api/health', (req, res) => {
  res.json({
    success: true, 
    message: 'INEX Portal API is running',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/status-update', '/api/messages', '/api/health', '/api/live-data', '/api/message-manager']
  });
});

// GET endpoint for live data
app.get('/api/live-data', (req, res) => {
  try {
    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);
    
    // Ensure live data file exists
    if (!fs.existsSync(liveDataPath)) {
      const defaultData = {
        progress: 5,
        phase: "Discovery",
        phaseName: "Discovery Phase",
        status: "Requirements gathering in progress - initial stakeholder interviews completed",
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
      fs.writeFileSync(liveDataPath, JSON.stringify(defaultData, null, 2));
    }
    
    const liveData = fs.readFileSync(liveDataPath, 'utf8');
    const data = JSON.parse(liveData);
    
    res.json({
      success: true,
      data: data,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error reading live data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error reading live data'
    });
  }
});

// API Endpoints
app.put('/api/live-data', (req, res) => {
  try {
    const updateData = req.body;
    
    // Validate input
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data. Must be an object.' 
      });
    }
    
    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);
    
    // Read existing live data
    let existingData = {};
    try {
      if (fs.existsSync(liveDataPath)) {
        const existingFile = fs.readFileSync(liveDataPath, 'utf8');
        existingData = JSON.parse(existingFile);
      }
    } catch (readError) {
      console.log('No existing data found, starting fresh');
    }
    
    // Update the data with new values
    const updatedData = {
      ...existingData,
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(liveDataPath, JSON.stringify(updatedData, null, 2));
      console.log('Live data updated in inex-live-data.json');
    } catch (writeError) {
      console.error('Error saving live data:', writeError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save live data'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Live data updated successfully',
      data: updatedData
    });
    
  } catch (error) {
    console.error('Error updating live data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error updating live data' 
    });
  }
});

app.post('/api/status-update', (req, res) => {
  try {
    const { progress, phase, status } = req.body;
    
    // Validate input
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid progress value. Must be a number between 0 and 100.' 
      });
    }
    
    if (!phase || typeof phase !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phase value. Must be a string.' 
      });
    }
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value. Must be a string.' 
      });
    }
    
    // Here you would typically save to a database or file
    // For now, we'll just log the update and return success
    console.log('Status Update Received:', { progress, phase, status, timestamp: new Date().toISOString() });
    
    // Read existing live data to preserve all parameters
    let existingData = {};
    try {
      if (fs.existsSync('inex-live-data.json')) {
        const existingFile = fs.readFileSync('inex-live-data.json', 'utf8');
        existingData = JSON.parse(existingFile);
      }
    } catch (readError) {
      console.log('No existing data found, starting fresh');
    }
    
    // Update the consolidated data with all available parameters
    const statusData = {
      ...existingData,
      progress,
      phase,
      status,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync('inex-live-data.json', JSON.stringify(statusData, null, 2));
      console.log('Status data updated in inex-live-data.json');
    } catch (writeError) {
      console.error('Error saving status data:', writeError);
      // Continue anyway - this is not critical
    }
    
    res.json({ 
      success: true, 
      message: 'Status update received and saved successfully',
      data: statusData
    });
    
  } catch (error) {
    console.error('Error processing status update:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error processing status update' 
    });
  }
});

// Messaging API endpoints
app.get('/api/messages', (req, res) => {
  try {
    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);
    
    // Ensure live data file exists
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
        phases: [],
        updates: [],
        nextActions: [],
        messages: []
      };
      fs.writeFileSync(liveDataPath, JSON.stringify(defaultData, null, 2));
    }
    
    const liveData = fs.readFileSync(liveDataPath, 'utf8');
    const data = JSON.parse(liveData);
    const messages = data.messages || [];
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
      lastUpdated: data.lastUpdated || new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error reading messages'
    });
  }
 });

app.post('/api/messages', (req, res) => {
  try {
    const { name, text, email, priority = 'normal', category = 'general' } = req.body;
    
    // Validate required fields
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);
    
    // Ensure live data file exists
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
        phases: [],
        updates: [],
        nextActions: [],
        messages: []
      };
      fs.writeFileSync(liveDataPath, JSON.stringify(defaultData, null, 2));
    }
    
    // Read existing live data
    const liveData = fs.readFileSync(liveDataPath, 'utf8');
    const data = JSON.parse(liveData);
    const messages = data.messages || [];
    
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
    
    // Update the consolidated data
    data.messages = messages;
    data.lastUpdated = new Date().toISOString();
    
    // Save back to consolidated file (single write)
    fs.writeFileSync(liveDataPath, JSON.stringify(data, null, 2));
    
    console.log('Message saved and backups created:', {
      liveData: liveDataFile,
      dataBackup: backupFile,
      messagesBackup: messagesBackupFile
    });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
      totalMessages: messages.length
    });
    
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing message'
    });
  }
});

app.get('/api/message-manager', (req, res) => {
  try {
    const { status, priority, category, limit = 50, offset = 0 } = req.query;

    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);

    // Ensure consolidated data file exists
    if (!fs.existsSync(liveDataPath)) {
      fs.writeFileSync(liveDataPath, JSON.stringify({ messages: [] }, null, 2));
    }

    const fileContents = fs.readFileSync(liveDataPath, 'utf8');
    const data = JSON.parse(fileContents || '{}');
    let messages = Array.isArray(data.messages) ? data.messages : [];

    // Apply filters
    if (status) messages = messages.filter(msg => msg.status === status);
    if (priority) messages = messages.filter(msg => msg.priority === priority);
    if (category) messages = messages.filter(msg => msg.category === category);

    // Apply pagination
    const totalCount = messages.length;
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paged = messages.slice(start, end);

    res.json({
      success: true,
      messages: paged,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: end < totalCount
      },
      filters: { status, priority, category },
      lastUpdated: data.lastUpdated || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error reading messages for manager:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error reading messages'
    });
  }
});

app.put('/api/message-manager', (req, res) => {
  try {
    const { id, status, read, responded, response, priority, category } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);

    // Ensure consolidated data file exists
    if (!fs.existsSync(liveDataPath)) {
      fs.writeFileSync(liveDataPath, JSON.stringify({ messages: [] }, null, 2));
    }

    const fileContents = fs.readFileSync(liveDataPath, 'utf8');
    const data = JSON.parse(fileContents || '{}');
    const messages = Array.isArray(data.messages) ? data.messages : [];

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
      if (!messages[messageIndex].responses) messages[messageIndex].responses = [];
      messages[messageIndex].responses.push({
        text: response,
        timestamp: new Date().toISOString(),
        responder: 'Development Team'
      });
      messages[messageIndex].responded = true;
      messages[messageIndex].status = 'responded';
    }

    // Update lastUpdated on message and consolidated data
    messages[messageIndex].lastUpdated = new Date().toISOString();
    data.messages = messages;
    data.lastUpdated = new Date().toISOString();

    // Save back to consolidated file
    fs.writeFileSync(liveDataPath, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: messages[messageIndex]
    });

  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error updating message'
    });
  }
});

app.delete('/api/message-manager', (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    const liveDataFile = 'inex-live-data.json';
    const liveDataPath = path.join(__dirname, liveDataFile);

    // Ensure consolidated data file exists
    if (!fs.existsSync(liveDataPath)) {
      fs.writeFileSync(liveDataPath, JSON.stringify({ messages: [] }, null, 2));
    }

    const fileContents = fs.readFileSync(liveDataPath, 'utf8');
    const data = JSON.parse(fileContents || '{}');
    const messages = Array.isArray(data.messages) ? data.messages : [];

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

    // Save back to consolidated file
    data.messages = messages;
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(liveDataPath, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: 'Message archived successfully'
    });

  } catch (error) {
    console.error('Error archiving message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error archiving message'
    });
  }
});

// Catch-all route for 404
app.use((req, res) => {
  res.status(404).send(`
    <html>
      <head>
        <title>404 - Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #A62E3F; }
          a { color: #FFB200; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">Return to Home</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Available routes:`);
  htmlFiles.forEach(file => {
    console.log(`  /${file} (or /${file}.html)`);
  });
  console.log(`  / (serves index.html)`);
  console.log(`  /api/messages (messaging API)`);
  console.log(`  /api/message-manager (message management API)`);
});
