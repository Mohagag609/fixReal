from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from realpp.models import Customer, Unit, Contract, Safe, Voucher, Partner, Broker, Installment

class ChartGenerator:
    def __init__(self):
        pass
    
    def sales_over_time(self):
        """المبيعات عبر الوقت"""
        try:
            # آخر 12 شهر
            end_date = timezone.now()
            start_date = end_date - timedelta(days=365)
            
            # تجميع المبيعات حسب الشهر
            sales_data = []
            for i in range(12):
                month_start = start_date + timedelta(days=i*30)
                month_end = month_start + timedelta(days=30)
                
                monthly_sales = Contract.objects.filter(
                    contract_date__range=[month_start, month_end]
                ).aggregate(Sum('total_price'))['total_price__sum'] or 0
                
                sales_data.append({
                    'month': month_start.strftime('%Y-%m'),
                    'sales': float(monthly_sales)
                })
            
            return {
                'status': 'success',
                'data': sales_data,
                'chart_type': 'line',
                'title': 'المبيعات عبر الوقت'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات المبيعات: {str(e)}'
            }
    
    def units_by_status(self):
        """الوحدات حسب الحالة"""
        try:
            units_data = Unit.objects.values('status').annotate(count=Count('id'))
            
            chart_data = []
            for item in units_data:
                chart_data.append({
                    'status': item['status'],
                    'count': item['count']
                })
            
            return {
                'status': 'success',
                'data': chart_data,
                'chart_type': 'pie',
                'title': 'الوحدات حسب الحالة'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات الوحدات: {str(e)}'
            }
    
    def customers_by_month(self):
        """العملاء حسب الشهر"""
        try:
            # آخر 12 شهر
            end_date = timezone.now()
            start_date = end_date - timedelta(days=365)
            
            # تجميع العملاء حسب الشهر
            customers_data = []
            for i in range(12):
                month_start = start_date + timedelta(days=i*30)
                month_end = month_start + timedelta(days=30)
                
                monthly_customers = Customer.objects.filter(
                    created_at__range=[month_start, month_end]
                ).count()
                
                customers_data.append({
                    'month': month_start.strftime('%Y-%m'),
                    'customers': monthly_customers
                })
            
            return {
                'status': 'success',
                'data': customers_data,
                'chart_type': 'bar',
                'title': 'العملاء الجدد حسب الشهر'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات العملاء: {str(e)}'
            }
    
    def financial_summary(self):
        """الملخص المالي"""
        try:
            # آخر 30 يوم
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
            
            # الإيرادات
            income = Voucher.objects.filter(
                voucher_type='income',
                date__range=[start_date, end_date]
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            # المصروفات
            expenses = Voucher.objects.filter(
                voucher_type='expense',
                date__range=[start_date, end_date]
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            # المبيعات
            sales = Contract.objects.filter(
                contract_date__range=[start_date, end_date]
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # الأرباح
            profit = income - expenses
            
            return {
                'status': 'success',
                'data': {
                    'income': float(income),
                    'expenses': float(expenses),
                    'sales': float(sales),
                    'profit': float(profit)
                },
                'chart_type': 'doughnut',
                'title': 'الملخص المالي'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في الملخص المالي: {str(e)}'
            }
    
    def contracts_by_status(self):
        """العقود حسب الحالة"""
        try:
            contracts_data = Contract.objects.values('status').annotate(count=Count('id'))
            
            chart_data = []
            for item in contracts_data:
                chart_data.append({
                    'status': item['status'],
                    'count': item['count']
                })
            
            return {
                'status': 'success',
                'data': chart_data,
                'chart_type': 'pie',
                'title': 'العقود حسب الحالة'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات العقود: {str(e)}'
            }
    
    def units_by_type(self):
        """الوحدات حسب النوع"""
        try:
            units_data = Unit.objects.values('unit_type').annotate(count=Count('id'))
            
            chart_data = []
            for item in units_data:
                chart_data.append({
                    'type': item['unit_type'],
                    'count': item['count']
                })
            
            return {
                'status': 'success',
                'data': chart_data,
                'chart_type': 'bar',
                'title': 'الوحدات حسب النوع'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات أنواع الوحدات: {str(e)}'
            }
    
    def monthly_revenue(self):
        """الإيرادات الشهرية"""
        try:
            # آخر 12 شهر
            end_date = timezone.now()
            start_date = end_date - timedelta(days=365)
            
            # تجميع الإيرادات حسب الشهر
            revenue_data = []
            for i in range(12):
                month_start = start_date + timedelta(days=i*30)
                month_end = month_start + timedelta(days=30)
                
                monthly_income = Voucher.objects.filter(
                    voucher_type='income',
                    date__range=[month_start, month_end]
                ).aggregate(Sum('amount'))['amount__sum'] or 0
                
                monthly_expenses = Voucher.objects.filter(
                    voucher_type='expense',
                    date__range=[month_start, month_end]
                ).aggregate(Sum('amount'))['amount__sum'] or 0
                
                revenue_data.append({
                    'month': month_start.strftime('%Y-%m'),
                    'income': float(monthly_income),
                    'expenses': float(monthly_expenses),
                    'net': float(monthly_income - monthly_expenses)
                })
            
            return {
                'status': 'success',
                'data': revenue_data,
                'chart_type': 'line',
                'title': 'الإيرادات الشهرية'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات الإيرادات: {str(e)}'
            }
    
    def partners_share_distribution(self):
        """توزيع حصص الشركاء"""
        try:
            partners_data = Partner.objects.values('name', 'share_percentage').order_by('-share_percentage')
            
            chart_data = []
            for partner in partners_data:
                chart_data.append({
                    'name': partner['name'],
                    'share': float(partner['share_percentage'])
                })
            
            return {
                'status': 'success',
                'data': chart_data,
                'chart_type': 'pie',
                'title': 'توزيع حصص الشركاء'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في بيانات حصص الشركاء: {str(e)}'
            }

# إنشاء مثيل الخدمة
chart_generator = ChartGenerator()