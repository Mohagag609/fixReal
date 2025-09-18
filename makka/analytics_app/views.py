from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Min
from datetime import datetime, timedelta
import json

from accounting_app.models import Invoice, Bill, Payment, Customer, Vendor
from accounting_app.services.calculations import FinancialCalculations


class AnalyticsDashboardView(LoginRequiredMixin, TemplateView):
    """Main analytics dashboard"""
    template_name = 'analytics/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get date range
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)  # Last 30 days
        
        # Revenue analytics
        revenue_data = self._get_revenue_analytics(company, start_date, end_date)
        
        # Expense analytics
        expense_data = self._get_expense_analytics(company, start_date, end_date)
        
        # Customer analytics
        customer_data = self._get_customer_analytics(company, start_date, end_date)
        
        # Vendor analytics
        vendor_data = self._get_vendor_analytics(company, start_date, end_date)
        
        # Cash flow analytics
        cash_flow_data = self._get_cash_flow_analytics(company, start_date, end_date)
        
        context.update({
            'revenue_data': revenue_data,
            'expense_data': expense_data,
            'customer_data': customer_data,
            'vendor_data': vendor_data,
            'cash_flow_data': cash_flow_data,
            'start_date': start_date,
            'end_date': end_date,
        })
        
        return context
    
    def _get_revenue_analytics(self, company, start_date, end_date):
        """Get revenue analytics data"""
        invoices = Invoice.objects.filter(
            company=company,
            invoice_date__range=[start_date, end_date],
            status__in=['SENT', 'PAID']
        )
        
        # Total revenue
        total_revenue = invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Revenue by month
        monthly_revenue = {}
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            month_invoices = invoices.filter(
                invoice_date__year=current_date.year,
                invoice_date__month=current_date.month
            )
            monthly_revenue[month_key] = month_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            current_date += timedelta(days=32)
            current_date = current_date.replace(day=1)
        
        # Revenue by customer
        customer_revenue = []
        for customer in Customer.objects.filter(company=company):
            customer_invoices = invoices.filter(customer=customer)
            total = customer_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            if total > 0:
                customer_revenue.append({
                    'customer': customer.name,
                    'amount': float(total),
                    'count': customer_invoices.count()
                })
        
        # Sort by amount descending
        customer_revenue.sort(key=lambda x: x['amount'], reverse=True)
        
        return {
            'total_revenue': float(total_revenue),
            'monthly_revenue': monthly_revenue,
            'customer_revenue': customer_revenue[:10],  # Top 10 customers
            'average_invoice': float(invoices.aggregate(Avg('total_amount'))['total_amount__avg'] or 0),
            'invoice_count': invoices.count()
        }
    
    def _get_expense_analytics(self, company, start_date, end_date):
        """Get expense analytics data"""
        bills = Bill.objects.filter(
            company=company,
            bill_date__range=[start_date, end_date],
            status__in=['RECEIVED', 'PAID']
        )
        
        # Total expenses
        total_expenses = bills.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Expenses by month
        monthly_expenses = {}
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            month_bills = bills.filter(
                bill_date__year=current_date.year,
                bill_date__month=current_date.month
            )
            monthly_expenses[month_key] = month_bills.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            current_date += timedelta(days=32)
            current_date = current_date.replace(day=1)
        
        # Expenses by vendor
        vendor_expenses = []
        for vendor in Vendor.objects.filter(company=company):
            vendor_bills = bills.filter(vendor=vendor)
            total = vendor_bills.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            if total > 0:
                vendor_expenses.append({
                    'vendor': vendor.name,
                    'amount': float(total),
                    'count': vendor_bills.count()
                })
        
        # Sort by amount descending
        vendor_expenses.sort(key=lambda x: x['amount'], reverse=True)
        
        return {
            'total_expenses': float(total_expenses),
            'monthly_expenses': monthly_expenses,
            'vendor_expenses': vendor_expenses[:10],  # Top 10 vendors
            'average_bill': float(bills.aggregate(Avg('total_amount'))['total_amount__avg'] or 0),
            'bill_count': bills.count()
        }
    
    def _get_customer_analytics(self, company, start_date, end_date):
        """Get customer analytics data"""
        customers = Customer.objects.filter(company=company)
        
        # Customer statistics
        total_customers = customers.count()
        
        # Active customers (with invoices in date range)
        active_customers = customers.filter(
            invoice__invoice_date__range=[start_date, end_date]
        ).distinct().count()
        
        # New customers (first invoice in date range)
        new_customers = customers.filter(
            invoice__invoice_date__range=[start_date, end_date]
        ).annotate(
            first_invoice_date=Min('invoice__invoice_date')
        ).filter(
            first_invoice_date__range=[start_date, end_date]
        ).count()
        
        # Customer lifetime value
        customer_lifetime_values = []
        for customer in customers:
            total_invoices = customer.invoice_set.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            if total_invoices > 0:
                customer_lifetime_values.append({
                    'customer': customer.name,
                    'lifetime_value': float(total_invoices),
                    'invoice_count': customer.invoice_set.count()
                })
        
        # Sort by lifetime value descending
        customer_lifetime_values.sort(key=lambda x: x['lifetime_value'], reverse=True)
        
        return {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_customers': new_customers,
            'customer_lifetime_values': customer_lifetime_values[:10],  # Top 10 customers
        }
    
    def _get_vendor_analytics(self, company, start_date, end_date):
        """Get vendor analytics data"""
        vendors = Vendor.objects.filter(company=company)
        
        # Vendor statistics
        total_vendors = vendors.count()
        
        # Active vendors (with bills in date range)
        active_vendors = vendors.filter(
            bill__bill_date__range=[start_date, end_date]
        ).distinct().count()
        
        # Vendor spending
        vendor_spending = []
        for vendor in vendors:
            total_bills = vendor.bill_set.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            if total_bills > 0:
                vendor_spending.append({
                    'vendor': vendor.name,
                    'total_spent': float(total_bills),
                    'bill_count': vendor.bill_set.count()
                })
        
        # Sort by total spent descending
        vendor_spending.sort(key=lambda x: x['total_spent'], reverse=True)
        
        return {
            'total_vendors': total_vendors,
            'active_vendors': active_vendors,
            'vendor_spending': vendor_spending[:10],  # Top 10 vendors
        }
    
    def _get_cash_flow_analytics(self, company, start_date, end_date):
        """Get cash flow analytics data"""
        # Cash inflows
        customer_payments = Payment.objects.filter(
            company=company,
            payment_type='CUSTOMER_PAYMENT',
            payment_date__range=[start_date, end_date]
        )
        
        # Cash outflows
        vendor_payments = Payment.objects.filter(
            company=company,
            payment_type='VENDOR_PAYMENT',
            payment_date__range=[start_date, end_date]
        )
        
        total_inflows = customer_payments.aggregate(Sum('amount'))['amount__sum'] or 0
        total_outflows = vendor_payments.aggregate(Sum('amount'))['amount__sum'] or 0
        net_cash_flow = total_inflows - total_outflows
        
        # Daily cash flow
        daily_cash_flow = {}
        current_date = start_date
        while current_date <= end_date:
            date_key = current_date.strftime('%Y-%m-%d')
            
            daily_inflows = customer_payments.filter(
                payment_date=current_date
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            daily_outflows = vendor_payments.filter(
                payment_date=current_date
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            daily_cash_flow[date_key] = {
                'inflows': float(daily_inflows),
                'outflows': float(daily_outflows),
                'net': float(daily_inflows - daily_outflows)
            }
            
            current_date += timedelta(days=1)
        
        return {
            'total_inflows': float(total_inflows),
            'total_outflows': float(total_outflows),
            'net_cash_flow': float(net_cash_flow),
            'daily_cash_flow': daily_cash_flow,
        }


# AJAX endpoints for charts
def get_revenue_chart_data(request):
    """Get revenue chart data via AJAX"""
    user_profile = request.user.userprofile
    company = user_profile.company
    
    # Get date range
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not start_date or not end_date:
        return JsonResponse({'error': 'Start date and end date are required'}, status=400)
    
    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Get revenue data
    invoices = Invoice.objects.filter(
        company=company,
        invoice_date__range=[start_date, end_date],
        status__in=['SENT', 'PAID']
    )
    
    # Group by month
    monthly_data = {}
    current_date = start_date
    while current_date <= end_date:
        month_key = current_date.strftime('%Y-%m')
        month_invoices = invoices.filter(
            invoice_date__year=current_date.year,
            invoice_date__month=current_date.month
        )
        monthly_data[month_key] = float(month_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
        current_date += timedelta(days=32)
        current_date = current_date.replace(day=1)
    
    return JsonResponse({
        'labels': list(monthly_data.keys()),
        'data': list(monthly_data.values())
    })


def get_expense_chart_data(request):
    """Get expense chart data via AJAX"""
    user_profile = request.user.userprofile
    company = user_profile.company
    
    # Get date range
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not start_date or not end_date:
        return JsonResponse({'error': 'Start date and end date are required'}, status=400)
    
    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Get expense data
    bills = Bill.objects.filter(
        company=company,
        bill_date__range=[start_date, end_date],
        status__in=['RECEIVED', 'PAID']
    )
    
    # Group by month
    monthly_data = {}
    current_date = start_date
    while current_date <= end_date:
        month_key = current_date.strftime('%Y-%m')
        month_bills = bills.filter(
            bill_date__year=current_date.year,
            bill_date__month=current_date.month
        )
        monthly_data[month_key] = float(month_bills.aggregate(Sum('total_amount'))['total_amount__sum'] or 0)
        current_date += timedelta(days=32)
        current_date = current_date.replace(day=1)
    
    return JsonResponse({
        'labels': list(monthly_data.keys()),
        'data': list(monthly_data.values())
    })


def get_cash_flow_chart_data(request):
    """Get cash flow chart data via AJAX"""
    user_profile = request.user.userprofile
    company = user_profile.company
    
    # Get date range
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not start_date or not end_date:
        return JsonResponse({'error': 'Start date and end date are required'}, status=400)
    
    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # Get cash flow data
    customer_payments = Payment.objects.filter(
        company=company,
        payment_type='CUSTOMER_PAYMENT',
        payment_date__range=[start_date, end_date]
    )
    
    vendor_payments = Payment.objects.filter(
        company=company,
        payment_type='VENDOR_PAYMENT',
        payment_date__range=[start_date, end_date]
    )
    
    # Group by month
    monthly_inflows = {}
    monthly_outflows = {}
    current_date = start_date
    while current_date <= end_date:
        month_key = current_date.strftime('%Y-%m')
        
        month_inflows = customer_payments.filter(
            payment_date__year=current_date.year,
            payment_date__month=current_date.month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        month_outflows = vendor_payments.filter(
            payment_date__year=current_date.year,
            payment_date__month=current_date.month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        monthly_inflows[month_key] = float(month_inflows)
        monthly_outflows[month_key] = float(month_outflows)
        
        current_date += timedelta(days=32)
        current_date = current_date.replace(day=1)
    
    return JsonResponse({
        'labels': list(monthly_inflows.keys()),
        'inflows': list(monthly_inflows.values()),
        'outflows': list(monthly_outflows.values())
    })