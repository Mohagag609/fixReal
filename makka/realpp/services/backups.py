"""
Backup and restore services for the real estate management system.
This module handles automated backups, restore operations, and backup management.
"""

import os
import shutil
import zipfile
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from django.conf import settings
from django.core.management import call_command
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import connection

from .dbms import DatabaseManager


class BackupManager:
    """Backup and restore operations."""
    
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.backup_dir = getattr(settings, 'BACKUP_DIR', 'backups')
        self.media_dir = settings.MEDIA_ROOT
        
        # Create backup directory if it doesn't exist
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def create_full_backup(self, backup_name: str = None) -> Dict[str, Any]:
        """Create a full backup including database and media files."""
        try:
            if not backup_name:
                backup_name = f"full_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            backup_path = os.path.join(self.backup_dir, backup_name)
            os.makedirs(backup_path, exist_ok=True)
            
            # Backup database
            db_backup_file = os.path.join(backup_path, 'database.sql')
            db_result = self.db_manager.backup_database(db_backup_file)
            
            if not db_result['success']:
                return {
                    'success': False,
                    'message': f'Database backup failed: {db_result["message"]}',
                    'timestamp': datetime.now()
                }
            
            # Backup media files
            media_backup_dir = os.path.join(backup_path, 'media')
            if os.path.exists(self.media_dir):
                shutil.copytree(self.media_dir, media_backup_dir)
            
            # Create backup info file
            info_file = os.path.join(backup_path, 'backup_info.txt')
            with open(info_file, 'w', encoding='utf-8') as f:
                f.write(f"Backup Name: {backup_name}\n")
                f.write(f"Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Database: {settings.DATABASES['default']['NAME']}\n")
                f.write(f"Media Files: {'Yes' if os.path.exists(media_backup_dir) else 'No'}\n")
            
            # Create zip archive
            zip_path = f"{backup_path}.zip"
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(backup_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, backup_path)
                        zipf.write(file_path, arcname)
            
            # Remove temporary directory
            shutil.rmtree(backup_path)
            
            return {
                'success': True,
                'message': 'Full backup created successfully',
                'backup_path': zip_path,
                'backup_name': backup_name,
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Full backup failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def create_database_backup(self, backup_name: str = None) -> Dict[str, Any]:
        """Create database-only backup."""
        try:
            if not backup_name:
                backup_name = f"db_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
            
            backup_path = os.path.join(self.backup_dir, backup_name)
            result = self.db_manager.backup_database(backup_path)
            
            if result['success']:
                result['backup_path'] = backup_path
                result['backup_name'] = backup_name
            
            return result
        except Exception as e:
            return {
                'success': False,
                'message': f'Database backup failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def restore_full_backup(self, backup_path: str) -> Dict[str, Any]:
        """Restore from a full backup."""
        try:
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'message': 'Backup file not found',
                    'timestamp': datetime.now()
                }
            
            # Extract backup
            extract_dir = os.path.join(self.backup_dir, 'temp_restore')
            os.makedirs(extract_dir, exist_ok=True)
            
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                zipf.extractall(extract_dir)
            
            # Restore database
            db_file = os.path.join(extract_dir, 'database.sql')
            if os.path.exists(db_file):
                db_result = self.db_manager.restore_database(db_file)
                if not db_result['success']:
                    return {
                        'success': False,
                        'message': f'Database restore failed: {db_result["message"]}',
                        'timestamp': datetime.now()
                    }
            
            # Restore media files
            media_dir = os.path.join(extract_dir, 'media')
            if os.path.exists(media_dir):
                if os.path.exists(self.media_dir):
                    shutil.rmtree(self.media_dir)
                shutil.copytree(media_dir, self.media_dir)
            
            # Cleanup
            shutil.rmtree(extract_dir)
            
            return {
                'success': True,
                'message': 'Full backup restored successfully',
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Full restore failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def restore_database_backup(self, backup_path: str) -> Dict[str, Any]:
        """Restore database from backup."""
        try:
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'message': 'Backup file not found',
                    'timestamp': datetime.now()
                }
            
            result = self.db_manager.restore_database(backup_path)
            return result
        except Exception as e:
            return {
                'success': False,
                'message': f'Database restore failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups."""
        try:
            backups = []
            
            for filename in os.listdir(self.backup_dir):
                file_path = os.path.join(self.backup_dir, filename)
                
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    backups.append({
                        'name': filename,
                        'path': file_path,
                        'size': stat.st_size,
                        'created': datetime.fromtimestamp(stat.st_ctime),
                        'type': 'full' if filename.endswith('.zip') else 'database'
                    })
            
            # Sort by creation time (newest first)
            backups.sort(key=lambda x: x['created'], reverse=True)
            
            return backups
        except Exception as e:
            return []
    
    def delete_backup(self, backup_name: str) -> Dict[str, Any]:
        """Delete a backup file."""
        try:
            backup_path = os.path.join(self.backup_dir, backup_name)
            
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'message': 'Backup file not found',
                    'timestamp': datetime.now()
                }
            
            os.remove(backup_path)
            
            return {
                'success': True,
                'message': 'Backup deleted successfully',
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Delete failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def cleanup_old_backups(self, days: int = 30) -> Dict[str, Any]:
        """Clean up old backup files."""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            deleted_count = 0
            
            for filename in os.listdir(self.backup_dir):
                file_path = os.path.join(self.backup_dir, filename)
                
                if os.path.isfile(file_path):
                    file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                    
                    if file_time < cutoff_date:
                        os.remove(file_path)
                        deleted_count += 1
            
            return {
                'success': True,
                'message': f'Cleaned up {deleted_count} old backups',
                'deleted_count': deleted_count,
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def get_backup_size(self, backup_path: str) -> int:
        """Get backup file size in bytes."""
        try:
            return os.path.getsize(backup_path)
        except OSError:
            return 0
    
    def schedule_automatic_backup(self, frequency: str = 'daily') -> Dict[str, Any]:
        """Schedule automatic backups (placeholder for cron job setup)."""
        # This would typically be implemented with a task scheduler
        # like Celery or a cron job
        return {
            'success': True,
            'message': f'Automatic backup scheduled for {frequency}',
            'frequency': frequency,
            'timestamp': datetime.now()
        }


def get_backup_manager() -> BackupManager:
    """Get backup manager instance."""
    return BackupManager()