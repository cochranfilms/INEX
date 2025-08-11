# INEX Client-Developer Communication System

## Overview

The INEX Client-Developer Communication System provides a robust, global messaging platform that enables seamless communication between clients and the development team. Built with Node.js 22.x and Express, it features JSON-based storage for reliability and cross-platform compatibility.

## Features

### 🌐 Global Access
- **CORS-enabled APIs** for cross-origin requests
- **JSON file storage** for platform-independent operation
- **Fallback mechanisms** for offline/local operation
- **Real-time updates** with auto-refresh

### 💬 Client Messaging
- **Public message form** on status page
- **Anonymous messaging** support
- **Priority levels** (low, normal, high, urgent)
- **Category organization** (client-feedback, feature-request, etc.)
- **Email capture** (optional)

### 🛠️ Developer Management
- **Developer dashboard** for message management
- **Message status tracking** (new, read, responded, archived)
- **Response system** with threaded conversations
- **Bulk operations** (mark all read, export, clear archived)
- **Filtering and search** by status, priority, category

### 🔒 Data Security
- **Automatic backups** with timestamped files
- **Soft deletion** (archiving instead of permanent removal)
- **Input validation** and sanitization
- **Error handling** with graceful fallbacks

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Page   │    │  Express API    │    │  JSON Storage   │
│  (status.html)  │◄──►│   (server.js)   │◄──►│ (inex-messages) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Dev Dashboard  │    │  Message APIs   │    │  Backup Files   │
│(dev-dashboard)  │    │ (/api/messages) │    │ (daily backups) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Client Messaging (`/api/messages`)
- **GET** `/api/messages` - Retrieve all messages
- **POST** `/api/messages` - Send new message

### Message Management (`/api/message-manager`)
- **GET** `/api/message-manager` - Get messages with filters
- **PUT** `/api/message-manager` - Update message (read, respond, etc.)
- **DELETE** `/api/message-manager` - Archive message

## Installation & Setup

### Prerequisites
- Node.js 22.x or higher
- npm or yarn package manager

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# or
node server.js
```

### 3. Access the System
- **Public Status Page**: http://localhost:3000/status.html
- **Developer Dashboard**: http://localhost:3000/dev-dashboard.html
- **API Base**: http://localhost:3000/api/

## Usage

### For Clients
1. Navigate to the public status page
2. Fill out the message form with your name and message
3. Click "Send Message"
4. Your message will be immediately visible to the development team

### For Developers
1. Open the developer dashboard
2. View incoming messages with status indicators
3. Click "Respond" to reply to messages
4. Use filters to organize and prioritize messages
5. Export messages or manage archives as needed

## File Structure

```
INEX/
├── api/
│   ├── messages.js              # Client messaging API
│   ├── message-manager.js       # Message management API
│   └── status-update.js         # Status update API
├── server.js                    # Main Express server
├── status.html                  # Public status page with messaging
├── dev-dashboard.html           # Developer message management
├── test-messaging.js            # System testing script
├── inex-messages.json           # Message storage (auto-created)
├── inex-messages-backup-*.json # Daily backup files
└── package.json                 # Dependencies and scripts
```

## Testing

### Run the Test Suite
```bash
node test-messaging.js
```

The test script will:
- Verify server connectivity
- Test message creation and retrieval
- Validate message management operations
- Check file persistence and backups

### Manual Testing
1. Start the server: `node server.js`
2. Open `status.html` in a browser
3. Send a test message
4. Open `dev-dashboard.html` in another tab
5. Verify the message appears and can be managed

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

### Message Storage
- **Primary**: `inex-messages.json`
- **Backups**: `inex-messages-backup-YYYY-MM-DD.json`
- **Auto-creation**: Files are created automatically if missing

### CORS Settings
- **Origin**: `*` (global access)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization

## Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check Node.js version
node --version  # Should be 22.x or higher

# Check if port is in use
lsof -i :3000

# Install dependencies
npm install
```

#### Messages Not Saving
- Verify file permissions in the project directory
- Check server logs for error messages
- Ensure the `inex-messages.json` file is writable

#### API Not Responding
- Verify the server is running
- Check browser console for CORS errors
- Ensure the API endpoints are properly configured

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development node server.js

# Check API responses
curl http://localhost:3000/api/messages
```

## Security Considerations

### Data Protection
- **Input validation** prevents malicious content
- **File-based storage** keeps data local and private
- **No external dependencies** for message storage
- **Backup system** prevents data loss

### Access Control
- **Public messaging** for client communication
- **Developer dashboard** for internal management
- **No authentication required** for basic messaging
- **Consider adding auth** for production use

## Production Deployment

### Vercel Deployment
The system is configured for Vercel deployment with:
- **API routes** in the `api/` directory
- **Static files** served from the root
- **Environment variables** for configuration

### Custom Domain
Update the following files for custom domain deployment:
- `CNAME` file
- `vercel.json` configuration
- API base URLs in frontend code

## Maintenance

### Regular Tasks
- **Monitor backup files** for disk space
- **Review archived messages** periodically
- **Export important conversations** for record keeping
- **Update dependencies** as needed

### Backup Strategy
- **Daily backups** with timestamped filenames
- **JSON format** for easy data recovery
- **Version control** for configuration changes
- **Offsite storage** recommended for production

## Support

### Getting Help
1. Check the troubleshooting section above
2. Run the test script to identify issues
3. Review server logs for error details
4. Check browser console for frontend issues

### Contributing
- Follow the existing code style
- Test changes with the test script
- Update documentation for new features
- Maintain backward compatibility

## License

This system is part of the INEX Portal project and follows the same licensing terms.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Node.js Requirement**: 22.x+  
**Status**: Production Ready ✅
