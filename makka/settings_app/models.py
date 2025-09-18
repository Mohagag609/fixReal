from django.db import models
from django.utils import timezone

class Settings(models.Model):
    """إعدادات النظام"""
    key = models.CharField(max_length=100, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    
    class Meta:
        verbose_name = "إعداد"
        verbose_name_plural = "إعدادات النظام"
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: {self.value}"

class KeyVal(models.Model):
    """مفاتيح وقيم"""
    key = models.CharField(max_length=100, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    
    class Meta:
        verbose_name = "مفتاح وقيمة"
        verbose_name_plural = "مفاتيح وقيم"
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: {self.value}"