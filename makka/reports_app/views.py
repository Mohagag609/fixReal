from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from realpp.models import Customer, Unit, Contract, Safe, Voucher, Partner, Broker, Installment
from .services import report_generator, chart_generator, export_service
import json

def reports_dashboard(request):
    """لوحة تحكم التقارير"""
    try:
        # إحصائيات سريعة
        total_customers = Customer.objects.count()
        total_units = Unit.objects.count()
        total_contracts = Contract.objects.count()
        total_sales = Contract.objects.aggregate(Sum('total_price'))['total_price__sum'] or 0
        
        # تقارير حديثة
        recent_reports = [
            {'name': 'تقرير العملاء', 'type': 'customers', 'created_at': timezone.now()},
            {'name': 'تقرير العقود', 'type': 'contracts', 'created_at': timezone.now()},
            {'name': 'تقرير الوحدات', 'type': 'units', 'created_at': timezone.now()},
        ]
        
        context = {
            'total_customers': total_customers,
            'total_units': total_units,
            'total_contracts': total_contracts,
            'total_sales': total_sales,
            'recent_reports': recent_reports,
        }
        return render(request, 'reports_app/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة التقارير: {str(e)}')
        return render(request, 'reports_app/dashboard.html', {})

def customers_report(request):
    """تقرير العملاء"""
    try:
        # فلترة
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # بناء الاستعلام
        customers = Customer.objects.all()
        
        if search:
            customers = customers.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(national_id__icontains=search)
            )
        
        if date_from:
            customers = customers.filter(created_at__gte=date_from)
        
        if date_to:
            customers = customers.filter(created_at__lte=date_to)
        
        # إحصائيات
        stats = {
            'total': customers.count(),
            'with_contracts': customers.filter(contract__isnull=False).distinct().count(),
            'without_contracts': customers.filter(contract__isnull=True).count(),
        }
        
        context = {
            'customers': customers.order_by('-created_at')[:100],  # أول 100 عميل
            'stats': stats,
            'search': search,
            'status_filter': status_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'reports_app/customers_report.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تقرير العملاء: {str(e)}')
        return redirect('reports_dashboard')

def contracts_report(request):
    """تقرير العقود"""
    try:
        # فلترة
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # بناء الاستعلام
        contracts = Contract.objects.select_related('customer', 'unit', 'broker')
        
        if search:
            contracts = contracts.filter(
                Q(customer__name__icontains=search) |
                Q(unit__unit_number__icontains=search) |
                Q(contract_number__icontains=search)
            )
        
        if status_filter:
            contracts = contracts.filter(status=status_filter)
        
        if date_from:
            contracts = contracts.filter(contract_date__gte=date_from)
        
        if date_to:
            contracts = contracts.filter(contract_date__lte=date_to)
        
        # إحصائيات
        stats = {
            'total': contracts.count(),
            'total_value': contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0,
            'average_value': contracts.aggregate(Avg('total_price'))['total_price__avg'] or 0,
            'active': contracts.filter(status='active').count(),
            'completed': contracts.filter(status='completed').count(),
            'cancelled': contracts.filter(status='cancelled').count(),
        }
        
        context = {
            'contracts': contracts.order_by('-contract_date')[:100],
            'stats': stats,
            'search': search,
            'status_filter': status_filter,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'reports_app/contracts_report.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تقرير العقود: {str(e)}')
        return redirect('reports_dashboard')

def units_report(request):
    """تقرير الوحدات"""
    try:
        # فلترة
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        unit_type_filter = request.GET.get('unit_type', '')
        building_filter = request.GET.get('building', '')
        
        # بناء الاستعلام
        units = Unit.objects.all()
        
        if search:
            units = units.filter(
                Q(unit_number__icontains=search) |
                Q(building__icontains=search) |
                Q(description__icontains=search)
            )
        
        if status_filter:
            units = units.filter(status=status_filter)
        
        if unit_type_filter:
            units = units.filter(unit_type=unit_type_filter)
        
        if building_filter:
            units = units.filter(building__icontains=building_filter)
        
        # إحصائيات
        stats = {
            'total': units.count(),
            'available': units.filter(status='available').count(),
            'sold': units.filter(status='sold').count(),
            'rented': units.filter(status='rented').count(),
            'total_value': units.aggregate(Sum('price'))['price__sum'] or 0,
            'average_price': units.aggregate(Avg('price'))['price__avg'] or 0,
        }
        
        context = {
            'units': units.order_by('-created_at')[:100],
            'stats': stats,
            'search': search,
            'status_filter': status_filter,
            'unit_type_filter': unit_type_filter,
            'building_filter': building_filter,
        }
        return render(request, 'reports_app/units_report.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تقرير الوحدات: {str(e)}')
        return redirect('reports_dashboard')

