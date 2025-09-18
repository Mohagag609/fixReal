from django.urls import path
from . import views

app_name = 'dbms'

urlpatterns = [
    path('', views.DBMSDashboardView.as_view(), name='dashboard'),
    path('table-browser/', views.TableBrowserView.as_view(), name='table_browser'),
    path('sql-executor/', views.SQLExecutorView.as_view(), name='sql_executor'),
    path('backup-manager/', views.BackupManagerView.as_view(), name='backup_manager'),
    path('import-export/', views.ImportExportView.as_view(), name='import_export'),
    path('database-stats/', views.DatabaseStatsView.as_view(), name='database_stats'),
    
    # AJAX endpoints
    path('ajax/table-data/<str:table_name>/', views.get_table_data, name='ajax_table_data'),
    path('ajax/execute-sql/', views.execute_sql_ajax, name='ajax_execute_sql'),
    path('ajax/query-plan/', views.get_query_plan, name='ajax_query_plan'),
]