import os
import subprocess
import shutil
from datetime import datetime
from django.conf import settings
from django.db import connection
import json

class BackupService:
    def __init__(self):
        self.backup_dir = getattr(settings, 'BACKUP_DIR', 'backups')
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def create_backup(self, backup_name=None):
        """إنشاء نسخة احتياطية"""
        try:
            if not backup_name:
                backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            db_settings = settings.DATABASES['default']
            filename = f"{backup_name}.sql"
            filepath = os.path.join(self.backup_dir, filename)
            
            # إنشاء النسخة الاحتياطية باستخدام pg_dump
            env = os.environ.copy()
            env['PGPASSWORD'] = db_settings['PASSWORD']
            
            cmd = [
                'pg_dump',
                '-h', db_settings['HOST'],
                '-p', str(db_settings['PORT']),
                '-U', db_settings['USER'],
                '-d', db_settings['NAME'],
                '-f', filepath,
                '--verbose',
                '--no-password'
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                # إنشاء ملف معلومات النسخة الاحتياطية
                backup_info = {
                    'filename': filename,
                    'created_at': datetime.now().isoformat(),
                    'database_name': db_settings['NAME'],
                    'file_size': os.path.getsize(filepath),
                    'status': 'success'
                }
                
                info_file = os.path.join(self.backup_dir, f"{backup_name}_info.json")
                with open(info_file, 'w', encoding='utf-8') as f:
                    json.dump(backup_info, f, ensure_ascii=False, indent=2)
                
                return {
                    'status': 'success',
                    'filename': filename,
                    'filepath': filepath,
                    'file_size': backup_info['file_size'],
                    'message': 'تم إنشاء النسخة الاحتياطية بنجاح'
                }
            else:
                return {
                    'status': 'error',
                    'message': f'فشل في إنشاء النسخة الاحتياطية: {result.stderr}'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إنشاء النسخة الاحتياطية: {str(e)}'
            }
    
    def restore_backup(self, backup_filename):
        """استعادة نسخة احتياطية"""
        try:
            filepath = os.path.join(self.backup_dir, backup_filename)
            
            if not os.path.exists(filepath):
                return {
                    'status': 'error',
                    'message': 'ملف النسخة الاحتياطية غير موجود'
                }
            
            db_settings = settings.DATABASES['default']
            env = os.environ.copy()
            env['PGPASSWORD'] = db_settings['PASSWORD']
            
            cmd = [
                'psql',
                '-h', db_settings['HOST'],
                '-p', str(db_settings['PORT']),
                '-U', db_settings['USER'],
                '-d', db_settings['NAME'],
                '-f', filepath
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {
                    'status': 'success',
                    'message': 'تم استعادة النسخة الاحتياطية بنجاح'
                }
            else:
                return {
                    'status': 'error',
                    'message': f'فشل في استعادة النسخة الاحتياطية: {result.stderr}'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في استعادة النسخة الاحتياطية: {str(e)}'
            }
    
    def delete_backup(self, backup_filename):
        """حذف نسخة احتياطية"""
        try:
            filepath = os.path.join(self.backup_dir, backup_filename)
            info_file = os.path.join(self.backup_dir, f"{backup_filename.replace('.sql', '')}_info.json")
            
            if os.path.exists(filepath):
                os.remove(filepath)
            
            if os.path.exists(info_file):
                os.remove(info_file)
            
            return {
                'status': 'success',
                'message': 'تم حذف النسخة الاحتياطية بنجاح'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في حذف النسخة الاحتياطية: {str(e)}'
            }
    
    def list_backups(self):
        """قائمة النسخ الاحتياطية"""
        try:
            backups = []
            
            for filename in os.listdir(self.backup_dir):
                if filename.endswith('.sql'):
                    filepath = os.path.join(self.backup_dir, filename)
                    info_file = os.path.join(self.backup_dir, f"{filename.replace('.sql', '')}_info.json")
                    
                    backup_info = {
                        'filename': filename,
                        'file_size': os.path.getsize(filepath),
                        'created_at': datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                        'status': 'available'
                    }
                    
                    # قراءة معلومات إضافية من ملف المعلومات
                    if os.path.exists(info_file):
                        try:
                            with open(info_file, 'r', encoding='utf-8') as f:
                                additional_info = json.load(f)
                                backup_info.update(additional_info)
                        except:
                            pass
                    
                    backups.append(backup_info)
            
            # ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
            backups.sort(key=lambda x: x['created_at'], reverse=True)
            
            return {
                'status': 'success',
                'backups': backups
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في قائمة النسخ الاحتياطية: {str(e)}'
            }
    
    def get_backup_info(self, backup_filename):
        """معلومات النسخة الاحتياطية"""
        try:
            filepath = os.path.join(self.backup_dir, backup_filename)
            info_file = os.path.join(self.backup_dir, f"{backup_filename.replace('.sql', '')}_info.json")
            
            if not os.path.exists(filepath):
                return {
                    'status': 'error',
                    'message': 'ملف النسخة الاحتياطية غير موجود'
                }
            
            backup_info = {
                'filename': backup_filename,
                'file_size': os.path.getsize(filepath),
                'created_at': datetime.fromtimestamp(os.path.getctime(filepath)).isoformat(),
                'status': 'available'
            }
            
            # قراءة معلومات إضافية
            if os.path.exists(info_file):
                try:
                    with open(info_file, 'r', encoding='utf-8') as f:
                        additional_info = json.load(f)
                        backup_info.update(additional_info)
                except:
                    pass
            
            return {
                'status': 'success',
                'backup_info': backup_info
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في معلومات النسخة الاحتياطية: {str(e)}'
            }

# إنشاء مثيل الخدمة
backup_service = BackupService()