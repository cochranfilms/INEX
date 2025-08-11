const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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
  'contract-reference'
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
});
