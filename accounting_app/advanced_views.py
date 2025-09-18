"""
الصفحات الفرعية المتقدمة
Advanced Sub-pages Views

يحتوي على:
- نظام الإشعارات المتقدم
- نظام التقارير المتقدم
- نظام النسخ الاحتياطية
- نظام تحسين الأداء
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.http import JsonResponse, HttpResponse, Http404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q, Count, Sum, Avg
from django.core.files.storage import default_storage
from django.conf import settings
from datetime import datetime, timedelta
import json
import logging

from .models import (
    Customer, Unit, Partner, Contract, Installment, Safe, Voucher, Broker,
    PartnerDebt, BrokerDue, PartnerGroup, UnitPartner, PartnerGroupPartner,
    UnitPartnerGroup, AuditLog, Settings, KeyVal, Transfer, Notification
)
from .notification_system import (
    NotificationService, NotificationTemplate, NotificationRule, 
    NotificationGroup, AdvancedNotification, NotificationDelivery,
    NotificationPreference, NotificationAnalytics
)
from .reports_system import (
    ReportBuilder, ReportTemplate, ReportDefinition, ReportExecution,
    ReportSchedule, create_financial_report_template, create_contracts_report_template,
    create_partners_report_template
)
from .backup_system import (
    BackupService, BackupSchedule, BackupExecution, BackupRestore,
    BackupStorage, create_daily_backup_schedule, create_weekly_backup_schedule
)
from .performance_system import (
    PerformanceService, PerformanceMeasurement, SlowQuery, MaterializedView,
    DatabaseIndex, PerformanceOptimization, PerformanceThreshold
)

logger = logging.getLogger(__name__)


# ==================== نظام الإشعارات ====================

class NotificationDashboardView(LoginRequiredMixin, ListView):
    """لوحة تحكم الإشعارات"""
    model = AdvancedNotification
    template_name = 'accounting_app/notifications/dashboard.html'
    context_object_name = 'notifications'
    paginate_by = 20
    
    def get_queryset(self):
        return AdvancedNotification.objects.filter(
            recipients__contains=[self.request.user.email]
        ).order_by('-created_at')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # إحصائيات الإشعارات
        service = NotificationService()
        context['unread_count'] = self.get_queryset().filter(
            status__in=['pending', 'sent', 'delivered']
        ).count()
        
        context['recent_notifications'] = self.get_queryset()[:10]
        
        # إحصائيات حسب الفئة
        context['category_stats'] = self.get_queryset().values('category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return context


class NotificationDetailView(LoginRequiredMixin, DetailView):
    """تفاصيل الإشعار"""
    model = AdvancedNotification
    template_name = 'accounting_app/notifications/detail.html'
    context_object_name = 'notification'
    
    def get_object(self):
        obj = super().get_object()
        # تحديث حالة الإشعار كمقروء
        service = NotificationService()
        service.mark_as_read(obj.id, self.request.user)
        return obj


class NotificationTemplateListView(LoginRequiredMixin, ListView):
    """قائمة قوالب الإشعارات"""
    model = NotificationTemplate
    template_name = 'accounting_app/notifications/templates.html'
    context_object_name = 'templates'
    paginate_by = 20


class NotificationTemplateCreateView(LoginRequiredMixin, CreateView):
    """إنشاء قالب إشعار"""
    model = NotificationTemplate
    template_name = 'accounting_app/notifications/template_form.html'
    fields = ['name', 'category', 'channels', 'subject_template', 'message_template', 'html_template', 'variables']
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class NotificationRuleListView(LoginRequiredMixin, ListView):
    """قائمة قواعد الإشعارات"""
    model = NotificationRule
    template_name = 'accounting_app/notifications/rules.html'
    context_object_name = 'rules'
    paginate_by = 20


class NotificationAnalyticsView(LoginRequiredMixin, ListView):
    """تحليلات الإشعارات"""
    model = NotificationAnalytics
    template_name = 'accounting_app/notifications/analytics.html'
    context_object_name = 'analytics'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # تحليلات الإشعارات
        service = NotificationService()
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        else:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
        
        context['analytics_data'] = service.get_analytics(start_date, end_date)
        context['start_date'] = start_date
        context['end_date'] = end_date
        
        return context


# ==================== نظام التقارير ====================

class ReportsDashboardView(LoginRequiredMixin, ListView):
    """لوحة تحكم التقارير"""
    model = ReportDefinition
    template_name = 'accounting_app/reports/dashboard.html'
    context_object_name = 'reports'
    paginate_by = 20
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # إحصائيات التقارير
        context['total_reports'] = ReportDefinition.objects.count()
        context['recent_executions'] = ReportExecution.objects.filter(
            executed_by=self.request.user
        ).order_by('-created_at')[:10]
        
        # التقارير المجدولة
        context['scheduled_reports'] = ReportSchedule.objects.filter(is_active=True)
        
        return context


class ReportBuilderView(LoginRequiredMixin, CreateView):
    """منشئ التقارير"""
    model = ReportDefinition
    template_name = 'accounting_app/reports/builder.html'
    fields = ['name', 'description', 'category', 'template', 'parameters', 'filters', 'sorting', 'grouping', 'calculations', 'charts', 'formatting']
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['templates'] = ReportTemplate.objects.filter(is_active=True)
        return context
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class ReportExecutionView(LoginRequiredMixin, DetailView):
    """تنفيذ التقرير"""
    model = ReportExecution
    template_name = 'accounting_app/reports/execution.html'
    context_object_name = 'execution'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # بيانات التقرير إذا كان مكتملاً
        if self.object.status == 'completed' and self.object.file_path:
            context['file_url'] = default_storage.url(self.object.file_path)
            context['file_size_mb'] = self.object.file_size / (1024 * 1024)
        
        return context


class ReportScheduleListView(LoginRequiredMixin, ListView):
    """قائمة التقارير المجدولة"""
    model = ReportSchedule
    template_name = 'accounting_app/reports/schedules.html'
    context_object_name = 'schedules'
    paginate_by = 20


class ReportScheduleCreateView(LoginRequiredMixin, CreateView):
    """إنشاء جدولة تقرير"""
    model = ReportSchedule
    template_name = 'accounting_app/reports/schedule_form.html'
    fields = ['name', 'description', 'report_definition', 'schedule_type', 'schedule_config', 'recipients', 'formats']
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['report_definitions'] = ReportDefinition.objects.filter(is_active=True)
        return context
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


# ==================== نظام النسخ الاحتياطية ====================

class BackupDashboardView(LoginRequiredMixin, ListView):
    """لوحة تحكم النسخ الاحتياطية"""
    model = BackupExecution
    template_name = 'accounting_app/backup/dashboard.html'
    context_object_name = 'backups'
    paginate_by = 20
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # إحصائيات النسخ الاحتياطية
        service = BackupService()
        context['backup_status'] = service.get_backup_status()
        
        # الجداول المجدولة
        context['schedules'] = BackupSchedule.objects.filter(is_active=True)
        
        # النسخ الاحتياطية الأخيرة
        context['recent_backups'] = BackupExecution.objects.order_by('-created_at')[:10]
        
        return context


class BackupScheduleListView(LoginRequiredMixin, ListView):
    """قائمة جدولة النسخ الاحتياطية"""
    model = BackupSchedule
    template_name = 'accounting_app/backup/schedules.html'
    context_object_name = 'schedules'
    paginate_by = 20


class BackupScheduleCreateView(LoginRequiredMixin, CreateView):
    """إنشاء جدولة نسخة احتياطية"""
    model = BackupSchedule
    template_name = 'accounting_app/backup/schedule_form.html'
    fields = ['name', 'description', 'backup_type', 'schedule_type', 'schedule_config', 'retention_days', 'compression', 'encryption', 'include_media', 'include_static']
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)


class BackupExecutionDetailView(LoginRequiredMixin, DetailView):
    """تفاصيل تنفيذ النسخة الاحتياطية"""
    model = BackupExecution
    template_name = 'accounting_app/backup/execution_detail.html'
    context_object_name = 'execution'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # معلومات الملف
        if self.object.file_path and default_storage.exists(self.object.file_path):
            context['file_url'] = default_storage.url(self.object.file_path)
            context['file_size_mb'] = self.object.file_size / (1024 * 1024)
        
        return context


class BackupRestoreView(LoginRequiredMixin, DetailView):
    """استعادة نسخة احتياطية"""
    model = BackupExecution
    template_name = 'accounting_app/backup/restore.html'
    context_object_name = 'execution'
    
    def post(self, request, *args, **kwargs):
        execution = self.get_object()
        
        if execution.status != 'completed':
            messages.error(request, 'لا يمكن استعادة نسخة احتياطية غير مكتملة')
            return redirect('backup_execution_detail', pk=execution.pk)
        
        service = BackupService()
        restore = service.restore_backup(execution, restored_by=request.user)
        
        if restore.status == 'completed':
            messages.success(request, 'تم استعادة النسخة الاحتياطية بنجاح')
        else:
            messages.error(request, f'فشل في استعادة النسخة الاحتياطية: {restore.error_message}')
        
        return redirect('backup_execution_detail', pk=execution.pk)


# ==================== نظام تحسين الأداء ====================

class PerformanceDashboardView(LoginRequiredMixin, ListView):
    """لوحة تحكم الأداء"""
    model = PerformanceMeasurement
    template_name = 'accounting_app/performance/dashboard.html'
    context_object_name = 'measurements'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # بيانات لوحة التحكم
        service = PerformanceService()
        context['dashboard_data'] = service.get_performance_dashboard_data()
        
        # المقاييس الأخيرة
        context['recent_metrics'] = PerformanceMeasurement.objects.order_by('-timestamp')[:20]
        
        # الاستعلامات البطيئة
        context['slow_queries'] = SlowQuery.objects.order_by('-execution_time')[:10]
        
        # العروض المادية
        context['materialized_views'] = MaterializedView.objects.filter(is_active=True)
        
        return context


class PerformanceAnalyticsView(LoginRequiredMixin, ListView):
    """تحليلات الأداء"""
    model = PerformanceMeasurement
    template_name = 'accounting_app/performance/analytics.html'
    context_object_name = 'measurements'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # تحليل قاعدة البيانات
        service = PerformanceService()
        context['database_analysis'] = service.analyze_database_performance()
        
        # المقاييس حسب النوع
        context['metrics_by_type'] = PerformanceMeasurement.objects.values('metric').annotate(
            avg_value=Avg('value'),
            max_value=models.Max('value'),
            min_value=models.Min('value'),
            count=Count('id')
        ).order_by('-count')
        
        return context


class SlowQueriesView(LoginRequiredMixin, ListView):
    """الاستعلامات البطيئة"""
    model = SlowQuery
    template_name = 'accounting_app/performance/slow_queries.html'
    context_object_name = 'slow_queries'
    paginate_by = 20
    
    def get_queryset(self):
        return SlowQuery.objects.order_by('-execution_time')


class MaterializedViewsView(LoginRequiredMixin, ListView):
    """العروض المادية"""
    model = MaterializedView
    template_name = 'accounting_app/performance/materialized_views.html'
    context_object_name = 'materialized_views'
    paginate_by = 20


class MaterializedViewCreateView(LoginRequiredMixin, CreateView):
    """إنشاء عرض مادي"""
    model = MaterializedView
    template_name = 'accounting_app/performance/materialized_view_form.html'
    fields = ['name', 'description', 'query', 'refresh_interval']
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        
        # إنشاء العرض المادي
        service = PerformanceService()
        try:
            materialized_view = service.create_materialized_view(
                name=form.instance.name,
                query=form.instance.query,
                description=form.instance.description,
                refresh_interval=form.instance.refresh_interval,
                created_by=self.request.user
            )
            messages.success(self.request, 'تم إنشاء العرض المادي بنجاح')
            return redirect('materialized_views')
        except Exception as e:
            messages.error(self.request, f'فشل في إنشاء العرض المادي: {str(e)}')
            return self.form_invalid(form)


class PerformanceOptimizationsView(LoginRequiredMixin, ListView):
    """تحسينات الأداء"""
    model = PerformanceOptimization
    template_name = 'accounting_app/performance/optimizations.html'
    context_object_name = 'optimizations'
    paginate_by = 20


# ==================== API Views ====================

def get_notifications_api(request):
    """API للحصول على الإشعارات"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'غير مصرح'}, status=401)
    
    service = NotificationService()
    notifications = service.get_user_notifications(request.user, limit=50)
    
    return JsonResponse({
        'notifications': notifications,
        'unread_count': len([n for n in notifications if n['status'] in ['sent', 'delivered']])
    })


