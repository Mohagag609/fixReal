"""
الصفحات الفرعية - Detail Views
تحتوي على جميع الصفحات الفرعية للكائنات المختلفة
"""

from django.shortcuts import render, get_object_or_404
from django.views.generic import DetailView
from django.http import JsonResponse
from django.db import transaction
from django.utils import timezone
from datetime import date, timedelta
from collections import defaultdict

from .models import (
    Partner, Unit, Contract, Installment, Voucher, Safe, Broker, 
    Customer, PartnerGroup, PartnerDailyTransaction, PartnerLedger
)


class PartnerDetailView(DetailView):
    """تفاصيل الشريك مع نظام الإيراد والمصروف اليومي"""
    model = Partner
    template_name = 'accounting_app/partners/detail.html'
    context_object_name = 'partner'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        partner = self.get_object()
        
        # Get date range from query parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            from datetime import datetime
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        # Get partner data
        context['unit_partners'] = partner.unit_partners.filter(deleted_at__isnull=True)
        context['daily_transactions'] = partner.daily_transactions.filter(
            transaction_date__range=[start_date, end_date],
            deleted_at__isnull=True
        ).order_by('transaction_date', 'created_at')
        
        # Calculate totals
        context['total_income'] = partner.get_daily_income(end_date)
        context['total_expense'] = partner.get_daily_expense(end_date)
        context['net_balance'] = partner.get_daily_balance(end_date)
        context['running_balance'] = partner.get_running_balance(end_date)
        
        # Generate daily ledger
        context['daily_ledger'] = partner.generate_daily_ledger(start_date, end_date)
        
        # Get transactions by day
        context['transactions_by_day'] = self.get_transactions_by_day(partner, start_date, end_date)
        
        context['start_date'] = start_date
        context['end_date'] = end_date
        
        return context
    
    def get_transactions_by_day(self, partner, start_date, end_date):
        """تجميع المعاملات حسب اليوم"""
        transactions = partner.daily_transactions.filter(
            transaction_date__range=[start_date, end_date],
            deleted_at__isnull=True
        ).order_by('transaction_date', 'created_at')
        
        transactions_by_day = defaultdict(list)
        for transaction in transactions:
            date_key = transaction.transaction_date.strftime('%Y-%m-%d')
            transactions_by_day[date_key].append(transaction)
        
        return dict(transactions_by_day)


class UnitDetailView(DetailView):
    """تفاصيل الوحدة"""
    model = Unit
    template_name = 'accounting_app/units/detail.html'
    context_object_name = 'unit'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        unit = self.get_object()
        
        # Get related data
        context['unit_partners'] = unit.unit_partners.filter(deleted_at__isnull=True)
        context['contracts'] = unit.contracts.filter(deleted_at__isnull=True)
        context['installments'] = unit.installments.filter(deleted_at__isnull=True)
        context['vouchers'] = unit.vouchers.filter(deleted_at__isnull=True)
        
        # Get partner groups
        context['partner_groups'] = PartnerGroup.objects.filter(
            unit_partner_groups__unit=unit,
            unit_partner_groups__deleted_at__isnull=True
        ).distinct()
        
        # Calculate unit statistics
        context['total_partners'] = context['unit_partners'].count()
        context['total_contracts'] = context['contracts'].count()
        context['total_installments'] = context['installments'].count()
        context['total_vouchers'] = context['vouchers'].count()
        
        # Check if unit is available
        context['is_available'] = unit.is_available()
        context['has_contract'] = unit.get_contract() is not None
        
        return context


