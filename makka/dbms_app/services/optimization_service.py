from django.db import connection
from django.conf import settings
import psutil
import os

class OptimizationService:
    def __init__(self):
        self.db_settings = settings.DATABASES['default']
    
    def get_database_statistics(self):
        """إحصائيات قاعدة البيانات"""
        try:
            with connection.cursor() as cursor:
                # عدد الجداول
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)
                total_tables = cursor.fetchone()[0]
                
                # عدد السجلات الإجمالي
                cursor.execute("""
                    SELECT SUM(n_tup_ins) as total_inserts,
                           SUM(n_tup_upd) as total_updates,
                           SUM(n_tup_del) as total_deletes
                    FROM pg_stat_user_tables
                """)
                stats = cursor.fetchone()
                
                # معلومات الجداول
                cursor.execute("""
                    SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
                    FROM pg_stat_user_tables
                    ORDER BY n_live_tup DESC
                """)
                table_stats = cursor.fetchall()
                
                return {
                    'status': 'success',
                    'total_tables': total_tables,
                    'total_records': sum(row[5] for row in table_stats),  # n_live_tup
                    'total_inserts': stats[0] or 0,
                    'total_updates': stats[1] or 0,
                    'total_deletes': stats[2] or 0,
                    'table_statistics': [
                        {
                            'schema': row[0],
                            'table': row[1],
                            'inserts': row[2],
                            'updates': row[3],
                            'deletes': row[4],
                            'live_tuples': row[5],
                            'dead_tuples': row[6]
                        }
                        for row in table_stats
                    ]
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إحصائيات قاعدة البيانات: {str(e)}'
            }
    
    def get_database_size(self):
        """حجم قاعدة البيانات"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as database_size,
                           pg_database_size(current_database()) as database_size_bytes
                """)
                result = cursor.fetchone()
                
                return {
                    'status': 'success',
                    'database_size': result[0],
                    'database_size_bytes': result[1]
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في حجم قاعدة البيانات: {str(e)}'
            }
    
    def get_table_list(self):
        """قائمة الجداول"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT table_name, 
                           pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
                           pg_total_relation_size(quote_ident(table_name)) as size_bytes
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """)
                tables = cursor.fetchall()
                
                return [
                    {
                        'name': table[0],
                        'size': table[1],
                        'size_bytes': table[2]
                    }
                    for table in tables
                ]
                
        except Exception as e:
            return []
    
    def get_table_info(self, table_name):
        """معلومات الجدول"""
        try:
            with connection.cursor() as cursor:
                # معلومات أساسية
                cursor.execute("""
                    SELECT 
                        pg_size_pretty(pg_total_relation_size(%s)) as size,
                        pg_total_relation_size(%s) as size_bytes,
                        (SELECT COUNT(*) FROM %s) as row_count
                """, [table_name, table_name, table_name])
                
                basic_info = cursor.fetchone()
                
                # معلومات الأعمدة
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = %s AND table_schema = 'public'
                    ORDER BY ordinal_position
                """, [table_name])
                
                columns = cursor.fetchall()
                
                # الفهارس
                cursor.execute("""
                    SELECT indexname, indexdef
                    FROM pg_indexes
                    WHERE tablename = %s
                """, [table_name])
                
                indexes = cursor.fetchall()
                
                return {
                    'status': 'success',
                    'table_name': table_name,
                    'size': basic_info[0],
                    'size_bytes': basic_info[1],
                    'row_count': basic_info[2],
                    'columns': [
                        {
                            'name': col[0],
                            'type': col[1],
                            'nullable': col[2],
                            'default': col[3]
                        }
                        for col in columns
                    ],
                    'indexes': [
                        {
                            'name': idx[0],
                            'definition': idx[1]
                        }
                        for idx in indexes
                    ]
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في معلومات الجدول: {str(e)}'
            }
    
    def optimize_database(self):
        """تحسين قاعدة البيانات"""
        try:
            with connection.cursor() as cursor:
                # تحليل الجداول
                cursor.execute("ANALYZE;")
                
                # تنظيف قاعدة البيانات
                cursor.execute("VACUUM;")
                
                # إعادة بناء الفهارس
                cursor.execute("REINDEX DATABASE %s;", [self.db_settings['NAME']])
                
                return {
                    'status': 'success',
                    'message': 'تم تحسين قاعدة البيانات بنجاح'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تحسين قاعدة البيانات: {str(e)}'
            }
    
    def execute_custom_sql(self, sql_query):
        """تنفيذ استعلام SQL مخصص"""
        try:
            with connection.cursor() as cursor:
                cursor.execute(sql_query)
                
                if cursor.description:
                    # استعلام SELECT
                    columns = [col[0] for col in cursor.description]
                    rows = cursor.fetchall()
                    
                    return {
                        'status': 'success',
                        'query_type': 'SELECT',
                        'columns': columns,
                        'rows': rows,
                        'row_count': len(rows)
                    }
                else:
                    # استعلام DDL/DML
                    return {
                        'status': 'success',
                        'query_type': 'DDL/DML',
                        'message': 'تم تنفيذ الاستعلام بنجاح'
                    }
                    
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تنفيذ الاستعلام: {str(e)}'
            }
    
    def get_system_resources(self):
        """معلومات موارد النظام"""
        try:
            # استخدام الذاكرة
            memory = psutil.virtual_memory()
            
            # استخدام القرص
            disk = psutil.disk_usage('/')
            
            # استخدام المعالج
            cpu_percent = psutil.cpu_percent(interval=1)
            
            return {
                'status': 'success',
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'used': memory.used,
                    'percentage': memory.percent
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percentage': (disk.used / disk.total) * 100
                },
                'cpu_percentage': cpu_percent
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في معلومات النظام: {str(e)}'
            }

# إنشاء مثيل الخدمة
optimization_service = OptimizationService()