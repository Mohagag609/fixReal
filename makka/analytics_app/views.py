from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from datetime import datetime, timedelta
from realpp.models import Customer, Unit, Contract, Safe, Voucher, Partner, Broker, Installment
from .services import analytics_service, chart_service, kpi_service
import json

def analytics_dashboard(request):
    """لوحة تحكم التحليلات"""
    try:
        # KPIs رئيسية
        kpis = kpi_service.get_main_kpis()
        
        # رسوم بيانية
        charts = {
            'sales_over_time': chart_service.sales_over_time(),
            'units_by_status': chart_service.units_by_status(),
            'customers_growth': chart_service.customers_growth(),
            'financial_summary': chart_service.financial_summary(),
        }
        
        # تحليلات متقدمة
        advanced_analytics = analytics_service.get_advanced_analytics()
        
        context = {
            'kpis': kpis,
            'charts': charts,
            'advanced_analytics': advanced_analytics,
        }
        return render(request, 'analytics_app/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة التحليلات: {str(e)}')
        return render(request, 'analytics_app/dashboard.html', {})

def sales_analytics(request):
    """تحليلات المبيعات"""
    try:
        # فلترة
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        period = request.GET.get('period', 'monthly')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # تحليلات المبيعات
        sales_data = analytics_service.get_sales_analytics(date_from, date_to, period)
        
        # رسوم بيانية
        charts = {
            'sales_trend': chart_service.sales_trend(date_from, date_to, period),
            'sales_by_month': chart_service.sales_by_month(date_from, date_to),
            'top_customers': chart_service.top_customers(date_from, date_to),
            'sales_by_unit_type': chart_service.sales_by_unit_type(date_from, date_to),
        }
        
        context = {
            'sales_data': sales_data,
            'charts': charts,
            'date_from': date_from,
            'date_to': date_to,
            'period': period,
        }
        return render(request, 'analytics_app/sales_analytics.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحليلات المبيعات: {str(e)}')
        return redirect('analytics_dashboard')

def customer_analytics(request):
    """تحليلات العملاء"""
    try:
        # فلترة
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # تحليلات العملاء
        customer_data = analytics_service.get_customer_analytics(date_from, date_to)
        
        # رسوم بيانية
        charts = {
            'customer_growth': chart_service.customer_growth(date_from, date_to),
            'customer_segments': chart_service.customer_segments(),
            'customer_retention': chart_service.customer_retention(),
            'customer_satisfaction': chart_service.customer_satisfaction(),
        }
        
        context = {
            'customer_data': customer_data,
            'charts': charts,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'analytics_app/customer_analytics.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحليلات العملاء: {str(e)}')
        return redirect('analytics_dashboard')

def financial_analytics(request):
    """التحليلات المالية"""
    try:
        # فلترة
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # التحليلات المالية
        financial_data = analytics_service.get_financial_analytics(date_from, date_to)
        
        # رسوم بيانية
        charts = {
            'revenue_trend': chart_service.revenue_trend(date_from, date_to),
            'expense_breakdown': chart_service.expense_breakdown(date_from, date_to),
            'profit_margin': chart_service.profit_margin(date_from, date_to),
            'cash_flow': chart_service.cash_flow(date_from, date_to),
        }
        
        context = {
            'financial_data': financial_data,
            'charts': charts,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'analytics_app/financial_analytics.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في التحليلات المالية: {str(e)}')
        return redirect('analytics_dashboard')

def unit_analytics(request):
    """تحليلات الوحدات"""
    try:
        # فلترة
        building_filter = request.GET.get('building', '')
        unit_type_filter = request.GET.get('unit_type', '')
        
        # تحليلات الوحدات
        unit_data = analytics_service.get_unit_analytics(building_filter, unit_type_filter)
        
        # رسوم بيانية
        charts = {
            'units_by_status': chart_service.units_by_status(),
            'units_by_type': chart_service.units_by_type(),
            'units_by_building': chart_service.units_by_building(),
            'price_distribution': chart_service.price_distribution(),
        }
        
        context = {
            'unit_data': unit_data,
            'charts': charts,
            'building_filter': building_filter,
            'unit_type_filter': unit_type_filter,
        }
        return render(request, 'analytics_app/unit_analytics.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحليلات الوحدات: {str(e)}')
        return redirect('analytics_dashboard')

def performance_analytics(request):
    """تحليلات الأداء"""
    try:
        # فلترة
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # تحليلات الأداء
        performance_data = analytics_service.get_performance_analytics(date_from, date_to)
        
        # رسوم بيانية
        charts = {
            'performance_metrics': chart_service.performance_metrics(date_from, date_to),
            'efficiency_trends': chart_service.efficiency_trends(date_from, date_to),
            'productivity_analysis': chart_service.productivity_analysis(date_from, date_to),
        }
        
        context = {
            'performance_data': performance_data,
            'charts': charts,
            'date_from': date_from,
            'date_to': date_to,
        }
        return render(request, 'analytics_app/performance_analytics.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحليلات الأداء: {str(e)}')
        return redirect('analytics_dashboard')

def get_chart_data(request, chart_type):
    """الحصول على بيانات الرسم البياني"""
    try:
        # معاملات إضافية
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        period = request.GET.get('period', 'monthly')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # توليد بيانات الرسم البياني
        if chart_type == 'sales_trend':
            data = chart_service.sales_trend(date_from, date_to, period)
        elif chart_type == 'customer_growth':
            data = chart_service.customer_growth(date_from, date_to)
        elif chart_type == 'revenue_trend':
            data = chart_service.revenue_trend(date_from, date_to)
        elif chart_type == 'units_by_status':
            data = chart_service.units_by_status()
        elif chart_type == 'financial_summary':
            data = chart_service.financial_summary()
        else:
            return JsonResponse({'error': 'نوع الرسم البياني غير صحيح'}, status=400)
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_kpi_data(request, kpi_type):
    """الحصول على بيانات KPI"""
    try:
        if kpi_type == 'main':
            data = kpi_service.get_main_kpis()
        elif kpi_type == 'sales':
            data = kpi_service.get_sales_kpis()
        elif kpi_type == 'financial':
            data = kpi_service.get_financial_kpis()
        elif kpi_type == 'customer':
            data = kpi_service.get_customer_kpis()
        else:
            return JsonResponse({'error': 'نوع KPI غير صحيح'}, status=400)
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def export_analytics(request, analytics_type):
    """تصدير التحليلات"""
    try:
        format_type = request.GET.get('format', 'pdf')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # تحديد الفترة الزمنية
        if not date_from:
            date_from = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not date_to:
            date_to = timezone.now().strftime('%Y-%m-%d')
        
        # توليد التقرير
        if analytics_type == 'sales':
            data = analytics_service.get_sales_analytics(date_from, date_to)
            title = 'تحليلات المبيعات'
        elif analytics_type == 'customer':
            data = analytics_service.get_customer_analytics(date_from, date_to)
            title = 'تحليلات العملاء'
        elif analytics_type == 'financial':
            data = analytics_service.get_financial_analytics(date_from, date_to)
            title = 'التحليلات المالية'
        else:
            return JsonResponse({'error': 'نوع التحليلات غير صحيح'}, status=400)
        
        # تصدير التقرير
        from reports_app.services.export_service import export_service
        
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