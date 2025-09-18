from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class BaseModel(models.Model):
    """Base model with common fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class NotificationCategory(BaseModel):
    """Notification categories for organizing notifications"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#007bff')  # Hex color
    icon = models.CharField(max_length=50, default='bell')  # Icon class
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class Notification(BaseModel):
    """Notification model"""
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('UNREAD', 'Unread'),
        ('READ', 'Read'),
        ('ARCHIVED', 'Archived'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    category = models.ForeignKey(NotificationCategory, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UNREAD')
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.URLField(blank=True, null=True)
    action_text = models.CharField(max_length=100, blank=True, null=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_important = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if self.status == 'UNREAD':
            self.status = 'READ'
            self.read_at = timezone.now()
            self.save()
    
    def mark_as_archived(self):
        """Mark notification as archived"""
        self.status = 'ARCHIVED'
        self.save()
    
    @property
    def is_expired(self):
        """Check if notification is expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


class NotificationTemplate(BaseModel):
    """Notification templates for automated notifications"""
    name = models.CharField(max_length=100)
    category = models.ForeignKey(NotificationCategory, on_delete=models.CASCADE)
    title_template = models.CharField(max_length=255)
    message_template = models.TextField()
    priority = models.CharField(max_length=10, choices=Notification.PRIORITY_CHOICES, default='MEDIUM')
    is_active = models.BooleanField(default=True)
    trigger_events = models.JSONField(default=list)  # List of events that trigger this template
    
    def __str__(self):
        return self.name


class NotificationSchedule(BaseModel):
    """Scheduled notifications"""
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    scheduled_at = models.DateTimeField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    context_data = models.JSONField(default=dict)  # Data to populate template
    
    class Meta:
        ordering = ['scheduled_at']
    
    def __str__(self):
        return f"{self.template.name} - {self.user.username} - {self.scheduled_at}"


class NotificationSettings(BaseModel):
    """User notification preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Email preferences
    email_enabled = models.BooleanField(default=True)
    email_frequency = models.CharField(max_length=20, choices=[
        ('IMMEDIATE', 'Immediate'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('NEVER', 'Never'),
    ], default='IMMEDIATE')
    
    # Push notification preferences
    push_enabled = models.BooleanField(default=True)
    
    # Category preferences
    category_preferences = models.JSONField(default=dict)  # {category_id: enabled}
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Notification Settings - {self.user.username}"