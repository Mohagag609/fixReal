from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.views.generic import (
    ListView, CreateView, UpdateView, DeleteView, DetailView, TemplateView
)
from django.urls import reverse_lazy, reverse
from django.http import JsonResponse, HttpResponse
from django.db import transaction
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    Company, Customer, Vendor, Invoice, InvoiceItem, Bill, BillItem,
    Payment, PaymentAllocation, JournalEntry, JournalEntryLine,
    ChartOfAccounts, BankAccount, BankTransaction, Product, TaxRate
)
from .services.calculations import FinancialCalculations
from .services.reports import ReportGenerator
from .forms import (
    InvoiceForm, InvoiceItemFormSet, BillForm, BillItemFormSet,
    CustomerForm, VendorForm, PaymentForm, JournalEntryForm,
    JournalEntryLineFormSet, ProductForm, TaxRateForm
)


# Dashboard Views
class DashboardView(LoginRequiredMixin, TemplateView):
    """Main dashboard with KPIs and overview"""
    template_name = 'accounting/dashboard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get user's company
        user_profile = self.request.user.userprofile
        company = user_profile.company
        
        # Calculate KPIs
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Revenue this month
        monthly_revenue = Invoice.objects.filter(
            company=company,
            invoice_date__gte=month_start,
            status__in=['SENT', 'PAID']
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Outstanding receivables
        outstanding_receivables = Invoice.objects.filter(
            company=company,
            status__in=['SENT', 'OVERDUE']
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Outstanding payables
        outstanding_payables = Bill.objects.filter(
            company=company,
            status__in=['RECEIVED', 'OVERDUE']
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        # Recent transactions
        recent_invoices = Invoice.objects.filter(company=company).order_by('-created_at')[:5]
        recent_bills = Bill.objects.filter(company=company).order_by('-created_at')[:5]
        
        context.update({
            'monthly_revenue': monthly_revenue,
            'outstanding_receivables': outstanding_receivables,
            'outstanding_payables': outstanding_payables,
            'recent_invoices': recent_invoices,
            'recent_bills': recent_bills,
            'company': company
        })
        
        return context


# Customer Management
class CustomerListView(LoginRequiredMixin, ListView):
    """List all customers"""
    model = Customer
    template_name = 'accounting/customers/list.html'
    context_object_name = 'customers'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Customer.objects.filter(company=user_profile.company).order_by('name')


class CustomerCreateView(LoginRequiredMixin, CreateView):
    """Create new customer"""
    model = Customer
    form_class = CustomerForm
    template_name = 'accounting/customers/form.html'
    success_url = reverse_lazy('accounting:customer_list')
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class CustomerUpdateView(LoginRequiredMixin, UpdateView):
    """Update customer"""
    model = Customer
    form_class = CustomerForm
    template_name = 'accounting/customers/form.html'
    success_url = reverse_lazy('accounting:customer_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Customer.objects.filter(company=user_profile.company)


class CustomerDeleteView(LoginRequiredMixin, DeleteView):
    """Delete customer"""
    model = Customer
    template_name = 'accounting/customers/confirm_delete.html'
    success_url = reverse_lazy('accounting:customer_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Customer.objects.filter(company=user_profile.company)


class CustomerDetailView(LoginRequiredMixin, DetailView):
    """Customer detail view with invoices and payments"""
    model = Customer
    template_name = 'accounting/customers/detail.html'
    context_object_name = 'customer'
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Customer.objects.filter(company=user_profile.company)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        customer = self.get_object()
        
        # Get customer invoices
        invoices = Invoice.objects.filter(customer=customer).order_by('-invoice_date')
        context['invoices'] = invoices[:10]  # Last 10 invoices
        
        # Get customer payments
        payments = Payment.objects.filter(customer=customer).order_by('-payment_date')
        context['payments'] = payments[:10]  # Last 10 payments
        
        # Calculate totals
        context['total_invoices'] = invoices.count()
        context['total_amount'] = invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        context['total_paid'] = payments.aggregate(Sum('amount'))['amount__sum'] or 0
        context['balance_due'] = context['total_amount'] - context['total_paid']
        
        return context


# Vendor Management
class VendorListView(LoginRequiredMixin, ListView):
    """List all vendors"""
    model = Vendor
    template_name = 'accounting/vendors/list.html'
    context_object_name = 'vendors'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Vendor.objects.filter(company=user_profile.company).order_by('name')


class VendorCreateView(LoginRequiredMixin, CreateView):
    """Create new vendor"""
    model = Vendor
    form_class = VendorForm
    template_name = 'accounting/vendors/form.html'
    success_url = reverse_lazy('accounting:vendor_list')
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class VendorUpdateView(LoginRequiredMixin, UpdateView):
    """Update vendor"""
    model = Vendor
    form_class = VendorForm
    template_name = 'accounting/vendors/form.html'
    success_url = reverse_lazy('accounting:vendor_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Vendor.objects.filter(company=user_profile.company)


class VendorDeleteView(LoginRequiredMixin, DeleteView):
    """Delete vendor"""
    model = Vendor
    template_name = 'accounting/vendors/confirm_delete.html'
    success_url = reverse_lazy('accounting:vendor_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Vendor.objects.filter(company=user_profile.company)


# Invoice Management
class InvoiceListView(LoginRequiredMixin, ListView):
    """List all invoices"""
    model = Invoice
    template_name = 'accounting/invoices/list.html'
    context_object_name = 'invoices'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        queryset = Invoice.objects.filter(company=user_profile.company).order_by('-invoice_date')
        
        # Filter by status if provided
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by customer if provided
        customer_id = self.request.GET.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user_profile = self.request.user.userprofile
        
        # Add filter options
        context['customers'] = Customer.objects.filter(company=user_profile.company)
        context['status_choices'] = [
            ('DRAFT', 'Draft'),
            ('SENT', 'Sent'),
            ('PAID', 'Paid'),
            ('OVERDUE', 'Overdue'),
            ('CANCELLED', 'Cancelled'),
        ]
        
        return context


class InvoiceCreateView(LoginRequiredMixin, CreateView):
    """Create new invoice"""
    model = Invoice
    form_class = InvoiceForm
    template_name = 'accounting/invoices/form.html'
    
    def get_success_url(self):
        return reverse('accounting:invoice_detail', kwargs={'pk': self.object.pk})
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class InvoiceUpdateView(LoginRequiredMixin, UpdateView):
    """Update invoice"""
    model = Invoice
    form_class = InvoiceForm
    template_name = 'accounting/invoices/form.html'
    
    def get_success_url(self):
        return reverse('accounting:invoice_detail', kwargs={'pk': self.object.pk})
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Invoice.objects.filter(company=user_profile.company)
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs


class InvoiceDetailView(LoginRequiredMixin, DetailView):
    """Invoice detail view"""
    model = Invoice
    template_name = 'accounting/invoices/detail.html'
    context_object_name = 'invoice'
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Invoice.objects.filter(company=user_profile.company)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        invoice = self.get_object()
        
        # Get invoice items
        context['items'] = invoice.items.all()
        
        # Get payment allocations
        context['allocations'] = PaymentAllocation.objects.filter(invoice=invoice)
        
        return context


class InvoiceDeleteView(LoginRequiredMixin, DeleteView):
    """Delete invoice"""
    model = Invoice
    template_name = 'accounting/invoices/confirm_delete.html'
    success_url = reverse_lazy('accounting:invoice_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Invoice.objects.filter(company=user_profile.company)


# Bill Management
class BillListView(LoginRequiredMixin, ListView):
    """List all bills"""
    model = Bill
    template_name = 'accounting/bills/list.html'
    context_object_name = 'bills'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        queryset = Bill.objects.filter(company=user_profile.company).order_by('-bill_date')
        
        # Filter by status if provided
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by vendor if provided
        vendor_id = self.request.GET.get('vendor')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user_profile = self.request.user.userprofile
        
        # Add filter options
        context['vendors'] = Vendor.objects.filter(company=user_profile.company)
        context['status_choices'] = [
            ('DRAFT', 'Draft'),
            ('RECEIVED', 'Received'),
            ('PAID', 'Paid'),
            ('OVERDUE', 'Overdue'),
            ('CANCELLED', 'Cancelled'),
        ]
        
        return context


class BillCreateView(LoginRequiredMixin, CreateView):
    """Create new bill"""
    model = Bill
    form_class = BillForm
    template_name = 'accounting/bills/form.html'
    
    def get_success_url(self):
        return reverse('accounting:bill_detail', kwargs={'pk': self.object.pk})
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class BillUpdateView(LoginRequiredMixin, UpdateView):
    """Update bill"""
    model = Bill
    form_class = BillForm
    template_name = 'accounting/bills/form.html'
    
    def get_success_url(self):
        return reverse('accounting:bill_detail', kwargs={'pk': self.object.pk})
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Bill.objects.filter(company=user_profile.company)
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs


class BillDetailView(LoginRequiredMixin, DetailView):
    """Bill detail view"""
    model = Bill
    template_name = 'accounting/bills/detail.html'
    context_object_name = 'bill'
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Bill.objects.filter(company=user_profile.company)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        bill = self.get_object()
        
        # Get bill items
        context['items'] = bill.items.all()
        
        # Get payment allocations
        context['allocations'] = PaymentAllocation.objects.filter(bill=bill)
        
        return context


class BillDeleteView(LoginRequiredMixin, DeleteView):
    """Delete bill"""
    model = Bill
    template_name = 'accounting/bills/confirm_delete.html'
    success_url = reverse_lazy('accounting:bill_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Bill.objects.filter(company=user_profile.company)


# Payment Management
class PaymentListView(LoginRequiredMixin, ListView):
    """List all payments"""
    model = Payment
    template_name = 'accounting/payments/list.html'
    context_object_name = 'payments'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Payment.objects.filter(company=user_profile.company).order_by('-payment_date')


class PaymentCreateView(LoginRequiredMixin, CreateView):
    """Create new payment"""
    model = Payment
    form_class = PaymentForm
    template_name = 'accounting/payments/form.html'
    success_url = reverse_lazy('accounting:payment_list')
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class PaymentUpdateView(LoginRequiredMixin, UpdateView):
    """Update payment"""
    model = Payment
    form_class = PaymentForm
    template_name = 'accounting/payments/form.html'
    success_url = reverse_lazy('accounting:payment_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Payment.objects.filter(company=user_profile.company)
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs


class PaymentDeleteView(LoginRequiredMixin, DeleteView):
    """Delete payment"""
    model = Payment
    template_name = 'accounting/payments/confirm_delete.html'
    success_url = reverse_lazy('accounting:payment_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Payment.objects.filter(company=user_profile.company)


# Chart of Accounts
class ChartOfAccountsListView(LoginRequiredMixin, ListView):
    """List chart of accounts"""
    model = ChartOfAccounts
    template_name = 'accounting/chart_of_accounts/list.html'
    context_object_name = 'accounts'
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return ChartOfAccounts.objects.filter(company=user_profile.company).order_by('code')


# Journal Entries
class JournalEntryListView(LoginRequiredMixin, ListView):
    """List journal entries"""
    model = JournalEntry
    template_name = 'accounting/journal_entries/list.html'
    context_object_name = 'journal_entries'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return JournalEntry.objects.filter(company=user_profile.company).order_by('-entry_date')


class JournalEntryCreateView(LoginRequiredMixin, CreateView):
    """Create journal entry"""
    model = JournalEntry
    form_class = JournalEntryForm
    template_name = 'accounting/journal_entries/form.html'
    success_url = reverse_lazy('accounting:journal_entry_list')
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class JournalEntryDetailView(LoginRequiredMixin, DetailView):
    """Journal entry detail"""
    model = JournalEntry
    template_name = 'accounting/journal_entries/detail.html'
    context_object_name = 'journal_entry'
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return JournalEntry.objects.filter(company=user_profile.company)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        journal_entry = self.get_object()
        context['lines'] = journal_entry.lines.all()
        return context


# Product Management
class ProductListView(LoginRequiredMixin, ListView):
    """List products"""
    model = Product
    template_name = 'accounting/products/list.html'
    context_object_name = 'products'
    paginate_by = 20
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Product.objects.filter(company=user_profile.company).order_by('name')


class ProductCreateView(LoginRequiredMixin, CreateView):
    """Create product"""
    model = Product
    form_class = ProductForm
    template_name = 'accounting/products/form.html'
    success_url = reverse_lazy('accounting:product_list')
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs
    
    def form_valid(self, form):
        user_profile = self.request.user.userprofile
        form.instance.company = user_profile.company
        return super().form_valid(form)


class ProductUpdateView(LoginRequiredMixin, UpdateView):
    """Update product"""
    model = Product
    form_class = ProductForm
    template_name = 'accounting/products/form.html'
    success_url = reverse_lazy('accounting:product_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Product.objects.filter(company=user_profile.company)
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        user_profile = self.request.user.userprofile
        kwargs['company'] = user_profile.company
        return kwargs


class ProductDeleteView(LoginRequiredMixin, DeleteView):
    """Delete product"""
    model = Product
    template_name = 'accounting/products/confirm_delete.html'
    success_url = reverse_lazy('accounting:product_list')
    
    def get_queryset(self):
        user_profile = self.request.user.userprofile
        return Product.objects.filter(company=user_profile.company)


# AJAX Views for dynamic updates
def get_customer_invoices(request, customer_id):
    """Get invoices for a customer (AJAX)"""
    invoices = Invoice.objects.filter(customer_id=customer_id, status__in=['SENT', 'OVERDUE'])
    data = []
    for invoice in invoices:
        data.append({
            'id': invoice.id,
            'number': invoice.invoice_number,
            'date': invoice.invoice_date.strftime('%Y-%m-%d'),
            'amount': float(invoice.total_amount),
            'balance': float(invoice.balance_due)
        })
    return JsonResponse({'invoices': data})


def get_vendor_bills(request, vendor_id):
    """Get bills for a vendor (AJAX)"""
    bills = Bill.objects.filter(vendor_id=vendor_id, status__in=['RECEIVED', 'OVERDUE'])
    data = []
    for bill in bills:
        data.append({
            'id': bill.id,
            'number': bill.bill_number,
            'date': bill.bill_date.strftime('%Y-%m-%d'),
            'amount': float(bill.total_amount),
            'balance': float(bill.balance_due)
        })
    return JsonResponse({'bills': data})


def calculate_invoice_totals(request, invoice_id):
    """Calculate invoice totals (AJAX)"""
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        calculations = FinancialCalculations.calculate_invoice_totals(invoice)
        return JsonResponse(calculations)
    except Invoice.DoesNotExist:
        return JsonResponse({'error': 'Invoice not found'}, status=404)


def calculate_bill_totals(request, bill_id):
    """Calculate bill totals (AJAX)"""
    try:
        bill = Bill.objects.get(id=bill_id)
        calculations = FinancialCalculations.calculate_bill_totals(bill)
        return JsonResponse(calculations)
    except Bill.DoesNotExist:
        return JsonResponse({'error': 'Bill not found'}, status=404)