from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.db import connection
from django.utils import timezone
import os
import json
import csv
import io
from datetime import datetime
from .services import backup_service, import_export_service, optimization_service

def dbms_dashboard(request):
    """لوحة تحكم إدارة قاعدة البيانات"""
    try:
        # إحصائيات قاعدة البيانات
        db_stats = optimization_service.get_database_statistics()
        
        # قائمة النسخ الاحتياطية
        backups = backup_service.list_backups()
        
        # حجم قاعدة البيانات
        db_size = optimization_service.get_database_size()
        
        context = {
            'db_stats': db_stats,
            'backups': backups,
            'db_size': db_size,
            'total_tables': db_stats.get('total_tables', 0),
            'total_records': db_stats.get('total_records', 0),
            'database_name': settings.DATABASES['default']['NAME'],
        }
        return render(request, 'dbms_app/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة التحكم: {str(e)}')
        return render(request, 'dbms_app/dashboard.html', {})

@require_http_methods(["POST"])
def create_backup(request):
    """إنشاء نسخة احتياطية"""
    try:
        backup_name = request.POST.get('backup_name', f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
        result = backup_service.create_backup(backup_name)
        
        if result['status'] == 'success':
            messages.success(request, f'تم إنشاء النسخة الاحتياطية بنجاح: {result["filename"]}')
        else:
            messages.error(request, f'فشل في إنشاء النسخة الاحتياطية: {result["message"]}')
            
    except Exception as e:
        messages.error(request, f'خطأ في إنشاء النسخة الاحتياطية: {str(e)}')
    
    return redirect('dbms_dashboard')

@require_http_methods(["POST"])
def restore_backup(request):
    """استعادة نسخة احتياطية"""
    try:
        backup_file = request.POST.get('backup_file')
        if not backup_file:
            messages.error(request, 'يرجى اختيار ملف النسخة الاحتياطية')
            return redirect('dbms_dashboard')
            
        result = backup_service.restore_backup(backup_file)
        
        if result['status'] == 'success':
            messages.success(request, 'تم استعادة النسخة الاحتياطية بنجاح')
        else:
            messages.error(request, f'فشل في استعادة النسخة الاحتياطية: {result["message"]}')
            
    except Exception as e:
        messages.error(request, f'خطأ في استعادة النسخة الاحتياطية: {str(e)}')
    
    return redirect('dbms_dashboard')

@require_http_methods(["POST"])
def delete_backup(request):
    """حذف نسخة احتياطية"""
    try:
        backup_file = request.POST.get('backup_file')
        if not backup_file:
            messages.error(request, 'يرجى اختيار ملف النسخة الاحتياطية')
            return redirect('dbms_dashboard')
            
        result = backup_service.delete_backup(backup_file)
        
        if result['status'] == 'success':
            messages.success(request, 'تم حذف النسخة الاحتياطية بنجاح')
        else:
            messages.error(request, f'فشل في حذف النسخة الاحتياطية: {result["message"]}')
            
    except Exception as e:
        messages.error(request, f'خطأ في حذف النسخة الاحتياطية: {str(e)}')
    
    return redirect('dbms_dashboard')

def download_backup(request, filename):
    """تحميل نسخة احتياطية"""
    try:
        backup_path = os.path.join(settings.BACKUP_DIR, filename)
        if os.path.exists(backup_path):
            with open(backup_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/sql')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
        else:
            messages.error(request, 'ملف النسخة الاحتياطية غير موجود')
            return redirect('dbms_dashboard')
    except Exception as e:
        messages.error(request, f'خطأ في تحميل النسخة الاحتياطية: {str(e)}')
        return redirect('dbms_dashboard')

@require_http_methods(["POST"])
def optimize_database(request):
    """تحسين قاعدة البيانات"""
    try:
        result = optimization_service.optimize_database()
        
        if result['status'] == 'success':
            messages.success(request, 'تم تحسين قاعدة البيانات بنجاح')
        else:
            messages.error(request, f'فشل في تحسين قاعدة البيانات: {result["message"]}')
            
    except Exception as e:
        messages.error(request, f'خطأ في تحسين قاعدة البيانات: {str(e)}')
    
    return redirect('dbms_dashboard')

def export_data(request):
    """تصدير البيانات"""
    try:
        table_name = request.GET.get('table')
        format_type = request.GET.get('format', 'json')
        
        if not table_name:
            messages.error(request, 'يرجى اختيار الجدول المراد تصديره')
            return redirect('dbms_dashboard')
            
        result = import_export_service.export_table_data(table_name, format_type)
        
        if result['status'] == 'success':
            if format_type == 'json':
                response = HttpResponse(result['data'], content_type='application/json')
                response['Content-Disposition'] = f'attachment; filename="{table_name}_export.json"'
            elif format_type == 'csv':
                response = HttpResponse(result['data'], content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename="{table_name}_export.csv"'
            else:
                response = HttpResponse(result['data'], content_type='application/octet-stream')
                response['Content-Disposition'] = f'attachment; filename="{table_name}_export.{format_type}"'
            
            return response
        else:
            messages.error(request, f'فشل في تصدير البيانات: {result["message"]}')
            
    except Exception as e:
        messages.error(request, f'خطأ في تصدير البيانات: {str(e)}')
    
    return redirect('dbms_dashboard')

@require_http_methods(["POST"])
def import_data(request):
    """استيراد البيانات"""
    try:
        if 'import_file' not in request.FILES:
            messages.error(request, 'يرجى اختيار ملف الاستيراد')
            return redirect('dbms_dashboard')
            
        import_file = request.FILES['import_file']
        table_name = request.POST.get('table_name')
        format_type = request.POST.get('format_type', 'json')
        
        if not table_name:
            messages.error(request, 'يرجى تحديد اسم الجدول')
            return redirect('dbms_dashboard')
            
        result = import_export_service.import_table_data(import_file, table_name, format_type)
        
        if result['status'] == 'success':
            messages.success(request, f'تم استيراد {result["imported_count"]} سجل بنجاح')
        else:
            messages.error(request, f'فشل في استيراد البيانات: {result["message"]}')
            
    except Exception as e:
        messages.error(request, f'خطأ في استيراد البيانات: {str(e)}')
    
    return redirect('dbms_dashboard')

def get_table_list(request):
    """الحصول على قائمة الجداول"""
    try:
        tables = optimization_service.get_table_list()
        return JsonResponse({'tables': tables})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_table_info(request, table_name):
    """الحصول على معلومات الجدول"""
    try:
        info = optimization_service.get_table_info(table_name)
        return JsonResponse(info)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def execute_sql(request):
    """تنفيذ استعلام SQL مخصص"""
    try:
        sql_query = request.POST.get('sql_query')
        if not sql_query:
            return JsonResponse({'error': 'يرجى إدخال استعلام SQL'}, status=400)
            
        result = optimization_service.execute_custom_sql(sql_query)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)