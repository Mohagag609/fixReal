"""
Database management services for the real estate management system.
This module handles database operations, optimization, and maintenance.
"""

import os
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from django.db import connection, transaction
from django.core.management import call_command
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from ..models import AuditLog, Settings


class DatabaseManager:
    """Database management operations."""
    
    def __init__(self):
        self.db_settings = settings.DATABASES['default']
    
    def get_database_info(self) -> Dict[str, Any]:
        """Get database information and statistics."""
        with connection.cursor() as cursor:
            # Get database size
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """)
            db_size = cursor.fetchone()[0]
            
            # Get table sizes
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            """)
            table_sizes = cursor.fetchall()
            
            # Get connection count
            cursor.execute("""
                SELECT count(*) as connections
                FROM pg_stat_activity 
                WHERE state = 'active'
            """)
            active_connections = cursor.fetchone()[0]
            
            return {
                'database_size': db_size,
                'table_sizes': table_sizes,
                'active_connections': active_connections,
                'database_name': self.db_settings['NAME'],
                'database_host': self.db_settings['HOST'],
                'database_port': self.db_settings['PORT'],
            }
    
    def optimize_database(self) -> Dict[str, Any]:
        """Optimize database performance."""
        try:
            with connection.cursor() as cursor:
                # Analyze tables
                cursor.execute("ANALYZE")
                
                # Vacuum tables
                cursor.execute("VACUUM")
                
                # Reindex
                cursor.execute("REINDEX DATABASE %s", [self.db_settings['NAME']])
                
                return {
                    'success': True,
                    'message': 'Database optimized successfully',
                    'timestamp': datetime.now()
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Database optimization failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def backup_database(self, backup_path: str = None) -> Dict[str, Any]:
        """Create database backup."""
        try:
            if not backup_path:
                backup_path = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
            
            # Create backup using pg_dump
            db_name = self.db_settings['NAME']
            db_user = self.db_settings['USER']
            db_host = self.db_settings['HOST']
            db_port = self.db_settings['PORT']
            
            cmd = [
                'pg_dump',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                '-f', backup_path
            ]
            
            # Set password if provided
            env = os.environ.copy()
            if 'PASSWORD' in self.db_settings:
                env['PGPASSWORD'] = self.db_settings['PASSWORD']
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {
                    'success': True,
                    'message': 'Database backup created successfully',
                    'backup_path': backup_path,
                    'timestamp': datetime.now()
                }
            else:
                return {
                    'success': False,
                    'message': f'Backup failed: {result.stderr}',
                    'timestamp': datetime.now()
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Backup failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def restore_database(self, backup_path: str) -> Dict[str, Any]:
        """Restore database from backup."""
        try:
            if not os.path.exists(backup_path):
                return {
                    'success': False,
                    'message': 'Backup file not found',
                    'timestamp': datetime.now()
                }
            
            db_name = self.db_settings['NAME']
            db_user = self.db_settings['USER']
            db_host = self.db_settings['HOST']
            db_port = self.db_settings['PORT']
            
            cmd = [
                'psql',
                '-h', db_host,
                '-p', str(db_port),
                '-U', db_user,
                '-d', db_name,
                '-f', backup_path
            ]
            
            # Set password if provided
            env = os.environ.copy()
            if 'PASSWORD' in self.db_settings:
                env['PGPASSWORD'] = self.db_settings['PASSWORD']
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {
                    'success': True,
                    'message': 'Database restored successfully',
                    'timestamp': datetime.now()
                }
            else:
                return {
                    'success': False,
                    'message': f'Restore failed: {result.stderr}',
                    'timestamp': datetime.now()
                }
        except Exception as e:
            return {
                'success': False,
                'message': f'Restore failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def get_database_health(self) -> Dict[str, Any]:
        """Get database health metrics."""
        try:
            with connection.cursor() as cursor:
                # Check for long-running queries
                cursor.execute("""
                    SELECT count(*) as long_queries
                    FROM pg_stat_activity 
                    WHERE state = 'active' 
                    AND query_start < now() - interval '5 minutes'
                """)
                long_queries = cursor.fetchone()[0]
                
                # Check for locks
                cursor.execute("""
                    SELECT count(*) as locks
                    FROM pg_locks 
                    WHERE NOT granted
                """)
                locks = cursor.fetchone()[0]
                
                # Check database connections
                cursor.execute("""
                    SELECT count(*) as total_connections
                    FROM pg_stat_activity
                """)
                total_connections = cursor.fetchone()[0]
                
                # Check for dead tuples
                cursor.execute("""
                    SELECT sum(n_dead_tup) as dead_tuples
                    FROM pg_stat_user_tables
                """)
                dead_tuples = cursor.fetchone()[0] or 0
                
                return {
                    'long_queries': long_queries,
                    'locks': locks,
                    'total_connections': total_connections,
                    'dead_tuples': dead_tuples,
                    'health_score': self._calculate_health_score(long_queries, locks, dead_tuples),
                    'timestamp': datetime.now()
                }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now()
            }
    
    def _calculate_health_score(self, long_queries: int, locks: int, dead_tuples: int) -> int:
        """Calculate database health score (0-100)."""
        score = 100
        
        # Deduct points for issues
        if long_queries > 0:
            score -= min(long_queries * 10, 30)
        
        if locks > 0:
            score -= min(locks * 5, 20)
        
        if dead_tuples > 1000:
            score -= min((dead_tuples - 1000) // 100, 25)
        
        return max(score, 0)
    
    def cleanup_old_data(self, days: int = 30) -> Dict[str, Any]:
        """Clean up old data and logs."""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Clean up old audit logs
            old_logs = AuditLog.objects.filter(created_at__lt=cutoff_date)
            deleted_logs = old_logs.count()
            old_logs.delete()
            
            return {
                'success': True,
                'message': f'Cleaned up {deleted_logs} old audit logs',
                'deleted_logs': deleted_logs,
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def run_migrations(self) -> Dict[str, Any]:
        """Run database migrations."""
        try:
            call_command('migrate', verbosity=0)
            return {
                'success': True,
                'message': 'Migrations completed successfully',
                'timestamp': datetime.now()
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Migration failed: {str(e)}',
                'timestamp': datetime.now()
            }
    
    def get_table_statistics(self) -> Dict[str, Any]:
        """Get detailed table statistics."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        n_tup_ins as inserts,
                        n_tup_upd as updates,
                        n_tup_del as deletes,
                        n_live_tup as live_tuples,
                        n_dead_tup as dead_tuples,
                        last_vacuum,
                        last_autovacuum,
                        last_analyze,
                        last_autoanalyze
                    FROM pg_stat_user_tables
                    ORDER BY n_live_tup DESC
                """)
                
                table_stats = cursor.fetchall()
                
                return {
                    'table_statistics': table_stats,
                    'timestamp': datetime.now()
                }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now()
            }


def get_database_manager() -> DatabaseManager:
    """Get database manager instance."""
    return DatabaseManager()