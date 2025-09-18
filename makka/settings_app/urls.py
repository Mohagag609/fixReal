from django.urls import path
from . import views

urlpatterns = [
    path('', views.settings_dashboard, name='settings_dashboard'),
    
    # إعدادات النظام
    path('system/', views.system_settings, name='system_settings'),
    path('system/edit/<int:pk>/', views.edit_setting, name='edit_setting'),
    path('system/delete/<int:pk>/', views.delete_setting, name='delete_setting'),
    
    # إعدادات المفاتيح
    path('keyvals/', views.keyval_settings, name='keyval_settings'),
    path('keyvals/edit/<int:pk>/', views.edit_keyval, name='edit_keyval'),
    path('keyvals/delete/<int:pk>/', views.delete_keyval, name='delete_keyval'),
    
    # API endpoints
    path('api/setting/<str:key>/', views.get_setting_value, name='get_setting_value'),
    path('api/setting/<str:key>/set/', views.set_setting_value, name='set_setting_value'),
    path('api/keyval/<str:key>/', views.get_keyval_value, name='get_keyval_value'),
    path('api/keyval/<str:key>/set/', views.set_keyval_value, name='set_keyval_value'),
    
    # النسخ الاحتياطي والاستيراد
    path('export/', views.export_settings, name='export_settings'),
    path('import/', views.import_settings, name='import_settings'),
    path('reset/', views.reset_settings, name='reset_settings'),
    path('backup/', views.backup_settings, name='backup_settings'),
    path('restore/', views.restore_settings, name='restore_settings'),
]