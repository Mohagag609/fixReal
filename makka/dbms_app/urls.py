from django.urls import path
from . import views

urlpatterns = [
    path('', views.dbms_dashboard, name='dbms_dashboard'),
    
    # النسخ الاحتياطية
    path('backup/create/', views.create_backup, name='create_backup'),
    path('backup/restore/', views.restore_backup, name='restore_backup'),
    path('backup/delete/', views.delete_backup, name='delete_backup'),
    path('backup/download/<str:filename>/', views.download_backup, name='download_backup'),
    
    # التحسين والصيانة
    path('optimize/', views.optimize_database, name='optimize_database'),
    path('sql/execute/', views.execute_sql, name='execute_sql'),
    
    # الاستيراد والتصدير
    path('export/', views.export_data, name='export_data'),
    path('import/', views.import_data, name='import_data'),
    
    # API endpoints
    path('api/tables/', views.get_table_list, name='get_table_list'),
    path('api/tables/<str:table_name>/', views.get_table_info, name='get_table_info'),
]