class ContractDetailView(DetailView):
    """تفاصيل العقد"""
    model = Contract
    template_name = 'accounting_app/contracts/detail.html'
    context_object_name = 'contract'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        contract = self.get_object()
        
        # Get related data
        context['installments'] = contract.unit.installments.filter(deleted_at__isnull=True)
        context['vouchers'] = Voucher.objects.filter(
            linked_ref=contract.unit.id,
            deleted_at__isnull=True
        )
        
        # Calculate contract totals
        context['total_installments'] = contract.get_total_installments()
        context['installment_base_amount'] = contract.get_installment_base_amount()
        context['remaining_after_annual'] = contract.get_remaining_after_annual_payments()
        context['regular_installment_amount'] = contract.get_regular_installment_amount()
        
        # Calculate payment summary
        context['total_paid'] = context['installments'].filter(status='مدفوع').aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        
        context['total_pending'] = context['installments'].filter(status='غير مدفوع').aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        
        context['payment_progress'] = (
            (context['total_paid'] / contract.total_price) * 100 
            if contract.total_price > 0 else 0
        )
        
        return context


class InstallmentDetailView(DetailView):
    """تفاصيل القسط"""
    model = Installment
    template_name = 'accounting_app/installments/detail.html'
    context_object_name = 'installment'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        installment = self.get_object()
        
        # Get related data
        context['contract'] = installment.unit.get_contract()
        context['unit'] = installment.unit
        
        # Calculate installment data
        context['is_overdue'] = installment.is_overdue()
        context['days_overdue'] = installment.get_days_overdue()
        
        # Get installment history
        context['installment_history'] = installment.unit.installments.filter(
            deleted_at__isnull=True
        ).order_by('due_date')
        
        return context


class VoucherDetailView(DetailView):
    """تفاصيل السند"""
    model = Voucher
    template_name = 'accounting_app/vouchers/detail.html'
    context_object_name = 'voucher'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        voucher = self.get_object()
        
        # Get related data
        context['safe'] = voucher.safe
        context['unit'] = voucher.unit
        
        # Get voucher history for the same safe
        context['safe_vouchers'] = voucher.safe.vouchers.filter(
            deleted_at__isnull=True
        ).order_by('-date')[:10]
        
        return context


class SafeDetailView(DetailView):
    """تفاصيل الخزنة"""
    model = Safe
    template_name = 'accounting_app/safes/detail.html'
    context_object_name = 'safe'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        safe = self.get_object()
        
        # Get related data
        context['vouchers'] = safe.vouchers.filter(deleted_at__isnull=True).order_by('-date')
        context['transfers_from'] = safe.transfers_from.filter(deleted_at__isnull=True).order_by('-created_at')
        context['transfers_to'] = safe.transfers_to.filter(deleted_at__isnull=True).order_by('-created_at')
        
        # Calculate safe totals
        context['total_receipts'] = safe.get_total_receipts()
        context['total_payments'] = safe.get_total_payments()
        context['transfers_in'] = safe.get_transfers_in()
        context['transfers_out'] = safe.get_transfers_out()
        context['calculated_balance'] = safe.calculate_balance()
        
        # Get recent transactions
        context['recent_vouchers'] = context['vouchers'][:10]
        context['recent_transfers'] = list(context['transfers_from'][:5]) + list(context['transfers_to'][:5])
        context['recent_transfers'].sort(key=lambda x: x.created_at, reverse=True)
        context['recent_transfers'] = context['recent_transfers'][:10]
        
        return context


class BrokerDetailView(DetailView):
    """تفاصيل السمسار"""
    model = Broker
    template_name = 'accounting_app/brokers/detail.html'
    context_object_name = 'broker'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        broker = self.get_object()
        
        # Get related data
        context['broker_dues'] = broker.broker_dues.filter(deleted_at__isnull=True)
        context['contracts'] = broker.get_contracts()
        
        # Calculate broker totals
        context['total_due'] = broker.get_total_due()
        context['paid_due'] = broker.get_paid_due()
        context['pending_due'] = broker.get_pending_due()
        context['total_contracts'] = broker.get_total_contracts()
        context['total_commission'] = broker.get_total_commission()
        
        # Get recent activity
        context['recent_contracts'] = context['contracts'][:5]
        context['recent_dues'] = context['broker_dues'].order_by('-due_date')[:5]
        
        return context


