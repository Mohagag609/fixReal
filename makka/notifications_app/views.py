from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Q
from .models import Notification
from .services import notification_service
import json

def notifications_dashboard(request):
    """لوحة تحكم الإشعارات"""
    try:
        # الإشعارات غير المقروءة
        unread_notifications = Notification.objects.filter(is_read=False).order_by('-created_at')[:10]
        
        # جميع الإشعارات
        all_notifications = Notification.objects.all().order_by('-created_at')[:50]
        
        # إحصائيات
        stats = {
            'total': Notification.objects.count(),
            'unread': Notification.objects.filter(is_read=False).count(),
            'read': Notification.objects.filter(is_read=True).count(),
            'today': Notification.objects.filter(created_at__date=timezone.now().date()).count(),
        }
        
        context = {
            'unread_notifications': unread_notifications,
            'all_notifications': all_notifications,
            'stats': stats,
        }
        return render(request, 'notifications_app/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة الإشعارات: {str(e)}')
        return render(request, 'notifications_app/dashboard.html', {})

def notification_list(request):
    """قائمة الإشعارات"""
    try:
        # فلترة
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # بناء الاستعلام
        notifications = Notification.objects.all()
        
        if search:
            notifications = notifications.filter(
                Q(message__icontains=search) |
                Q(notification_type__icontains=search)
            )
        
        if status_filter == 'read':
            notifications = notifications.filter(is_read=True)
        elif status_filter == 'unread':
            notifications = notifications.filter(is_read=False)
        
        if date_from:
            notifications = notifications.filter(created_at__gte=date_from)
        
        if date_to:
            notifications = notifications.filter(created_at__lte=date_to)
        
        # إحصائيات
        stats = {
            'total': notifications.count(),
            'read': notifications.filter(is_read=True).count(),
            'unread': notifications.filter(is_read=False).count(),
        }
        
        context = {
            'notifications': notifications.order_by('-created_at'),
            'stats': stats,
            'search': search,
            'status_filter': status_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'notifications_app/list.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في قائمة الإشعارات: {str(e)}')
        return redirect('notifications_dashboard')

def notification_detail(request, pk):
    """تفاصيل الإشعار"""
    try:
        notification = get_object_or_404(Notification, pk=pk)
        
        # وضع علامة مقروء
        if not notification.is_read:
            notification.is_read = True
            notification.save()
        
        context = {
            'notification': notification,
        }
        return render(request, 'notifications_app/detail.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تفاصيل الإشعار: {str(e)}')
        return redirect('notifications_dashboard')

@require_http_methods(["POST"])
def mark_as_read(request, pk):
    """وضع علامة مقروء"""
    try:
        notification = get_object_or_404(Notification, pk=pk)
        notification.is_read = True
        notification.save()
        
        return JsonResponse({'status': 'success', 'message': 'تم وضع علامة مقروء'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
def mark_as_unread(request, pk):
    """وضع علامة غير مقروء"""
    try:
        notification = get_object_or_404(Notification, pk=pk)
        notification.is_read = False
        notification.save()
        
        return JsonResponse({'status': 'success', 'message': 'تم وضع علامة غير مقروء'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
def mark_all_as_read(request):
    """وضع علامة مقروء لجميع الإشعارات"""
    try:
        Notification.objects.filter(is_read=False).update(is_read=True)
        
        return JsonResponse({'status': 'success', 'message': 'تم وضع علامة مقروء لجميع الإشعارات'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
def delete_notification(request, pk):
    """حذف الإشعار"""
    try:
        notification = get_object_or_404(Notification, pk=pk)
        notification.delete()
        
        return JsonResponse({'status': 'success', 'message': 'تم حذف الإشعار'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@require_http_methods(["POST"])
def delete_all_notifications(request):
    """حذف جميع الإشعارات"""
    try:
        Notification.objects.all().delete()
        
        return JsonResponse({'status': 'success', 'message': 'تم حذف جميع الإشعارات'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

def get_unread_count(request):
    """عدد الإشعارات غير المقروءة"""
    try:
        count = Notification.objects.filter(is_read=False).count()
        return JsonResponse({'count': count})
    except Exception as e:
        return JsonResponse({'count': 0})

def create_notification(request):
    """إنشاء إشعار جديد"""
    try:
        if request.method == 'POST':
            data = json.loads(request.body)
            
            notification = Notification.objects.create(
                message=data.get('message', ''),
                notification_type=data.get('type', 'info'),
                is_read=False,
                user_id=data.get('user_id', 1)  # افتراضي
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'تم إنشاء الإشعار',
                'notification_id': notification.id
            })
        else:
            return JsonResponse({'error': 'Method not allowed'}, status=405)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def send_contract_notification(request, contract_id):
    """إرسال إشعار عقد جديد"""
    try:
        result = notification_service.send_contract_notification(contract_id)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def send_payment_notification(request, installment_id):
    """إرسال إشعار دفعة جديدة"""
    try:
        result = notification_service.send_payment_notification(installment_id)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def send_due_notification(request, installment_id):
    """إرسال إشعار استحقاق"""
    try:
        result = notification_service.send_due_notification(installment_id)
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)