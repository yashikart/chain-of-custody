# Deployment Guide

This guide provides comprehensive instructions for deploying the Chain of Custody file movement system in various environments.

## System Requirements

### Minimum Requirements
- **Node.js**: 16.x or higher
- **MongoDB**: 4.4 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB minimum for application and file storage
- **Network**: HTTP/HTTPS access for API endpoints

### Recommended Production Requirements
- **Node.js**: 18.x LTS
- **MongoDB**: 6.x with replica set
- **RAM**: 8GB or higher
- **Storage**: SSD with 100GB+ for file storage
- **Network**: Load balancer with SSL termination
- **Backup**: Automated backup solution

## Development Environment

### Local Development Setup

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd Chain-of-Custody-file-movement
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Database Setup:**
   ```bash
   # Install MongoDB locally or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6
   ```

3. **Environment Configuration:**
   ```bash
   # backend/.env
   MONGODB_URL=mongodb://localhost:27017/chain-of-custody
   PORT=3000
   UPLOAD_DIR=uploads/
   NODE_ENV=development
   ```

4. **Start Development Servers:**
   ```bash
   # Terminal 1: Backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend && npm start
   ```

5. **Verify Installation:**
   - Backend: http://localhost:3000/health
   - Frontend: http://localhost:3001
   - API Documentation: Available in project files

## Production Deployment

### Option 1: Traditional Server Deployment

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/chain-of-custody
sudo chown $USER:$USER /opt/chain-of-custody

# Deploy application
cd /opt/chain-of-custody
git clone <repository-url> .
npm install --production

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Create production environment file
cat > backend/.env << EOF
MONGODB_URL=mongodb://localhost:27017/chain-of-custody-prod
PORT=3000
UPLOAD_DIR=/opt/chain-of-custody/storage/uploads/
NODE_ENV=production
EOF

# Create storage directories
mkdir -p storage/uploads
mkdir -p storage/ipfs-storage
mkdir -p logs
```

#### 3. Process Management with PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chain-of-custody-api',
    script: 'backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Nginx Configuration

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/chain-of-custody << EOF
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/chain-of-custody/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # File uploads (increase limits)
    client_max_body_size 100M;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/chain-of-custody /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### 1. Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["node", "server.js"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

#### 2. Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: chain-custody-db
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: chain-of-custody
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"

  backend:
    build: 
      context: .
      dockerfile: backend/Dockerfile
    container_name: chain-custody-api
    restart: unless-stopped
    environment:
      MONGODB_URL: mongodb://mongodb:27017/chain-of-custody
      PORT: 3000
      NODE_ENV: production
    volumes:
      - ./storage:/app/storage
    ports:
      - "3000:3000"
    depends_on:
      - mongodb

  frontend:
    build:
      context: frontend
      dockerfile: Dockerfile
    container_name: chain-custody-web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale backend if needed
docker-compose up -d --scale backend=3
```

### Option 3: Cloud Deployment (AWS)

#### 1. AWS Infrastructure Setup

```bash
# Install AWS CLI and configure
aws configure

# Create S3 bucket for file storage
aws s3 mb s3://your-chain-custody-files

# Create MongoDB Atlas cluster or EC2 instance
# Update connection string in environment variables
```

#### 2. Elastic Beanstalk Deployment

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init chain-of-custody

# Create environment
eb create production

# Deploy
eb deploy
```

## Security Configuration

### 1. Environment Variables

```bash
# Production environment variables
NODE_ENV=production
MONGODB_URL=mongodb://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. MongoDB Security

```javascript
// mongo-init.js
db = db.getSiblingDB('chain-of-custody');

db.createUser({
  user: 'chainuser',
  pwd: 'secure-password',
  roles: [
    {
      role: 'readWrite',
      db: 'chain-of-custody'
    }
  ]
});

// Create indexes for performance
db.chainofcustodies.createIndex({ fileId: 1 });
db.chainofcustodies.createIndex({ 'custodyChain.timestamp': -1 });
db.chainofcustodies.createIndex({ currentLocation: 1 });
```

### 3. SSL/TLS Configuration

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 2. Health Checks

```bash
# Create health check script
cat > health-check.sh << EOF
#!/bin/bash
response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ \$response -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy"
    exit 1
fi
EOF

chmod +x health-check.sh

# Add to cron for monitoring
echo "*/5 * * * * /opt/chain-of-custody/health-check.sh" | crontab -
```

## Backup and Recovery

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/mongodb"
mkdir -p \$BACKUP_DIR

mongodump --uri="mongodb://localhost:27017/chain-of-custody" --out=\$BACKUP_DIR/\$DATE

# Compress backup
tar -czf \$BACKUP_DIR/\$DATE.tar.gz -C \$BACKUP_DIR \$DATE
rm -rf \$BACKUP_DIR/\$DATE

# Keep only last 30 days
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/chain-of-custody/backup.sh" | crontab -
```

### 2. File Storage Backup

```bash
# Backup file storage
rsync -av --delete /opt/chain-of-custody/storage/ /backup/storage/

# For cloud storage
aws s3 sync /opt/chain-of-custody/storage/ s3://your-backup-bucket/storage/
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Additional MongoDB indexes
db.chainofcustodies.createIndex({ "metadata.department": 1, "createdAt": -1 });
db.chainofcustodies.createIndex({ "metadata.caseNumber": 1 });
db.chainofcustodies.createIndex({ "custodyChain.userId": 1, "custodyChain.timestamp": -1 });
```

### 2. Application Optimization

```bash
# Enable gzip compression in Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Configure caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues:**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check logs
   sudo tail -f /var/log/mongodb/mongod.log
   ```

2. **File Upload Issues:**
   ```bash
   # Check disk space
   df -h
   
   # Check permissions
   ls -la storage/uploads/
   ```

3. **Performance Issues:**
   ```bash
   # Monitor system resources
   htop
   
   # Check application logs
   pm2 logs
   ```

### Log Analysis

```bash
# Analyze API logs
grep "ERROR" logs/combined.log | tail -20

# Monitor real-time logs
tail -f logs/combined.log | grep -E "(ERROR|WARN)"
```

This deployment guide ensures a robust, secure, and scalable Chain of Custody system suitable for production environments.
