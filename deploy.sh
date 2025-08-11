#!/bin/zsh
# Production deployment script for INEX Portal

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Deploying INEX Portal to production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build or prepare for production
echo "🔨 Preparing for production..."

# Create a simple production start script
cat > start.sh << 'EOF'
#!/bin/zsh
export NODE_ENV=production
export PORT=3000
node server.js
EOF

chmod +x start.sh

# Create PM2 ecosystem file for production
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inex-portal',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Create nginx configuration for case-insensitive routing
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name inex.cochranfilms.com www.inex.cochranfilms.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inex.cochranfilms.com www.inex.cochranfilms.com;
    
    # SSL configuration (you'll need to add your SSL certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Root directory
    root /var/www/inex-portal;
    index index.html;
    
    # Handle case-insensitive routing
    location ~* ^/([^/]+)$ {
        try_files /$1.html /$1 /index.html =404;
    }
    
    location ~* ^/([^/]+)\.html$ {
        try_files /$1.html =404;
    }
    
    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Node.js server for dynamic content
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF

echo "✅ Production configuration created!"
echo ""
echo "📋 Next steps:"
echo "1. Install PM2: npm install -g pm2"
echo "2. Start the application: pm2 start ecosystem.config.js --env production"
echo "3. Save PM2 configuration: pm2 save"
echo "4. Setup PM2 to start on boot: pm2 startup"
echo "5. Configure nginx with the provided nginx.conf"
echo "6. Setup SSL certificates for HTTPS"
echo ""
echo "🌐 Your app will be available at: https://inex.cochranfilms.com"
echo "📁 All HTML files will be accessible regardless of case or extension"
