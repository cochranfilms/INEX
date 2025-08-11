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
    endpoints: ['/api/status-update', '/api/messages', '/api/health']
  });
});

// API Endpoints
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
    
    // Save to a simple JSON file for persistence
    const statusData = {
      progress,
      phase,
      status,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync('inex-live-data.json', JSON.stringify(statusData, null, 2));
      console.log('Status data saved to inex-live-data.json');
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
    const messagesFile = 'inex-messages.json';
    const messagesPath = path.join(__dirname, messagesFile);
    
    // Ensure messages file exists
    if (!fs.existsSync(messagesPath)) {
      fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
    }
    
    const messagesData = fs.readFileSync(messagesPath, 'utf8');
    const messages = JSON.parse(messagesData);
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
      lastUpdated: new Date().toISOString()
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
    
    const messagesFile = 'inex-messages.json';
    const messagesPath = path.join(__dirname, messagesFile);
    
    // Ensure messages file exists
    if (!fs.existsSync(messagesPath)) {
      fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
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
    const backupPath = path.join(__dirname, backupFile);
    fs.writeFileSync(backupPath, JSON.stringify(messages, null, 2));
    
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
    
    const messagesFile = 'inex-messages.json';
    const messagesPath = path.join(__dirname, messagesFile);
    
    // Ensure messages file exists
    if (!fs.existsSync(messagesPath)) {
      fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
    }
    
    const messagesData = fs.readFileSync(messagesPath, 'utf8');
    let messages = JSON.parse(messagesData);
    
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
    
    res.json({
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
    
    const messagesFile = 'inex-messages.json';
    const messagesPath = path.join(__dirname, messagesFile);
    
    // Ensure messages file exists
    if (!fs.existsSync(messagesPath)) {
      fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
    }
    
    const messagesData = fs.readFileSync(messagesPath, 'utf8');
    const messages = JSON.parse(messagesData);
    
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
    
    // Save back to file
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
    
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
    
    const messagesFile = 'inex-messages.json';
    const messagesPath = path.join(__dirname, messagesFile);
    
    // Ensure messages file exists
    if (!fs.existsSync(messagesPath)) {
      fs.writeFileSync(messagesPath, JSON.stringify([], null, 2));
    }
    
    const messagesData = fs.readFileSync(messagesPath, 'utf8');
    const messages = JSON.parse(messagesData);
    
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
    
    // Save back to file
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
    
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
