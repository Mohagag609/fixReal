import json
import os
from django.utils import timezone
from datetime import datetime
from ..models import Settings, KeyVal

class SettingsService:
    def __init__(self):
        pass
    
    def get_setting_value(self, key, default=None):
        """الحصول على قيمة إعداد"""
        try:
            setting = Settings.objects.get(key=key)
            return setting.value
        except Settings.DoesNotExist:
            return default
    
    def set_setting_value(self, key, value, description=''):
        """تعيين قيمة إعداد"""
        try:
            setting, created = Settings.objects.get_or_create(
                key=key,
                defaults={'value': value, 'description': description}
            )
            
            if not created:
                setting.value = value
                setting.updated_at = timezone.now()
                setting.save()
            
            return {
                'status': 'success',
                'message': 'تم حفظ الإعداد بنجاح',
                'created': created
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في حفظ الإعداد: {str(e)}'
            }
    
    def get_keyval_value(self, key, default=None):
        """الحصول على قيمة مفتاح"""
        try:
            keyval = KeyVal.objects.get(key=key)
            return keyval.value
        except KeyVal.DoesNotExist:
            return default
    
    def set_keyval_value(self, key, value):
        """تعيين قيمة مفتاح"""
        try:
            keyval, created = KeyVal.objects.get_or_create(
                key=key,
                defaults={'value': value}
            )
            
            if not created:
                keyval.value = value
                keyval.updated_at = timezone.now()
                keyval.save()
            
            return {
                'status': 'success',
                'message': 'تم حفظ المفتاح بنجاح',
                'created': created
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في حفظ المفتاح: {str(e)}'
            }
    
    def get_all_settings(self):
        """الحصول على جميع الإعدادات"""
        try:
            settings = Settings.objects.all().order_by('key')
            keyvals = KeyVal.objects.all().order_by('key')
            
            return {
                'status': 'success',
                'settings': list(settings.values()),
                'keyvals': list(keyvals.values())
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في الحصول على الإعدادات: {str(e)}'
            }
    
    def export_settings(self):
        """تصدير الإعدادات"""
        try:
            settings = Settings.objects.all().order_by('key')
            keyvals = KeyVal.objects.all().order_by('key')
            
            export_data = {
                'exported_at': timezone.now().isoformat(),
                'settings': list(settings.values('key', 'value', 'description')),
                'keyvals': list(keyvals.values('key', 'value'))
            }
            
            return {
                'status': 'success',
                'data': export_data,
                'message': 'تم تصدير الإعدادات بنجاح'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تصدير الإعدادات: {str(e)}'
            }
    
    def import_settings(self, settings_file):
        """استيراد الإعدادات"""
        try:
            # قراءة الملف
            content = settings_file.read().decode('utf-8')
            data = json.loads(content)
            
            imported_count = 0
            
            # استيراد الإعدادات
            if 'settings' in data:
                for setting_data in data['settings']:
                    setting, created = Settings.objects.get_or_create(
                        key=setting_data['key'],
                        defaults={
                            'value': setting_data['value'],
                            'description': setting_data.get('description', '')
                        }
                    )
                    
                    if not created:
                        setting.value = setting_data['value']
                        setting.description = setting_data.get('description', '')
                        setting.updated_at = timezone.now()
                        setting.save()
                    
                    if created:
                        imported_count += 1
            
            # استيراد المفاتيح
            if 'keyvals' in data:
                for keyval_data in data['keyvals']:
                    keyval, created = KeyVal.objects.get_or_create(
                        key=keyval_data['key'],
                        defaults={'value': keyval_data['value']}
                    )
                    
                    if not created:
                        keyval.value = keyval_data['value']
                        keyval.updated_at = timezone.now()
                        keyval.save()
                    
                    if created:
                        imported_count += 1
            
            return {
                'status': 'success',
                'imported_count': imported_count,
                'message': f'تم استيراد {imported_count} إعداد بنجاح'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في استيراد الإعدادات: {str(e)}'
            }
    
    def reset_settings(self):
        """إعادة تعيين الإعدادات"""
        try:
            # حذف جميع الإعدادات
            Settings.objects.all().delete()
            KeyVal.objects.all().delete()
            
            # إنشاء الإعدادات الافتراضية
            default_settings = [
                {
                    'key': 'site_name',
                    'value': 'نظام إدارة العقارات',
                    'description': 'اسم الموقع'
                },
                {
                    'key': 'site_description',
                    'value': 'نظام شامل لإدارة العقارات والعقود',
                    'description': 'وصف الموقع'
                },
                {
                    'key': 'currency',
                    'value': 'SAR',
                    'description': 'العملة الافتراضية'
                },
                {
                    'key': 'date_format',
                    'value': '%Y-%m-%d',
                    'description': 'تنسيق التاريخ'
                },
                {
                    'key': 'timezone',
                    'value': 'Asia/Riyadh',
                    'description': 'المنطقة الزمنية'
                },
                {
                    'key': 'items_per_page',
                    'value': '20',
                    'description': 'عدد العناصر في الصفحة'
                },
                {
                    'key': 'backup_retention_days',
                    'value': '30',
                    'description': 'عدد أيام الاحتفاظ بالنسخ الاحتياطية'
                },
                {
                    'key': 'notification_enabled',
                    'value': 'true',
                    'description': 'تفعيل الإشعارات'
                },
                {
                    'key': 'email_notifications',
                    'value': 'true',
                    'description': 'تفعيل إشعارات البريد الإلكتروني'
                },
                {
                    'key': 'sms_notifications',
                    'value': 'false',
                    'description': 'تفعيل إشعارات الرسائل النصية'
                }
            ]
            
            for setting_data in default_settings:
                Settings.objects.create(
                    key=setting_data['key'],
                    value=setting_data['value'],
                    description=setting_data['description']
                )
            
            return {
                'status': 'success',
                'message': 'تم إعادة تعيين الإعدادات بنجاح'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إعادة تعيين الإعدادات: {str(e)}'
            }
    
    def backup_settings(self):
        """نسخ احتياطي للإعدادات"""
        try:
            # إنشاء مجلد النسخ الاحتياطية
            backup_dir = 'settings_backups'
            os.makedirs(backup_dir, exist_ok=True)
            
            # تصدير الإعدادات
            export_result = self.export_settings()
            if export_result['status'] != 'success':
                return export_result
            
            # حفظ الملف
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'settings_backup_{timestamp}.json'
            filepath = os.path.join(backup_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_result['data'], f, ensure_ascii=False, indent=2)
            
            return {
                'status': 'success',
                'filename': filename,
                'filepath': filepath,
                'message': 'تم إنشاء النسخة الاحتياطية بنجاح'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إنشاء النسخة الاحتياطية: {str(e)}'
            }
    
    def restore_settings(self, backup_file):
        """استعادة الإعدادات"""
        try:
            # قراءة الملف
            content = backup_file.read().decode('utf-8')
            data = json.loads(content)
            
            # استيراد الإعدادات
            result = self.import_settings_from_data(data)
            return result
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في استعادة الإعدادات: {str(e)}'
            }
    
    def import_settings_from_data(self, data):
        """استيراد الإعدادات من البيانات"""
        try:
            imported_count = 0
            
            # استيراد الإعدادات
            if 'settings' in data:
                for setting_data in data['settings']:
                    setting, created = Settings.objects.get_or_create(
                        key=setting_data['key'],
                        defaults={
                            'value': setting_data['value'],
                            'description': setting_data.get('description', '')
                        }
                    )
                    
                    if not created:
                        setting.value = setting_data['value']
                        setting.description = setting_data.get('description', '')
                        setting.updated_at = timezone.now()
                        setting.save()
                    
                    if created:
                        imported_count += 1
            
            # استيراد المفاتيح
            if 'keyvals' in data:
                for keyval_data in data['keyvals']:
                    keyval, created = KeyVal.objects.get_or_create(
                        key=keyval_data['key'],
                        defaults={'value': keyval_data['value']}
                    )
                    
                    if not created:
                        keyval.value = keyval_data['value']
                        keyval.updated_at = timezone.now()
                        keyval.save()
                    
                    if created:
                        imported_count += 1
            
            return {
                'status': 'success',
                'imported_count': imported_count,
                'message': f'تم استيراد {imported_count} إعداد بنجاح'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في استيراد الإعدادات: {str(e)}'
            }
    
    def get_setting_stats(self):
        """إحصائيات الإعدادات"""
        try:
            stats = {
                'total_settings': Settings.objects.count(),
                'total_keyvals': KeyVal.objects.count(),
                'last_updated': Settings.objects.order_by('-updated_at').first().updated_at if Settings.objects.exists() else None,
                'recent_settings': Settings.objects.order_by('-updated_at')[:5].values('key', 'value', 'updated_at'),
            }
            
            return {
                'status': 'success',
                'stats': stats
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إحصائيات الإعدادات: {str(e)}'
            }

# إنشاء مثيل الخدمة
settings_service = SettingsService()