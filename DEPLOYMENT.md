# 🚀 INEX Portal Deployment Guide

## Overview

The INEX Portal has been updated with a new Node.js server that provides:
- **Case-insensitive routing**: URLs work regardless of capitalization
- **Extension-less URLs**: Files accessible with or without `.html` extension
- **Production-ready**: PM2 process management and nginx configuration

## 🏗️ Architecture

```
Client Request → nginx (SSL termination) → Node.js Server → Static Files
```

## 📁 File Structure

```
INEX/
├── server.js              # Main Node.js server
├── package.json           # Dependencies
├── deploy.sh             # Production deployment script
├── ecosystem.config.js    # PM2 configuration
├── nginx.conf            # nginx configuration
├── test-server.js        # Server testing script
└── *.html               # HTML files
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Test Locally
```bash
node server.js
```
Visit: http://localhost:3000

### 3. Test Routing
```bash
node test-server.js
```

## 🌐 Production Deployment

### 1. Run Deployment Script
```bash
./deploy.sh
```

### 2. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 3. Start Application
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 4. Configure nginx
- Copy `nginx.conf` to your server's nginx sites-available
- Update SSL certificate paths
- Restart nginx

## 🔗 URL Routing Examples

All these URLs will work and serve the same content:

| URL Pattern | Serves |
|-------------|---------|
| `/` | `index.html` |
| `/index` | `index.html` |
| `/index.html` | `index.html` |
| `/INDEX` | `index.html` |
| `/INDEX.HTML` | `index.html` |
| `/status` | `status.html` |
| `/status.html` | `status.html` |
| `/inex-portal-agreement` | `INEX-Portal-Agreement.html` |
| `/inex-proposal` | `INEX-Proposal.html` |

## 🛡️ Security Features

- HTTPS enforcement
- Security headers (X-Frame-Options, XSS Protection, etc.)
- Static file caching
- Proxy to Node.js for dynamic content

## 📊 Monitoring

### PM2 Commands
```bash
pm2 status                    # Check app status
pm2 logs inex-portal         # View logs
pm2 restart inex-portal      # Restart app
pm2 stop inex-portal         # Stop app
```

### nginx Commands
```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload configuration
sudo systemctl restart nginx  # Restart nginx
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Permission denied**
   ```bash
   chmod +x deploy.sh
   chmod +x start.sh
   ```

3. **nginx configuration error**
   ```bash
   sudo nginx -t
   sudo tail -f /var/log/nginx/error.log
   ```

### Logs
- PM2 logs: `pm2 logs inex-portal`
- nginx logs: `/var/log/nginx/`
- Application logs: Check PM2 output

## 📈 Performance

- Static files served directly by nginx
- Dynamic content proxied to Node.js
- File caching with appropriate headers
- Cluster mode for Node.js (multiple processes)

## 🔄 Updates

To update the application:

1. Pull latest changes
2. Restart the application:
   ```bash
   pm2 restart inex-portal
   ```

## 📞 Support

For deployment issues, check:
1. PM2 status and logs
2. nginx configuration and logs
3. Server firewall settings
4. SSL certificate validity
