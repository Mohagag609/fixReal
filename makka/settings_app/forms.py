from django import forms
from .models import UserSettings, CompanySettings


class UserSettingsForm(forms.ModelForm):
    """User settings form"""
    class Meta:
        model = UserSettings
        fields = [
            'theme', 'currency', 'currency_symbol', 'currency_position',
            'date_format', 'time_format', 'decimal_places', 'thousands_separator',
            'decimal_separator', 'auto_save_enabled', 'auto_save_interval',
            'email_notifications', 'push_notifications', 'notification_frequency',
            'language', 'timezone'
        ]
        widgets = {
            'theme': forms.Select(attrs={'class': 'form-control'}),
            'currency': forms.Select(attrs={'class': 'form-control'}),
            'currency_symbol': forms.TextInput(attrs={'class': 'form-control'}),
            'currency_position': forms.Select(attrs={'class': 'form-control'}),
            'date_format': forms.Select(attrs={'class': 'form-control'}),
            'time_format': forms.Select(attrs={'class': 'form-control'}),
            'decimal_places': forms.NumberInput(attrs={'class': 'form-control'}),
            'thousands_separator': forms.TextInput(attrs={'class': 'form-control'}),
            'decimal_separator': forms.TextInput(attrs={'class': 'form-control'}),
            'auto_save_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'auto_save_interval': forms.NumberInput(attrs={'class': 'form-control'}),
            'email_notifications': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'push_notifications': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'notification_frequency': forms.Select(attrs={'class': 'form-control'}),
            'language': forms.Select(attrs={'class': 'form-control'}),
            'timezone': forms.Select(attrs={'class': 'form-control'}),
        }


class CompanySettingsForm(forms.ModelForm):
    """Company settings form"""
    class Meta:
        model = CompanySettings
        fields = [
            'company_name', 'company_email', 'company_phone', 'company_address',
            'company_website', 'fiscal_year_start', 'fiscal_year_end',
            'default_currency', 'tax_rate', 'invoice_prefix', 'invoice_number_format',
            'invoice_due_days', 'invoice_footer_text', 'bill_prefix',
            'bill_number_format', 'bill_due_days', 'payment_terms',
            'late_fee_rate', 'auto_backup_enabled', 'backup_frequency',
            'backup_retention_days', 'session_timeout', 'two_factor_enabled',
            'api_enabled', 'webhook_url'
        ]
        widgets = {
            'company_name': forms.TextInput(attrs={'class': 'form-control'}),
            'company_email': forms.EmailInput(attrs={'class': 'form-control'}),
            'company_phone': forms.TextInput(attrs={'class': 'form-control'}),
            'company_address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'company_website': forms.URLInput(attrs={'class': 'form-control'}),
            'fiscal_year_start': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'fiscal_year_end': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'default_currency': forms.Select(attrs={'class': 'form-control'}),
            'tax_rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'invoice_prefix': forms.TextInput(attrs={'class': 'form-control'}),
            'invoice_number_format': forms.TextInput(attrs={'class': 'form-control'}),
            'invoice_due_days': forms.NumberInput(attrs={'class': 'form-control'}),
            'invoice_footer_text': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'bill_prefix': forms.TextInput(attrs={'class': 'form-control'}),
            'bill_number_format': forms.TextInput(attrs={'class': 'form-control'}),
            'bill_due_days': forms.NumberInput(attrs={'class': 'form-control'}),
            'payment_terms': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'late_fee_rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'auto_backup_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'backup_frequency': forms.Select(attrs={'class': 'form-control'}),
            'backup_retention_days': forms.NumberInput(attrs={'class': 'form-control'}),
            'session_timeout': forms.NumberInput(attrs={'class': 'form-control'}),
            'two_factor_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'api_enabled': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'webhook_url': forms.URLInput(attrs={'class': 'form-control'}),
        }