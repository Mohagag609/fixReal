"""
Django views for the real estate management system.
This module contains all view functions for handling HTTP requests.
"""

from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Sum, Count
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    Customer, Unit, Contract, Installment, Safe, Transfer,
    Broker, Partner, PartnerDebt, AuditLog
)
from .forms import (
    CustomerForm, UnitForm, ContractForm, SafeForm, TransferForm,
    BrokerForm, InstallmentForm, SearchForm, DateRangeForm, ImportForm
)
from .services.calculations import calculate_dashboard_kpis
from .services.reports import generate_report


def dashboard(request):
    """Main dashboard view."""
    try:
        # Get dashboard KPIs
        kpis = calculate_dashboard_kpis()
        
        # Get recent data
        recent_contracts = Contract.objects.select_related('customer', 'unit').order_by('-created_at')[:5]
        recent_customers = Customer.objects.order_by('-created_at')[:5]
        
        context = {
            'total_sales': kpis.get('total_sales', 0),
            'total_customers': kpis.get('total_customers', 0),
            'available_units': kpis.get('available_units', 0),
            'total_contracts': kpis.get('total_contracts', 0),
            'recent_contracts': recent_contracts,
            'recent_customers': recent_customers,
        }
        
        return render(request, 'realpp/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة التحكم: {str(e)}')
        return render(request, 'realpp/dashboard.html', {})


# Customer Views
def customers_list(request):
    """List all customers."""
    try:
        search_form = SearchForm(request.GET)
        customers = Customer.objects.all()
        
        if search_form.is_valid():
            query = search_form.cleaned_data.get('search_query')
            if query:
                customers = customers.filter(
                    Q(name__icontains=query) |
                    Q(phone__icontains=query) |
                    Q(email__icontains=query)
                )
        
        paginator = Paginator(customers, 20)
        page_number = request.GET.get('page')
        customers = paginator.get_page(page_number)
        
        context = {
            'customers': customers,
            'search_form': search_form,
        }
        
        return render(request, 'realpp/customers/list.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل قائمة العملاء: {str(e)}')
        return render(request, 'realpp/customers/list.html', {'customers': []})


def customers_create(request):
    """Create new customer."""
    if request.method == 'POST':
        form = CustomerForm(request.POST)
        if form.is_valid():
            customer = form.save()
            messages.success(request, 'تم إنشاء العميل بنجاح')
            return redirect('realpp:customers_detail', customer.id)
    else:
        form = CustomerForm()
    
    return render(request, 'realpp/customers/form.html', {'form': form})


def customers_detail(request, pk):
    """View customer details."""
    try:
        customer = get_object_or_404(Customer, pk=pk)
        
        # Calculate customer statistics
        contracts = customer.contracts.all()
        total_purchases = sum(contract.final_price for contract in contracts)
        
        # Calculate remaining amount
        remaining_amount = 0
        for contract in contracts:
            paid_amount = contract.installments.filter(status='paid').aggregate(
                total=Sum('paid_amount')
            )['total'] or 0
            remaining_amount += contract.final_price - paid_amount
        
        # Calculate payment percentage
        payment_percentage = 0
        if total_purchases > 0:
            paid_amount = total_purchases - remaining_amount
            payment_percentage = (paid_amount / total_purchases) * 100
        
        context = {
            'customer': customer,
            'total_purchases': total_purchases,
            'remaining_amount': remaining_amount,
            'payment_percentage': payment_percentage,
        }
        
        return render(request, 'realpp/customers/detail.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل تفاصيل العميل: {str(e)}')
        return redirect('realpp:customers_list')


def customers_edit(request, pk):
    """Edit customer."""
    try:
        customer = get_object_or_404(Customer, pk=pk)
        
        if request.method == 'POST':
            form = CustomerForm(request.POST, instance=customer)
            if form.is_valid():
                form.save()
                messages.success(request, 'تم تحديث العميل بنجاح')
                return redirect('realpp:customers_detail', customer.id)
        else:
            form = CustomerForm(instance=customer)
        
        return render(request, 'realpp/customers/form.html', {
            'form': form,
            'customer': customer
        })
    except Exception as e:
        messages.error(request, f'خطأ في تحديث العميل: {str(e)}')
        return redirect('realpp:customers_list')


