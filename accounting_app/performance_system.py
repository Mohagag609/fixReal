"""
نظام تحسين الأداء ومراقبة قاعدة البيانات
Performance Optimization and Database Monitoring System

يحتوي على:
- تحليل أداء قاعدة البيانات
- إنشاء Materialized Views
- مراقبة الاستعلامات البطيئة
- تحسين الفهارس
- مراقبة استخدام الذاكرة
- تحليل الأداء
"""

from django.db import models, connection
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from datetime import datetime, timedelta
import json
import logging
import psutil
import time
from typing import List, Dict, Optional, Any
from enum import Enum
import threading
import subprocess
import os

logger = logging.getLogger(__name__)


class PerformanceMetric(models.TextChoices):
    """مقاييس الأداء"""
    RESPONSE_TIME = 'response_time', 'وقت الاستجابة'
    QUERY_TIME = 'query_time', 'وقت الاستعلام'
    MEMORY_USAGE = 'memory_usage', 'استخدام الذاكرة'
    CPU_USAGE = 'cpu_usage', 'استخدام المعالج'
    DISK_USAGE = 'disk_usage', 'استخدام القرص'
    CONNECTION_COUNT = 'connection_count', 'عدد الاتصالات'
    CACHE_HIT_RATIO = 'cache_hit_ratio', 'نسبة ضربات التخزين المؤقت'


class PerformanceAlert(models.TextChoices):
    """تنبيهات الأداء"""
    HIGH_RESPONSE_TIME = 'high_response_time', 'وقت استجابة عالي'
    HIGH_MEMORY_USAGE = 'high_memory_usage', 'استخدام ذاكرة عالي'
    HIGH_CPU_USAGE = 'high_cpu_usage', 'استخدام معالج عالي'
    SLOW_QUERY = 'slow_query', 'استعلام بطيء'
    HIGH_CONNECTION_COUNT = 'high_connection_count', 'عدد اتصالات عالي'
    LOW_CACHE_HIT_RATIO = 'low_cache_hit_ratio', 'نسبة ضربات تخزين مؤقت منخفضة'


class PerformanceThreshold(models.Model):
    """عتبات الأداء"""
    metric = models.CharField(max_length=50, choices=PerformanceMetric.choices, verbose_name="المقياس")
    threshold_value = models.FloatField(verbose_name="قيمة العتبة")
    threshold_type = models.CharField(max_length=20, choices=[
        ('greater_than', 'أكبر من'),
        ('less_than', 'أقل من'),
        ('equals', 'يساوي'),
    ], verbose_name="نوع العتبة")
    alert_type = models.CharField(max_length=50, choices=PerformanceAlert.choices, verbose_name="نوع التنبيه")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        verbose_name = "عتبة الأداء"
        verbose_name_plural = "عتبات الأداء"
        unique_together = ['metric', 'alert_type']

    def __str__(self):
        return f"{self.get_metric_display()} - {self.threshold_value}"


class PerformanceMeasurement(models.Model):
    """قياسات الأداء"""
    metric = models.CharField(max_length=50, choices=PerformanceMetric.choices, verbose_name="المقياس")
    value = models.FloatField(verbose_name="القيمة")
    unit = models.CharField(max_length=20, verbose_name="الوحدة")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="الوقت")
    metadata = models.JSONField(default=dict, verbose_name="البيانات الإضافية")

    class Meta:
        verbose_name = "قياس الأداء"
        verbose_name_plural = "قياسات الأداء"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.get_metric_display()}: {self.value} {self.unit}"


class SlowQuery(models.Model):
    """الاستعلامات البطيئة"""
    query = models.TextField(verbose_name="الاستعلام")
    execution_time = models.FloatField(verbose_name="وقت التنفيذ")
    rows_examined = models.PositiveIntegerField(verbose_name="الصفوف المفحوصة")
    rows_sent = models.PositiveIntegerField(verbose_name="الصفوف المرسلة")
    database = models.CharField(max_length=100, verbose_name="قاعدة البيانات")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="الوقت")
    is_optimized = models.BooleanField(default=False, verbose_name="محسن")
    optimization_notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات التحسين")

    class Meta:
        verbose_name = "استعلام بطيء"
        verbose_name_plural = "الاستعلامات البطيئة"
        ordering = ['-execution_time']

    def __str__(self):
        return f"استعلام بطيء - {self.execution_time}ms"


