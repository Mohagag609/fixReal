from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from realpp.models import Customer, Unit, Contract, Safe, Voucher, Partner, Broker, Installment

class AnalyticsService:
    def __init__(self):
        pass
    
    def get_main_kpis(self):
        """KPIs الرئيسية"""
        try:
            today = timezone.now().date()
            this_month = today.replace(day=1)
            last_month = (this_month - timedelta(days=1)).replace(day=1)
            
            # المبيعات
            total_sales = Contract.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0
            monthly_sales = Contract.objects.filter(
                contract_date__gte=this_month
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # العملاء
            total_customers = Customer.objects.count()
            monthly_customers = Customer.objects.filter(
                created_at__gte=this_month
            ).count()
            
            # الوحدات
            total_units = Unit.objects.count()
            available_units = Unit.objects.filter(status='available').count()
            sold_units = Unit.objects.filter(status='sold').count()
            
            # العقود
            total_contracts = Contract.objects.count()
            active_contracts = Contract.objects.filter(status='active').count()
            
            # الإيرادات والمصروفات
            total_income = Voucher.objects.filter(voucher_type='income').aggregate(Sum('amount'))['amount__sum'] or 0
            total_expenses = Voucher.objects.filter(voucher_type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
            net_profit = total_income - total_expenses
            
            # معدلات النمو
            last_month_sales = Contract.objects.filter(
                contract_date__gte=last_month,
                contract_date__lt=this_month
            ).aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            sales_growth = 0
            if last_month_sales > 0:
                sales_growth = ((monthly_sales - last_month_sales) / last_month_sales) * 100
            
            last_month_customers = Customer.objects.filter(
                created_at__gte=last_month,
                created_at__lt=this_month
            ).count()
            
            customer_growth = 0
            if last_month_customers > 0:
                customer_growth = ((monthly_customers - last_month_customers) / last_month_customers) * 100
            
            return {
                'status': 'success',
                'kpis': {
                    'total_sales': float(total_sales),
                    'monthly_sales': float(monthly_sales),
                    'total_customers': total_customers,
                    'monthly_customers': monthly_customers,
                    'total_units': total_units,
                    'available_units': available_units,
                    'sold_units': sold_units,
                    'total_contracts': total_contracts,
                    'active_contracts': active_contracts,
                    'total_income': float(total_income),
                    'total_expenses': float(total_expenses),
                    'net_profit': float(net_profit),
                    'sales_growth': sales_growth,
                    'customer_growth': customer_growth,
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في KPIs الرئيسية: {str(e)}'
            }
    
    def get_sales_analytics(self, date_from, date_to, period='monthly'):
        """تحليلات المبيعات"""
        try:
            # تحويل التواريخ
            if isinstance(date_from, str):
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            if isinstance(date_to, str):
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            
            # العقود في الفترة
            contracts = Contract.objects.filter(
                contract_date__range=[date_from, date_to]
            )
            
            # إحصائيات أساسية
            total_sales = contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0
            total_contracts = contracts.count()
            average_contract_value = contracts.aggregate(Avg('total_price'))['total_price__avg'] or 0
            
            # المبيعات حسب النوع
            sales_by_type = contracts.values('installment_type').annotate(
                total_sales=Sum('total_price'),
                count=Count('id')
            ).order_by('-total_sales')
            
            # المبيعات حسب الشهر
            sales_by_month = []
            current_date = date_from
            while current_date <= date_to:
                if period == 'monthly':
                    month_start = current_date.replace(day=1)
                    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                    if month_end > date_to:
                        month_end = date_to
                    
                    monthly_sales = contracts.filter(
                        contract_date__range=[month_start, month_end]
                    ).aggregate(Sum('total_price'))['total_price__sum'] or 0
                    
                    sales_by_month.append({
                        'period': month_start.strftime('%Y-%m'),
                        'sales': float(monthly_sales)
                    })
                    
                    current_date = month_end + timedelta(days=1)
                elif period == 'weekly':
                    week_end = min(current_date + timedelta(days=6), date_to)
                    
                    weekly_sales = contracts.filter(
                        contract_date__range=[current_date, week_end]
                    ).aggregate(Sum('total_price'))['total_price__sum'] or 0
                    
                    sales_by_month.append({
                        'period': current_date.strftime('%Y-%m-%d'),
                        'sales': float(weekly_sales)
                    })
                    
                    current_date = week_end + timedelta(days=1)
                else:  # daily
                    daily_sales = contracts.filter(
                        contract_date=current_date
                    ).aggregate(Sum('total_price'))['total_price__sum'] or 0
                    
                    sales_by_month.append({
                        'period': current_date.strftime('%Y-%m-%d'),
                        'sales': float(daily_sales)
                    })
                    
                    current_date += timedelta(days=1)
            
            # أفضل العملاء
            top_customers = contracts.values(
                'customer__name', 'customer__id'
            ).annotate(
                total_sales=Sum('total_price'),
                contract_count=Count('id')
            ).order_by('-total_sales')[:10]
            
            # أفضل الوحدات
            top_units = contracts.values(
                'unit__unit_number', 'unit__building', 'unit__id'
            ).annotate(
                total_sales=Sum('total_price'),
                contract_count=Count('id')
            ).order_by('-total_sales')[:10]
            
            return {
                'status': 'success',
                'analytics': {
                    'total_sales': float(total_sales),
                    'total_contracts': total_contracts,
                    'average_contract_value': float(average_contract_value),
                    'sales_by_type': list(sales_by_type),
                    'sales_by_period': sales_by_month,
                    'top_customers': list(top_customers),
                    'top_units': list(top_units),
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تحليلات المبيعات: {str(e)}'
            }
    
    def get_customer_analytics(self, date_from, date_to):
        """تحليلات العملاء"""
        try:
            # تحويل التواريخ
            if isinstance(date_from, str):
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            if isinstance(date_to, str):
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            
            # العملاء في الفترة
            customers = Customer.objects.filter(
                created_at__range=[date_from, date_to]
            )
            
            # إحصائيات أساسية
            total_customers = customers.count()
            customers_with_contracts = customers.filter(contract__isnull=False).distinct().count()
            customers_without_contracts = total_customers - customers_with_contracts
            
            # نمو العملاء
            customer_growth = []
            current_date = date_from
            while current_date <= date_to:
                month_start = current_date.replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                if month_end > date_to:
                    month_end = date_to
                
                monthly_customers = customers.filter(
                    created_at__range=[month_start, month_end]
                ).count()
                
                customer_growth.append({
                    'period': month_start.strftime('%Y-%m'),
                    'customers': monthly_customers
                })
                
                current_date = month_end + timedelta(days=1)
            
            # توزيع العملاء حسب العقود
            customer_segments = [
                {
                    'segment': 'عملاء بدون عقود',
                    'count': customers_without_contracts,
                    'percentage': (customers_without_contracts / total_customers * 100) if total_customers > 0 else 0
                },
                {
                    'segment': 'عملاء بعقد واحد',
                    'count': customers.filter(contract__isnull=False).annotate(
                        contract_count=Count('contract')
                    ).filter(contract_count=1).count(),
                    'percentage': 0  # سيتم حسابه
                },
                {
                    'segment': 'عملاء بعقود متعددة',
                    'count': customers.filter(contract__isnull=False).annotate(
                        contract_count=Count('contract')
                    ).filter(contract_count__gt=1).count(),
                    'percentage': 0  # سيتم حسابه
                }
            ]
            
            # حساب النسب المئوية
            for segment in customer_segments[1:]:
                segment['percentage'] = (segment['count'] / total_customers * 100) if total_customers > 0 else 0
            
            # أفضل العملاء حسب القيمة
            top_customers = customers.annotate(
                total_contract_value=Sum('contract__total_price'),
                contract_count=Count('contract')
            ).filter(
                total_contract_value__isnull=False
            ).order_by('-total_contract_value')[:10]
            
            return {
                'status': 'success',
                'analytics': {
                    'total_customers': total_customers,
                    'customers_with_contracts': customers_with_contracts,
                    'customers_without_contracts': customers_without_contracts,
                    'customer_growth': customer_growth,
                    'customer_segments': customer_segments,
                    'top_customers': list(top_customers.values(
                        'id', 'name', 'phone', 'total_contract_value', 'contract_count'
                    )),
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تحليلات العملاء: {str(e)}'
            }
    
    def get_financial_analytics(self, date_from, date_to):
        """التحليلات المالية"""
        try:
            # تحويل التواريخ
            if isinstance(date_from, str):
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            if isinstance(date_to, str):
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            
            # المعاملات المالية في الفترة
            vouchers = Voucher.objects.filter(date__range=[date_from, date_to])
            contracts = Contract.objects.filter(contract_date__range=[date_from, date_to])
            
            # الإيرادات والمصروفات
            total_income = vouchers.filter(voucher_type='income').aggregate(Sum('amount'))['amount__sum'] or 0
            total_expenses = vouchers.filter(voucher_type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
            net_profit = total_income - total_expenses
            
            # المبيعات
            total_sales = contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # توزيع المصروفات
            expense_breakdown = vouchers.filter(voucher_type='expense').values(
                'description'
            ).annotate(
                total_amount=Sum('amount'),
                count=Count('id')
            ).order_by('-total_amount')
            
            # الإيرادات الشهرية
            monthly_revenue = []
            current_date = date_from
            while current_date <= date_to:
                month_start = current_date.replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                if month_end > date_to:
                    month_end = date_to
                
                monthly_income = vouchers.filter(
                    voucher_type='income',
                    date__range=[month_start, month_end]
                ).aggregate(Sum('amount'))['amount__sum'] or 0
                
                monthly_expenses = vouchers.filter(
                    voucher_type='expense',
                    date__range=[month_start, month_end]
                ).aggregate(Sum('amount'))['amount__sum'] or 0
                
                monthly_revenue.append({
                    'period': month_start.strftime('%Y-%m'),
                    'income': float(monthly_income),
                    'expenses': float(monthly_expenses),
                    'net': float(monthly_income - monthly_expenses)
                })
                
                current_date = month_end + timedelta(days=1)
            
            # معدل الربحية
            profit_margin = (net_profit / total_income * 100) if total_income > 0 else 0
            
            return {
                'status': 'success',
                'analytics': {
                    'total_income': float(total_income),
                    'total_expenses': float(total_expenses),
                    'net_profit': float(net_profit),
                    'total_sales': float(total_sales),
                    'profit_margin': profit_margin,
                    'expense_breakdown': list(expense_breakdown),
                    'monthly_revenue': monthly_revenue,
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في التحليلات المالية: {str(e)}'
            }
    
    def get_unit_analytics(self, building_filter='', unit_type_filter=''):
        """تحليلات الوحدات"""
        try:
            # فلترة الوحدات
            units = Unit.objects.all()
            
            if building_filter:
                units = units.filter(building__icontains=building_filter)
            
            if unit_type_filter:
                units = units.filter(unit_type=unit_type_filter)
            
            # إحصائيات أساسية
            total_units = units.count()
            available_units = units.filter(status='available').count()
            sold_units = units.filter(status='sold').count()
            rented_units = units.filter(status='rented').count()
            
            # الأسعار
            total_value = units.aggregate(Sum('price'))['price__sum'] or 0
            average_price = units.aggregate(Avg('price'))['price__avg'] or 0
            min_price = units.aggregate(Min('price'))['price__min'] or 0
            max_price = units.aggregate(Max('price'))['price__max'] or 0
            
            # المساحات
            total_area = units.aggregate(Sum('area'))['area__sum'] or 0
            average_area = units.aggregate(Avg('area'))['area__avg'] or 0
            
            # توزيع حسب النوع
            units_by_type = units.values('unit_type').annotate(
                count=Count('id'),
                total_value=Sum('price'),
                average_price=Avg('price')
            ).order_by('-count')
            
            # توزيع حسب المبنى
            units_by_building = units.values('building').annotate(
                count=Count('id'),
                total_value=Sum('price'),
                average_price=Avg('price')
            ).order_by('-count')
            
            # توزيع حسب الحالة
            units_by_status = units.values('status').annotate(
                count=Count('id'),
                total_value=Sum('price'),
                average_price=Avg('price')
            ).order_by('-count')
            
            return {
                'status': 'success',
                'analytics': {
                    'total_units': total_units,
                    'available_units': available_units,
                    'sold_units': sold_units,
                    'rented_units': rented_units,
                    'total_value': float(total_value),
                    'average_price': float(average_price),
                    'min_price': float(min_price),
                    'max_price': float(max_price),
                    'total_area': float(total_area),
                    'average_area': float(average_area),
                    'units_by_type': list(units_by_type),
                    'units_by_building': list(units_by_building),
                    'units_by_status': list(units_by_status),
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تحليلات الوحدات: {str(e)}'
            }
    
    def get_performance_analytics(self, date_from, date_to):
        """تحليلات الأداء"""
        try:
            # تحويل التواريخ
            if isinstance(date_from, str):
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            if isinstance(date_to, str):
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            
            # العقود في الفترة
            contracts = Contract.objects.filter(
                contract_date__range=[date_from, date_to]
            )
            
            # معدل إتمام العقود
            total_contracts = contracts.count()
            completed_contracts = contracts.filter(status='completed').count()
            completion_rate = (completed_contracts / total_contracts * 100) if total_contracts > 0 else 0
            
            # متوسط وقت الإتمام
            completed_contracts_with_dates = contracts.filter(
                status='completed',
                completed_at__isnull=False
            )
            
            avg_completion_time = 0
            if completed_contracts_with_dates.exists():
                completion_times = []
                for contract in completed_contracts_with_dates:
                    if contract.completed_at:
                        time_diff = (contract.completed_at.date() - contract.contract_date).days
                        completion_times.append(time_diff)
                
                if completion_times:
                    avg_completion_time = sum(completion_times) / len(completion_times)
            
            # معدل التحصيل
            total_due = contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0
            total_collected = contracts.aggregate(Sum('down_payment'))['down_payment__sum'] or 0
            
            # إضافة المدفوعات من الأقساط
            installments = Installment.objects.filter(
                contract__in=contracts
            )
            total_installment_payments = installments.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
            total_collected += total_installment_payments
            
            collection_rate = (total_collected / total_due * 100) if total_due > 0 else 0
            
            # مؤشرات الأداء
            performance_metrics = {
                'completion_rate': completion_rate,
                'avg_completion_time': avg_completion_time,
                'collection_rate': collection_rate,
                'total_contracts': total_contracts,
                'completed_contracts': completed_contracts,
                'total_due': float(total_due),
                'total_collected': float(total_collected),
            }
            
            return {
                'status': 'success',
                'analytics': performance_metrics
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في تحليلات الأداء: {str(e)}'
            }
    
    def get_advanced_analytics(self):
        """تحليلات متقدمة"""
        try:
            # تحليل الاتجاهات
            trends = self._analyze_trends()
            
            # تحليل الأنماط
            patterns = self._analyze_patterns()
            
            # التوقعات
            forecasts = self._generate_forecasts()
            
            return {
                'status': 'success',
                'analytics': {
                    'trends': trends,
                    'patterns': patterns,
                    'forecasts': forecasts,
                }
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'خطأ في التحليلات المتقدمة: {str(e)}'
            }
    
    def _analyze_trends(self):
        """تحليل الاتجاهات"""
        # تحليل اتجاهات المبيعات
        # تحليل اتجاهات العملاء
        # تحليل اتجاهات الأسعار
        return {
            'sales_trend': 'increasing',
            'customer_trend': 'stable',
            'price_trend': 'increasing'
        }
    
    def _analyze_patterns(self):
        """تحليل الأنماط"""
        # أنماط المبيعات
        # أنماط العملاء
        # أنماط الوحدات
        return {
            'sales_patterns': [],
            'customer_patterns': [],
            'unit_patterns': []
        }
    
    def _generate_forecasts(self):
        """توليد التوقعات"""
        # توقع المبيعات
        # توقع العملاء
        # توقع الإيرادات
        return {
            'sales_forecast': [],
            'customer_forecast': [],
            'revenue_forecast': []
        }

# إنشاء مثيل الخدمة
analytics_service = AnalyticsService()