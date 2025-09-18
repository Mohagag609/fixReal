# Deployment Guide

This guide covers deploying the Accounting System to various platforms.

## Prerequisites

- Python 3.11+
- PostgreSQL (for production)
- Git
- Domain name (optional)

## Environment Variables

Create a `.env` file or set these environment variables:

```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:password@host:port/dbname
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## Local Production Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb accounting_db

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 3. Static Files

```bash
python manage.py collectstatic
```

### 4. Run with Gunicorn

```bash
gunicorn accounting_project.wsgi --bind 0.0.0.0:8000
```

## Heroku Deployment

### 1. Install Heroku CLI

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh
```

### 2. Login and Create App

```bash
heroku login
heroku create your-accounting-app
```

### 3. Set Environment Variables

```bash
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=your-accounting-app.herokuapp.com
```

### 4. Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### 5. Deploy

```bash
git add .
git commit -m "Initial deployment"
git push heroku main
```

### 6. Run Migrations

```bash
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

## Render Deployment

### 1. Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### 2. Configure Service

- **Name**: accounting-system
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn accounting_project.wsgi`

### 3. Environment Variables

Add these in the Render dashboard:

```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-app.onrender.com
DATABASE_URL=postgres://user:password@host:port/dbname
```

### 4. Deploy

Click "Create Web Service" and Render will automatically deploy your app.

## DigitalOcean App Platform

### 1. Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository

### 2. Configure App

- **Source**: GitHub repository
- **Branch**: main
- **Build Command**: `pip install -r requirements.txt`
- **Run Command**: `gunicorn accounting_project.wsgi`

### 3. Add Database

1. Click "Create Database"
2. Choose PostgreSQL
3. Select plan (Basic $12/month minimum)

### 4. Environment Variables

Add these in the app settings:

```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-app.ondigitalocean.app
DATABASE_URL=postgres://user:password@host:port/dbname
```

## AWS Elastic Beanstalk

### 1. Install EB CLI

```bash
pip install awsebcli
```

### 2. Initialize EB

```bash
eb init
eb create production
```

### 3. Configure Environment

Create `.ebextensions/django.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:python:
    WSGIPath: accounting_project.wsgi
  aws:elasticbeanstalk:environment:variables:
    DJANGO_SETTINGS_MODULE: accounting_project.settings
```

### 4. Deploy

```bash
eb deploy
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "accounting_project.wsgi", "--bind", "0.0.0.0:8000"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://postgres:password@db:5432/accounting_db
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=accounting_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3. Run with Docker

```bash
docker-compose up -d
```

## Post-Deployment

### 1. Run Migrations

```bash
python manage.py migrate
```

### 2. Create Superuser

```bash
python manage.py createsuperuser
```

### 3. Collect Static Files

```bash
python manage.py collectstatic
```

### 4. Set up Cron Jobs

For scheduled backups and reports:

```bash
# Add to crontab
0 2 * * * /path/to/venv/bin/python /path/to/manage.py backup_daily
0 0 * * 0 /path/to/venv/bin/python /path/to/manage.py generate_weekly_reports
```

## Monitoring and Maintenance

### 1. Log Monitoring

```bash
# View logs
tail -f logs/django.log

# Or with Heroku
heroku logs --tail
```

### 2. Database Backup

```bash
# Manual backup
python manage.py backup_database

# Restore backup
python manage.py restore_database backup_file.json
```

### 3. Performance Monitoring

- Monitor database performance
- Check memory usage
- Review error logs
- Update dependencies regularly

## Troubleshooting

### Common Issues

1. **Static files not loading**:
   - Check `STATIC_ROOT` and `STATIC_URL` settings
   - Run `python manage.py collectstatic`

2. **Database connection errors**:
   - Verify `DATABASE_URL` format
   - Check database server status
   - Ensure proper permissions

3. **Migration errors**:
   - Check database schema
   - Run `python manage.py showmigrations`
   - Reset migrations if needed

4. **Memory issues**:
   - Increase server memory
   - Optimize database queries
   - Use caching

### Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Contact support team

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use HTTPS
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable monitoring
- [ ] Regular security updates