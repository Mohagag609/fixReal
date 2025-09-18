"""
نظام النسخ الاحتياطية المتقدم
Advanced Backup System

يحتوي على:
- إنشاء نسخ احتياطية تلقائية ومجدولة
- استعادة النسخ الاحتياطية
- ضغط النسخ الاحتياطية
- تشفير النسخ الاحتياطية
- إدارة النسخ الاحتياطية
- مراقبة حالة النسخ الاحتياطية
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.files.storage import default_storage
from django.conf import settings
from django.core.management import call_command
from django.db import connection
from datetime import datetime, timedelta
import json
import logging
import os
import zipfile
import tarfile
import shutil
import subprocess
from typing import List, Dict, Optional, Any
from enum import Enum
import hashlib
import pickle
import gzip
import bz2
from cryptography.fernet import Fernet
import schedule
import threading
import time

logger = logging.getLogger(__name__)


class BackupType(models.TextChoices):
    """أنواع النسخ الاحتياطية"""
    FULL = 'full', 'كاملة'
    INCREMENTAL = 'incremental', 'تزايدية'
    DIFFERENTIAL = 'differential', 'تفاضلية'
    SCHEMA_ONLY = 'schema_only', 'هيكل فقط'
    DATA_ONLY = 'data_only', 'بيانات فقط'


class BackupStatus(models.TextChoices):
    """حالات النسخ الاحتياطية"""
    PENDING = 'pending', 'في الانتظار'
    RUNNING = 'running', 'قيد التشغيل'
    COMPLETED = 'completed', 'مكتملة'
    FAILED = 'failed', 'فشلت'
    CANCELLED = 'cancelled', 'ملغية'
    EXPIRED = 'expired', 'منتهية الصلاحية'


class BackupCompression(models.TextChoices):
    """أنواع الضغط"""
    NONE = 'none', 'بدون ضغط'
    ZIP = 'zip', 'ZIP'
    GZIP = 'gzip', 'GZIP'
    BZIP2 = 'bzip2', 'BZIP2'
    TAR_GZ = 'tar_gz', 'TAR.GZ'
    TAR_BZ2 = 'tar_bz2', 'TAR.BZ2'


class BackupEncryption(models.TextChoices):
    """أنواع التشفير"""
    NONE = 'none', 'بدون تشفير'
    AES = 'aes', 'AES'
    FERNET = 'fernet', 'Fernet'


class BackupSchedule(models.Model):
    """جدولة النسخ الاحتياطية"""
    name = models.CharField(max_length=255, verbose_name="اسم الجدولة")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف")
    backup_type = models.CharField(max_length=20, choices=BackupType.choices, verbose_name="نوع النسخة")
    schedule_type = models.CharField(max_length=20, choices=[
        ('daily', 'يومي'),
        ('weekly', 'أسبوعي'),
        ('monthly', 'شهري'),
        ('custom', 'مخصص'),
    ], verbose_name="نوع الجدولة")
    schedule_config = models.JSONField(default=dict, verbose_name="إعدادات الجدولة")
    retention_days = models.PositiveIntegerField(default=30, verbose_name="أيام الاحتفاظ")
    compression = models.CharField(max_length=20, choices=BackupCompression.choices, default=BackupCompression.ZIP, verbose_name="الضغط")
    encryption = models.CharField(max_length=20, choices=BackupEncryption.choices, default=BackupEncryption.NONE, verbose_name="التشفير")
    encryption_key = models.TextField(blank=True, null=True, verbose_name="مفتاح التشفير")
    include_media = models.BooleanField(default=True, verbose_name="تضمين الملفات")
    include_static = models.BooleanField(default=False, verbose_name="تضمين الملفات الثابتة")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    last_run = models.DateTimeField(null=True, blank=True, verbose_name="آخر تشغيل")
    next_run = models.DateTimeField(null=True, blank=True, verbose_name="التشغيل التالي")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="أنشأه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        verbose_name = "جدولة النسخة الاحتياطية"
        verbose_name_plural = "جدولة النسخ الاحتياطية"

    def __str__(self):
        return self.name


class BackupExecution(models.Model):
    """تنفيذ النسخ الاحتياطية"""
    schedule = models.ForeignKey(BackupSchedule, on_delete=models.CASCADE, verbose_name="الجدولة")
    backup_type = models.CharField(max_length=20, choices=BackupType.choices, verbose_name="نوع النسخة")
    status = models.CharField(max_length=20, choices=BackupStatus.choices, default=BackupStatus.PENDING, verbose_name="الحالة")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت البداية")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت الانتهاء")
    file_path = models.CharField(max_length=500, blank=True, null=True, verbose_name="مسار الملف")
    file_size = models.PositiveIntegerField(default=0, verbose_name="حجم الملف")
    compression_ratio = models.FloatField(default=0, verbose_name="نسبة الضغط")
    error_message = models.TextField(blank=True, null=True, verbose_name="رسالة الخطأ")
    metadata = models.JSONField(default=dict, verbose_name="البيانات الإضافية")
    executed_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="نفذه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "تنفيذ النسخة الاحتياطية"
        verbose_name_plural = "تنفيذ النسخ الاحتياطية"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.schedule.name} - {self.get_status_display()}"

    def is_expired(self):
        """فحص انتهاء صلاحية النسخة الاحتياطية"""
        if self.completed_at:
            expiry_date = self.completed_at + timedelta(days=self.schedule.retention_days)
            return timezone.now() > expiry_date
        return False


class BackupRestore(models.Model):
    """استعادة النسخ الاحتياطية"""
    backup_execution = models.ForeignKey(BackupExecution, on_delete=models.CASCADE, verbose_name="النسخة الاحتياطية")
    status = models.CharField(max_length=20, choices=BackupStatus.choices, default=BackupStatus.PENDING, verbose_name="الحالة")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت البداية")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="وقت الانتهاء")
    error_message = models.TextField(blank=True, null=True, verbose_name="رسالة الخطأ")
    restored_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="استعادها")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "استعادة النسخة الاحتياطية"
        verbose_name_plural = "استعادة النسخ الاحتياطية"
        ordering = ['-created_at']

    def __str__(self):
        return f"استعادة {self.backup_execution.schedule.name} - {self.get_status_display()}"


class BackupStorage(models.Model):
    """تخزين النسخ الاحتياطية"""
    name = models.CharField(max_length=255, verbose_name="اسم التخزين")
    storage_type = models.CharField(max_length=20, choices=[
        ('local', 'محلي'),
        ('ftp', 'FTP'),
        ('sftp', 'SFTP'),
        ('s3', 'Amazon S3'),
        ('azure', 'Azure Blob'),
        ('gcp', 'Google Cloud'),
        ('dropbox', 'Dropbox'),
    ], verbose_name="نوع التخزين")
    config = models.JSONField(default=dict, verbose_name="الإعدادات")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "تخزين النسخة الاحتياطية"
        verbose_name_plural = "تخزين النسخ الاحتياطية"

    def __str__(self):
        return self.name


class BackupService:
    """خدمة النسخ الاحتياطية"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.backup_dir = getattr(settings, 'BACKUP_DIR', 'backups')
        self.media_dir = getattr(settings, 'MEDIA_ROOT', 'media')
        self.static_dir = getattr(settings, 'STATIC_ROOT', 'static')
    
    def create_backup(self, 
                     schedule: BackupSchedule,
                     backup_type: str = None,
                     executed_by: User = None) -> BackupExecution:
        """إنشاء نسخة احتياطية"""
        
        if backup_type is None:
            backup_type = schedule.backup_type
        
        # إنشاء سجل التنفيذ
        execution = BackupExecution.objects.create(
            schedule=schedule,
            backup_type=backup_type,
            status=BackupStatus.RUNNING,
            started_at=timezone.now(),
            executed_by=executed_by
        )
        
        try:
            # إنشاء مجلد النسخة الاحتياطية
            backup_path = self._create_backup_directory(execution)
            
            # نسخ قاعدة البيانات
            if backup_type in [BackupType.FULL, BackupType.DATA_ONLY]:
                self._backup_database(backup_path, execution)
            
            # نسخ الملفات
            if backup_type in [BackupType.FULL, BackupType.INCREMENTAL]:
                if schedule.include_media:
                    self._backup_media_files(backup_path, execution)
                if schedule.include_static:
                    self._backup_static_files(backup_path, execution)
            
            # ضغط النسخة الاحتياطية
            if schedule.compression != BackupCompression.NONE:
                backup_path = self._compress_backup(backup_path, schedule.compression, execution)
            
            # تشفير النسخة الاحتياطية
            if schedule.encryption != BackupEncryption.NONE:
                backup_path = self._encrypt_backup(backup_path, schedule.encryption, schedule.encryption_key, execution)
            
            # حساب حجم الملف
            file_size = os.path.getsize(backup_path)
            
            # تحديث سجل التنفيذ
            execution.status = BackupStatus.COMPLETED
            execution.completed_at = timezone.now()
            execution.file_path = backup_path
            execution.file_size = file_size
            execution.metadata = {
                'backup_type': backup_type,
                'compression': schedule.compression,
                'encryption': schedule.encryption,
                'file_count': self._count_files(backup_path),
                'database_size': self._get_database_size(),
            }
            execution.save()
            
            # تحديث الجدولة
            schedule.last_run = execution.completed_at
            schedule.next_run = self._calculate_next_run(schedule)
            schedule.save()
            
            # تنظيف النسخ القديمة
            self._cleanup_old_backups(schedule)
            
            return execution
            
        except Exception as e:
            self.logger.error(f"Error creating backup {execution.id}: {str(e)}")
            execution.status = BackupStatus.FAILED
            execution.error_message = str(e)
            execution.completed_at = timezone.now()
            execution.save()
            
            return execution
    
    def _create_backup_directory(self, execution: BackupExecution) -> str:
        """إنشاء مجلد النسخة الاحتياطية"""
        timestamp = execution.started_at.strftime('%Y%m%d_%H%M%S')
        backup_name = f"{execution.schedule.name}_{timestamp}"
        backup_path = os.path.join(self.backup_dir, backup_name)
        
        os.makedirs(backup_path, exist_ok=True)
        
        return backup_path
    
    def _backup_database(self, backup_path: str, execution: BackupExecution):
        """نسخ قاعدة البيانات"""
        db_file = os.path.join(backup_path, 'database.sql')
        
        # استخدام Django's dumpdata
        with open(db_file, 'w') as f:
            call_command('dumpdata', stdout=f, indent=2)
        
        # إضافة معلومات قاعدة البيانات
        db_info = {
            'database_name': settings.DATABASES['default']['NAME'],
            'backup_time': execution.started_at.isoformat(),
            'django_version': settings.DJANGO_VERSION,
        }
        
        with open(os.path.join(backup_path, 'database_info.json'), 'w') as f:
            json.dump(db_info, f, indent=2)
    
    def _backup_media_files(self, backup_path: str, execution: BackupExecution):
        """نسخ ملفات الوسائط"""
        media_backup_path = os.path.join(backup_path, 'media')
        
        if os.path.exists(self.media_dir):
            shutil.copytree(self.media_dir, media_backup_path)
    
    def _backup_static_files(self, backup_path: str, execution: BackupExecution):
        """نسخ الملفات الثابتة"""
        static_backup_path = os.path.join(backup_path, 'static')
        
        if os.path.exists(self.static_dir):
            shutil.copytree(self.static_dir, static_backup_path)
    
    def _compress_backup(self, backup_path: str, compression_type: str, execution: BackupExecution) -> str:
        """ضغط النسخة الاحتياطية"""
        compressed_path = f"{backup_path}.{self._get_compression_extension(compression_type)}"
        
        if compression_type == BackupCompression.ZIP:
            with zipfile.ZipFile(compressed_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(backup_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, backup_path)
                        zipf.write(file_path, arcname)
        
        elif compression_type == BackupCompression.TAR_GZ:
            with tarfile.open(compressed_path, 'w:gz') as tar:
                tar.add(backup_path, arcname=os.path.basename(backup_path))
        
        elif compression_type == BackupCompression.TAR_BZ2:
            with tarfile.open(compressed_path, 'w:bz2') as tar:
                tar.add(backup_path, arcname=os.path.basename(backup_path))
        
        # حذف المجلد الأصلي
        shutil.rmtree(backup_path)
        
        return compressed_path
    
    def _get_compression_extension(self, compression_type: str) -> str:
        """الحصول على امتداد الضغط"""
        extensions = {
            BackupCompression.ZIP: 'zip',
            BackupCompression.GZIP: 'gz',
            BackupCompression.BZIP2: 'bz2',
            BackupCompression.TAR_GZ: 'tar.gz',
            BackupCompression.TAR_BZ2: 'tar.bz2',
        }
        return extensions.get(compression_type, 'zip')
    
    def _encrypt_backup(self, backup_path: str, encryption_type: str, key: str, execution: BackupExecution) -> str:
        """تشفير النسخة الاحتياطية"""
        if encryption_type == BackupEncryption.FERNET:
            if not key:
                key = Fernet.generate_key()
            
            fernet = Fernet(key)
            
            with open(backup_path, 'rb') as f:
                data = f.read()
            
            encrypted_data = fernet.encrypt(data)
            
            encrypted_path = f"{backup_path}.encrypted"
            with open(encrypted_path, 'wb') as f:
                f.write(encrypted_data)
            
            # حذف الملف الأصلي
            os.remove(backup_path)
            
            return encrypted_path
        
        return backup_path
    
    def _count_files(self, path: str) -> int:
        """عد الملفات في المسار"""
        count = 0
        for root, dirs, files in os.walk(path):
            count += len(files)
        return count
    
    def _get_database_size(self) -> int:
        """الحصول على حجم قاعدة البيانات"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_database_size(current_database())")
                return cursor.fetchone()[0]
        except:
            return 0
    
    def _calculate_next_run(self, schedule: BackupSchedule) -> datetime:
        """حساب وقت التشغيل التالي"""
        now = timezone.now()
        
        if schedule.schedule_type == 'daily':
            return now + timedelta(days=1)
        elif schedule.schedule_type == 'weekly':
            return now + timedelta(weeks=1)
        elif schedule.schedule_type == 'monthly':
            return now + timedelta(days=30)
        else:
            # مخصص
            config = schedule.schedule_config
            if 'interval_hours' in config:
                return now + timedelta(hours=config['interval_hours'])
            elif 'interval_days' in config:
                return now + timedelta(days=config['interval_days'])
            else:
                return now + timedelta(days=1)
    
    def _cleanup_old_backups(self, schedule: BackupSchedule):
        """تنظيف النسخ القديمة"""
        cutoff_date = timezone.now() - timedelta(days=schedule.retention_days)
        
        old_executions = BackupExecution.objects.filter(
            schedule=schedule,
            completed_at__lt=cutoff_date,
            status=BackupStatus.COMPLETED
        )
        
        for execution in old_executions:
            if execution.file_path and os.path.exists(execution.file_path):
                os.remove(execution.file_path)
            
            execution.status = BackupStatus.EXPIRED
            execution.save()
    
    def restore_backup(self, 
                      execution: BackupExecution,
                      restore_to: str = None,
                      restored_by: User = None) -> BackupRestore:
        """استعادة نسخة احتياطية"""
        
        # إنشاء سجل الاستعادة
        restore = BackupRestore.objects.create(
            backup_execution=execution,
            status=BackupStatus.RUNNING,
            started_at=timezone.now(),
            restored_by=restored_by
        )
        
        try:
            if not execution.file_path or not os.path.exists(execution.file_path):
                raise Exception("ملف النسخة الاحتياطية غير موجود")
            
            # فك التشفير إذا كان مشفراً
            if execution.schedule.encryption != BackupEncryption.NONE:
                decrypted_path = self._decrypt_backup(execution.file_path, execution.schedule.encryption, execution.schedule.encryption_key)
            else:
                decrypted_path = execution.file_path
            
            # فك الضغط إذا كان مضغوطاً
            if execution.schedule.compression != BackupCompression.NONE:
                extracted_path = self._extract_backup(decrypted_path, execution.schedule.compression)
            else:
                extracted_path = decrypted_path
            
            # استعادة قاعدة البيانات
            self._restore_database(extracted_path, restore)
            
            # استعادة الملفات
            if execution.schedule.include_media:
                self._restore_media_files(extracted_path, restore)
            
            if execution.schedule.include_static:
                self._restore_static_files(extracted_path, restore)
            
            # تنظيف الملفات المؤقتة
            if decrypted_path != execution.file_path:
                os.remove(decrypted_path)
            if extracted_path != decrypted_path:
                shutil.rmtree(extracted_path)
            
            restore.status = BackupStatus.COMPLETED
            restore.completed_at = timezone.now()
            restore.save()
            
            return restore
            
        except Exception as e:
            self.logger.error(f"Error restoring backup {execution.id}: {str(e)}")
            restore.status = BackupStatus.FAILED
            restore.error_message = str(e)
            restore.completed_at = timezone.now()
            restore.save()
            
            return restore
    
    def _decrypt_backup(self, encrypted_path: str, encryption_type: str, key: str) -> str:
        """فك تشفير النسخة الاحتياطية"""
        if encryption_type == BackupEncryption.FERNET:
            fernet = Fernet(key)
            
            with open(encrypted_path, 'rb') as f:
                encrypted_data = f.read()
            
            decrypted_data = fernet.decrypt(encrypted_data)
            
            decrypted_path = encrypted_path.replace('.encrypted', '')
            with open(decrypted_path, 'wb') as f:
                f.write(decrypted_data)
            
            return decrypted_path
        
        return encrypted_path
    
    def _extract_backup(self, compressed_path: str, compression_type: str) -> str:
        """فك ضغط النسخة الاحتياطية"""
        extracted_path = compressed_path.replace(f".{self._get_compression_extension(compression_type)}", '')
        
        if compression_type == BackupCompression.ZIP:
            with zipfile.ZipFile(compressed_path, 'r') as zipf:
                zipf.extractall(extracted_path)
        
        elif compression_type in [BackupCompression.TAR_GZ, BackupCompression.TAR_BZ2]:
            with tarfile.open(compressed_path, 'r') as tar:
                tar.extractall(extracted_path)
        
        return extracted_path
    
    def _restore_database(self, backup_path: str, restore: BackupRestore):
        """استعادة قاعدة البيانات"""
        db_file = os.path.join(backup_path, 'database.sql')
        
        if os.path.exists(db_file):
            # استخدام Django's loaddata
            call_command('loaddata', db_file)
    
    def _restore_media_files(self, backup_path: str, restore: BackupRestore):
        """استعادة ملفات الوسائط"""
        media_backup_path = os.path.join(backup_path, 'media')
        
        if os.path.exists(media_backup_path):
            if os.path.exists(self.media_dir):
                shutil.rmtree(self.media_dir)
            shutil.copytree(media_backup_path, self.media_dir)
    
    def _restore_static_files(self, backup_path: str, restore: BackupRestore):
        """استعادة الملفات الثابتة"""
        static_backup_path = os.path.join(backup_path, 'static')
        
        if os.path.exists(static_backup_path):
            if os.path.exists(self.static_dir):
                shutil.rmtree(self.static_dir)
            shutil.copytree(static_backup_path, self.static_dir)
    
    def get_backup_status(self) -> Dict:
        """الحصول على حالة النسخ الاحتياطية"""
        total_backups = BackupExecution.objects.count()
        successful_backups = BackupExecution.objects.filter(status=BackupStatus.COMPLETED).count()
        failed_backups = BackupExecution.objects.filter(status=BackupStatus.FAILED).count()
        
        total_size = sum(execution.file_size for execution in BackupExecution.objects.filter(status=BackupStatus.COMPLETED))
        
        return {
            'total_backups': total_backups,
            'successful_backups': successful_backups,
            'failed_backups': failed_backups,
            'success_rate': (successful_backups / total_backups * 100) if total_backups > 0 else 0,
            'total_size': total_size,
            'total_size_mb': total_size / (1024 * 1024),
        }


# وظائف مساعدة
def create_daily_backup_schedule(name: str, created_by: User) -> BackupSchedule:
    """إنشاء جدولة يومية للنسخ الاحتياطية"""
    return BackupSchedule.objects.create(
        name=name,
        description="نسخة احتياطية يومية تلقائية",
        backup_type=BackupType.FULL,
        schedule_type='daily',
        schedule_config={'time': '02:00'},  # 2:00 AM
        retention_days=30,
        compression=BackupCompression.ZIP,
        encryption=BackupEncryption.NONE,
        include_media=True,
        include_static=False,
        created_by=created_by
    )


def create_weekly_backup_schedule(name: str, created_by: User) -> BackupSchedule:
    """إنشاء جدولة أسبوعية للنسخ الاحتياطية"""
    return BackupSchedule.objects.create(
        name=name,
        description="نسخة احتياطية أسبوعية تلقائية",
        backup_type=BackupType.FULL,
        schedule_type='weekly',
        schedule_config={'day': 'sunday', 'time': '03:00'},  # Sunday 3:00 AM
        retention_days=90,
        compression=BackupCompression.TAR_GZ,
        encryption=BackupEncryption.FERNET,
        include_media=True,
        include_static=True,
        created_by=created_by
    )


def run_scheduled_backups():
    """تشغيل النسخ الاحتياطية المجدولة"""
    service = BackupService()
    
    now = timezone.now()
    schedules = BackupSchedule.objects.filter(
        is_active=True,
        next_run__lte=now
    )
    
    for schedule in schedules:
        service.create_backup(schedule)