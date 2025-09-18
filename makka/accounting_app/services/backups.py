import os
import json
import zipfile
import shutil
from datetime import datetime, timedelta
from django.conf import settings
from django.core.management import call_command
from django.core.files.storage import default_storage
import subprocess
import psycopg2
from .dbms import DatabaseManagementSystem


class BackupManager:
    """Advanced backup and restore management system"""
    
    def __init__(self):
        self.dbms = DatabaseManagementSystem()
        self.backup_dir = os.path.join(settings.MEDIA_ROOT, 'backups')
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def create_full_backup(self, backup_name=None, compress=True):
        """Create full system backup including database, media files, and settings"""
        if backup_name is None:
            backup_name = f"full_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_path = os.path.join(self.backup_dir, backup_name)
        os.makedirs(backup_path, exist_ok=True)
        
        # 1. Database backup
        db_backup_path = self._backup_database(backup_path)
        
        # 2. Media files backup
        media_backup_path = self._backup_media_files(backup_path)
        
        # 3. Settings and configuration backup
        settings_backup_path = self._backup_settings(backup_path)
        
        # 4. Create backup manifest
        manifest = {
            'backup_name': backup_name,
            'timestamp': datetime.now().isoformat(),
            'backup_type': 'full',
            'database_backup': os.path.basename(db_backup_path),
            'media_backup': os.path.basename(media_backup_path),
            'settings_backup': os.path.basename(settings_backup_path),
            'django_version': settings.DJANGO_VERSION,
            'database_engine': settings.DATABASES['default']['ENGINE']
        }
        
        manifest_path = os.path.join(backup_path, 'manifest.json')
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        # 5. Compress if requested
        if compress:
            compressed_path = f"{backup_path}.zip"
            self._compress_backup(backup_path, compressed_path)
            shutil.rmtree(backup_path)
            return compressed_path
        
        return backup_path
    
    def create_database_backup(self, backup_name=None):
        """Create database-only backup"""
        if backup_name is None:
            backup_name = f"db_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_path = os.path.join(self.backup_dir, backup_name)
        os.makedirs(backup_path, exist_ok=True)
        
        db_backup_path = self._backup_database(backup_path)
        
        # Create manifest
        manifest = {
            'backup_name': backup_name,
            'timestamp': datetime.now().isoformat(),
            'backup_type': 'database',
            'database_backup': os.path.basename(db_backup_path),
            'django_version': settings.DJANGO_VERSION,
            'database_engine': settings.DATABASES['default']['ENGINE']
        }
        
        manifest_path = os.path.join(backup_path, 'manifest.json')
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return backup_path
    
    def create_media_backup(self, backup_name=None):
        """Create media files backup"""
        if backup_name is None:
            backup_name = f"media_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_path = os.path.join(self.backup_dir, backup_name)
        os.makedirs(backup_path, exist_ok=True)
        
        media_backup_path = self._backup_media_files(backup_path)
        
        # Create manifest
        manifest = {
            'backup_name': backup_name,
            'timestamp': datetime.now().isoformat(),
            'backup_type': 'media',
            'media_backup': os.path.basename(media_backup_path)
        }
        
        manifest_path = os.path.join(backup_path, 'manifest.json')
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        return backup_path
    
    def _backup_database(self, backup_path):
        """Backup database using appropriate method"""
        db_engine = settings.DATABASES['default']['ENGINE']
        
        if 'sqlite' in db_engine:
            return self._backup_sqlite(backup_path)
        elif 'postgresql' in db_engine:
            return self._backup_postgresql(backup_path)
        else:
            # Fallback to JSON export
            return self.dbms.create_backup()
    
    def _backup_sqlite(self, backup_path):
        """Backup SQLite database"""
        db_path = settings.DATABASES['default']['NAME']
        backup_file = os.path.join(backup_path, 'database.sqlite')
        
        shutil.copy2(db_path, backup_file)
        return backup_file
    
    def _backup_postgresql(self, backup_path):
        """Backup PostgreSQL database using pg_dump"""
        db_config = settings.DATABASES['default']
        backup_file = os.path.join(backup_path, 'database.sql')
        
        # Build pg_dump command
        cmd = [
            'pg_dump',
            '--host', db_config['HOST'],
            '--port', str(db_config['PORT']),
            '--username', db_config['USER'],
            '--dbname', db_config['NAME'],
            '--file', backup_file,
            '--verbose'
        ]
        
        # Set password if provided
        env = os.environ.copy()
        if db_config['PASSWORD']:
            env['PGPASSWORD'] = db_config['PASSWORD']
        
        try:
            subprocess.run(cmd, env=env, check=True)
            return backup_file
        except subprocess.CalledProcessError as e:
            raise Exception(f"PostgreSQL backup failed: {e}")
    
    def _backup_media_files(self, backup_path):
        """Backup media files"""
        media_backup_dir = os.path.join(backup_path, 'media')
        os.makedirs(media_backup_dir, exist_ok=True)
        
        media_root = settings.MEDIA_ROOT
        if os.path.exists(media_root):
            shutil.copytree(media_root, media_backup_dir, dirs_exist_ok=True)
        
        return media_backup_dir
    
    def _backup_settings(self, backup_path):
        """Backup settings and configuration"""
        settings_backup_file = os.path.join(backup_path, 'settings.json')
        
        # Export Django settings (excluding sensitive data)
        settings_data = {
            'DEBUG': settings.DEBUG,
            'ALLOWED_HOSTS': settings.ALLOWED_HOSTS,
            'INSTALLED_APPS': settings.INSTALLED_APPS,
            'MIDDLEWARE': settings.MIDDLEWARE,
            'ROOT_URLCONF': settings.ROOT_URLCONF,
            'TEMPLATES': settings.TEMPLATES,
            'WSGI_APPLICATION': settings.WSGI_APPLICATION,
            'DATABASES': {
                'default': {
                    'ENGINE': settings.DATABASES['default']['ENGINE'],
                    'NAME': settings.DATABASES['default']['NAME'],
                    'HOST': settings.DATABASES['default']['HOST'],
                    'PORT': settings.DATABASES['default']['PORT'],
                    'USER': settings.DATABASES['default']['USER'],
                    # Don't include password in backup
                }
            },
            'STATIC_URL': settings.STATIC_URL,
            'MEDIA_URL': settings.MEDIA_URL,
            'LANGUAGE_CODE': settings.LANGUAGE_CODE,
            'TIME_ZONE': settings.TIME_ZONE,
            'USE_I18N': settings.USE_I18N,
            'USE_TZ': settings.USE_TZ,
        }
        
        with open(settings_backup_file, 'w') as f:
            json.dump(settings_data, f, indent=2)
        
        return settings_backup_file
    
    def _compress_backup(self, source_path, target_path):
        """Compress backup directory"""
        with zipfile.ZipFile(target_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(source_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_path)
                    zipf.write(file_path, arcname)
    
    def restore_backup(self, backup_path, restore_type='full'):
        """Restore from backup"""
        # Check if backup is compressed
        if backup_path.endswith('.zip'):
            backup_path = self._extract_backup(backup_path)
        
        # Read manifest
        manifest_path = os.path.join(backup_path, 'manifest.json')
        if not os.path.exists(manifest_path):
            raise Exception("Invalid backup: manifest.json not found")
        
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Restore based on type
        if restore_type == 'full' or manifest['backup_type'] == 'full':
            self._restore_database(backup_path, manifest)
            self._restore_media_files(backup_path, manifest)
        elif restore_type == 'database' or manifest['backup_type'] == 'database':
            self._restore_database(backup_path, manifest)
        elif restore_type == 'media' or manifest['backup_type'] == 'media':
            self._restore_media_files(backup_path, manifest)
        
        return True
    
    def _extract_backup(self, zip_path):
        """Extract compressed backup"""
        extract_path = zip_path.replace('.zip', '_extracted')
        os.makedirs(extract_path, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(extract_path)
        
        return extract_path
    
    def _restore_database(self, backup_path, manifest):
        """Restore database from backup"""
        db_engine = settings.DATABASES['default']['ENGINE']
        
        if 'sqlite' in db_engine:
            self._restore_sqlite(backup_path, manifest)
        elif 'postgresql' in db_engine:
            self._restore_postgresql(backup_path, manifest)
        else:
            # Fallback to JSON restore
            db_backup_file = os.path.join(backup_path, manifest['database_backup'])
            self.dbms.restore_backup(db_backup_file)
    
    def _restore_sqlite(self, backup_path, manifest):
        """Restore SQLite database"""
        db_path = settings.DATABASES['default']['NAME']
        backup_file = os.path.join(backup_path, manifest['database_backup'])
        
        if os.path.exists(backup_file):
            shutil.copy2(backup_file, db_path)
        else:
            raise Exception(f"Database backup file not found: {backup_file}")
    
    def _restore_postgresql(self, backup_path, manifest):
        """Restore PostgreSQL database"""
        db_config = settings.DATABASES['default']
        backup_file = os.path.join(backup_path, manifest['database_backup'])
        
        if not os.path.exists(backup_file):
            raise Exception(f"Database backup file not found: {backup_file}")
        
        # Build psql command
        cmd = [
            'psql',
            '--host', db_config['HOST'],
            '--port', str(db_config['PORT']),
            '--username', db_config['USER'],
            '--dbname', db_config['NAME'],
            '--file', backup_file,
            '--verbose'
        ]
        
        # Set password if provided
        env = os.environ.copy()
        if db_config['PASSWORD']:
            env['PGPASSWORD'] = db_config['PASSWORD']
        
        try:
            subprocess.run(cmd, env=env, check=True)
        except subprocess.CalledProcessError as e:
            raise Exception(f"PostgreSQL restore failed: {e}")
    
    def _restore_media_files(self, backup_path, manifest):
        """Restore media files"""
        media_backup_dir = os.path.join(backup_path, 'media')
        media_root = settings.MEDIA_ROOT
        
        if os.path.exists(media_backup_dir):
            if os.path.exists(media_root):
                shutil.rmtree(media_root)
            shutil.copytree(media_backup_dir, media_root)
        else:
            raise Exception(f"Media backup directory not found: {media_backup_dir}")
    
    def list_backups(self):
        """List all available backups"""
        backups = []
        
        for item in os.listdir(self.backup_dir):
            item_path = os.path.join(self.backup_dir, item)
            
            if os.path.isdir(item_path):
                # Directory backup
                manifest_path = os.path.join(item_path, 'manifest.json')
                if os.path.exists(manifest_path):
                    with open(manifest_path, 'r') as f:
                        manifest = json.load(f)
                    backups.append({
                        'name': item,
                        'type': 'directory',
                        'manifest': manifest,
                        'size': self._get_directory_size(item_path),
                        'created': os.path.getctime(item_path)
                    })
            elif item.endswith('.zip'):
                # Compressed backup
                backups.append({
                    'name': item,
                    'type': 'compressed',
                    'size': os.path.getsize(item_path),
                    'created': os.path.getctime(item_path)
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x['created'], reverse=True)
        
        return backups
    
    def _get_directory_size(self, path):
        """Get directory size in bytes"""
        total_size = 0
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                if os.path.exists(filepath):
                    total_size += os.path.getsize(filepath)
        return total_size
    
    def delete_backup(self, backup_name):
        """Delete backup"""
        backup_path = os.path.join(self.backup_dir, backup_name)
        
        if os.path.exists(backup_path):
            if os.path.isdir(backup_path):
                shutil.rmtree(backup_path)
            else:
                os.remove(backup_path)
            return True
        
        return False
    
    def cleanup_old_backups(self, days_to_keep=30):
        """Clean up old backups"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        deleted_count = 0
        
        for backup in self.list_backups():
            backup_date = datetime.fromtimestamp(backup['created'])
            if backup_date < cutoff_date:
                if self.delete_backup(backup['name']):
                    deleted_count += 1
        
        return deleted_count
    
    def schedule_automatic_backup(self, backup_type='full', schedule='daily'):
        """Schedule automatic backups (placeholder for cron job integration)"""
        # This would typically integrate with a task scheduler like Celery
        # or create cron jobs for automatic backups
        
        schedule_config = {
            'backup_type': backup_type,
            'schedule': schedule,
            'enabled': True,
            'created_at': datetime.now().isoformat()
        }
        
        schedule_file = os.path.join(self.backup_dir, 'schedule.json')
        with open(schedule_file, 'w') as f:
            json.dump(schedule_config, f, indent=2)
        
        return schedule_config