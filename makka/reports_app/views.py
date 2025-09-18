from django.shortcuts import render, get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView, ListView
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.utils import timezone
from datetime import datetime, timedelta
import json
import csv
import io

from accounting_app.services.reports import ReportGenerator
from accounting_app.models import Company, Customer, Vendor


class ReportsDashboardView(LoginRequiredMixin, TemplateView):
    """Reports dashboard with available report types"""
    template_name = 'reports/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get user's company
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        context['company'] = company
        context['customers'] = Customer.objects.filter(company=company)
        context['vendors'] = Vendor.objects.filter(company=company)
        
        return context


class InvoiceReportView(LoginRequiredMixin, TemplateView):
    """Invoice report generator"""
    template_name = 'reports/invoice_report.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        status = self.request.GET.get('status')
        customer_id = self.request.GET.get('customer')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            report_data = report_generator.generate_invoice_report(
                start_date, end_date, status, 
                Customer.objects.get(id=customer_id) if customer_id else None
            )
            
            context['report_data'] = report_data
            context['start_date'] = start_date
            context['end_date'] = end_date
            context['status'] = status
            context['customer_id'] = customer_id
        
        context['customers'] = Customer.objects.filter(company=company)
        context['status_choices'] = [
            ('DRAFT', 'Draft'),
            ('SENT', 'Sent'),
            ('PAID', 'Paid'),
            ('OVERDUE', 'Overdue'),
            ('CANCELLED', 'Cancelled'),
        ]
        
        return context


class BillReportView(LoginRequiredMixin, TemplateView):
    """Bill report generator"""
    template_name = 'reports/bill_report.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        status = self.request.GET.get('status')
        vendor_id = self.request.GET.get('vendor')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            report_data = report_generator.generate_bill_report(
                start_date, end_date, status,
                Vendor.objects.get(id=vendor_id) if vendor_id else None
            )
            
            context['report_data'] = report_data
            context['start_date'] = start_date
            context['end_date'] = end_date
            context['status'] = status
            context['vendor_id'] = vendor_id
        
        context['vendors'] = Vendor.objects.filter(company=company)
        context['status_choices'] = [
            ('DRAFT', 'Draft'),
            ('RECEIVED', 'Received'),
            ('PAID', 'Paid'),
            ('OVERDUE', 'Overdue'),
            ('CANCELLED', 'Cancelled'),
        ]
        
        return context


class CustomerStatementView(LoginRequiredMixin, TemplateView):
    """Customer statement generator"""
    template_name = 'reports/customer_statement.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        customer_id = self.request.GET.get('customer')
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if customer_id and start_date and end_date:
            customer = get_object_or_404(Customer, id=customer_id, company=company)
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            statement_data = report_generator.generate_customer_statement(
                customer, start_date, end_date
            )
            
            context['statement_data'] = statement_data
            context['customer'] = customer
            context['start_date'] = start_date
            context['end_date'] = end_date
        
        context['customers'] = Customer.objects.filter(company=company)
        
        return context


class VendorStatementView(LoginRequiredMixin, TemplateView):
    """Vendor statement generator"""
    template_name = 'reports/vendor_statement.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        vendor_id = self.request.GET.get('vendor')
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if vendor_id and start_date and end_date:
            vendor = get_object_or_404(Vendor, id=vendor_id, company=company)
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            statement_data = report_generator.generate_vendor_statement(
                vendor, start_date, end_date
            )
            
            context['statement_data'] = statement_data
            context['vendor'] = vendor
            context['start_date'] = start_date
            context['end_date'] = end_date
        
        context['vendors'] = Vendor.objects.filter(company=company)
        
        return context


class SalesSummaryView(LoginRequiredMixin, TemplateView):
    """Sales summary report"""
    template_name = 'reports/sales_summary.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            summary_data = report_generator.generate_sales_summary(start_date, end_date)
            
            context['summary_data'] = summary_data
            context['start_date'] = start_date
            context['end_date'] = end_date
        
        return context


class ExpenseSummaryView(LoginRequiredMixin, TemplateView):
    """Expense summary report"""
    template_name = 'reports/expense_summary.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            summary_data = report_generator.generate_expense_summary(start_date, end_date)
            
            context['summary_data'] = summary_data
            context['start_date'] = start_date
            context['end_date'] = end_date
        
        return context


class CashFlowReportView(LoginRequiredMixin, TemplateView):
    """Cash flow report"""
    template_name = 'reports/cash_flow.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            cash_flow_data = report_generator.generate_cash_flow_report(start_date, end_date)
            
            context['cash_flow_data'] = cash_flow_data
            context['start_date'] = start_date
            context['end_date'] = end_date
        
        return context


class TaxReportView(LoginRequiredMixin, TemplateView):
    """Tax report"""
    template_name = 'reports/tax_report.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Get filter parameters
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')
        
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            report_generator = ReportGenerator(company)
            tax_data = report_generator.generate_tax_report(start_date, end_date)
            
            context['tax_data'] = tax_data
            context['start_date'] = start_date
            context['end_date'] = end_date
        
        return context


# Export functions
def export_report_csv(request, report_type):
    """Export report as CSV"""
    user_profile = request.user.userprofile
    company = user_profile.company
    
    # Get filter parameters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    status = request.GET.get('status')
    customer_id = request.GET.get('customer')
    vendor_id = request.GET.get('vendor')
    
    if not start_date or not end_date:
        return HttpResponse('Start date and end date are required', status=400)
    
    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    report_generator = ReportGenerator(company)
    
    if report_type == 'invoice':
        customer = Customer.objects.get(id=customer_id) if customer_id else None
        report_data = report_generator.generate_invoice_report(start_date, end_date, status, customer)
    elif report_type == 'bill':
        vendor = Vendor.objects.get(id=vendor_id) if vendor_id else None
        report_data = report_generator.generate_bill_report(start_date, end_date, status, vendor)
    elif report_type == 'sales':
        report_data = report_generator.generate_sales_summary(start_date, end_date)
    elif report_type == 'expense':
        report_data = report_generator.generate_expense_summary(start_date, end_date)
    elif report_type == 'cash_flow':
        report_data = report_generator.generate_cash_flow_report(start_date, end_date)
    elif report_type == 'tax':
        report_data = report_generator.generate_tax_report(start_date, end_date)
    else:
        return HttpResponse('Invalid report type', status=400)
    
    csv_data = report_generator.export_to_csv(report_data, f'{report_type}_report.csv')
    
    response = HttpResponse(csv_data, content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{report_type}_report_{start_date}_{end_date}.csv"'
    
    return response