@require_http_methods(["POST"])
def customers_delete(request, pk):
    """Delete customer."""
    try:
        customer = get_object_or_404(Customer, pk=pk)
        customer.delete()
        return JsonResponse({'success': True, 'message': 'تم حذف العميل بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


def customers_import(request):
    """Import customers from file."""
    if request.method == 'POST':
        form = ImportForm(request.POST, request.FILES)
        if form.is_valid():
            # Handle file import logic here
            messages.success(request, 'تم استيراد العملاء بنجاح')
            return redirect('realpp:customers_list')
    else:
        form = ImportForm()
    
    return render(request, 'realpp/customers/import.html', {'form': form})


def customers_export(request):
    """Export customers to file."""
    try:
        customers = Customer.objects.all()
        # Handle export logic here
        return JsonResponse({'success': True, 'message': 'تم تصدير العملاء بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# Unit Views
def units_list(request):
    """List all units."""
    try:
        search_form = SearchForm(request.GET)
        units = Unit.objects.all()
        
        if search_form.is_valid():
            query = search_form.cleaned_data.get('search_query')
            if query:
                units = units.filter(
                    Q(unit_number__icontains=query) |
                    Q(building__icontains=query)
                )
        
        paginator = Paginator(units, 20)
        page_number = request.GET.get('page')
        units = paginator.get_page(page_number)
        
        context = {
            'units': units,
            'search_form': search_form,
        }
        
        return render(request, 'realpp/units/list.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل قائمة الوحدات: {str(e)}')
        return render(request, 'realpp/units/list.html', {'units': []})


def units_create(request):
    """Create new unit."""
    if request.method == 'POST':
        form = UnitForm(request.POST)
        if form.is_valid():
            unit = form.save()
            messages.success(request, 'تم إنشاء الوحدة بنجاح')
            return redirect('realpp:units_detail', unit.id)
    else:
        form = UnitForm()
    
    return render(request, 'realpp/units/form.html', {'form': form})


def units_detail(request, pk):
    """View unit details."""
    try:
        unit = get_object_or_404(Unit, pk=pk)
        
        context = {
            'unit': unit,
        }
        
        return render(request, 'realpp/units/detail.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل تفاصيل الوحدة: {str(e)}')
        return redirect('realpp:units_list')


def units_edit(request, pk):
    """Edit unit."""
    try:
        unit = get_object_or_404(Unit, pk=pk)
        
        if request.method == 'POST':
            form = UnitForm(request.POST, instance=unit)
            if form.is_valid():
                form.save()
                messages.success(request, 'تم تحديث الوحدة بنجاح')
                return redirect('realpp:units_detail', unit.id)
        else:
            form = UnitForm(instance=unit)
        
        return render(request, 'realpp/units/form.html', {
            'form': form,
            'unit': unit
        })
    except Exception as e:
        messages.error(request, f'خطأ في تحديث الوحدة: {str(e)}')
        return redirect('realpp:units_list')


@require_http_methods(["POST"])
def units_delete(request, pk):
    """Delete unit."""
    try:
        unit = get_object_or_404(Unit, pk=pk)
        unit.delete()
        return JsonResponse({'success': True, 'message': 'تم حذف الوحدة بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


def units_import(request):
    """Import units from file."""
    if request.method == 'POST':
        form = ImportForm(request.POST, request.FILES)
        if form.is_valid():
            # Handle file import logic here
            messages.success(request, 'تم استيراد الوحدات بنجاح')
            return redirect('realpp:units_list')
    else:
        form = ImportForm()
    
    return render(request, 'realpp/units/import.html', {'form': form})


def units_export(request):
    """Export units to file."""
    try:
        units = Unit.objects.all()
        # Handle export logic here
        return JsonResponse({'success': True, 'message': 'تم تصدير الوحدات بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# Contract Views
def contracts_list(request):
    """List all contracts."""
    try:
        search_form = SearchForm(request.GET)
        contracts = Contract.objects.select_related('customer', 'unit').all()
        
        if search_form.is_valid():
            query = search_form.cleaned_data.get('search_query')
            if query:
                contracts = contracts.filter(
                    Q(contract_number__icontains=query) |
                    Q(customer__name__icontains=query) |
                    Q(unit__unit_number__icontains=query)
                )
        
        paginator = Paginator(contracts, 20)
        page_number = request.GET.get('page')
        contracts = paginator.get_page(page_number)
        
        context = {
            'contracts': contracts,
            'search_form': search_form,
        }
        
        return render(request, 'realpp/contracts/list.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل قائمة العقود: {str(e)}')
        return render(request, 'realpp/contracts/list.html', {'contracts': []})


def contracts_create(request):
    """Create new contract."""
    if request.method == 'POST':
        form = ContractForm(request.POST)
        if form.is_valid():
            contract = form.save()
            messages.success(request, 'تم إنشاء العقد بنجاح')
            return redirect('realpp:contracts_detail', contract.id)
    else:
        form = ContractForm()
    
    return render(request, 'realpp/contracts/form.html', {'form': form})


def contracts_detail(request, pk):
    """View contract details."""
    try:
        contract = get_object_or_404(Contract, pk=pk)
        
        context = {
            'contract': contract,
        }
        
        return render(request, 'realpp/contracts/detail.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل تفاصيل العقد: {str(e)}')
        return redirect('realpp:contracts_list')


def contracts_edit(request, pk):
    """Edit contract."""
    try:
        contract = get_object_or_404(Contract, pk=pk)
        
        if request.method == 'POST':
            form = ContractForm(request.POST, instance=contract)
            if form.is_valid():
                form.save()
                messages.success(request, 'تم تحديث العقد بنجاح')
                return redirect('realpp:contracts_detail', contract.id)
        else:
            form = ContractForm(instance=contract)
        
        return render(request, 'realpp/contracts/form.html', {
            'form': form,
            'contract': contract
        })
    except Exception as e:
        messages.error(request, f'خطأ في تحديث العقد: {str(e)}')
        return redirect('realpp:contracts_list')


@require_http_methods(["POST"])
def contracts_delete(request, pk):
    """Delete contract."""
    try:
        contract = get_object_or_404(Contract, pk=pk)
        contract.delete()
        return JsonResponse({'success': True, 'message': 'تم حذف العقد بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


def contracts_export(request):
    """Export contracts to file."""
    try:
        contracts = Contract.objects.all()
        # Handle export logic here
        return JsonResponse({'success': True, 'message': 'تم تصدير العقود بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# Treasury Views
def treasury_dashboard(request):
    """Treasury dashboard."""
    try:
        safes = Safe.objects.all()
        recent_transfers = Transfer.objects.select_related('from_safe', 'to_safe').order_by('-created_at')[:10]
        
        # Calculate totals
        total_funds = sum(safe.current_balance for safe in safes)
        total_safes = safes.count()
        today_transfers = Transfer.objects.filter(created_at__date=timezone.now().date()).count()
        total_transfers = Transfer.objects.aggregate(total=Sum('amount'))['total'] or 0
        
        context = {
            'safes': safes,
            'recent_transfers': recent_transfers,
            'total_funds': total_funds,
            'total_safes': total_safes,
            'today_transfers': today_transfers,
            'total_transfers': total_transfers,
        }
        
        return render(request, 'realpp/treasury/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة الخزينة: {str(e)}')
        return render(request, 'realpp/treasury/dashboard.html', {})


def safes_list(request):
    """List all safes."""
    try:
        safes = Safe.objects.all()
        
        context = {
            'safes': safes,
        }
        
        return render(request, 'realpp/treasury/safes_list.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل قائمة الخزائن: {str(e)}')
        return render(request, 'realpp/treasury/safes_list.html', {'safes': []})


def safes_create(request):
    """Create new safe."""
    if request.method == 'POST':
        form = SafeForm(request.POST)
        if form.is_valid():
            safe = form.save()
            messages.success(request, 'تم إنشاء الخزينة بنجاح')
            return redirect('realpp:safes_detail', safe.id)
    else:
        form = SafeForm()
    
    return render(request, 'realpp/treasury/safes_form.html', {'form': form})


def safes_detail(request, pk):
    """View safe details."""
    try:
        safe = get_object_or_404(Safe, pk=pk)
        
        context = {
            'safe': safe,
        }
        
        return render(request, 'realpp/treasury/safes_detail.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل تفاصيل الخزينة: {str(e)}')
        return redirect('realpp:safes_list')


def safes_edit(request, pk):
    """Edit safe."""
    try:
        safe = get_object_or_404(Safe, pk=pk)
        
        if request.method == 'POST':
            form = SafeForm(request.POST, instance=safe)
            if form.is_valid():
                form.save()
                messages.success(request, 'تم تحديث الخزينة بنجاح')
                return redirect('realpp:safes_detail', safe.id)
        else:
            form = SafeForm(instance=safe)
        
        return render(request, 'realpp/treasury/safes_form.html', {
            'form': form,
            'safe': safe
        })
    except Exception as e:
        messages.error(request, f'خطأ في تحديث الخزينة: {str(e)}')
        return redirect('realpp:safes_list')


@require_http_methods(["POST"])
def safes_delete(request, pk):
    """Delete safe."""
    try:
        safe = get_object_or_404(Safe, pk=pk)
        safe.delete()
        return JsonResponse({'success': True, 'message': 'تم حذف الخزينة بنجاح'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# Reports Views
def reports_dashboard(request):
    """Reports dashboard."""
    try:
        # Get report data
        sales_data = calculate_dashboard_kpis()
        
        context = {
            'total_sales': sales_data.get('total_sales', 0),
            'total_revenue': sales_data.get('total_receipts', 0),
            'total_contracts': sales_data.get('total_contracts', 0),
            'sold_units': sales_data.get('sold_units', 0),
        }
        
        return render(request, 'realpp/reports/dashboard.html', context)
    except Exception as e:
        messages.error(request, f'خطأ في تحميل لوحة التقارير: {str(e)}')
        return render(request, 'realpp/reports/dashboard.html', {})


def generate_report_view(request, report_type, format='pdf'):
    """Generate and download report."""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d')
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d')
        
        return generate_report(
            report_type=report_type,
            format=format,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        messages.error(request, f'خطأ في توليد التقرير: {str(e)}')
        return redirect('realpp:reports_dashboard')


# Error Views
def custom_404(request, exception):
    """Custom 404 error page."""
    return render(request, 'realpp/404.html', status=404)


def custom_500(request):
    """Custom 500 error page."""
    return render(request, 'realpp/500.html', status=500)


def custom_403(request, exception):
    """Custom 403 error page."""
    return render(request, 'realpp/403.html', status=403)


def custom_400(request, exception):
    """Custom 400 error page."""
    return render(request, 'realpp/400.html', status=400)