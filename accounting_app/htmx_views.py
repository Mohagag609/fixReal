"""
HTMX views for dynamic interactions
"""
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from decimal import Decimal
import json

from .models import Customer, Unit, Safe, Installment, Voucher
from .services.financial_services import VoucherService, InstallmentService


@require_http_methods(["GET"])
def get_customers_htmx(request):
    """HTMX endpoint for customer search"""
    search = request.GET.get('search', '')
    customers = Customer.objects.filter(
        deleted_at__isnull=True,
        name__icontains=search
    )[:10]
    
    html = render(request, 'accounting_app/htmx/customer_list.html', {
        'customers': customers
    }).content.decode('utf-8')
    
    return JsonResponse({
        'success': True,
        'html': html,
        'count': customers.count()
    })


@require_http_methods(["GET"])
def get_units_htmx(request):
    """HTMX endpoint for unit search"""
    search = request.GET.get('search', '')
    units = Unit.objects.filter(
        deleted_at__isnull=True
    ).filter(
        name__icontains=search
    )[:10]
    
    html = render(request, 'accounting_app/htmx/unit_list.html', {
        'units': units
    }).content.decode('utf-8')
    
    return JsonResponse({
        'success': True,
        'html': html,
        'count': units.count()
    })


@require_http_methods(["GET"])
def get_safes_htmx(request):
    """HTMX endpoint for safe list"""
    safes = Safe.objects.filter(deleted_at__isnull=True).order_by('name')
    
    html = render(request, 'accounting_app/htmx/safe_list.html', {
        'safes': safes
    }).content.decode('utf-8')
    
    return JsonResponse({
        'success': True,
        'html': html,
        'count': safes.count()
    })


@require_http_methods(["POST"])
@csrf_exempt
def update_installment_status_htmx(request, installment_id):
    """HTMX endpoint for updating installment status"""
    try:
        installment = get_object_or_404(Installment, id=installment_id, deleted_at__isnull=True)
        data = json.loads(request.body)
        new_status = data.get('status')
        
        if new_status not in ['معلق', 'مدفوع', 'متأخر']:
            return JsonResponse({
                'success': False,
                'message': 'حالة غير صحيحة'
            })
        
        installment.status = new_status
        installment.save()
        
        html = render(request, 'accounting_app/htmx/installment_row.html', {
            'installment': installment
        }).content.decode('utf-8')
        
        return JsonResponse({
            'success': True,
            'html': html,
            'message': 'تم تحديث حالة القسط بنجاح'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطأ في تحديث القسط: {str(e)}'
        })


@require_http_methods(["POST"])
@csrf_exempt
def create_voucher_htmx(request):
    """HTMX endpoint for creating voucher"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['type', 'date', 'amount', 'safe_id', 'description']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'message': f'الحقل {field} مطلوب'
                })
        
        # Get safe
        safe = get_object_or_404(Safe, id=data['safe_id'], deleted_at__isnull=True)
        
        # Validate amount
        try:
            amount = Decimal(str(data['amount']))
            if amount <= 0:
                return JsonResponse({
                    'success': False,
                    'message': 'المبلغ يجب أن يكون أكبر من صفر'
                })
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': 'مبلغ غير صحيح'
            })
        
        # Create voucher
        voucher_data = {
            'type': data['type'],
            'date': timezone.datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
            'amount': amount,
            'safe': safe,
            'description': data['description'],
            'payer': data.get('payer', ''),
            'beneficiary': data.get('beneficiary', ''),
            'linked_ref': data.get('linked_ref', ''),
        }
        
        voucher = VoucherService.create_voucher(voucher_data)
        
        # Get updated safe balance
        safe.refresh_from_db()
        
        html = render(request, 'accounting_app/htmx/voucher_row.html', {
            'voucher': voucher
        }).content.decode('utf-8')
        
        return JsonResponse({
            'success': True,
            'html': html,
            'message': 'تم إضافة السند بنجاح',
            'safe_balance': float(safe.balance)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطأ في إنشاء السند: {str(e)}'
        })


@require_http_methods(["GET"])
def get_dashboard_stats_htmx(request):
    """HTMX endpoint for dashboard statistics"""
    try:
        # Get contract statistics
        contract_stats = ContractService.get_contract_statistics()
        
        # Get installment statistics
        pending_installments = InstallmentService.get_pending_installments_count()
        total_paid = InstallmentService.get_total_paid_installments()
        
        # Get customer count
        total_customers = Customer.objects.filter(deleted_at__isnull=True).count()
        
        # Get unit count
        total_units = Unit.objects.filter(deleted_at__isnull=True).count()
        
        stats = {
            'total_contracts': contract_stats['total_contracts'],
            'total_contracts_value': float(contract_stats['total_value']),
            'total_customers': total_customers,
            'total_units': total_units,
            'pending_installments': pending_installments,
            'total_paid_installments': float(total_paid)
        }
        
        html = render(request, 'accounting_app/htmx/dashboard_stats.html', {
            'stats': stats
        }).content.decode('utf-8')
        
        return JsonResponse({
            'success': True,
            'html': html,
            'stats': stats
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطأ في جلب الإحصائيات: {str(e)}'
        })


@require_http_methods(["GET"])
def get_safe_balance_htmx(request, safe_id):
    """HTMX endpoint for getting safe balance"""
    try:
        safe = get_object_or_404(Safe, id=safe_id, deleted_at__isnull=True)
        
        html = render(request, 'accounting_app/htmx/safe_balance.html', {
            'safe': safe
        }).content.decode('utf-8')
        
        return JsonResponse({
            'success': True,
            'html': html,
            'balance': float(safe.balance)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطأ في جلب رصيد الخزنة: {str(e)}'
        })