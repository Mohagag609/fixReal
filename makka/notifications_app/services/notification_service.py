from django.utils import timezone
from datetime import datetime, timedelta
from ..models import Notification
from realpp.models import Contract, Installment, Customer, Unit

class NotificationService:
    def __init__(self):
        pass
    
    def create_notification(self, message, notification_type='info', user_id=1, related_object=None):
        """إنشاء إشعار جديد"""
        try:
            notification = Notification.objects.create(
                message=message,
                notification_type=notification_type,
                is_read=False,
                user_id=user_id,
                related_object_id=related_object.id if related_object else None,
                related_object_type=related_object.__class__.__name__ if related_object else None
            )
            
            return {
                'status': 'success',
                'notification_id': notification.id,
                'message': 'تم إنشاء الإشعار بنجاح'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إنشاء الإشعار: {str(e)}'
            }
    
    def send_contract_notification(self, contract_id):
        """إرسال إشعار عقد جديد"""
        try:
            contract = Contract.objects.get(id=contract_id)
            
            message = f"تم إنشاء عقد جديد رقم {contract.contract_number} للعميل {contract.customer.name}"
            
            return self.create_notification(
                message=message,
                notification_type='contract',
                related_object=contract
            )
        except Contract.DoesNotExist:
            return {
                'status': 'error',
                'message': 'العقد غير موجود'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إرسال إشعار العقد: {str(e)}'
            }
    
    def send_payment_notification(self, installment_id):
        """إرسال إشعار دفعة جديدة"""
        try:
            installment = Installment.objects.get(id=installment_id)
            
            message = f"تم استلام دفعة بقيمة {installment.paid_amount} ريال للعقد {installment.contract.contract_number}"
            
            return self.create_notification(
                message=message,
                notification_type='payment',
                related_object=installment
            )
        except Installment.DoesNotExist:
            return {
                'status': 'error',
                'message': 'الدفعة غير موجودة'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إرسال إشعار الدفعة: {str(e)}'
            }
    
    def send_due_notification(self, installment_id):
        """إرسال إشعار استحقاق"""
        try:
            installment = Installment.objects.get(id=installment_id)
            
            message = f"استحقاق دفعة بقيمة {installment.due_amount} ريال للعقد {installment.contract.contract_number} في {installment.due_date}"
            
            return self.create_notification(
                message=message,
                notification_type='due',
                related_object=installment
            )
        except Installment.DoesNotExist:
            return {
                'status': 'error',
                'message': 'الدفعة غير موجودة'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إرسال إشعار الاستحقاق: {str(e)}'
            }
    
    def check_overdue_installments(self):
        """فحص الدفعات المتأخرة"""
        try:
            today = timezone.now().date()
            overdue_installments = Installment.objects.filter(
                due_date__lt=today,
                status__in=['unpaid', 'partially_paid']
            )
            
            notifications_created = 0
            for installment in overdue_installments:
                message = f"دفعة متأخرة بقيمة {installment.due_amount} ريال للعقد {installment.contract.contract_number}"
                
                # التحقق من وجود إشعار سابق
                existing_notification = Notification.objects.filter(
                    message__icontains=installment.contract.contract_number,
                    notification_type='overdue',
                    created_at__gte=today - timedelta(days=1)
                ).first()
                
                if not existing_notification:
                    self.create_notification(
                        message=message,
                        notification_type='overdue',
                        related_object=installment
                    )
                    notifications_created += 1
            
            return {
                'status': 'success',
                'overdue_count': overdue_installments.count(),
                'notifications_created': notifications_created
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في فحص الدفعات المتأخرة: {str(e)}'
            }
    
    def check_upcoming_due_installments(self, days_ahead=3):
        """فحص الدفعات القادمة"""
        try:
            today = timezone.now().date()
            future_date = today + timedelta(days=days_ahead)
            
            upcoming_installments = Installment.objects.filter(
                due_date__range=[today, future_date],
                status__in=['unpaid', 'partially_paid']
            )
            
            notifications_created = 0
            for installment in upcoming_installments:
                days_until_due = (installment.due_date - today).days
                message = f"دفعة مستحقة خلال {days_until_due} أيام بقيمة {installment.due_amount} ريال للعقد {installment.contract.contract_number}"
                
                # التحقق من وجود إشعار سابق
                existing_notification = Notification.objects.filter(
                    message__icontains=installment.contract.contract_number,
                    notification_type='upcoming_due',
                    created_at__gte=today - timedelta(days=1)
                ).first()
                
                if not existing_notification:
                    self.create_notification(
                        message=message,
                        notification_type='upcoming_due',
                        related_object=installment
                    )
                    notifications_created += 1
            
            return {
                'status': 'success',
                'upcoming_count': upcoming_installments.count(),
                'notifications_created': notifications_created
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في فحص الدفعات القادمة: {str(e)}'
            }
    
    def send_low_balance_notification(self, safe_id, threshold=1000):
        """إرسال إشعار رصيد منخفض"""
        try:
            from realpp.models import Safe
            safe = Safe.objects.get(id=safe_id)
            
            if safe.balance < threshold:
                message = f"رصيد منخفض في الخزينة {safe.name}: {safe.balance} ريال"
                
                return self.create_notification(
                    message=message,
                    notification_type='low_balance',
                    related_object=safe
                )
            else:
                return {
                    'status': 'info',
                    'message': 'الرصيد طبيعي'
                }
        except Safe.DoesNotExist:
            return {
                'status': 'error',
                'message': 'الخزينة غير موجودة'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إرسال إشعار الرصيد المنخفض: {str(e)}'
            }
    
    def send_new_customer_notification(self, customer_id):
        """إرسال إشعار عميل جديد"""
        try:
            customer = Customer.objects.get(id=customer_id)
            
            message = f"تم تسجيل عميل جديد: {customer.name}"
            
            return self.create_notification(
                message=message,
                notification_type='new_customer',
                related_object=customer
            )
        except Customer.DoesNotExist:
            return {
                'status': 'error',
                'message': 'العميل غير موجود'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إرسال إشعار العميل الجديد: {str(e)}'
            }
    
    def send_new_unit_notification(self, unit_id):
        """إرسال إشعار وحدة جديدة"""
        try:
            unit = Unit.objects.get(id=unit_id)
            
            message = f"تم إضافة وحدة جديدة: {unit.unit_number} في {unit.building}"
            
            return self.create_notification(
                message=message,
                notification_type='new_unit',
                related_object=unit
            )
        except Unit.DoesNotExist:
            return {
                'status': 'error',
                'message': 'الوحدة غير موجودة'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إرسال إشعار الوحدة الجديدة: {str(e)}'
            }
    
    def cleanup_old_notifications(self, days_old=30):
        """تنظيف الإشعارات القديمة"""
        try:
            cutoff_date = timezone.now() - timedelta(days=days_old)
            old_notifications = Notification.objects.filter(created_at__lt=cutoff_date)
            count = old_notifications.count()
            old_notifications.delete()
            
            return {
                'status': 'success',
                'deleted_count': count,
                'message': f'تم حذف {count} إشعار قديم'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تنظيف الإشعارات: {str(e)}'
            }
    
    def get_notification_stats(self):
        """إحصائيات الإشعارات"""
        try:
            today = timezone.now().date()
            
            stats = {
                'total': Notification.objects.count(),
                'unread': Notification.objects.filter(is_read=False).count(),
                'read': Notification.objects.filter(is_read=True).count(),
                'today': Notification.objects.filter(created_at__date=today).count(),
                'this_week': Notification.objects.filter(
                    created_at__gte=today - timedelta(days=7)
                ).count(),
                'this_month': Notification.objects.filter(
                    created_at__gte=today - timedelta(days=30)
                ).count(),
            }
            
            # إحصائيات حسب النوع
            type_stats = {}
            for notification_type in Notification.objects.values_list('notification_type', flat=True).distinct():
                type_stats[notification_type] = Notification.objects.filter(
                    notification_type=notification_type
                ).count()
            
            stats['by_type'] = type_stats
            
            return {
                'status': 'success',
                'stats': stats
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في إحصائيات الإشعارات: {str(e)}'
            }

# إنشاء مثيل الخدمة
notification_service = NotificationService()