def financial_report(request):
    """التقرير المالي"""
    try:
        # فلترة
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # إحصائيات مالية
        contracts = Contract.objects.filter(contract_date__range=[date_from, date_to])
        vouchers = Voucher.objects.filter(date__range=[date_from, date_to])
        
        stats = {
            'total_sales': contracts.aggregate(Sum('total_price'))['total_price__sum'] or 0,
            'total_receipts': vouchers.filter(voucher_type='income').aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_expenses': vouchers.filter(voucher_type='expense').aggregate(Sum('amount'))['amount__sum'] or 0,
            'net_profit': 0,  # سيتم حسابه
            'contracts_count': contracts.count(),
            'vouchers_count': vouchers.count(),
        }
        
        stats['net_profit'] = stats['total_receipts'] - stats['total_expenses']
        
        # تفاصيل المعاملات
        recent_contracts = contracts.order_by('-contract_date')[:10]
        recent_vouchers = vouchers.order_by('-date')[:10]
        
        context = {
            'stats': stats,
            'recent_contracts': recent_contracts,
            'recent_vouchers': recent_vouchers,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'reports_app/financial_report.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في التقرير المالي: {str(e)}')
        return redirect('reports_dashboard')

def partners_report(request):
    """تقرير الشركاء"""
    try:
        # فلترة
        search = request.GET.get('search', '')
        group_filter = request.GET.get('group', '')
        
        # بناء الاستعلام
        partners = Partner.objects.all()
        
        if search:
            partners = partners.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(national_id__icontains=search)
            )
        
        if group_filter:
            partners = partners.filter(partnergrouppartner__partner_group_id=group_filter)
        
        # إحصائيات
        stats = {
            'total': partners.count(),
            'total_share': partners.aggregate(Sum('share_percentage'))['share_percentage__sum'] or 0,
            'average_share': partners.aggregate(Avg('share_percentage'))['share_percentage__avg'] or 0,
        }
        
        context = {
            'partners': partners.order_by('-created_at')[:100],
            'stats': stats,
            'search': search,
            'group_filter': group_filter,
        }
        return render(request, 'reports_app/partners_report.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تقرير الشركاء: {str(e)}')
        return redirect('reports_dashboard')

def safes_report(request):
    """تقرير الخزائن"""
    try:
        # فلترة
        search = request.GET.get('search', '')
        
        # بناء الاستعلام
        safes = Safe.objects.all()
        
        if search:
            safes = safes.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # إحصائيات
        stats = {
            'total': safes.count(),
            'total_balance': safes.aggregate(Sum('balance'))['balance__sum'] or 0,
            'average_balance': safes.aggregate(Avg('balance'))['balance__avg'] or 0,
        }
        
        # تفاصيل الخزائن
        safes_with_transfers = []
        for safe in safes:
            transfers_in = safe.transfer_to_safe.aggregate(Sum('amount'))['amount__sum'] or 0
            transfers_out = safe.transfer_from_safe.aggregate(Sum('amount'))['amount__sum'] or 0
            safes_with_transfers.append({
                'safe': safe,
                'transfers_in': transfers_in,
                'transfers_out': transfers_out,
                'net_transfers': transfers_in - transfers_out,
            })
        
        context = {
            'safes_with_transfers': safes_with_transfers,
            'stats': stats,
            'search': search,
        }
        return render(request, 'reports_app/safes_report.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تقرير الخزائن: {str(e)}')
        return redirect('reports_dashboard')

def export_report(request, report_type):
    """تصدير التقرير"""
    try:
        format_type = request.GET.get('format', 'pdf')
        
        if report_type == 'customers':
            data = Customer.objects.all()
            title = 'تقرير العملاء'
        elif report_type == 'contracts':
            data = Contract.objects.select_related('customer', 'unit')
            title = 'تقرير العقود'
        elif report_type == 'units':
            data = Unit.objects.all()
            title = 'تقرير الوحدات'
        elif report_type == 'financial':
            data = Voucher.objects.all()
            title = 'التقرير المالي'
        else:
            return JsonResponse({'error': 'نوع التقرير غير صحيح'}, status=400)
        
        if format_type == 'pdf':
            pdf_content = export_service.generate_pdf_report(title, data)
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{title}.pdf"'
            return response
        elif format_type == 'excel':
            excel_content = export_service.generate_excel_report(title, data)
            response = HttpResponse(excel_content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{title}.xlsx"'
            return response
        else:
            return JsonResponse({'error': 'نوع التصدير غير مدعوم'}, status=400)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_chart_data(request, chart_type):
    """الحصول على بيانات الرسم البياني"""
    try:
        if chart_type == 'sales_over_time':
            data = chart_generator.sales_over_time()
        elif chart_type == 'units_by_status':
            data = chart_generator.units_by_status()
        elif chart_type == 'customers_by_month':
            data = chart_generator.customers_by_month()
        elif chart_type == 'financial_summary':
            data = chart_generator.financial_summary()
        else:
            return JsonResponse({'error': 'نوع الرسم البياني غير صحيح'}, status=400)
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)