from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import Settings, KeyVal
from .forms import SettingsForm, KeyValForm
from .services import settings_service
import json

def settings_dashboard(request):
    """لوحة تحكم الإعدادات"""
    try:
        # إعدادات النظام
        system_settings = Settings.objects.all().order_by('key')
        
        # إعدادات المفاتيح
        keyval_settings = KeyVal.objects.all().order_by('key')
        
        # إحصائيات
        stats = {
            'total_settings': system_settings.count(),
            'total_keyvals': keyval_settings.count(),
            'last_updated': system_settings.order_by('-updated_at').first().updated_at if system_settings.exists() else None,
        }
        
        context = {
            'system_settings': system_settings,
            'keyval_settings': keyval_settings,
            'stats': stats,
        }
        return render(request, 'settings_app/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة الإعدادات: {str(e)}')
        return render(request, 'settings_app/dashboard.html', {})

def system_settings(request):
    """إعدادات النظام"""
    try:
        if request.method == 'POST':
            form = SettingsForm(request.POST)
            if form.is_valid():
                setting = form.save()
                messages.success(request, 'تم حفظ الإعداد بنجاح')
                return redirect('system_settings')
        else:
            form = SettingsForm()
        
        settings_list = Settings.objects.all().order_by('key')
        
        context = {
            'form': form,
            'settings_list': settings_list,
        }
        return render(request, 'settings_app/system_settings.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في إعدادات النظام: {str(e)}')
        return redirect('settings_dashboard')

def keyval_settings(request):
    """إعدادات المفاتيح"""
    try:
        if request.method == 'POST':
            form = KeyValForm(request.POST)
            if form.is_valid():
                keyval = form.save()
                messages.success(request, 'تم حفظ المفتاح بنجاح')
                return redirect('keyval_settings')
        else:
            form = KeyValForm()
        
        keyvals_list = KeyVal.objects.all().order_by('key')
        
        context = {
            'form': form,
            'keyvals_list': keyvals_list,
        }
        return render(request, 'settings_app/keyval_settings.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في إعدادات المفاتيح: {str(e)}')
        return redirect('settings_dashboard')

def edit_setting(request, pk):
    """تعديل إعداد"""
    try:
        setting = get_object_or_404(Settings, pk=pk)
        
        if request.method == 'POST':
            form = SettingsForm(request.POST, instance=setting)
            if form.is_valid():
                form.save()
                messages.success(request, 'تم تحديث الإعداد بنجاح')
                return redirect('system_settings')
        else:
            form = SettingsForm(instance=setting)
        
        context = {
            'form': form,
            'setting': setting,
        }
        return render(request, 'settings_app/edit_setting.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تعديل الإعداد: {str(e)}')
        return redirect('system_settings')

def edit_keyval(request, pk):
    """تعديل مفتاح"""
    try:
        keyval = get_object_or_404(KeyVal, pk=pk)
        
        if request.method == 'POST':
            form = KeyValForm(request.POST, instance=keyval)
            if form.is_valid():
                form.save()
                messages.success(request, 'تم تحديث المفتاح بنجاح')
                return redirect('keyval_settings')
        else:
            form = KeyValForm(instance=keyval)
        
        context = {
            'form': form,
            'keyval': keyval,
        }
        return render(request, 'settings_app/edit_keyval.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تعديل المفتاح: {str(e)}')
        return redirect('keyval_settings')

@require_http_methods(["POST"])
def delete_setting(request, pk):
    """حذف إعداد"""
    try:
        setting = get_object_or_404(Settings, pk=pk)
        setting.delete()
        messages.success(request, 'تم حذف الإعداد بنجاح')
        return redirect('system_settings')
    except Exception as e:
        messages.error(request, f'خطأ في حذف الإعداد: {str(e)}')
        return redirect('system_settings')

@require_http_methods(["POST"])
def delete_keyval(request, pk):
    """حذف مفتاح"""
    try:
        keyval = get_object_or_404(KeyVal, pk=pk)
        keyval.delete()
        messages.success(request, 'تم حذف المفتاح بنجاح')
        return redirect('keyval_settings')
    except Exception as e:
        messages.error(request, f'خطأ في حذف المفتاح: {str(e)}')
        return redirect('keyval_settings')

def get_setting_value(request, key):
    """الحصول على قيمة إعداد"""
    try:
        value = settings_service.get_setting_value(key)
        return JsonResponse({'value': value})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def set_setting_value(request, key):
    """تعيين قيمة إعداد"""
    try:
        data = json.loads(request.body)
        value = data.get('value', '')
        
        result = settings_service.set_setting_value(key, value)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_keyval_value(request, key):
    """الحصول على قيمة مفتاح"""
    try:
        value = settings_service.get_keyval_value(key)
        return JsonResponse({'value': value})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def set_keyval_value(request, key):
    """تعيين قيمة مفتاح"""
    try:
        data = json.loads(request.body)
        value = data.get('value', '')
        
        result = settings_service.set_keyval_value(key, value)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def export_settings(request):
    """تصدير الإعدادات"""
    try:
        result = settings_service.export_settings()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def import_settings(request):
    """استيراد الإعدادات"""
    try:
        if 'settings_file' not in request.FILES:
            return JsonResponse({'error': 'يرجى اختيار ملف الإعدادات'}, status=400)
        
        settings_file = request.FILES['settings_file']
        result = settings_service.import_settings(settings_file)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def reset_settings(request):
    """إعادة تعيين الإعدادات"""
    try:
        result = settings_service.reset_settings()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def backup_settings(request):
    """نسخ احتياطي للإعدادات"""
    try:
        result = settings_service.backup_settings()
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def restore_settings(request):
    """استعادة الإعدادات"""
    try:
        if 'backup_file' not in request.FILES:
            return JsonResponse({'error': 'يرجى اختيار ملف النسخة الاحتياطية'}, status=400)
        
        backup_file = request.FILES['backup_file']
        result = settings_service.restore_settings(backup_file)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)