def mark_notification_read_api(request, notification_id):
    """API لتحديد الإشعار كمقروء"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'غير مصرح'}, status=401)
    
    service = NotificationService()
    success = service.mark_as_read(notification_id, request.user)
    
    return JsonResponse({'success': success})


def execute_report_api(request, report_id):
    """API لتنفيذ تقرير"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'غير مصرح'}, status=401)
    
    try:
        report_definition = get_object_or_404(ReportDefinition, id=report_id)
        
        # الحصول على المعاملات من الطلب
        parameters = json.loads(request.body) if request.body else {}
        
        # تنفيذ التقرير
        builder = ReportBuilder()
        execution = builder.execute_report(
            report_definition=report_definition,
            parameters=parameters,
            executed_by=request.user
        )
        
        return JsonResponse({
            'success': True,
            'execution_id': execution.id,
            'status': execution.status
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def create_backup_api(request):
    """API لإنشاء نسخة احتياطية"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'غير مصرح'}, status=401)
    
    try:
        schedule_id = request.POST.get('schedule_id')
        schedule = get_object_or_404(BackupSchedule, id=schedule_id)
        
        service = BackupService()
        execution = service.create_backup(schedule, executed_by=request.user)
        
        return JsonResponse({
            'success': True,
            'execution_id': execution.id,
            'status': execution.status
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_performance_metrics_api(request):
    """API للحصول على مقاييس الأداء"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'غير مصرح'}, status=401)
    
    service = PerformanceService()
    dashboard_data = service.get_performance_dashboard_data()
    
    return JsonResponse(dashboard_data)


def optimize_database_api(request):
    """API لتحسين قاعدة البيانات"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'غير مصرح'}, status=401)
    
    try:
        service = PerformanceService()
        optimizations = service.optimize_database()
        
        return JsonResponse({
            'success': True,
            'optimizations_count': len(optimizations),
            'optimizations': [
                {
                    'id': opt.id,
                    'name': opt.name,
                    'type': opt.optimization_type,
                    'improvement': opt.improvement_percentage
                }
                for opt in optimizations
            ]
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)