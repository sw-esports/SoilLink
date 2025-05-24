#!/bin/bash

# Production Deployment Script for SoilLink2
# This script prepares and deploys the application for production

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
print_status "Checking required files..."

if [ ! -f ".env.example" ]; then
    print_error ".env.example not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    exit 1
fi

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    print_warning ".env file not found, creating from .env.example"
    cp .env.example .env
    print_warning "Please update .env with your production values!"
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production

# Run security audit
print_status "Running security audit..."
npm audit --audit-level moderate || {
    print_warning "Security vulnerabilities found. Consider running 'npm audit fix'"
}

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

# Set proper permissions
print_status "Setting file permissions..."
chmod 755 logs
chmod 755 uploads
chmod 755 temp
chmod 600 .env

# Validate environment variables
print_status "Validating environment variables..."
node -e "
require('dotenv').config();
const required = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];
const missing = required.filter(env => !process.env[env]);
if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
}
console.log('Environment validation passed');
"

# Test database connection
print_status "Testing database connection..."
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('Database connection successful');
    mongoose.connection.close();
})
.catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
});
"

# Create systemd service file (Linux only)
if command -v systemctl &> /dev/null; then
    print_status "Creating systemd service file..."
    
    cat > soillink2.service << EOF
[Unit]
Description=SoilLink2 Agricultural Analysis Application
After=network.target

[Service]
Type=simple
User=\$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=soillink2

[Install]
WantedBy=multi-user.target
EOF

    print_status "Systemd service file created: soillink2.service"
    print_status "To install: sudo mv soillink2.service /etc/systemd/system/"
    print_status "To enable: sudo systemctl enable soillink2"
    print_status "To start: sudo systemctl start soillink2"
fi

# Create nginx configuration example
print_status "Creating nginx configuration example..."

cat > nginx.conf.example << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
    location /css/ {
        alias $(pwd)/public/css/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /js/ {
        alias $(pwd)/public/js/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /src/ {
        alias $(pwd)/public/src/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /api/health {
        access_log off;
        proxy_pass http://localhost:3000;
    }
}
EOF

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem file..."

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'soillink2',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000,
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create backup script
print_status "Creating backup script..."

cat > backup.sh << 'EOF'
#!/bin/bash

# SoilLink2 Backup Script

BACKUP_DIR="/backups/soillink2"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="soillink2"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
echo "Backing up MongoDB..."
mongodump --db "$DB_NAME" --out "$BACKUP_DIR/db_$DATE"

# Backup application files
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=logs \
    --exclude=temp \
    --exclude=.git \
    .

# Backup logs
echo "Backing up logs..."
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" logs/

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -type d -name "db_*" -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x backup.sh

# Final checks
print_status "Running final checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

if [[ $NODE_VERSION < "v16" ]]; then
    print_warning "Node.js version 16 or higher is recommended"
fi

# Check if port is available
if netstat -ln | grep -q ":3000 "; then
    print_warning "Port 3000 is already in use"
fi

print_status "✅ Production deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your production values"
echo "2. Configure your reverse proxy (nginx.conf.example provided)"
echo "3. Set up SSL certificates"
echo "4. Start the application:"
echo "   - Using PM2: pm2 start ecosystem.config.js --env production"
echo "   - Using systemd: sudo systemctl start soillink2"
echo "   - Direct: NODE_ENV=production node app.js"
echo "5. Set up regular backups: ./backup.sh"
echo ""
print_status "🚀 Ready for production!"
