from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView, UpdateView
from django.http import JsonResponse
from django.contrib import messages
from django.utils import timezone
from django.core.paginator import Paginator
from django.db.models import Q
from datetime import datetime, timedelta
import json

from .models import UserSettings, CompanySettings, SystemSettings, AuditLog
from .forms import UserSettingsForm, CompanySettingsForm


class SettingsDashboardView(LoginRequiredMixin, TemplateView):
    """Settings dashboard"""
    template_name = 'settings/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get user settings
        user_settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        
        # Get company settings
        company_settings, created = CompanySettings.objects.get_or_create(company=company)
        
        # Get system settings
        system_settings = SystemSettings.objects.all()
        
        # Get recent audit logs
        recent_audit_logs = AuditLog.objects.filter(
            user=self.request.user
        ).order_by('-created_at')[:10]
        
        context.update({
            'user_settings': user_settings,
            'company_settings': company_settings,
            'system_settings': system_settings,
            'recent_audit_logs': recent_audit_logs,
        })
        
        return context


class UserSettingsView(LoginRequiredMixin, UpdateView):
    """User settings management"""
    model = UserSettings
    form_class = UserSettingsForm
    template_name = 'settings/user_settings.html'
    success_url = '/settings/'
    
    def get_object(self):
        user_settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        return user_settings
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'User settings updated successfully')
        return response


class CompanySettingsView(LoginRequiredMixin, UpdateView):
    """Company settings management"""
    model = CompanySettings
    form_class = CompanySettingsForm
    template_name = 'settings/company_settings.html'
    success_url = '/settings/'
    
    def get_object(self):
        user_profile = self.request.user.userprofile
        company_settings, created = CompanySettings.objects.get_or_create(company=user_profile.company)
        return company_settings
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Company settings updated successfully')
        return response


class SystemSettingsView(LoginRequiredMixin, TemplateView):
    """System settings management"""
    template_name = 'settings/system_settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get system settings
        system_settings = SystemSettings.objects.all()
        
        # Group settings by category
        settings_by_category = {}
        for setting in system_settings:
            category = setting.key.split('_')[0] if '_' in setting.key else 'general'
            if category not in settings_by_category:
                settings_by_category[category] = []
            settings_by_category[category].append(setting)
        
        context['settings_by_category'] = settings_by_category
        
        return context
    
    def post(self, request, *args, **kwargs):
        # Update system settings
        for key, value in request.POST.items():
            if key.startswith('setting_'):
                setting_key = key.replace('setting_', '')
                data_type = request.POST.get(f'type_{setting_key}', 'string')
                
                SystemSettings.set_setting(setting_key, value, data_type)
        
        messages.success(request, 'System settings updated successfully')
        return self.get(request, *args, **kwargs)


class AuditLogView(LoginRequiredMixin, TemplateView):
    """Audit log viewer"""
    template_name = 'settings/audit_log.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get audit logs
        audit_logs = AuditLog.objects.all()
        
        # Filter by user if not admin
        if not self.request.user.is_superuser:
            audit_logs = audit_logs.filter(user=self.request.user)
        
        # Filter by date range
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            audit_logs = audit_logs.filter(
                created_at__date__range=[start_date, end_date]
            )
        
        # Filter by action
        action = self.request.GET.get('action')
        if action:
            audit_logs = audit_logs.filter(action__icontains=action)
        
        # Filter by model
        model_name = self.request.GET.get('model_name')
        if model_name:
            audit_logs = audit_logs.filter(model_name__icontains=model_name)
        
        # Pagination
        paginator = Paginator(audit_logs, 50)
        page_number = self.request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        
        context.update({
            'page_obj': page_obj,
            'start_date': start_date,
            'end_date': end_date,
            'action': action,
            'model_name': model_name,
        })
        
        return context


