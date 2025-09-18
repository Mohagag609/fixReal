from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView, TemplateView
from django.http import JsonResponse
from django.contrib import messages
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q
from datetime import datetime, timedelta

from .models import Notification, NotificationCategory, NotificationSettings
from .services import NotificationService


class NotificationsListView(LoginRequiredMixin, ListView):
    """List user notifications"""
    model = Notification
    template_name = 'notifications/list.html'
    context_object_name = 'notifications'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        
        # Filter by status
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by category
        category_id = self.request.GET.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by priority
        priority = self.request.GET.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Search
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(message__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = NotificationCategory.objects.filter(is_active=True)
        context['status_choices'] = Notification.STATUS_CHOICES
        context['priority_choices'] = Notification.PRIORITY_CHOICES
        
        # Get unread count
        context['unread_count'] = Notification.objects.filter(
            user=self.request.user,
            status='UNREAD'
        ).count()
        
        return context


class NotificationDetailView(LoginRequiredMixin, DetailView):
    """Notification detail view"""
    model = Notification
    template_name = 'notifications/detail.html'
    context_object_name = 'notification'
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def get(self, request, *args, **kwargs):
        notification = self.get_object()
        # Mark as read when viewed
        notification.mark_as_read()
        return super().get(request, *args, **kwargs)


class NotificationSettingsView(LoginRequiredMixin, TemplateView):
    """User notification settings"""
    template_name = 'notifications/settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get or create user settings
        settings, created = NotificationSettings.objects.get_or_create(
            user=self.request.user
        )
        
        context['settings'] = settings
        context['categories'] = NotificationCategory.objects.filter(is_active=True)
        
        return context
    
    def post(self, request, *args, **kwargs):
        settings, created = NotificationSettings.objects.get_or_create(
            user=request.user
        )
        
        # Update settings
        settings.email_enabled = request.POST.get('email_enabled') == 'on'
        settings.email_frequency = request.POST.get('email_frequency', 'IMMEDIATE')
        settings.push_enabled = request.POST.get('push_enabled') == 'on'
        settings.quiet_hours_enabled = request.POST.get('quiet_hours_enabled') == 'on'
        
        if settings.quiet_hours_enabled:
            settings.quiet_hours_start = request.POST.get('quiet_hours_start')
            settings.quiet_hours_end = request.POST.get('quiet_hours_end')
        
        # Update category preferences
        category_preferences = {}
        for category in NotificationCategory.objects.filter(is_active=True):
            enabled = request.POST.get(f'category_{category.id}') == 'on'
            category_preferences[str(category.id)] = enabled
        
        settings.category_preferences = category_preferences
        settings.save()
        
        messages.success(request, 'Notification settings updated successfully')
        return self.get(request, *args, **kwargs)


class NotificationDashboardView(LoginRequiredMixin, TemplateView):
    """Notification dashboard with statistics"""
    template_name = 'notifications/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user = self.request.user
        now = timezone.now()
        
        # Get notification statistics
        total_notifications = Notification.objects.filter(user=user).count()
        unread_notifications = Notification.objects.filter(
            user=user, status='UNREAD'
        ).count()
        
        # Recent notifications
        recent_notifications = Notification.objects.filter(
            user=user
        ).order_by('-created_at')[:10]
        
        # Notifications by category
        category_stats = []
        for category in NotificationCategory.objects.filter(is_active=True):
            count = Notification.objects.filter(
                user=user, category=category
            ).count()
            if count > 0:
                category_stats.append({
                    'category': category,
                    'count': count
                })
        
        # Notifications by priority
        priority_stats = []
        for priority, label in Notification.PRIORITY_CHOICES:
            count = Notification.objects.filter(
                user=user, priority=priority
            ).count()
            if count > 0:
                priority_stats.append({
                    'priority': priority,
                    'label': label,
                    'count': count
                })
        
        context.update({
            'total_notifications': total_notifications,
            'unread_notifications': unread_notifications,
            'recent_notifications': recent_notifications,
            'category_stats': category_stats,
            'priority_stats': priority_stats,
        })
        
        return context


# AJAX endpoints
def mark_notification_read(request, notification_id):
    """Mark notification as read via AJAX"""
    try:
        notification = Notification.objects.get(
            id=notification_id, user=request.user
        )
        notification.mark_as_read()
        return JsonResponse({'success': True})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Notification not found'}, status=404)


def mark_all_read(request):
    """Mark all notifications as read via AJAX"""
    Notification.objects.filter(
        user=request.user, status='UNREAD'
    ).update(status='READ', read_at=timezone.now())
    
    return JsonResponse({'success': True})


def archive_notification(request, notification_id):
    """Archive notification via AJAX"""
    try:
        notification = Notification.objects.get(
            id=notification_id, user=request.user
        )
        notification.mark_as_archived()
        return JsonResponse({'success': True})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Notification not found'}, status=404)


def delete_notification(request, notification_id):
    """Delete notification via AJAX"""
    try:
        notification = Notification.objects.get(
            id=notification_id, user=request.user
        )
        notification.delete()
        return JsonResponse({'success': True})
    except Notification.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Notification not found'}, status=404)


def get_unread_count(request):
    """Get unread notification count via AJAX"""
    count = Notification.objects.filter(
        user=request.user, status='UNREAD'
    ).count()
    
    return JsonResponse({'count': count})


def get_recent_notifications(request):
    """Get recent notifications via AJAX"""
    limit = int(request.GET.get('limit', 5))
    
    notifications = Notification.objects.filter(
        user=request.user
    ).order_by('-created_at')[:limit]
    
    data = []
    for notification in notifications:
        data.append({
            'id': str(notification.id),
            'title': notification.title,
            'message': notification.message[:100] + '...' if len(notification.message) > 100 else notification.message,
            'category': notification.category.name,
            'priority': notification.priority,
            'status': notification.status,
            'created_at': notification.created_at.isoformat(),
            'action_url': notification.action_url,
            'action_text': notification.action_text,
        })
    
    return JsonResponse({'notifications': data})


def create_notification(request):
    """Create notification via AJAX (for testing)"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST method required'}, status=405)
    
    title = request.POST.get('title')
    message = request.POST.get('message')
    category_id = request.POST.get('category_id')
    priority = request.POST.get('priority', 'MEDIUM')
    
    if not all([title, message, category_id]):
        return JsonResponse({'success': False, 'error': 'Missing required fields'}, status=400)
    
    try:
        category = NotificationCategory.objects.get(id=category_id)
        notification = Notification.objects.create(
            user=request.user,
            category=category,
            title=title,
            message=message,
            priority=priority
        )
        
        return JsonResponse({
            'success': True,
            'notification_id': str(notification.id)
        })
    except NotificationCategory.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invalid category'}, status=400)