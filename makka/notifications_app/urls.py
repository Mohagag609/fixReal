from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationsListView.as_view(), name='list'),
    path('dashboard/', views.NotificationDashboardView.as_view(), name='dashboard'),
    path('settings/', views.NotificationSettingsView.as_view(), name='settings'),
    path('<uuid:pk>/', views.NotificationDetailView.as_view(), name='detail'),
    
    # AJAX endpoints
    path('ajax/mark-read/<uuid:notification_id>/', views.mark_notification_read, name='ajax_mark_read'),
    path('ajax/mark-all-read/', views.mark_all_read, name='ajax_mark_all_read'),
    path('ajax/archive/<uuid:notification_id>/', views.archive_notification, name='ajax_archive'),
    path('ajax/delete/<uuid:notification_id>/', views.delete_notification, name='ajax_delete'),
    path('ajax/unread-count/', views.get_unread_count, name='ajax_unread_count'),
    path('ajax/recent/', views.get_recent_notifications, name='ajax_recent'),
    path('ajax/create/', views.create_notification, name='ajax_create'),
]