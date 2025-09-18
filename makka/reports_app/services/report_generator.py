from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from realpp.models import Customer, Unit, Contract, Safe, Voucher, Partner, Broker, Installment

class ReportGenerator:
    def __init__(self):
        pass
    
    def generate_customers_report(self, filters=None):
        """توليد تقرير العملاء"""
        try:
            customers = Customer.objects.all()
            
            if filters:
                if filters.get('search'):
                    customers = customers.filter(
                        Q(name__icontains=filters['search']) |
                        Q(phone__icontains=filters['search']) |
                        Q(national_id__icontains=filters['search'])
                    )
                
                if filters.get('date_from'):
                    customers = customers.filter(created_at__gte=filters['date_from'])
                
                if filters.get('date_to'):
                    customers = customers.filter(created_at__lte=filters['date_to'])
            
            # إحصائيات
            stats = {
                'total_customers': customers.count(),
                'with_contracts': customers.filter(contract__isnull=False).distinct().count(),
                'without_contracts': customers.filter(contract__isnull=True).count(),
                'new_this_month': customers.filter(created_at__gte=timezone.now().replace(day=1)).count(),
            }
            
            # تفاصيل العملاء
            customers_data = []
            for customer in customers.order_by('-created_at'):
                contracts_count = customer.contract_set.count()
                total_contracts_value = customer.contract_set.aggregate(Sum('total_price'))['total_price__sum'] or 0
                
                customers_data.append({
                    'id': customer.id,
                    'name': customer.name,
                    'phone': customer.phone,
                    'national_id': customer.national_id,
                    'email': customer.email,
                    'address': customer.address,
                    'created_at': customer.created_at,
                    'contracts_count': contracts_count,
                    'total_contracts_value': total_contracts_value,
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'data': customers_data,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في توليد تقرير العملاء: {str(e)}'
            }
    
    def generate_contracts_report(self, filters=None):
        """توليد تقرير العقود"""
        try:
            contracts = Contract.objects.select_related('customer', 'unit', 'broker')
            
            if filters:
                if filters.get('search'):
                    contracts = contracts.filter(
                        Q(customer__name__icontains=filters['search']) |
                        Q(unit__unit_number__icontains=filters['search']) |
                        Q(contract_number__icontains=filters['search'])
                    )
                
                if filters.get('status'):
                    contracts = contracts.filter(status=filters['status'])
                
                if filters.get('date_from'):
                    contracts = contracts.filter(contract_date__gte=filters['date_from'])
                
                if filters.get('date_to'):
                    contracts = contracts.filter(contract_date__lte=filters['date_to'])
            
            # إحصائيات
            stats = {
                'total_contracts': contracts.count(),
                'total_value': contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0,
                'average_value': contracts.aggregate(Avg('total_price'))['total_price__avg'] or 0,
                'active_contracts': contracts.filter(status='active').count(),
                'completed_contracts': contracts.filter(status='completed').count(),
                'cancelled_contracts': contracts.filter(status='cancelled').count(),
            }
            
            # تفاصيل العقود
            contracts_data = []
            for contract in contracts.order_by('-contract_date'):
                installments_count = contract.installment_set.count()
                paid_installments = contract.installment_set.filter(status='paid').count()
                remaining_amount = contract.total_price - contract.down_payment
                
                contracts_data.append({
                    'id': contract.id,
                    'contract_number': contract.contract_number,
                    'customer_name': contract.customer.name if contract.customer else '',
                    'unit_number': contract.unit.unit_number if contract.unit else '',
                    'contract_date': contract.contract_date,
                    'total_price': contract.total_price,
                    'down_payment': contract.down_payment,
                    'remaining_amount': remaining_amount,
                    'installment_type': contract.installment_type,
                    'number_of_installments': contract.number_of_installments,
                    'status': contract.status,
                    'installments_count': installments_count,
                    'paid_installments': paid_installments,
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'data': contracts_data,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في توليد تقرير العقود: {str(e)}'
            }
    
    def generate_units_report(self, filters=None):
        """توليد تقرير الوحدات"""
        try:
            units = Unit.objects.all()
            
            if filters:
                if filters.get('search'):
                    units = units.filter(
                        Q(unit_number__icontains=filters['search']) |
                        Q(building__icontains=filters['search']) |
                        Q(description__icontains=filters['search'])
                    )
                
                if filters.get('status'):
                    units = units.filter(status=filters['status'])
                
                if filters.get('unit_type'):
                    units = units.filter(unit_type=filters['unit_type'])
                
                if filters.get('building'):
                    units = units.filter(building__icontains=filters['building'])
            
            # إحصائيات
            stats = {
                'total_units': units.count(),
                'available_units': units.filter(status='available').count(),
                'sold_units': units.filter(status='sold').count(),
                'rented_units': units.filter(status='rented').count(),
                'total_value': units.aggregate(Sum('price'))['price__sum'] or 0,
                'average_price': units.aggregate(Avg('price'))['price__avg'] or 0,
                'total_area': units.aggregate(Sum('area'))['area__sum'] or 0,
                'average_area': units.aggregate(Avg('area'))['area__avg'] or 0,
            }
            
            # تفاصيل الوحدات
            units_data = []
            for unit in units.order_by('-created_at'):
                contracts_count = unit.contract_set.count()
                partners_count = unit.unitpartner_set.count()
                
                units_data.append({
                    'id': unit.id,
                    'unit_number': unit.unit_number,
                    'unit_code': unit.unit_code,
                    'floor': unit.floor,
                    'building': unit.building,
                    'area': unit.area,
                    'price': unit.price,
                    'status': unit.status,
                    'unit_type': unit.unit_type,
                    'description': unit.description,
                    'created_at': unit.created_at,
                    'contracts_count': contracts_count,
                    'partners_count': partners_count,
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'data': units_data,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في توليد تقرير الوحدات: {str(e)}'
            }
    
    def generate_financial_report(self, filters=None):
        """توليد التقرير المالي"""
        try:
            # تحديد الفترة الزمنية
            date_from = filters.get('date_from') if filters else None
            date_to = filters.get('date_to') if filters else None
            
            if not date_from:
                date_from = (timezone.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            if not date_to:
                date_to = timezone.now().strftime('%Y-%m-%d')
            
            # العقود في الفترة
            contracts = Contract.objects.filter(contract_date__range=[date_from, date_to])
            
            # المعاملات المالية في الفترة
            vouchers = Voucher.objects.filter(date__range=[date_from, date_to])
            
            # إحصائيات مالية
            stats = {
                'period': f"{date_from} إلى {date_to}",
                'total_sales': contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0,
                'total_receipts': vouchers.filter(voucher_type='income').aggregate(Sum('amount'))['amount__sum'] or 0,
                'total_expenses': vouchers.filter(voucher_type='expense').aggregate(Sum('amount'))['amount__sum'] or 0,
                'contracts_count': contracts.count(),
                'vouchers_count': vouchers.count(),
                'net_profit': 0,  # سيتم حسابه
            }
            
            stats['net_profit'] = stats['total_receipts'] - stats['total_expenses']
            
            # تفاصيل العقود
            contracts_data = []
            for contract in contracts.order_by('-contract_date'):
                contracts_data.append({
                    'id': contract.id,
                    'contract_number': contract.contract_number,
                    'customer_name': contract.customer.name if contract.customer else '',
                    'unit_number': contract.unit.unit_number if contract.unit else '',
                    'contract_date': contract.contract_date,
                    'total_price': contract.total_price,
                    'down_payment': contract.down_payment,
                    'status': contract.status,
                })
            
            # تفاصيل المعاملات المالية
            vouchers_data = []
            for voucher in vouchers.order_by('-date'):
                vouchers_data.append({
                    'id': voucher.id,
                    'safe_name': voucher.safe.name if voucher.safe else '',
                    'amount': voucher.amount,
                    'voucher_type': voucher.voucher_type,
                    'date': voucher.date,
                    'description': voucher.description,
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'contracts_data': contracts_data,
                'vouchers_data': vouchers_data,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في توليد التقرير المالي: {str(e)}'
            }
    
    def generate_partners_report(self, filters=None):
        """توليد تقرير الشركاء"""
        try:
            partners = Partner.objects.all()
            
            if filters:
                if filters.get('search'):
                    partners = partners.filter(
                        Q(name__icontains=filters['search']) |
                        Q(phone__icontains=filters['search']) |
                        Q(national_id__icontains=filters['search'])
                    )
                
                if filters.get('group'):
                    partners = partners.filter(partnergrouppartner__partner_group_id=filters['group'])
            
            # إحصائيات
            stats = {
                'total_partners': partners.count(),
                'total_share': partners.aggregate(Sum('share_percentage'))['share_percentage__sum'] or 0,
                'average_share': partners.aggregate(Avg('share_percentage'))['share_percentage__avg'] or 0,
            }
            
            # تفاصيل الشركاء
            partners_data = []
            for partner in partners.order_by('-created_at'):
                units_count = partner.unitpartner_set.count()
                groups_count = partner.partnergrouppartner_set.count()
                
                partners_data.append({
                    'id': partner.id,
                    'name': partner.name,
                    'phone': partner.phone,
                    'national_id': partner.national_id,
                    'email': partner.email,
                    'address': partner.address,
                    'share_percentage': partner.share_percentage,
                    'created_at': partner.created_at,
                    'units_count': units_count,
                    'groups_count': groups_count,
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'data': partners_data,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في توليد تقرير الشركاء: {str(e)}'
            }
    
    def generate_safes_report(self, filters=None):
        """توليد تقرير الخزائن"""
        try:
            safes = Safe.objects.all()
            
            if filters and filters.get('search'):
                safes = safes.filter(
                    Q(name__icontains=filters['search']) |
                    Q(description__icontains=filters['search'])
                )
            
            # إحصائيات
            stats = {
                'total_safes': safes.count(),
                'total_balance': safes.aggregate(Sum('balance'))['balance__sum'] or 0,
                'average_balance': safes.aggregate(Avg('balance'))['balance__avg'] or 0,
            }
            
            # تفاصيل الخزائن
            safes_data = []
            for safe in safes.order_by('-created_at'):
                transfers_in = safe.transfer_to_safe.aggregate(Sum('amount'))['amount__sum'] or 0
                transfers_out = safe.transfer_from_safe.aggregate(Sum('amount'))['amount__sum'] or 0
                vouchers_count = safe.voucher_set.count()
                
                safes_data.append({
                    'id': safe.id,
                    'name': safe.name,
                    'balance': safe.balance,
                    'description': safe.description,
                    'created_at': safe.created_at,
                    'transfers_in': transfers_in,
                    'transfers_out': transfers_out,
                    'net_transfers': transfers_in - transfers_out,
                    'vouchers_count': vouchers_count,
                })
            
            return {
                'status': 'success',
                'stats': stats,
                'data': safes_data,
                'generated_at': timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في توليد تقرير الخزائن: {str(e)}'
            }

# إنشاء مثيل الخدمة
report_generator = ReportGenerator()