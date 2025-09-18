import json
import csv
import io
from django.db import connection
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.conf import settings

class ImportExportService:
    def __init__(self):
        self.db_settings = settings.DATABASES['default']
    
    def export_table_data(self, table_name, format_type='json'):
        """تصدير بيانات الجدول"""
        try:
            with connection.cursor() as cursor:
                # الحصول على بيانات الجدول
                cursor.execute(f"SELECT * FROM {table_name}")
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                
                if format_type == 'json':
                    data = []
                    for row in rows:
                        row_dict = {}
                        for i, value in enumerate(row):
                            # تحويل التاريخ والوقت إلى نص
                            if hasattr(value, 'isoformat'):
                                row_dict[columns[i]] = value.isoformat()
                            else:
                                row_dict[columns[i]] = value
                        data.append(row_dict)
                    
                    json_data = json.dumps(data, ensure_ascii=False, indent=2)
                    return {
                        'status': 'success',
                        'data': json_data,
                        'format': 'json',
                        'row_count': len(rows)
                    }
                
                elif format_type == 'csv':
                    output = io.StringIO()
                    writer = csv.writer(output)
                    
                    # كتابة العناوين
                    writer.writerow(columns)
                    
                    # كتابة البيانات
                    for row in rows:
                        writer.writerow(row)
                    
                    csv_data = output.getvalue()
                    output.close()
                    
                    return {
                        'status': 'success',
                        'data': csv_data,
                        'format': 'csv',
                        'row_count': len(rows)
                    }
                
                else:
                    return {
                        'status': 'error',
                        'message': 'نوع التصدير غير مدعوم'
                    }
                    
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تصدير البيانات: {str(e)}'
            }
    
    def import_table_data(self, file, table_name, format_type='json'):
        """استيراد بيانات الجدول"""
        try:
            # قراءة الملف
            if isinstance(file, InMemoryUploadedFile):
                content = file.read().decode('utf-8')
            else:
                content = file.read().decode('utf-8')
            
            if format_type == 'json':
                data = json.loads(content)
                
                if not data:
                    return {
                        'status': 'error',
                        'message': 'الملف فارغ أو غير صالح'
                    }
                
                # الحصول على أعمدة الجدول
                with connection.cursor() as cursor:
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
                    columns = [col[0] for col in cursor.description]
                
                # إدراج البيانات
                imported_count = 0
                with connection.cursor() as cursor:
                    for row in data:
                        try:
                            # إنشاء استعلام INSERT
                            placeholders = ', '.join(['%s'] * len(columns))
                            query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                            
                            # تحضير البيانات
                            values = []
                            for col in columns:
                                if col in row:
                                    values.append(row[col])
                                else:
                                    values.append(None)
                            
                            cursor.execute(query, values)
                            imported_count += 1
                            
                        except Exception as e:
                            # تخطي السجل الذي فشل في الإدراج
                            continue
                
                return {
                    'status': 'success',
                    'imported_count': imported_count,
                    'message': f'تم استيراد {imported_count} سجل بنجاح'
                }
            
            elif format_type == 'csv':
                # قراءة CSV
                csv_reader = csv.DictReader(io.StringIO(content))
                rows = list(csv_reader)
                
                if not rows:
                    return {
                        'status': 'error',
                        'message': 'الملف فارغ أو غير صالح'
                    }
                
                # الحصول على أعمدة الجدول
                with connection.cursor() as cursor:
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
                    columns = [col[0] for col in cursor.description]
                
                # إدراج البيانات
                imported_count = 0
                with connection.cursor() as cursor:
                    for row in rows:
                        try:
                            # إنشاء استعلام INSERT
                            placeholders = ', '.join(['%s'] * len(columns))
                            query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                            
                            # تحضير البيانات
                            values = []
                            for col in columns:
                                if col in row and row[col]:
                                    values.append(row[col])
                                else:
                                    values.append(None)
                            
                            cursor.execute(query, values)
                            imported_count += 1
                            
                        except Exception as e:
                            # تخطي السجل الذي فشل في الإدراج
                            continue
                
                return {
                    'status': 'success',
                    'imported_count': imported_count,
                    'message': f'تم استيراد {imported_count} سجل بنجاح'
                }
            
            else:
                return {
                    'status': 'error',
                    'message': 'نوع الاستيراد غير مدعوم'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في استيراد البيانات: {str(e)}'
            }
    
    def export_all_tables(self, format_type='json'):
        """تصدير جميع الجداول"""
        try:
            with connection.cursor() as cursor:
                # الحصول على قائمة الجداول
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)
                tables = [row[0] for row in cursor.fetchall()]
            
            exported_tables = {}
            
            for table_name in tables:
                result = self.export_table_data(table_name, format_type)
                if result['status'] == 'success':
                    exported_tables[table_name] = result['data']
            
            return {
                'status': 'success',
                'tables': exported_tables,
                'table_count': len(exported_tables)
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تصدير جميع الجداول: {str(e)}'
            }
    
    def get_table_schema(self, table_name):
        """مخطط الجدول"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length
                    FROM information_schema.columns
                    WHERE table_name = %s AND table_schema = 'public'
                    ORDER BY ordinal_position
                """, [table_name])
                
                columns = cursor.fetchall()
                
                return {
                    'status': 'success',
                    'table_name': table_name,
                    'columns': [
                        {
                            'name': col[0],
                            'type': col[1],
                            'nullable': col[2] == 'YES',
                            'default': col[3],
                            'max_length': col[4]
                        }
                        for col in columns
                    ]
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في مخطط الجدول: {str(e)}'
            }

# إنشاء مثيل الخدمة
import_export_service = ImportExportService()