class MaterializedView(models.Model):
    """العروض المادية"""
    name = models.CharField(max_length=255, unique=True, verbose_name="الاسم")
    description = models.TextField(blank=True, null=True, verbose_name="الوصف")
    query = models.TextField(verbose_name="الاستعلام")
    refresh_interval = models.PositiveIntegerField(default=3600, verbose_name="فترة التحديث (ثانية)")
    last_refresh = models.DateTimeField(null=True, blank=True, verbose_name="آخر تحديث")
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="أنشأه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        verbose_name = "عرض مادي"
        verbose_name_plural = "العروض المادية"

    def __str__(self):
        return self.name


class DatabaseIndex(models.Model):
    """فهارس قاعدة البيانات"""
    table_name = models.CharField(max_length=255, verbose_name="اسم الجدول")
    index_name = models.CharField(max_length=255, verbose_name="اسم الفهرس")
    columns = models.JSONField(verbose_name="الأعمدة")
    index_type = models.CharField(max_length=50, verbose_name="نوع الفهرس")
    is_unique = models.BooleanField(default=False, verbose_name="فريد")
    size_bytes = models.PositiveIntegerField(default=0, verbose_name="الحجم (بايت)")
    usage_count = models.PositiveIntegerField(default=0, verbose_name="عدد الاستخدام")
    last_used = models.DateTimeField(null=True, blank=True, verbose_name="آخر استخدام")
    is_recommended = models.BooleanField(default=False, verbose_name="موصى به")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "فهرس قاعدة البيانات"
        verbose_name_plural = "فهارس قاعدة البيانات"
        unique_together = ['table_name', 'index_name']

    def __str__(self):
        return f"{self.table_name}.{self.index_name}"


class PerformanceOptimization(models.Model):
    """تحسينات الأداء"""
    name = models.CharField(max_length=255, verbose_name="الاسم")
    description = models.TextField(verbose_name="الوصف")
    optimization_type = models.CharField(max_length=50, choices=[
        ('index', 'فهرس'),
        ('query', 'استعلام'),
        ('view', 'عرض'),
        ('cache', 'تخزين مؤقت'),
        ('database', 'قاعدة بيانات'),
    ], verbose_name="نوع التحسين")
    sql_script = models.TextField(blank=True, null=True, verbose_name="سكريبت SQL")
    before_performance = models.FloatField(verbose_name="الأداء قبل التحسين")
    after_performance = models.FloatField(verbose_name="الأداء بعد التحسين")
    improvement_percentage = models.FloatField(verbose_name="نسبة التحسين")
    is_applied = models.BooleanField(default=False, verbose_name="مطبق")
    applied_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ التطبيق")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="أنشأه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        verbose_name = "تحسين الأداء"
        verbose_name_plural = "تحسينات الأداء"

    def __str__(self):
        return self.name