class ThemeSettingsView(LoginRequiredMixin, TemplateView):
    """Theme and appearance settings"""
    template_name = 'settings/theme_settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get user settings
        user_settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        
        # Available themes
        themes = [
            {'value': 'light', 'name': 'Light Theme', 'description': 'Clean and bright interface'},
            {'value': 'dark', 'name': 'Dark Theme', 'description': 'Easy on the eyes in low light'},
            {'value': 'auto', 'name': 'Auto Theme', 'description': 'Follows system preference'},
        ]
        
        context.update({
            'user_settings': user_settings,
            'themes': themes,
        })
        
        return context
    
    def post(self, request, *args, **kwargs):
        # Update theme settings
        user_settings, created = UserSettings.objects.get_or_create(user=request.user)
        
        user_settings.theme = request.POST.get('theme', 'light')
        user_settings.currency = request.POST.get('currency', 'USD')
        user_settings.currency_symbol = request.POST.get('currency_symbol', '$')
        user_settings.currency_position = request.POST.get('currency_position', 'before')
        user_settings.date_format = request.POST.get('date_format', 'YYYY-MM-DD')
        user_settings.time_format = request.POST.get('time_format', '24')
        user_settings.decimal_places = int(request.POST.get('decimal_places', 2))
        user_settings.thousands_separator = request.POST.get('thousands_separator', ',')
        user_settings.decimal_separator = request.POST.get('decimal_separator', '.')
        
        user_settings.save()
        
        messages.success(request, 'Theme settings updated successfully')
        return self.get(request, *args, **kwargs)


class NotificationSettingsView(LoginRequiredMixin, TemplateView):
    """Notification preferences"""
    template_name = 'settings/notification_settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get user settings
        user_settings, created = UserSettings.objects.get_or_create(user=self.request.user)
        
        context['user_settings'] = user_settings
        
        return context
    
    def post(self, request, *args, **kwargs):
        # Update notification settings
        user_settings, created = UserSettings.objects.get_or_create(user=request.user)
        
        user_settings.email_notifications = request.POST.get('email_notifications') == 'on'
        user_settings.push_notifications = request.POST.get('push_notifications') == 'on'
        user_settings.notification_frequency = request.POST.get('notification_frequency', 'immediate')
        
        user_settings.save()
        
        messages.success(request, 'Notification settings updated successfully')
        return self.get(request, *args, **kwargs)


class SecuritySettingsView(LoginRequiredMixin, TemplateView):
    """Security settings"""
    template_name = 'settings/security_settings.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get company settings
        user_profile = self.request.user.userprofile
        company_settings, created = CompanySettings.objects.get_or_create(company=user_profile.company)
        
        context['company_settings'] = company_settings
        
        return context
    
    def post(self, request, *args, **kwargs):
        # Update security settings
        user_profile = request.user.userprofile
        company_settings, created = CompanySettings.objects.get_or_create(company=user_profile.company)
        
        company_settings.session_timeout = int(request.POST.get('session_timeout', 30))
        company_settings.two_factor_enabled = request.POST.get('two_factor_enabled') == 'on'
        
        # Update password policy
        password_policy = {
            'min_length': int(request.POST.get('min_length', 8)),
            'require_uppercase': request.POST.get('require_uppercase') == 'on',
            'require_lowercase': request.POST.get('require_lowercase') == 'on',
            'require_numbers': request.POST.get('require_numbers') == 'on',
            'require_symbols': request.POST.get('require_symbols') == 'on',
        }
        company_settings.password_policy = password_policy
        
        company_settings.save()
        
        messages.success(request, 'Security settings updated successfully')
        return self.get(request, *args, **kwargs)


# AJAX endpoints
def update_setting(request):
    """Update a single setting via AJAX"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST method required'}, status=405)
    
    setting_key = request.POST.get('key')
    setting_value = request.POST.get('value')
    data_type = request.POST.get('data_type', 'string')
    
    if not setting_key:
        return JsonResponse({'success': False, 'error': 'Setting key is required'}, status=400)
    
    try:
        SystemSettings.set_setting(setting_key, setting_value, data_type)
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def get_setting(request, key):
    """Get a single setting value via AJAX"""
    value = SystemSettings.get_setting(key)
    return JsonResponse({'value': value})


def reset_settings(request):
    """Reset settings to defaults via AJAX"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST method required'}, status=405)
    
    try:
        # Reset user settings
        user_settings, created = UserSettings.objects.get_or_create(user=request.user)
        user_settings.theme = 'light'
        user_settings.currency = 'USD'
        user_settings.currency_symbol = '$'
        user_settings.currency_position = 'before'
        user_settings.date_format = 'YYYY-MM-DD'
        user_settings.time_format = '24'
        user_settings.decimal_places = 2
        user_settings.thousands_separator = ','
        user_settings.decimal_separator = '.'
        user_settings.auto_save_enabled = True
        user_settings.auto_save_interval = 30
        user_settings.email_notifications = True
        user_settings.push_notifications = True
        user_settings.notification_frequency = 'immediate'
        user_settings.language = 'en'
        user_settings.timezone = 'UTC'
        user_settings.save()
        
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)