class CustomerDetailView(DetailView):
    """تفاصيل العميل"""
    model = Customer
    template_name = 'accounting_app/customers/detail.html'
    context_object_name = 'customer'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        customer = self.get_object()
        
        # Get related data
        context['contracts'] = customer.get_contracts()
        context['units'] = customer.get_units()
        
        # Calculate customer totals
        context['total_contracts'] = customer.get_total_contracts()
        context['total_investment'] = customer.get_total_investment()
        context['total_down_payment'] = customer.get_total_down_payment()
        context['total_discount'] = customer.get_total_discount()
        context['total_units'] = customer.get_total_units()
        
        # Get recent activity
        context['recent_contracts'] = context['contracts'].order_by('-created_at')[:5]
        
        # Calculate payment summary
        total_paid = 0
        total_pending = 0
        for contract in context['contracts']:
            installments = contract.unit.installments.filter(deleted_at__isnull=True)
            total_paid += installments.filter(status='مدفوع').aggregate(
                total=models.Sum('amount')
            )['total'] or 0
            total_pending += installments.filter(status='غير مدفوع').aggregate(
                total=models.Sum('amount')
            )['total'] or 0
        
        context['total_paid'] = total_paid
        context['total_pending'] = total_pending
        
        return context


class PartnerGroupDetailView(DetailView):
    """تفاصيل مجموعة الشركاء"""
    model = PartnerGroup
    template_name = 'accounting_app/partner_groups/detail.html'
    context_object_name = 'partner_group'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        partner_group = self.get_object()
        
        # Get related data
        context['partners'] = partner_group.get_partners()
        context['units'] = partner_group.get_units()
        
        # Calculate group totals
        context['total_partners'] = partner_group.get_total_partners()
        context['total_percentage'] = partner_group.get_total_percentage()
        context['is_valid_percentages'] = partner_group.validate_percentages()
        context['total_units'] = partner_group.get_total_units()
        
        # Get partner details with percentages
        context['partner_details'] = []
        for partner in context['partners']:
            partner_percentage = partner_group.partner_group_partners.filter(
                partner=partner,
                deleted_at__isnull=True
            ).first()
            context['partner_details'].append({
                'partner': partner,
                'percentage': partner_percentage.percentage if partner_percentage else 0
            })
        
        return context


# API Views for AJAX
def get_partner_daily_transactions(request, partner_id):
    """الحصول على المعاملات اليومية للشريك"""
    try:
        partner = get_object_or_404(Partner, id=partner_id)
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date and end_date:
            from datetime import datetime
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        transactions = partner.daily_transactions.filter(
            transaction_date__range=[start_date, end_date],
            deleted_at__isnull=True
        ).order_by('transaction_date', 'created_at')
        
        data = []
        for transaction in transactions:
            data.append({
                'id': str(transaction.id),
                'transaction_type': transaction.transaction_type,
                'amount': float(transaction.amount),
                'description': transaction.description,
                'transaction_date': transaction.transaction_date.isoformat(),
                'partner_share': float(transaction.partner_share),
                'running_balance': float(transaction.running_balance),
            })
        
        return JsonResponse({
            'success': True,
            'data': data,
            'total_income': float(partner.get_daily_income(end_date)),
            'total_expense': float(partner.get_daily_expense(end_date)),
            'net_balance': float(partner.get_daily_balance(end_date)),
        })
    except Partner.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'الشريك غير موجود'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'خطأ في الحصول على المعاملات: {str(e)}'
        })


