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


class UserSettings(BaseModel):
    """User-specific settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_settings')
    
    # Theme settings
    theme = models.CharField(max_length=20, choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto'),
    ], default='light')
    
    # Currency settings
    currency = models.CharField(max_length=3, default='USD')
    currency_symbol = models.CharField(max_length=5, default='$')
    currency_position = models.CharField(max_length=10, choices=[
        ('before', 'Before'),
        ('after', 'After'),
    ], default='before')
    
    # Date format settings
    date_format = models.CharField(max_length=20, choices=[
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('DD-MM-YYYY', 'DD-MM-YYYY'),
    ], default='YYYY-MM-DD')
    
    # Time format settings
    time_format = models.CharField(max_length=10, choices=[
        ('12', '12 Hour'),
        ('24', '24 Hour'),
    ], default='24')
    
    # Number format settings
    decimal_places = models.IntegerField(default=2)
    thousands_separator = models.CharField(max_length=5, default=',')
    decimal_separator = models.CharField(max_length=5, default='.')
    
    # Auto-save settings
    auto_save_enabled = models.BooleanField(default=True)
    auto_save_interval = models.IntegerField(default=30)  # seconds
    
    # Dashboard settings
    dashboard_widgets = models.JSONField(default=list)  # List of enabled widgets
    dashboard_layout = models.JSONField(default=dict)  # Widget positions
    
    # Notification settings
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    notification_frequency = models.CharField(max_length=20, choices=[
        ('immediate', 'Immediate'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('never', 'Never'),
    ], default='immediate')
    
    # Language settings
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    
    def __str__(self):
        return f"Settings for {self.user.username}"


class CompanySettings(BaseModel):
    """Company-wide settings"""
    company = models.OneToOneField('accounting_app.Company', on_delete=models.CASCADE, related_name='company_settings')
    
    # Company information
    company_name = models.CharField(max_length=255)
    company_email = models.EmailField(blank=True, null=True)
    company_phone = models.CharField(max_length=20, blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)
    company_website = models.URLField(blank=True, null=True)
    
    # Financial settings
    fiscal_year_start = models.DateField()
    fiscal_year_end = models.DateField()
    default_currency = models.CharField(max_length=3, default='USD')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Invoice settings
    invoice_prefix = models.CharField(max_length=10, default='INV')
    invoice_number_format = models.CharField(max_length=50, default='{prefix}-{year}-{number}')
    invoice_due_days = models.IntegerField(default=30)
    invoice_footer_text = models.TextField(blank=True, null=True)
    
    # Bill settings
    bill_prefix = models.CharField(max_length=10, default='BILL')
    bill_number_format = models.CharField(max_length=50, default='{prefix}-{year}-{number}')
    bill_due_days = models.IntegerField(default=30)
    
    # Payment settings
    payment_terms = models.TextField(blank=True, null=True)
    late_fee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Backup settings
    auto_backup_enabled = models.BooleanField(default=True)
    backup_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], default='daily')
    backup_retention_days = models.IntegerField(default=30)
    
    # Security settings
    password_policy = models.JSONField(default=dict)
    session_timeout = models.IntegerField(default=30)  # minutes
    two_factor_enabled = models.BooleanField(default=False)
    
    # Integration settings
    api_enabled = models.BooleanField(default=False)
    webhook_url = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return f"Settings for {self.company.name}"


class SystemSettings(BaseModel):
    """System-wide settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=[
        ('string', 'String'),
        ('integer', 'Integer'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
        ('float', 'Float'),
    ], default='string')
    
    def __str__(self):
        return f"{self.key}: {self.value}"
    
    @classmethod
    def get_setting(cls, key, default=None):
        """Get system setting value"""
        try:
            setting = cls.objects.get(key=key)
            if setting.data_type == 'boolean':
                return setting.value.lower() in ['true', '1', 'yes', 'on']
            elif setting.data_type == 'integer':
                return int(setting.value)
            elif setting.data_type == 'float':
                return float(setting.value)
            elif setting.data_type == 'json':
                import json
                return json.loads(setting.value)
            else:
                return setting.value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_setting(cls, key, value, data_type='string', description=None):
        """Set system setting value"""
        if data_type == 'json':
            import json
            value = json.dumps(value)
        elif data_type == 'boolean':
            value = str(bool(value)).lower()
        else:
            value = str(value)
        
        setting, created = cls.objects.get_or_create(
            key=key,
            defaults={
                'value': value,
                'data_type': data_type,
                'description': description
            }
        )
        
        if not created:
            setting.value = value
            setting.data_type = data_type
            if description:
                setting.description = description
            setting.save()
        
        return setting


class AuditLog(BaseModel):
    """Audit log for tracking changes"""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    old_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} on {self.model_name} by {self.user.username if self.user else 'System'}"