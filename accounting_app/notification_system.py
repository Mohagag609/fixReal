"""
نظام الإشعارات الاحترافي الشامل
Professional Notification System

يحتوي على:
- إشعارات فورية (Real-time)
- إشعارات مجدولة (Scheduled)
- إشعارات متعددة القنوات (Multi-channel)
- نظام أولويات متقدم
- تجميع الإشعارات
- إحصائيات وتحليلات
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q, Count, Avg
from datetime import datetime, timedelta
import json
import logging
from typing import List, Dict, Optional, Any
from enum import Enum

logger = logging.getLogger(__name__)


class NotificationPriority(models.TextChoices):
    """أولويات الإشعارات"""
    LOW = 'low', 'منخفضة'
    NORMAL = 'normal', 'عادية'
    HIGH = 'high', 'عالية'
    URGENT = 'urgent', 'عاجلة'
    CRITICAL = 'critical', 'حرجة'


class NotificationChannel(models.TextChoices):
    """قنوات الإشعارات"""
    IN_APP = 'in_app', 'داخل التطبيق'
    EMAIL = 'email', 'البريد الإلكتروني'
    SMS = 'sms', 'الرسائل النصية'
    PUSH = 'push', 'الإشعارات الفورية'
    WEBHOOK = 'webhook', 'Webhook'
    SLACK = 'slack', 'Slack'
    TELEGRAM = 'telegram', 'Telegram'


class NotificationStatus(models.TextChoices):
    """حالات الإشعارات"""
    PENDING = 'pending', 'في الانتظار'
    SENT = 'sent', 'تم الإرسال'
    DELIVERED = 'delivered', 'تم التسليم'
    READ = 'read', 'تم القراءة'
    FAILED = 'failed', 'فشل الإرسال'
    CANCELLED = 'cancelled', 'ملغي'


class NotificationCategory(models.TextChoices):
    """فئات الإشعارات"""
    SYSTEM = 'system', 'النظام'
    FINANCIAL = 'financial', 'مالية'
    CONTRACT = 'contract', 'عقود'
    PAYMENT = 'payment', 'مدفوعات'
    REMINDER = 'reminder', 'تذكيرات'
    ALERT = 'alert', 'تنبيهات'
    REPORT = 'report', 'تقارير'
    BACKUP = 'backup', 'نسخ احتياطية'
    SECURITY = 'security', 'أمان'
    MAINTENANCE = 'maintenance', 'صيانة'


class NotificationTemplate(models.Model):
    """قوالب الإشعارات"""
    name = models.CharField(max_length=255, verbose_name="اسم القالب")
    category = models.CharField(max_length=50, choices=NotificationCategory.choices, verbose_name="الفئة")
    channels = models.JSONField(default=list, verbose_name="القنوات")
    subject_template = models.CharField(max_length=500, verbose_name="قالب العنوان")
    message_template = models.TextField(verbose_name="قالب الرسالة")
    html_template = models.TextField(blank=True, null=True, verbose_name="قالب HTML")
    variables = models.JSONField(default=dict, verbose_name="المتغيرات")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        verbose_name = "قالب الإشعار"
        verbose_name_plural = "قوالب الإشعارات"

    def __str__(self):
        return self.name


class NotificationRule(models.Model):
    """قواعد الإشعارات"""
    name = models.CharField(max_length=255, verbose_name="اسم القاعدة")
    category = models.CharField(max_length=50, choices=NotificationCategory.choices, verbose_name="الفئة")
    trigger_event = models.CharField(max_length=100, verbose_name="حدث التفعيل")
    conditions = models.JSONField(default=dict, verbose_name="الشروط")
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE, verbose_name="القالب")
    priority = models.CharField(max_length=20, choices=NotificationPriority.choices, default=NotificationPriority.NORMAL, verbose_name="الأولوية")
    channels = models.JSONField(default=list, verbose_name="القنوات")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "قاعدة الإشعار"
        verbose_name_plural = "قواعد الإشعارات"

    def __str__(self):
        return self.name


class NotificationGroup(models.Model):
    """مجموعات الإشعارات"""
    name = models.CharField(max_length=255, verbose_name="اسم المجموعة")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف")
    users = models.ManyToManyField(User, blank=True, verbose_name="المستخدمون")
    email_list = models.JSONField(default=list, verbose_name="قائمة البريد الإلكتروني")
    phone_list = models.JSONField(default=list, verbose_name="قائمة الهواتف")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "مجموعة الإشعارات"
        verbose_name_plural = "مجموعات الإشعارات"

    def __str__(self):
        return self.name


class AdvancedNotification(models.Model):
    """الإشعارات المتقدمة"""
    title = models.CharField(max_length=500, verbose_name="العنوان")
    message = models.TextField(verbose_name="الرسالة")
    category = models.CharField(max_length=50, choices=NotificationCategory.choices, verbose_name="الفئة")
    priority = models.CharField(max_length=20, choices=NotificationPriority.choices, default=NotificationPriority.NORMAL, verbose_name="الأولوية")
    channels = models.JSONField(default=list, verbose_name="القنوات")
    recipients = models.JSONField(default=list, verbose_name="المستقبلون")
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="القالب")
    template_variables = models.JSONField(default=dict, verbose_name="متغيرات القالب")
    
    # التوقيت
    scheduled_at = models.DateTimeField(null=True, blank=True, verbose_name="موعد الإرسال")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الانتهاء")
    
    # الحالة
    status = models.CharField(max_length=20, choices=NotificationStatus.choices, default=NotificationStatus.PENDING, verbose_name="الحالة")
    
    # الإعدادات
    is_urgent = models.BooleanField(default=False, verbose_name="عاجل")
    requires_acknowledgment = models.BooleanField(default=False, verbose_name="يتطلب إقرار")
    auto_archive = models.BooleanField(default=True, verbose_name="أرشفة تلقائية")
    group_notifications = models.BooleanField(default=False, verbose_name="تجميع الإشعارات")
    
    # البيانات الإضافية
    metadata = models.JSONField(default=dict, verbose_name="البيانات الإضافية")
    action_url = models.URLField(blank=True, null=True, verbose_name="رابط الإجراء")
    action_text = models.CharField(max_length=100, blank=True, null=True, verbose_name="نص الإجراء")
    
    # الإحصائيات
    sent_count = models.PositiveIntegerField(default=0, verbose_name="عدد المرسل")
    delivered_count = models.PositiveIntegerField(default=0, verbose_name="عدد المسلم")
    read_count = models.PositiveIntegerField(default=0, verbose_name="عدد المقروء")
    failed_count = models.PositiveIntegerField(default=0, verbose_name="عدد الفاشل")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        verbose_name = "إشعار متقدم"
        verbose_name_plural = "الإشعارات المتقدمة"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'scheduled_at']),
            models.Index(fields=['category', 'priority']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.get_priority_display()}"

    def is_expired(self):
        """فحص انتهاء صلاحية الإشعار"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    def is_scheduled(self):
        """فحص إذا كان الإشعار مجدول"""
        return self.scheduled_at and self.scheduled_at > timezone.now()

    def get_priority_score(self):
        """حساب نقاط الأولوية"""
        priority_scores = {
            NotificationPriority.LOW: 1,
            NotificationPriority.NORMAL: 2,
            NotificationPriority.HIGH: 3,
            NotificationPriority.URGENT: 4,
            NotificationPriority.CRITICAL: 5,
        }
        base_score = priority_scores.get(self.priority, 2)
        if self.is_urgent:
            base_score += 2
        if self.requires_acknowledgment:
            base_score += 1
        return base_score


