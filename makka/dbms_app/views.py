from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView, ListView
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.core.paginator import Paginator
import json

from accounting_app.services.dbms import DatabaseManagementSystem


class DBMSDashboardView(LoginRequiredMixin, TemplateView):
    """Database Management System Dashboard"""
    template_name = 'dbms/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        dbms = DatabaseManagementSystem()
        
        # Get database statistics
        context['db_stats'] = dbms.get_database_stats()
        context['tables'] = dbms.get_table_list()
        
        return context


class TableBrowserView(LoginRequiredMixin, TemplateView):
    """Table browser for viewing and editing table data"""
    template_name = 'dbms/table_browser.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        table_name = self.request.GET.get('table')
        
        if table_name:
            dbms = DatabaseManagementSystem()
            context['table_name'] = table_name
            context['table_structure'] = dbms.get_table_structure(table_name)
            
            # Get paginated data
            page = self.request.GET.get('page', 1)
            limit = 50
            offset = (int(page) - 1) * limit
            
            # Apply filters
            filters = {}
            for key, value in self.request.GET.items():
                if key not in ['table', 'page'] and value:
                    filters[key] = value
            
            context['table_data'] = dbms.get_table_data(table_name, limit, offset, filters)
            context['total_count'] = dbms.get_table_count(table_name, filters)
            
            # Pagination
            paginator = Paginator(range(context['total_count']), limit)
            context['paginator'] = paginator
            context['page_obj'] = paginator.get_page(page)
        
        return context


class SQLExecutorView(LoginRequiredMixin, TemplateView):
    """SQL query executor"""
    template_name = 'dbms/sql_executor.html'
    
    def post(self, request, *args, **kwargs):
        sql_query = request.POST.get('sql_query', '')
        dbms = DatabaseManagementSystem()
        
        result = dbms.execute_sql(sql_query)
        
        context = self.get_context_data()
        context['sql_query'] = sql_query
        context['result'] = result
        
        return render(request, self.template_name, context)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['sql_query'] = ''
        context['result'] = None
        return context


class BackupManagerView(LoginRequiredMixin, TemplateView):
    """Backup management interface"""
    template_name = 'dbms/backup_manager.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        from accounting_app.services.backups import BackupManager
        backup_manager = BackupManager()
        
        context['backups'] = backup_manager.list_backups()
        
        return context
    
    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        backup_name = request.POST.get('backup_name')
        
        from accounting_app.services.backups import BackupManager
        backup_manager = BackupManager()
        
        if action == 'create_full':
            backup_path = backup_manager.create_full_backup(backup_name)
            messages.success(request, f'Full backup created: {backup_path}')
        elif action == 'create_database':
            backup_path = backup_manager.create_database_backup(backup_name)
            messages.success(request, f'Database backup created: {backup_path}')
        elif action == 'create_media':
            backup_path = backup_manager.create_media_backup(backup_name)
            messages.success(request, f'Media backup created: {backup_path}')
        elif action == 'delete':
            if backup_manager.delete_backup(backup_name):
                messages.success(request, f'Backup deleted: {backup_name}')
            else:
                messages.error(request, f'Failed to delete backup: {backup_name}')
        
        return self.get(request, *args, **kwargs)


class ImportExportView(LoginRequiredMixin, TemplateView):
    """Import/Export data interface"""
    template_name = 'dbms/import_export.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        dbms = DatabaseManagementSystem()
        context['tables'] = dbms.get_table_list()
        return context
    
    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        table_name = request.POST.get('table_name')
        
        dbms = DatabaseManagementSystem()
        
        if action == 'export_csv':
            # Apply filters if provided
            filters = {}
            for key, value in request.POST.items():
                if key.startswith('filter_') and value:
                    field_name = key.replace('filter_', '')
                    filters[field_name] = value
            
            csv_data = dbms.export_table_to_csv(table_name, filters)
            
            response = HttpResponse(csv_data, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{table_name}_export.csv"'
            return response
        
        elif action == 'import_csv':
            csv_file = request.FILES.get('csv_file')
            if csv_file:
                csv_data = csv_file.read().decode('utf-8')
                dbms.import_csv_to_table(table_name, csv_data)
                messages.success(request, f'Data imported to {table_name} successfully')
            else:
                messages.error(request, 'No CSV file provided')
        
        return self.get(request, *args, **kwargs)


class DatabaseStatsView(LoginRequiredMixin, TemplateView):
    """Database statistics and performance monitoring"""
    template_name = 'dbms/database_stats.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        dbms = DatabaseManagementSystem()
        
        context['db_stats'] = dbms.get_database_stats()
        context['indexes'] = dbms.get_indexes()
        
        return context
    
    def post(self, request, *args, **kwargs):
        action = request.POST.get('action')
        
        dbms = DatabaseManagementSystem()
        
        if action == 'optimize':
            dbms.optimize_database()
            messages.success(request, 'Database optimized successfully')
        elif action == 'create_index':
            table_name = request.POST.get('table_name')
            column_name = request.POST.get('column_name')
            index_name = request.POST.get('index_name')
            
            if dbms.create_index(table_name, column_name, index_name):
                messages.success(request, f'Index created: {index_name}')
            else:
                messages.error(request, 'Failed to create index')
        elif action == 'drop_index':
            index_name = request.POST.get('index_name')
            
            if dbms.drop_index(index_name):
                messages.success(request, f'Index dropped: {index_name}')
            else:
                messages.error(request, 'Failed to drop index')
        
        return self.get(request, *args, **kwargs)


# AJAX endpoints
def get_table_data(request, table_name):
    """Get table data via AJAX"""
    dbms = DatabaseManagementSystem()
    
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 50))
    offset = (page - 1) * limit
    
    # Apply filters
    filters = {}
    for key, value in request.GET.items():
        if key not in ['page', 'limit'] and value:
            filters[key] = value
    
    data = dbms.get_table_data(table_name, limit, offset, filters)
    total_count = dbms.get_table_count(table_name, filters)
    
    return JsonResponse({
        'data': data,
        'total_count': total_count,
        'page': page,
        'has_next': (page * limit) < total_count,
        'has_previous': page > 1
    })


def execute_sql_ajax(request):
    """Execute SQL query via AJAX"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)
    
    sql_query = request.POST.get('sql_query', '')
    dbms = DatabaseManagementSystem()
    
    result = dbms.execute_sql(sql_query)
    
    return JsonResponse(result)


def get_query_plan(request):
    """Get query execution plan via AJAX"""
    sql_query = request.GET.get('sql_query', '')
    dbms = DatabaseManagementSystem()
    
    plan = dbms.get_query_plan(sql_query)
    
    return JsonResponse({'plan': plan})