# Deployment Guide - مكة العقارية

## Overview
This guide provides step-by-step instructions for deploying the Makka real estate management system to production.

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or CentOS 8+
- **Python**: 3.8 or higher
- **PostgreSQL**: 13 or higher
- **Nginx**: 1.18 or higher
- **Memory**: Minimum 4GB RAM
- **Storage**: Minimum 20GB free space
- **CPU**: 2 cores or more

### Software Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv python3-dev -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install additional dependencies
sudo apt install build-essential libpq-dev -y
```

## Database Setup

### 1. Create PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE makka_db;
CREATE USER makka_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE makka_db TO makka_user;
ALTER USER makka_user CREATEDB;
\q
```

### 2. Configure PostgreSQL
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/13/main/postgresql.conf

# Update the following settings:
listen_addresses = '*'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# Edit authentication configuration
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Add the following line:
host    makka_db    makka_user    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## Application Setup

### 1. Clone Repository
```bash
# Clone the repository
git clone https://github.com/your-username/makka.git
cd makka

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Variables:**
```env
# Database Configuration
DB_NAME=makka_db
DB_USER=makka_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Backup Configuration
BACKUP_DIR=/opt/makka/backups

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### 3. Database Migration
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Create logs directory
mkdir -p logs
chmod 755 logs
```

## Web Server Configuration

### 1. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/makka
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Static files
    location /static/ {
        alias /opt/makka/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /opt/makka/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 2. Enable Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/makka /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Application Server Configuration

### 1. Gunicorn Configuration
```bash
# Create Gunicorn configuration
nano gunicorn.conf.py
```

**Gunicorn Configuration:**
```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
user = "www-data"
group = "www-data"
daemon = False
pidfile = "/opt/makka/gunicorn.pid"
accesslog = "/opt/makka/logs/gunicorn_access.log"
errorlog = "/opt/makka/logs/gunicorn_error.log"
loglevel = "info"
```

### 2. Systemd Service
```bash
# Create systemd service
sudo nano /etc/systemd/system/makka.service
```

**Systemd Service:**
```ini
[Unit]
Description=Makka Real Estate Management System
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/makka
Environment=PATH=/opt/makka/venv/bin
ExecStart=/opt/makka/venv/bin/gunicorn --config gunicorn.conf.py makka.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 3. Start Services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start and enable services
sudo systemctl start makka
sudo systemctl enable makka

# Check status
sudo systemctl status makka
```

## SSL Certificate Setup

### 1. Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

### 2. Manual SSL Certificate
```bash
# Generate private key
sudo openssl genrsa -out /etc/ssl/private/your-domain.key 2048

# Generate certificate signing request
sudo openssl req -new -key /etc/ssl/private/your-domain.key -out /etc/ssl/certs/your-domain.csr

# Generate self-signed certificate (for testing)
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/your-domain.csr -signkey /etc/ssl/private/your-domain.key -out /etc/ssl/certs/your-domain.crt
```

## Backup Configuration

### 1. Database Backup
```bash
# Create backup script
sudo nano /opt/makka/backup_db.sh
```

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/makka/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="makka_db"
DB_USER="makka_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

### 2. Media Files Backup
```bash
# Create media backup script
sudo nano /opt/makka/backup_media.sh
```

**Media Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/makka/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MEDIA_DIR="/opt/makka/media"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create media backup
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz -C $MEDIA_DIR .

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +7 -delete

echo "Media backup completed: media_backup_$DATE.tar.gz"
```

### 3. Automated Backups
```bash
# Make scripts executable
sudo chmod +x /opt/makka/backup_db.sh
sudo chmod +x /opt/makka/backup_media.sh

# Add to crontab
sudo crontab -e

# Add the following lines:
0 2 * * * /opt/makka/backup_db.sh
0 3 * * * /opt/makka/backup_media.sh
```

## Monitoring Setup

### 1. Log Monitoring
```bash
# Install log monitoring tools
sudo apt install logrotate -y

# Configure log rotation
sudo nano /etc/logrotate.d/makka
```

**Log Rotation Configuration:**
```
/opt/makka/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload makka
    endscript
}
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Create monitoring script
sudo nano /opt/makka/monitor.sh
```

**Monitoring Script:**
```bash
#!/bin/bash
LOG_FILE="/opt/makka/logs/system_monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE WARNING: Disk usage is $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$DATE WARNING: Memory usage is $MEMORY_USAGE%" >> $LOG_FILE
fi

# Check application status
if ! systemctl is-active --quiet makka; then
    echo "$DATE ERROR: Makka service is not running" >> $LOG_FILE
    systemctl start makka
fi
```

## Security Hardening

### 1. Firewall Configuration
```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2Ban Configuration
```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Connect to PostgreSQL
psql -U makka_user -d makka_db

-- Create indexes for better performance
CREATE INDEX idx_customer_name ON realpp_customer(name);
CREATE INDEX idx_customer_phone ON realpp_customer(phone);
CREATE INDEX idx_unit_number ON realpp_unit(unit_number);
CREATE INDEX idx_contract_number ON realpp_contract(contract_number);
CREATE INDEX idx_installment_due_date ON realpp_installment(due_date);
CREATE INDEX idx_installment_status ON realpp_installment(status);

-- Analyze tables
ANALYZE;
```

### 2. Nginx Optimization
```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf
```

**Nginx Optimization:**
```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check database connection
   psql -U makka_user -d makka_db -h localhost
   ```

2. **Static Files Not Loading**
   ```bash
   # Collect static files
   python manage.py collectstatic --noinput
   
   # Check Nginx configuration
   sudo nginx -t
   ```

3. **Permission Issues**
   ```bash
   # Fix ownership
   sudo chown -R www-data:www-data /opt/makka
   sudo chmod -R 755 /opt/makka
   ```

4. **Service Not Starting**
   ```bash
   # Check logs
   sudo journalctl -u makka -f
   
   # Check Gunicorn logs
   tail -f /opt/makka/logs/gunicorn_error.log
   ```

### Log Files
- Application logs: `/opt/makka/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`
- PostgreSQL logs: `/var/log/postgresql/`

## Maintenance

### Regular Tasks

1. **Daily**
   - Check system logs
   - Monitor disk space
   - Verify backups

2. **Weekly**
   - Update system packages
   - Check security updates
   - Review error logs

3. **Monthly**
   - Database maintenance
   - Log rotation
   - Performance review

### Update Procedure

1. **Backup Current System**
   ```bash
   /opt/makka/backup_db.sh
   /opt/makka/backup_media.sh
   ```

2. **Update Code**
   ```bash
   cd /opt/makka
   git pull origin main
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

3. **Restart Services**
   ```bash
   sudo systemctl restart makka
   sudo systemctl restart nginx
   ```

## Support

For technical support or questions:
- Email: support@makka.com
- Documentation: https://docs.makka.com
- Issue Tracker: https://github.com/your-username/makka/issues

## Conclusion

This deployment guide provides a comprehensive setup for the Makka real estate management system. Follow the steps carefully and ensure all security measures are in place before going live.

Remember to:
- Keep the system updated
- Monitor performance regularly
- Maintain regular backups
- Follow security best practices
- Test changes in a staging environment first