def create_partner_daily_transaction(request):
    """إنشاء معاملة يومية للشريك"""
    if request.method == 'POST':
        try:
            partner_id = request.POST.get('partner_id')
            unit_id = request.POST.get('unit_id')
            contract_id = request.POST.get('contract_id')
            transaction_type = request.POST.get('transaction_type')
            amount = request.POST.get('amount')
            description = request.POST.get('description')
            transaction_date = request.POST.get('transaction_date')
            
            # Validate required fields
            if not all([partner_id, transaction_type, amount, description, transaction_date]):
                return JsonResponse({
                    'success': False,
                    'error': 'جميع الحقول المطلوبة يجب أن تكون مملوءة'
                })
            
            # Create transaction
            transaction = PartnerDailyTransaction.objects.create(
                partner_id=partner_id,
                unit_id=unit_id if unit_id else None,
                contract_id=contract_id if contract_id else None,
                transaction_type=transaction_type,
                amount=amount,
                description=description,
                transaction_date=transaction_date
            )
            
            # Calculate running balance
            partner = transaction.partner
            running_balance = partner.get_running_balance(transaction.transaction_date)
            transaction.running_balance = running_balance
            transaction.save()
            
            return JsonResponse({
                'success': True,
                'message': 'تم إنشاء المعاملة بنجاح',
                'data': {
                    'id': str(transaction.id),
                    'transaction_type': transaction.transaction_type,
                    'amount': float(transaction.amount),
                    'description': transaction.description,
                    'transaction_date': transaction.transaction_date.isoformat(),
                    'partner_share': float(transaction.partner_share),
                    'running_balance': float(transaction.running_balance),
                }
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': f'خطأ في إنشاء المعاملة: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'error': 'طريقة غير صحيحة'
    })


def get_partner_monthly_summary(request, partner_id):
    """الحصول على الملخص الشهري للشريك"""
    try:
        partner = get_object_or_404(Partner, id=partner_id)
        year = int(request.GET.get('year', date.today().year))
        month = int(request.GET.get('month', date.today().month))
        
        summary = partner.get_monthly_summary(year, month)
        
        return JsonResponse({
            'success': True,
            'data': {
                'year': year,
                'month': month,
                'total_income': float(summary['total_income']),
                'total_expense': float(summary['total_expense']),
                'net_balance': float(summary['net_balance']),
                'transaction_count': summary['transaction_count']
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'خطأ في الحصول على الملخص الشهري: {str(e)}'
        })


def get_unit_partners(request, unit_id):
    """الحصول على شركاء الوحدة"""
    try:
        unit = get_object_or_404(Unit, id=unit_id)
        unit_partners = unit.unit_partners.filter(deleted_at__isnull=True)
        
        data = []
        for up in unit_partners:
            data.append({
                'id': str(up.id),
                'partner_name': up.partner.name,
                'percentage': float(up.percentage),
                'created_at': up.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'data': data,
            'total_percentage': float(unit.get_total_partner_percentage()),
            'is_valid_percentages': unit.validate_partner_percentages()
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'خطأ في الحصول على شركاء الوحدة: {str(e)}'
        })


def get_contract_installments(request, contract_id):
    """الحصول على أقساط العقد"""
    try:
        contract = get_object_or_404(Contract, id=contract_id)
        installments = contract.unit.installments.filter(deleted_at__isnull=True).order_by('due_date')
        
        data = []
        for installment in installments:
            data.append({
                'id': str(installment.id),
                'amount': float(installment.amount),
                'due_date': installment.due_date.isoformat(),
                'status': installment.status,
                'notes': installment.notes,
                'is_overdue': installment.is_overdue(),
                'days_overdue': installment.get_days_overdue()
            })
        
        return JsonResponse({
            'success': True,
            'data': data,
            'total_installments': len(data),
            'paid_installments': len([i for i in data if i['status'] == 'مدفوع']),
            'pending_installments': len([i for i in data if i['status'] == 'غير مدفوع'])
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'خطأ في الحصول على أقساط العقد: {str(e)}'
        })


def get_safe_transactions(request, safe_id):
    """الحصول على معاملات الخزنة"""
    try:
        safe = get_object_or_404(Safe, id=safe_id)
        vouchers = safe.vouchers.filter(deleted_at__isnull=True).order_by('-date')
        
        data = []
        for voucher in vouchers:
            data.append({
                'id': str(voucher.id),
                'type': voucher.type,
                'amount': float(voucher.amount),
                'date': voucher.date.isoformat(),
                'description': voucher.description,
                'payer': voucher.payer,
                'beneficiary': voucher.beneficiary
            })
        
        return JsonResponse({
            'success': True,
            'data': data,
            'total_receipts': float(safe.get_total_receipts()),
            'total_payments': float(safe.get_total_payments()),
            'current_balance': float(safe.balance)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'خطأ في الحصول على معاملات الخزنة: {str(e)}'
        })