class NotificationDelivery(models.Model):
    """تسليم الإشعارات"""
    notification = models.ForeignKey(AdvancedNotification, on_delete=models.CASCADE, related_name='deliveries', verbose_name="الإشعار")
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices, verbose_name="القناة")
    recipient = models.CharField(max_length=255, verbose_name="المستقبل")
    status = models.CharField(max_length=20, choices=NotificationStatus.choices, default=NotificationStatus.PENDING, verbose_name="الحالة")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت الإرسال")
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت التسليم")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت القراءة")
    error_message = models.TextField(blank=True, null=True, verbose_name="رسالة الخطأ")
    metadata = models.JSONField(default=dict, verbose_name="البيانات الإضافية")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "تسليم الإشعار"
        verbose_name_plural = "تسليم الإشعارات"
        unique_together = ['notification', 'channel', 'recipient']

    def __str__(self):
        return f"{self.notification.title} - {self.get_channel_display()} - {self.recipient}"


class NotificationPreference(models.Model):
    """تفضيلات الإشعارات للمستخدمين"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name="المستخدم")
    categories = models.JSONField(default=dict, verbose_name="تفضيلات الفئات")
    channels = models.JSONField(default=dict, verbose_name="تفضيلات القنوات")
    quiet_hours_start = models.TimeField(null=True, blank=True, verbose_name="بداية ساعات الهدوء")
    quiet_hours_end = models.TimeField(null=True, blank=True, verbose_name="نهاية ساعات الهدوء")
    timezone = models.CharField(max_length=50, default='UTC', verbose_name="المنطقة الزمنية")
    language = models.CharField(max_length=10, default='ar', verbose_name="اللغة")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        verbose_name = "تفضيل الإشعار"
        verbose_name_plural = "تفضيلات الإشعارات"

    def __str__(self):
        return f"تفضيلات {self.user.username}"


class NotificationAnalytics(models.Model):
    """تحليلات الإشعارات"""
    date = models.DateField(verbose_name="التاريخ")
    category = models.CharField(max_length=50, choices=NotificationCategory.choices, verbose_name="الفئة")
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices, verbose_name="القناة")
    sent_count = models.PositiveIntegerField(default=0, verbose_name="عدد المرسل")
    delivered_count = models.PositiveIntegerField(default=0, verbose_name="عدد المسلم")
    read_count = models.PositiveIntegerField(default=0, verbose_name="عدد المقروء")
    failed_count = models.PositiveIntegerField(default=0, verbose_name="عدد الفاشل")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "تحليل الإشعارات"
        verbose_name_plural = "تحليلات الإشعارات"
        unique_together = ['date', 'category', 'channel']
        ordering = ['-date']

    def __str__(self):
        return f"{self.date} - {self.get_category_display()} - {self.get_channel_display()}"


class NotificationService:
    """خدمة الإشعارات المتقدمة"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def send_notification(self, 
                         title: str,
                         message: str,
                         recipients: List[str],
                         category: str = NotificationCategory.SYSTEM,
                         priority: str = NotificationPriority.NORMAL,
                         channels: List[str] = None,
                         template: NotificationTemplate = None,
                         template_variables: Dict = None,
                         scheduled_at: datetime = None,
                         expires_at: datetime = None,
                         is_urgent: bool = False,
                         requires_acknowledgment: bool = False,
                         action_url: str = None,
                         action_text: str = None,
                         metadata: Dict = None) -> AdvancedNotification:
        """إرسال إشعار جديد"""
        
        if channels is None:
            channels = [NotificationChannel.IN_APP]
        
        if template_variables is None:
            template_variables = {}
        
        if metadata is None:
            metadata = {}
        
        # إنشاء الإشعار
        notification = AdvancedNotification.objects.create(
            title=title,
            message=message,
            category=category,
            priority=priority,
            channels=channels,
            recipients=recipients,
            template=template,
            template_variables=template_variables,
            scheduled_at=scheduled_at,
            expires_at=expires_at,
            is_urgent=is_urgent,
            requires_acknowledgment=requires_acknowledgment,
            action_url=action_url,
            action_text=action_text,
            metadata=metadata
        )
        
        # إرسال فوري إذا لم يكن مجدول
        if not scheduled_at or scheduled_at <= timezone.now():
            self._process_notification(notification)
        
        return notification
    
    def _process_notification(self, notification: AdvancedNotification):
        """معالجة الإشعار"""
        try:
            for channel in notification.channels:
                for recipient in notification.recipients:
                    self._send_to_channel(notification, channel, recipient)
            
            notification.status = NotificationStatus.SENT
            notification.save()
            
        except Exception as e:
            self.logger.error(f"Error processing notification {notification.id}: {str(e)}")
            notification.status = NotificationStatus.FAILED
            notification.save()
    
    def _send_to_channel(self, notification: AdvancedNotification, channel: str, recipient: str):
        """إرسال الإشعار عبر قناة محددة"""
        delivery, created = NotificationDelivery.objects.get_or_create(
            notification=notification,
            channel=channel,
            recipient=recipient,
            defaults={'status': NotificationStatus.PENDING}
        )
        
        if not created:
            return delivery
        
        try:
            if channel == NotificationChannel.IN_APP:
                self._send_in_app(notification, recipient)
            elif channel == NotificationChannel.EMAIL:
                self._send_email(notification, recipient)
            elif channel == NotificationChannel.SMS:
                self._send_sms(notification, recipient)
            elif channel == NotificationChannel.PUSH:
                self._send_push(notification, recipient)
            elif channel == NotificationChannel.WEBHOOK:
                self._send_webhook(notification, recipient)
            elif channel == NotificationChannel.SLACK:
                self._send_slack(notification, recipient)
            elif channel == NotificationChannel.TELEGRAM:
                self._send_telegram(notification, recipient)
            
            delivery.status = NotificationStatus.SENT
            delivery.sent_at = timezone.now()
            delivery.save()
            
            notification.sent_count += 1
            notification.save()
            
        except Exception as e:
            self.logger.error(f"Error sending to {channel} for {recipient}: {str(e)}")
            delivery.status = NotificationStatus.FAILED
            delivery.error_message = str(e)
            delivery.save()
            
            notification.failed_count += 1
            notification.save()
    
    def _send_in_app(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار داخل التطبيق"""
        # يمكن استخدام WebSocket أو Server-Sent Events هنا
        cache_key = f"notification_{recipient}_{notification.id}"
        cache.set(cache_key, {
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'category': notification.category,
            'priority': notification.priority,
            'created_at': notification.created_at.isoformat(),
            'action_url': notification.action_url,
            'action_text': notification.action_text,
        }, timeout=86400)  # 24 ساعة
    
    def _send_email(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار عبر البريد الإلكتروني"""
        subject = notification.title
        message = notification.message
        
        if notification.template:
            # استخدام قالب HTML إذا كان متوفراً
            html_message = render_to_string(
                f'notifications/email/{notification.template.name}.html',
                {
                    'notification': notification,
                    'recipient': recipient,
                    **notification.template_variables
                }
            )
        else:
            html_message = None
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html_message,
            fail_silently=False
        )
    
    def _send_sms(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار عبر الرسائل النصية"""
        # يمكن دمج خدمة SMS مثل Twilio أو AWS SNS
        pass
    
    def _send_push(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار فوري"""
        # يمكن دمج خدمة Push notifications
        pass
    
    def _send_webhook(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار عبر Webhook"""
        # يمكن إرسال HTTP POST إلى URL محدد
        pass
    
    def _send_slack(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار عبر Slack"""
        # يمكن دمج Slack API
        pass
    
    def _send_telegram(self, notification: AdvancedNotification, recipient: str):
        """إرسال إشعار عبر Telegram"""
        # يمكن دمج Telegram Bot API
        pass
    
    def get_user_notifications(self, user: User, limit: int = 50) -> List[Dict]:
        """الحصول على إشعارات المستخدم"""
        cache_key = f"user_notifications_{user.id}_{limit}"
        notifications = cache.get(cache_key)
        
        if not notifications:
            deliveries = NotificationDelivery.objects.filter(
                recipient=user.email,
                status__in=[NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ]
            ).select_related('notification').order_by('-created_at')[:limit]
            
            notifications = []
            for delivery in deliveries:
                notifications.append({
                    'id': delivery.notification.id,
                    'title': delivery.notification.title,
                    'message': delivery.notification.message,
                    'category': delivery.notification.category,
                    'priority': delivery.notification.priority,
                    'status': delivery.status,
                    'created_at': delivery.created_at.isoformat(),
                    'read_at': delivery.read_at.isoformat() if delivery.read_at else None,
                    'action_url': delivery.notification.action_url,
                    'action_text': delivery.notification.action_text,
                })
            
            cache.set(cache_key, notifications, timeout=300)  # 5 دقائق
        
        return notifications
    
    def mark_as_read(self, notification_id: int, user: User) -> bool:
        """تحديد الإشعار كمقروء"""
        try:
            delivery = NotificationDelivery.objects.get(
                notification_id=notification_id,
                recipient=user.email
            )
            delivery.status = NotificationStatus.READ
            delivery.read_at = timezone.now()
            delivery.save()
            
            # تحديث عداد القراءة
            notification = delivery.notification
            notification.read_count += 1
            notification.save()
            
            return True
        except NotificationDelivery.DoesNotExist:
            return False
    
    def get_analytics(self, start_date: datetime, end_date: datetime) -> Dict:
        """الحصول على تحليلات الإشعارات"""
        analytics = NotificationAnalytics.objects.filter(
            date__range=[start_date.date(), end_date.date()]
        ).values('category', 'channel').annotate(
            total_sent=models.Sum('sent_count'),
            total_delivered=models.Sum('delivered_count'),
            total_read=models.Sum('read_count'),
            total_failed=models.Sum('failed_count')
        )
        
        return {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'analytics': list(analytics),
            'summary': {
                'total_sent': sum(a['total_sent'] or 0 for a in analytics),
                'total_delivered': sum(a['total_delivered'] or 0 for a in analytics),
                'total_read': sum(a['total_read'] or 0 for a in analytics),
                'total_failed': sum(a['total_failed'] or 0 for a in analytics),
            }
        }


# وظائف مساعدة
def create_notification_template(name: str, category: str, subject: str, message: str, 
                                channels: List[str] = None, variables: Dict = None) -> NotificationTemplate:
    """إنشاء قالب إشعار جديد"""
    if channels is None:
        channels = [NotificationChannel.IN_APP]
    
    if variables is None:
        variables = {}
    
    return NotificationTemplate.objects.create(
        name=name,
        category=category,
        channels=channels,
        subject_template=subject,
        message_template=message,
        variables=variables
    )


def create_notification_rule(name: str, category: str, trigger_event: str, 
                           template: NotificationTemplate, conditions: Dict = None) -> NotificationRule:
    """إنشاء قاعدة إشعار جديدة"""
    if conditions is None:
        conditions = {}
    
    return NotificationRule.objects.create(
        name=name,
        category=category,
        trigger_event=trigger_event,
        conditions=conditions,
        template=template
    )


def send_financial_alert(amount: float, description: str, recipients: List[str]):
    """إرسال تنبيه مالي"""
    service = NotificationService()
    return service.send_notification(
        title="تنبيه مالي",
        message=f"مبلغ {amount} ريال - {description}",
        recipients=recipients,
        category=NotificationCategory.FINANCIAL,
        priority=NotificationPriority.HIGH,
        channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        is_urgent=True
    )


def send_contract_reminder(contract_id: str, customer_name: str, recipients: List[str]):
    """إرسال تذكير عقد"""
    service = NotificationService()
    return service.send_notification(
        title="تذكير عقد",
        message=f"تذكير بموعد عقد العميل {customer_name}",
        recipients=recipients,
        category=NotificationCategory.CONTRACT,
        priority=NotificationPriority.NORMAL,
        channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        action_url=f"/contracts/{contract_id}/",
        action_text="عرض العقد"
    )


def send_payment_reminder(installment_id: str, amount: float, due_date: str, recipients: List[str]):
    """إرسال تذكير دفع"""
    service = NotificationService()
    return service.send_notification(
        title="تذكير دفع",
        message=f"قسط بقيمة {amount} ريال مستحق في {due_date}",
        recipients=recipients,
        category=NotificationCategory.PAYMENT,
        priority=NotificationPriority.HIGH,
        channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
        action_url=f"/installments/{installment_id}/",
        action_text="عرض القسط"
    )