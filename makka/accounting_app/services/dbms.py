import sqlite3
from django.db import connection

try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
from django.conf import settings
from django.core.management import call_command
from django.core.files.storage import default_storage
import json
import os
from datetime import datetime
import zipfile
import io


class DatabaseManagementSystem:
    """Database Management System for advanced operations"""
    
    def __init__(self):
        self.connection = connection
    
    def get_table_list(self):
        """Get list of all tables in the database"""
        with self.connection.cursor() as cursor:
            if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
            else:  # PostgreSQL
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name;
                """)
                tables = [row[0] for row in cursor.fetchall()]
        
        return tables
    
    def get_table_structure(self, table_name):
        """Get table structure and metadata"""
        with self.connection.cursor() as cursor:
            if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()
                structure = []
                for col in columns:
                    structure.append({
                        'name': col[1],
                        'type': col[2],
                        'not_null': bool(col[3]),
                        'default': col[4],
                        'primary_key': bool(col[5])
                    })
            else:  # PostgreSQL
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable, column_default, 
                           CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
                    FROM information_schema.columns c
                    LEFT JOIN (
                        SELECT ku.table_name, ku.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage ku
                        ON tc.constraint_name = ku.constraint_name
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                    ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
                    WHERE c.table_name = %s
                    ORDER BY c.ordinal_position;
                """, [table_name])
                columns = cursor.fetchall()
                structure = []
                for col in columns:
                    structure.append({
                        'name': col[0],
                        'type': col[1],
                        'not_null': col[2] == 'NO',
                        'default': col[3],
                        'primary_key': col[4]
                    })
        
        return structure
    
    def get_table_data(self, table_name, limit=100, offset=0, filters=None):
        """Get table data with pagination and filters"""
        query = f"SELECT * FROM {table_name}"
        params = []
        
        if filters:
            where_conditions = []
            for field, value in filters.items():
                if value:
                    where_conditions.append(f"{field} ILIKE %s")
                    params.append(f"%{value}%")
            
            if where_conditions:
                query += " WHERE " + " AND ".join(where_conditions)
        
        query += f" LIMIT {limit} OFFSET {offset}"
        
        with self.connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            
            data = []
            for row in rows:
                data.append(dict(zip(columns, row)))
        
        return data
    
    def get_table_count(self, table_name, filters=None):
        """Get total count of records in table"""
        query = f"SELECT COUNT(*) FROM {table_name}"
        params = []
        
        if filters:
            where_conditions = []
            for field, value in filters.items():
                if value:
                    where_conditions.append(f"{field} ILIKE %s")
                    params.append(f"%{value}%")
            
            if where_conditions:
                query += " WHERE " + " AND ".join(where_conditions)
        
        with self.connection.cursor() as cursor:
            cursor.execute(query, params)
            count = cursor.fetchone()[0]
        
        return count
    
    def execute_sql(self, sql_query, params=None):
        """Execute custom SQL query"""
        if params is None:
            params = []
        
        with self.connection.cursor() as cursor:
            try:
                cursor.execute(sql_query, params)
                
                # Check if it's a SELECT query
                if sql_query.strip().upper().startswith('SELECT'):
                    columns = [col[0] for col in cursor.description]
                    rows = cursor.fetchall()
                    return {
                        'success': True,
                        'data': [dict(zip(columns, row)) for row in rows],
                        'columns': columns,
                        'row_count': len(rows)
                    }
                else:
                    return {
                        'success': True,
                        'message': f'Query executed successfully. Rows affected: {cursor.rowcount}',
                        'row_count': cursor.rowcount
                    }
            except Exception as e:
                return {
                    'success': False,
                    'error': str(e)
                }
    
    def get_database_stats(self):
        """Get database statistics"""
        stats = {}
        
        with self.connection.cursor() as cursor:
            if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                # SQLite stats
                cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
                stats['table_count'] = cursor.fetchone()[0]
                
                cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();")
                stats['database_size'] = cursor.fetchone()[0]
                
                # Get table sizes
                tables = self.get_table_list()
                table_sizes = {}
                for table in tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table};")
                    table_sizes[table] = cursor.fetchone()[0]
                stats['table_sizes'] = table_sizes
                
            else:  # PostgreSQL
                # PostgreSQL stats
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public';
                """)
                stats['table_count'] = cursor.fetchone()[0]
                
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database()));
                """)
                stats['database_size'] = cursor.fetchone()[0]
                
                # Get table sizes
                cursor.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        attname,
                        n_distinct,
                        correlation
                    FROM pg_stats
                    WHERE schemaname = 'public'
                    ORDER BY tablename;
                """)
                stats['table_stats'] = cursor.fetchall()
        
        return stats
    
    def create_backup(self, backup_name=None):
        """Create database backup"""
        if backup_name is None:
            backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'database_type': 'sqlite' if 'sqlite' in settings.DATABASES['default']['ENGINE'] else 'postgresql',
            'tables': {}
        }
        
        # Get all tables
        tables = self.get_table_list()
        
        for table in tables:
            if not table.startswith('django_') and not table.startswith('auth_'):
                table_data = self.get_table_data(table, limit=10000)  # Limit for large tables
                backup_data['tables'][table] = table_data
        
        # Save backup to file
        backup_filename = f"{backup_name}.json"
        backup_path = os.path.join(settings.MEDIA_ROOT, 'backups', backup_filename)
        
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f, indent=2, default=str)
        
        return backup_path
    
    def restore_backup(self, backup_path):
        """Restore database from backup"""
        with open(backup_path, 'r') as f:
            backup_data = json.load(f)
        
        with self.connection.cursor() as cursor:
            for table_name, table_data in backup_data['tables'].items():
                if table_data:
                    # Clear existing data
                    cursor.execute(f"DELETE FROM {table_name};")
                    
                    # Insert backup data
                    if table_data:
                        columns = list(table_data[0].keys())
                        placeholders = ', '.join(['%s'] * len(columns))
                        insert_query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                        
                        for row in table_data:
                            values = [row.get(col) for col in columns]
                            cursor.execute(insert_query, values)
        
        return True
    
    def export_table_to_csv(self, table_name, filters=None):
        """Export table data to CSV format"""
        data = self.get_table_data(table_name, limit=10000, filters=filters)
        
        if not data:
            return ""
        
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
        
        return output.getvalue()
    
    def import_csv_to_table(self, table_name, csv_data):
        """Import CSV data to table"""
        import csv
        import io
        
        reader = csv.DictReader(io.StringIO(csv_data))
        
        with self.connection.cursor() as cursor:
            for row in reader:
                columns = list(row.keys())
                values = list(row.values())
                placeholders = ', '.join(['%s'] * len(columns))
                insert_query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                cursor.execute(insert_query, values)
        
        return True
    
    def optimize_database(self):
        """Optimize database performance"""
        with self.connection.cursor() as cursor:
            if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                # SQLite optimization
                cursor.execute("VACUUM;")
                cursor.execute("ANALYZE;")
            else:  # PostgreSQL
                # PostgreSQL optimization
                cursor.execute("VACUUM ANALYZE;")
        
        return True
    
    def get_query_plan(self, sql_query):
        """Get query execution plan"""
        with self.connection.cursor() as cursor:
            if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                cursor.execute(f"EXPLAIN QUERY PLAN {sql_query}")
                plan = cursor.fetchall()
            else:  # PostgreSQL
                cursor.execute(f"EXPLAIN ANALYZE {sql_query}")
                plan = cursor.fetchall()
        
        return plan
    
    def create_index(self, table_name, column_name, index_name=None):
        """Create index on table column"""
        if index_name is None:
            index_name = f"idx_{table_name}_{column_name}"
        
        with self.connection.cursor() as cursor:
            cursor.execute(f"CREATE INDEX {index_name} ON {table_name} ({column_name});")
        
        return True
    
    def drop_index(self, index_name):
        """Drop index"""
        with self.connection.cursor() as cursor:
            cursor.execute(f"DROP INDEX IF EXISTS {index_name};")
        
        return True
    
    def get_indexes(self, table_name=None):
        """Get list of indexes"""
        with self.connection.cursor() as cursor:
            if 'sqlite' in settings.DATABASES['default']['ENGINE']:
                if table_name:
                    cursor.execute(f"PRAGMA index_list({table_name});")
                else:
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='index';")
                indexes = cursor.fetchall()
            else:  # PostgreSQL
                if table_name:
                    cursor.execute("""
                        SELECT indexname, indexdef
                        FROM pg_indexes
                        WHERE tablename = %s;
                    """, [table_name])
                else:
                    cursor.execute("""
                        SELECT indexname, tablename, indexdef
                        FROM pg_indexes
                        WHERE schemaname = 'public';
                    """)
                indexes = cursor.fetchall()
        
        return indexes