class PerformanceService:
    """خدمة مراقبة الأداء"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def collect_metrics(self):
        """جمع مقاييس الأداء"""
        try:
            # مقاييس النظام
            self._collect_system_metrics()
            
            # مقاييس قاعدة البيانات
            self._collect_database_metrics()
            
            # مقاييس التخزين المؤقت
            self._collect_cache_metrics()
            
            # الاستعلامات البطيئة
            self._collect_slow_queries()
            
        except Exception as e:
            self.logger.error(f"Error collecting performance metrics: {str(e)}")
    
    def _collect_system_metrics(self):
        """جمع مقاييس النظام"""
        # استخدام الذاكرة
        memory = psutil.virtual_memory()
        PerformanceMeasurement.objects.create(
            metric=PerformanceMetric.MEMORY_USAGE,
            value=memory.percent,
            unit='%',
            metadata={'total': memory.total, 'available': memory.available}
        )
        
        # استخدام المعالج
        cpu_percent = psutil.cpu_percent(interval=1)
        PerformanceMeasurement.objects.create(
            metric=PerformanceMetric.CPU_USAGE,
            value=cpu_percent,
            unit='%'
        )
        
        # استخدام القرص
        disk = psutil.disk_usage('/')
        PerformanceMeasurement.objects.create(
            metric=PerformanceMetric.DISK_USAGE,
            value=(disk.used / disk.total) * 100,
            unit='%',
            metadata={'total': disk.total, 'used': disk.used, 'free': disk.free}
        )
    
    def _collect_database_metrics(self):
        """جمع مقاييس قاعدة البيانات"""
        with connection.cursor() as cursor:
            # عدد الاتصالات
            cursor.execute("SELECT count(*) FROM pg_stat_activity")
            connection_count = cursor.fetchone()[0]
            
            PerformanceMeasurement.objects.create(
                metric=PerformanceMetric.CONNECTION_COUNT,
                value=connection_count,
                unit='connections'
            )
            
            # حجم قاعدة البيانات
            cursor.execute("SELECT pg_database_size(current_database())")
            db_size = cursor.fetchone()[0]
            
            PerformanceMeasurement.objects.create(
                metric=PerformanceMetric.DISK_USAGE,
                value=db_size / (1024 * 1024),  # MB
                unit='MB',
                metadata={'type': 'database_size'}
            )
    
    def _collect_cache_metrics(self):
        """جمع مقاييس التخزين المؤقت"""
        try:
            # هذا مثال مبسط - في التطبيق الحقيقي ستحتاج لمراقبة Redis أو Memcached
            cache_stats = cache._cache.get_stats() if hasattr(cache._cache, 'get_stats') else {}
            
            if cache_stats:
                hits = cache_stats.get('hits', 0)
                misses = cache_stats.get('misses', 0)
                total = hits + misses
                
                if total > 0:
                    hit_ratio = (hits / total) * 100
                    PerformanceMeasurement.objects.create(
                        metric=PerformanceMetric.CACHE_HIT_RATIO,
                        value=hit_ratio,
                        unit='%',
                        metadata={'hits': hits, 'misses': misses, 'total': total}
                    )
        except Exception as e:
            self.logger.warning(f"Could not collect cache metrics: {str(e)}")
    
    def _collect_slow_queries(self):
        """جمع الاستعلامات البطيئة"""
        try:
            with connection.cursor() as cursor:
                # هذا مثال لـ PostgreSQL - قد تحتاج لتعديله حسب نوع قاعدة البيانات
                cursor.execute("""
                    SELECT query, mean_exec_time, rows_examined, rows_sent, datname
                    FROM pg_stat_statements 
                    WHERE mean_exec_time > 1000  -- استعلامات أبطأ من ثانية واحدة
                    ORDER BY mean_exec_time DESC
                    LIMIT 10
                """)
                
                for row in cursor.fetchall():
                    SlowQuery.objects.create(
                        query=row[0],
                        execution_time=row[1],
                        rows_examined=row[2] or 0,
                        rows_sent=row[3] or 0,
                        database=row[4]
                    )
        except Exception as e:
            self.logger.warning(f"Could not collect slow queries: {str(e)}")
    
    def check_thresholds(self):
        """فحص العتبات وإرسال التنبيهات"""
        thresholds = PerformanceThreshold.objects.filter(is_active=True)
        
        for threshold in thresholds:
            latest_measurement = PerformanceMeasurement.objects.filter(
                metric=threshold.metric
            ).order_by('-timestamp').first()
            
            if not latest_measurement:
                continue
            
            is_alert = False
            
            if threshold.threshold_type == 'greater_than':
                is_alert = latest_measurement.value > threshold.threshold_value
            elif threshold.threshold_type == 'less_than':
                is_alert = latest_measurement.value < threshold.threshold_value
            elif threshold.threshold_type == 'equals':
                is_alert = latest_measurement.value == threshold.threshold_value
            
            if is_alert:
                self._send_performance_alert(threshold, latest_measurement)
    
    def _send_performance_alert(self, threshold: PerformanceThreshold, measurement: PerformanceMeasurement):
        """إرسال تنبيه الأداء"""
        from .notification_system import NotificationService
        
        service = NotificationService()
        
        alert_message = f"""
        تنبيه أداء: {threshold.get_metric_display()}
        القيمة الحالية: {measurement.value} {measurement.unit}
        العتبة: {threshold.threshold_value}
        الوقت: {measurement.timestamp}
        """
        
        service.send_notification(
            title=f"تنبيه أداء: {threshold.get_alert_type_display()}",
            message=alert_message,
            recipients=['admin@example.com'],  # يمكن تخصيص هذا
            category='system',
            priority='high',
            channels=['in_app', 'email'],
            is_urgent=True
        )
    
    def create_materialized_view(self, 
                                name: str,
                                query: str,
                                description: str = None,
                                refresh_interval: int = 3600,
                                created_by: User = None) -> MaterializedView:
        """إنشاء عرض مادي"""
        
        # إنشاء العرض المادي في قاعدة البيانات
        with connection.cursor() as cursor:
            cursor.execute(f"""
                CREATE MATERIALIZED VIEW IF NOT EXISTS {name} AS
                {query}
            """)
        
        # إنشاء السجل
        materialized_view = MaterializedView.objects.create(
            name=name,
            description=description,
            query=query,
            refresh_interval=refresh_interval,
            created_by=created_by
        )
        
        return materialized_view
    
    def refresh_materialized_view(self, materialized_view: MaterializedView):
        """تحديث عرض مادي"""
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"REFRESH MATERIALIZED VIEW {materialized_view.name}")
            
            materialized_view.last_refresh = timezone.now()
            materialized_view.save()
            
            return True
        except Exception as e:
            self.logger.error(f"Error refreshing materialized view {materialized_view.name}: {str(e)}")
            return False
    
    def analyze_database_performance(self) -> Dict:
        """تحليل أداء قاعدة البيانات"""
        analysis = {
            'slow_queries': [],
            'missing_indexes': [],
            'unused_indexes': [],
            'table_sizes': [],
            'recommendations': []
        }
        
        with connection.cursor() as cursor:
            # الاستعلامات البطيئة
            cursor.execute("""
                SELECT query, mean_exec_time, calls
                FROM pg_stat_statements 
                WHERE mean_exec_time > 1000
                ORDER BY mean_exec_time DESC
                LIMIT 10
            """)
            
            for row in cursor.fetchall():
                analysis['slow_queries'].append({
                    'query': row[0][:200] + '...' if len(row[0]) > 200 else row[0],
                    'execution_time': row[1],
                    'calls': row[2]
                })
            
            # أحجام الجداول
            cursor.execute("""
                SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 10
            """)
            
            for row in cursor.fetchall():
                analysis['table_sizes'].append({
                    'schema': row[0],
                    'table': row[1],
                    'size': row[2]
                })
            
            # الفهارس غير المستخدمة
            cursor.execute("""
                SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE idx_scan = 0
                ORDER BY pg_relation_size(indexrelid) DESC
                LIMIT 10
            """)
            
            for row in cursor.fetchall():
                analysis['unused_indexes'].append({
                    'schema': row[0],
                    'table': row[1],
                    'index': row[2],
                    'scans': row[3],
                    'tuples_read': row[4],
                    'tuples_fetched': row[5]
                })
        
        # التوصيات
        if analysis['slow_queries']:
            analysis['recommendations'].append("يوجد استعلامات بطيئة تحتاج لتحسين")
        
        if analysis['unused_indexes']:
            analysis['recommendations'].append("يوجد فهارس غير مستخدمة يمكن حذفها")
        
        return analysis
    
    def optimize_database(self) -> List[PerformanceOptimization]:
        """تحسين قاعدة البيانات"""
        optimizations = []
        
        # تحليل الأداء
        analysis = self.analyze_database_performance()
        
        # تحسين الاستعلامات البطيئة
        for slow_query in analysis['slow_queries']:
            optimization = self._optimize_slow_query(slow_query)
            if optimization:
                optimizations.append(optimization)
        
        # حذف الفهارس غير المستخدمة
        for unused_index in analysis['unused_indexes']:
            optimization = self._remove_unused_index(unused_index)
            if optimization:
                optimizations.append(optimization)
        
        return optimizations
    
    def _optimize_slow_query(self, slow_query: Dict) -> Optional[PerformanceOptimization]:
        """تحسين استعلام بطيء"""
        # هذا مثال مبسط - في التطبيق الحقيقي ستحتاج لتحليل أكثر تعقيداً
        query = slow_query['query']
        
        # البحث عن استعلامات SELECT بدون WHERE
        if 'SELECT' in query.upper() and 'WHERE' not in query.upper():
            optimization = PerformanceOptimization.objects.create(
                name=f"تحسين استعلام: {query[:50]}...",
                description="إضافة فهارس أو تحسين الاستعلام",
                optimization_type='query',
                before_performance=slow_query['execution_time'],
                after_performance=slow_query['execution_time'] * 0.5,  # تحسين افتراضي
                improvement_percentage=50.0,
                created_by=None  # يمكن تمرير المستخدم هنا
            )
            
            return optimization
        
        return None
    
    def _remove_unused_index(self, unused_index: Dict) -> Optional[PerformanceOptimization]:
        """حذف فهرس غير مستخدم"""
        optimization = PerformanceOptimization.objects.create(
            name=f"حذف فهرس غير مستخدم: {unused_index['index']}",
            description=f"حذف فهرس {unused_index['index']} من جدول {unused_index['table']}",
            optimization_type='index',
            sql_script=f"DROP INDEX IF EXISTS {unused_index['index']};",
            before_performance=0,  # لا يمكن قياسه مباشرة
            after_performance=0,
            improvement_percentage=0,
            created_by=None
        )
        
        return optimization
    
    def get_performance_dashboard_data(self) -> Dict:
        """الحصول على بيانات لوحة تحكم الأداء"""
        now = timezone.now()
        last_hour = now - timedelta(hours=1)
        last_24_hours = now - timedelta(hours=24)
        
        # المقاييس الأخيرة
        recent_metrics = PerformanceMeasurement.objects.filter(
            timestamp__gte=last_hour
        ).values('metric').annotate(
            avg_value=models.Avg('value'),
            max_value=models.Max('value'),
            min_value=models.Min('value')
        )
        
        # الاستعلامات البطيئة
        slow_queries_count = SlowQuery.objects.filter(
            timestamp__gte=last_24_hours
        ).count()
        
        # العروض المادية
        materialized_views_count = MaterializedView.objects.filter(is_active=True).count()
        
        # التحسينات المطبقة
        applied_optimizations = PerformanceOptimization.objects.filter(is_applied=True).count()
        
        return {
            'recent_metrics': list(recent_metrics),
            'slow_queries_count': slow_queries_count,
            'materialized_views_count': materialized_views_count,
            'applied_optimizations': applied_optimizations,
            'system_info': {
                'memory_usage': psutil.virtual_memory().percent,
                'cpu_usage': psutil.cpu_percent(),
                'disk_usage': psutil.disk_usage('/').percent,
            }
        }


# وظائف مساعدة
def create_performance_thresholds():
    """إنشاء عتبات الأداء الافتراضية"""
    thresholds = [
        {
            'metric': PerformanceMetric.RESPONSE_TIME,
            'threshold_value': 2000,  # 2 seconds
            'threshold_type': 'greater_than',
            'alert_type': PerformanceAlert.HIGH_RESPONSE_TIME
        },
        {
            'metric': PerformanceMetric.MEMORY_USAGE,
            'threshold_value': 80,  # 80%
            'threshold_type': 'greater_than',
            'alert_type': PerformanceAlert.HIGH_MEMORY_USAGE
        },
        {
            'metric': PerformanceMetric.CPU_USAGE,
            'threshold_value': 80,  # 80%
            'threshold_type': 'greater_than',
            'alert_type': PerformanceAlert.HIGH_CPU_USAGE
        },
        {
            'metric': PerformanceMetric.CACHE_HIT_RATIO,
            'threshold_value': 70,  # 70%
            'threshold_type': 'less_than',
            'alert_type': PerformanceAlert.LOW_CACHE_HIT_RATIO
        }
    ]
    
    for threshold_data in thresholds:
        PerformanceThreshold.objects.get_or_create(
            metric=threshold_data['metric'],
            alert_type=threshold_data['alert_type'],
            defaults=threshold_data
        )


def start_performance_monitoring():
    """بدء مراقبة الأداء"""
    def monitor():
        service = PerformanceService()
        while True:
            try:
                service.collect_metrics()
                service.check_thresholds()
                time.sleep(60)  # كل دقيقة
            except Exception as e:
                logger.error(f"Error in performance monitoring: {str(e)}")
                time.sleep(60)
    
    # تشغيل المراقبة في خيط منفصل
    monitor_thread = threading.Thread(target=monitor, daemon=True)
    monitor_thread.start()