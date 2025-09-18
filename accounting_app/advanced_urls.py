"""
URLs للصفحات الفرعية المتقدمة
Advanced Sub-pages URLs

يحتوي على:
- نظام الإشعارات المتقدم
- نظام التقارير المتقدم
- نظام النسخ الاحتياطية
- نظام تحسين الأداء
"""

from django.urls import path
from . import advanced_views

app_name = 'advanced'

urlpatterns = [
    # ==================== نظام الإشعارات ====================
    
    # لوحة تحكم الإشعارات
    path('notifications/', advanced_views.NotificationDashboardView.as_view(), name='notification_dashboard'),
    path('notifications/<int:pk>/', advanced_views.NotificationDetailView.as_view(), name='notification_detail'),
    
    # قوالب الإشعارات
    path('notifications/templates/', advanced_views.NotificationTemplateListView.as_view(), name='notification_templates'),
    path('notifications/templates/create/', advanced_views.NotificationTemplateCreateView.as_view(), name='notification_template_create'),
    
    # قواعد الإشعارات
    path('notifications/rules/', advanced_views.NotificationRuleListView.as_view(), name='notification_rules'),
    
    # تحليلات الإشعارات
    path('notifications/analytics/', advanced_views.NotificationAnalyticsView.as_view(), name='notification_analytics'),
    
    # ==================== نظام التقارير ====================
    
    # لوحة تحكم التقارير
    path('reports/', advanced_views.ReportsDashboardView.as_view(), name='reports_dashboard'),
    path('reports/builder/', advanced_views.ReportBuilderView.as_view(), name='report_builder'),
    path('reports/execution/<int:pk>/', advanced_views.ReportExecutionView.as_view(), name='report_execution'),
    
    # جدولة التقارير
    path('reports/schedules/', advanced_views.ReportScheduleListView.as_view(), name='report_schedules'),
    path('reports/schedules/create/', advanced_views.ReportScheduleCreateView.as_view(), name='report_schedule_create'),
    
    # ==================== نظام النسخ الاحتياطية ====================
    
    # لوحة تحكم النسخ الاحتياطية
    path('backup/', advanced_views.BackupDashboardView.as_view(), name='backup_dashboard'),
    path('backup/execution/<int:pk>/', advanced_views.BackupExecutionDetailView.as_view(), name='backup_execution_detail'),
    path('backup/execution/<int:pk>/restore/', advanced_views.BackupRestoreView.as_view(), name='backup_restore'),
    
    # جدولة النسخ الاحتياطية
    path('backup/schedules/', advanced_views.BackupScheduleListView.as_view(), name='backup_schedules'),
    path('backup/schedules/create/', advanced_views.BackupScheduleCreateView.as_view(), name='backup_schedule_create'),
    
    # ==================== نظام تحسين الأداء ====================
    
    # لوحة تحكم الأداء
    path('performance/', advanced_views.PerformanceDashboardView.as_view(), name='performance_dashboard'),
    path('performance/analytics/', advanced_views.PerformanceAnalyticsView.as_view(), name='performance_analytics'),
    
    # الاستعلامات البطيئة
    path('performance/slow-queries/', advanced_views.SlowQueriesView.as_view(), name='slow_queries'),
    
    # العروض المادية
    path('performance/materialized-views/', advanced_views.MaterializedViewsView.as_view(), name='materialized_views'),
    path('performance/materialized-views/create/', advanced_views.MaterializedViewCreateView.as_view(), name='materialized_view_create'),
    
    # تحسينات الأداء
    path('performance/optimizations/', advanced_views.PerformanceOptimizationsView.as_view(), name='performance_optimizations'),
    
    # ==================== API Endpoints ====================
    
    # API الإشعارات
    path('api/notifications/', advanced_views.get_notifications_api, name='api_notifications'),
    path('api/notifications/<int:notification_id>/read/', advanced_views.mark_notification_read_api, name='api_notification_read'),
    
    # API التقارير
    path('api/reports/<int:report_id>/execute/', advanced_views.execute_report_api, name='api_report_execute'),
    
    # API النسخ الاحتياطية
    path('api/backup/create/', advanced_views.create_backup_api, name='api_backup_create'),
    
    # API الأداء
    path('api/performance/metrics/', advanced_views.get_performance_metrics_api, name='api_performance_metrics'),
    path('api/performance/optimize/', advanced_views.optimize_database_api, name='api_performance_optimize'),
]