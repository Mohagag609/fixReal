from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
import json

from .models import Notification, NotificationCategory, NotificationTemplate, NotificationSchedule, NotificationSettings


class NotificationService:
    """Service for managing notifications"""
    
    @staticmethod
    def create_notification(user, category_name, title, message, priority='MEDIUM', action_url=None, action_text=None, expires_at=None):
        """Create a new notification"""
        try:
            category = NotificationCategory.objects.get(name=category_name, is_active=True)
        except NotificationCategory.DoesNotExist:
            # Create default category if it doesn't exist
            category = NotificationCategory.objects.create(
                name=category_name,
                description=f'Default category for {category_name}'
            )
        
        notification = Notification.objects.create(
            user=user,
            category=category,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
            action_text=action_text,
            expires_at=expires_at
        )
        
        # Send email if enabled
        NotificationService._send_email_notification(notification)
        
        return notification
    
    @staticmethod
    def create_bulk_notifications(users, category_name, title, message, priority='MEDIUM', action_url=None, action_text=None):
        """Create notifications for multiple users"""
        try:
            category = NotificationCategory.objects.get(name=category_name, is_active=True)
        except NotificationCategory.DoesNotExist:
            category = NotificationCategory.objects.create(
                name=category_name,
                description=f'Default category for {category_name}'
            )
        
        notifications = []
        for user in users:
            notification = Notification.objects.create(
                user=user,
                category=category,
                title=title,
                message=message,
                priority=priority,
                action_url=action_url,
                action_text=action_text
            )
            notifications.append(notification)
        
        return notifications
    
    @staticmethod
    def create_from_template(template_name, user, context_data=None):
        """Create notification from template"""
        try:
            template = NotificationTemplate.objects.get(name=template_name, is_active=True)
        except NotificationTemplate.DoesNotExist:
            return None
        
        if context_data is None:
            context_data = {}
        
        # Render template with context
        title = template.title_template.format(**context_data)
        message = template.message_template.format(**context_data)
        
        notification = Notification.objects.create(
            user=user,
            category=template.category,
            title=title,
            message=message,
            priority=template.priority
        )
        
        return notification
    
    @staticmethod
    def schedule_notification(template_name, user, scheduled_at, context_data=None):
        """Schedule a notification for later delivery"""
        try:
            template = NotificationTemplate.objects.get(name=template_name, is_active=True)
        except NotificationTemplate.DoesNotExist:
            return None
        
        if context_data is None:
            context_data = {}
        
        schedule = NotificationSchedule.objects.create(
            template=template,
            user=user,
            scheduled_at=scheduled_at,
            context_data=context_data
        )
        
        return schedule
    
    @staticmethod
    def process_scheduled_notifications():
        """Process scheduled notifications that are due"""
        now = timezone.now()
        due_schedules = NotificationSchedule.objects.filter(
            scheduled_at__lte=now,
            is_sent=False
        )
        
        processed_count = 0
        for schedule in due_schedules:
            # Check if user has notifications enabled for this category
            settings = NotificationSettings.objects.filter(user=schedule.user).first()
            if settings and not settings.category_preferences.get(str(schedule.template.category.id), True):
                continue
            
            # Create notification
            NotificationService.create_from_template(
                schedule.template.name,
                schedule.user,
                schedule.context_data
            )
            
            # Mark as sent
            schedule.is_sent = True
            schedule.sent_at = now
            schedule.save()
            
            processed_count += 1
        
        return processed_count
    
    @staticmethod
    def cleanup_expired_notifications():
        """Remove expired notifications"""
        now = timezone.now()
        expired_notifications = Notification.objects.filter(
            expires_at__lt=now,
            status__in=['UNREAD', 'READ']
        )
        
        count = expired_notifications.count()
        expired_notifications.delete()
        
        return count
    
    @staticmethod
    def cleanup_old_notifications(days=30):
        """Remove old notifications"""
        cutoff_date = timezone.now() - timedelta(days=days)
        old_notifications = Notification.objects.filter(
            created_at__lt=cutoff_date,
            status='ARCHIVED'
        )
        
        count = old_notifications.count()
        old_notifications.delete()
        
        return count
    
    @staticmethod
    def get_user_notifications(user, status=None, category=None, priority=None, limit=None):
        """Get user notifications with filters"""
        queryset = Notification.objects.filter(user=user)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if category:
            queryset = queryset.filter(category=category)
        
        if priority:
            queryset = queryset.filter(priority=priority)
        
        queryset = queryset.order_by('-created_at')
        
        if limit:
            queryset = queryset[:limit]
        
        return queryset
    
    @staticmethod
    def get_unread_count(user):
        """Get unread notification count for user"""
        return Notification.objects.filter(
            user=user,
            status='UNREAD'
        ).count()
    
    @staticmethod
    def mark_all_read(user):
        """Mark all notifications as read for user"""
        return Notification.objects.filter(
            user=user,
            status='UNREAD'
        ).update(status='READ', read_at=timezone.now())
    
    @staticmethod
    def _send_email_notification(notification):
        """Send email notification if enabled"""
        try:
            settings = NotificationSettings.objects.get(user=notification.user)
            if not settings.email_enabled:
                return
        except NotificationSettings.DoesNotExist:
            pass  # Send by default if no settings
        
        # Check quiet hours
        if hasattr(settings, 'quiet_hours_enabled') and settings.quiet_hours_enabled:
            now = timezone.now().time()
            if settings.quiet_hours_start and settings.quiet_hours_end:
                if settings.quiet_hours_start <= now <= settings.quiet_hours_end:
                    return
        
        # Send email
        subject = f"[{notification.category.name}] {notification.title}"
        message = notification.message
        
        if notification.action_url:
            message += f"\n\nAction: {notification.action_url}"
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            fail_silently=True
        )
    
    @staticmethod
    def create_system_notification(user, title, message, priority='MEDIUM'):
        """Create system notification"""
        return NotificationService.create_notification(
            user=user,
            category_name='System',
            title=title,
            message=message,
            priority=priority
        )
    
    @staticmethod
    def create_invoice_notification(user, invoice):
        """Create invoice notification"""
        title = f"New Invoice: {invoice.invoice_number}"
        message = f"Invoice {invoice.invoice_number} for {invoice.customer.name} has been created. Amount: ${invoice.total_amount}"
        
        return NotificationService.create_notification(
            user=user,
            category_name='Invoices',
            title=title,
            message=message,
            priority='MEDIUM',
            action_url=f"/accounting/invoices/{invoice.id}/",
            action_text="View Invoice"
        )
    
    @staticmethod
    def create_payment_notification(user, payment):
        """Create payment notification"""
        title = f"Payment Received: ${payment.amount}"
        message = f"Payment of ${payment.amount} has been received on {payment.payment_date}"
        
        return NotificationService.create_notification(
            user=user,
            category_name='Payments',
            title=title,
            message=message,
            priority='LOW',
            action_url=f"/accounting/payments/{payment.id}/",
            action_text="View Payment"
        )
    
    @staticmethod
    def create_overdue_notification(user, invoice):
        """Create overdue invoice notification"""
        title = f"Overdue Invoice: {invoice.invoice_number}"
        message = f"Invoice {invoice.invoice_number} for {invoice.customer.name} is overdue. Amount: ${invoice.total_amount}"
        
        return NotificationService.create_notification(
            user=user,
            category_name='Overdue',
            title=title,
            message=message,
            priority='HIGH',
            action_url=f"/accounting/invoices/{invoice.id}/",
            action_text="View Invoice"
        )