const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

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
