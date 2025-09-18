from django.urls import path
from . import views

app_name = 'settings'

urlpatterns = [
    path('', views.SettingsDashboardView.as_view(), name='dashboard'),
    path('user/', views.UserSettingsView.as_view(), name='user_settings'),
    path('company/', views.CompanySettingsView.as_view(), name='company_settings'),
    path('system/', views.SystemSettingsView.as_view(), name='system_settings'),
    path('audit-log/', views.AuditLogView.as_view(), name='audit_log'),
    path('theme/', views.ThemeSettingsView.as_view(), name='theme_settings'),
    path('notifications/', views.NotificationSettingsView.as_view(), name='notification_settings'),
    path('security/', views.SecuritySettingsView.as_view(), name='security_settings'),
    
    # AJAX endpoints
    path('ajax/update-setting/', views.update_setting, name='ajax_update_setting'),
    path('ajax/get-setting/<str:key>/', views.get_setting, name='ajax_get_setting'),
    path('ajax/reset-settings/', views.reset_settings, name='ajax_reset_settings'),
]