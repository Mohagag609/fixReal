from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, CreateView, UpdateView, DeleteView, DetailView
from django.contrib import messages
from django.http import JsonResponse
from django.db import transaction
from django.core.paginator import Paginator
from django.db.models import Q, Sum, Count
from django.utils import timezone
from decimal import Decimal
import json

from .models import (
    Customer, Unit, Partner, Contract, Installment, Safe, Voucher, Broker,
    PartnerDebt, BrokerDue, PartnerGroup, UnitPartner, PartnerGroupPartner,
    UnitPartnerGroup, AuditLog, Settings, KeyVal, Transfer
)
from .services.financial_services import (
    SafeService, InstallmentService, ContractService, VoucherService, TransferService
)
from .services.validation_services import (
    CustomerValidationService, UnitValidationService, PartnerValidationService,
    PartnerGroupValidationService, FinancialValidationService
)


class DashboardView(ListView):
    """الصفحة الرئيسية"""
    template_name = 'accounting_app/dashboard.html'
    context_object_name = 'kpis'
    
    def get_queryset(self):
        # استخدام الخدمات لحساب المؤشرات
        contract_stats = ContractService.get_contract_statistics()
        
        total_customers = Customer.objects.filter(deleted_at__isnull=True).count()
        total_units = Unit.objects.filter(deleted_at__isnull=True).count()
        total_installments = Installment.objects.filter(deleted_at__isnull=True).count()
        
        total_installments_value = InstallmentService.get_total_paid_installments()
        pending_installments = InstallmentService.get_pending_installments_count()
        
        return {
            'total_contracts': contract_stats['total_contracts'],
            'total_customers': total_customers,
            'total_units': total_units,
            'total_installments': total_installments,
            'total_contracts_value': contract_stats['total_value'],
            'total_installments_value': total_installments_value,
            'pending_installments': pending_installments,
        }


class CustomerListView(ListView):
    """قائمة العملاء"""
    model = Customer
    template_name = 'accounting_app/customers/list.html'
    context_object_name = 'customers'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Customer.objects.filter(deleted_at__isnull=True)
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(national_id__icontains=search)
            )
        
        # التصفية حسب الحالة
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['status'] = self.request.GET.get('status', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class CustomerCreateView(CreateView):
    """إضافة عميل جديد"""
    model = Customer
    template_name = 'accounting_app/customers/form.html'
    fields = ['name', 'phone', 'national_id', 'address', 'status', 'notes']
    
    def form_valid(self, form):
        # التحقق من التكرار باستخدام الخدمة
        if form.cleaned_data.get('phone'):
            if not CustomerValidationService.validate_phone_uniqueness(form.cleaned_data['phone']):
                form.add_error('phone', 'رقم الهاتف موجود بالفعل')
                return self.form_invalid(form)
        
        if form.cleaned_data.get('national_id'):
            if not CustomerValidationService.validate_national_id_uniqueness(form.cleaned_data['national_id']):
                form.add_error('national_id', 'الرقم القومي موجود بالفعل')
                return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة العميل بنجاح')
        return response
    
    def get_success_url(self):
        return '/customers/'


class CustomerUpdateView(UpdateView):
    """تعديل عميل"""
    model = Customer
    template_name = 'accounting_app/customers/form.html'
    fields = ['name', 'phone', 'national_id', 'address', 'status', 'notes']
    
    def form_valid(self, form):
        # التحقق من التكرار باستخدام الخدمة
        if form.cleaned_data.get('phone'):
            if not CustomerValidationService.validate_phone_uniqueness(form.cleaned_data['phone'], self.object.id):
                form.add_error('phone', 'رقم الهاتف موجود بالفعل')
                return self.form_invalid(form)
        
        if form.cleaned_data.get('national_id'):
            if not CustomerValidationService.validate_national_id_uniqueness(form.cleaned_data['national_id'], self.object.id):
                form.add_error('national_id', 'الرقم القومي موجود بالفعل')
                return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث العميل بنجاح')
        return response
    
    def get_success_url(self):
        return '/customers/'


class CustomerDeleteView(DeleteView):
    """حذف عميل"""
    model = Customer
    template_name = 'accounting_app/customers/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف العميل بنجاح')
        return redirect('/customers/')


class UnitListView(ListView):
    """قائمة الوحدات"""
    model = Unit
    template_name = 'accounting_app/units/list.html'
    context_object_name = 'units'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Unit.objects.filter(deleted_at__isnull=True)
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(name__icontains=search) |
                Q(building__icontains=search)
            )
        
        # التصفية حسب الحالة
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['status'] = self.request.GET.get('status', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class UnitCreateView(CreateView):
    """إضافة وحدة جديدة"""
    model = Unit
    template_name = 'accounting_app/units/form.html'
    fields = ['name', 'unit_type', 'area', 'floor', 'building', 'total_price', 'status', 'notes']
    
    def form_valid(self, form):
        # إنشاء كود الوحدة
        if not form.cleaned_data.get('name'):
            form.add_error('name', 'اسم الوحدة مطلوب')
            return self.form_invalid(form)
        
        # إنشاء كود الوحدة
        code = f"{form.cleaned_data['name']}-{form.cleaned_data.get('floor', '0')}-{form.cleaned_data.get('building', '0')}"
        form.instance.code = code
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة الوحدة بنجاح')
        return response
    
    def get_success_url(self):
        return '/units/'


class UnitUpdateView(UpdateView):
    """تعديل وحدة"""
    model = Unit
    template_name = 'accounting_app/units/form.html'
    fields = ['name', 'unit_type', 'area', 'floor', 'building', 'total_price', 'status', 'notes']
    
    def form_valid(self, form):
        # تحديث كود الوحدة
        if form.cleaned_data.get('name'):
            code = f"{form.cleaned_data['name']}-{form.cleaned_data.get('floor', '0')}-{form.cleaned_data.get('building', '0')}"
            form.instance.code = code
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث الوحدة بنجاح')
        return response
    
    def get_success_url(self):
        return '/units/'


class UnitDeleteView(DeleteView):
    """حذف وحدة"""
    model = Unit
    template_name = 'accounting_app/units/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف الوحدة بنجاح')
        return redirect('/units/')


class ContractListView(ListView):
    """قائمة العقود"""
    model = Contract
    template_name = 'accounting_app/contracts/list.html'
    context_object_name = 'contracts'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Contract.objects.filter(deleted_at__isnull=True).select_related('unit', 'customer')
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(unit__code__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(broker_name__icontains=search)
            )
        
        # التصفية حسب نوع الدفع
        payment_type = self.request.GET.get('payment_type')
        if payment_type:
            queryset = queryset.filter(payment_type=payment_type)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['payment_type'] = self.request.GET.get('payment_type', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class ContractCreateView(CreateView):
    """إضافة عقد جديد"""
    model = Contract
    template_name = 'accounting_app/contracts/form.html'
    fields = [
        'unit', 'customer', 'start', 'total_price', 'discount_amount',
        'broker_name', 'broker_percent', 'broker_amount', 'commission_safe_id',
        'down_payment_safe_id', 'maintenance_deposit', 'installment_type',
        'installment_count', 'extra_annual', 'annual_payment_value',
        'down_payment', 'payment_type'
    ]
    
    def form_valid(self, form):
        with transaction.atomic():
            response = super().form_valid(form)
            
            # إنشاء الأقساط إذا كان النوع تقسيط
            if form.cleaned_data['payment_type'] == 'installment':
                self.create_installments(form.instance)
            
            messages.success(self.request, 'تم إضافة العقد بنجاح')
            return response
    
    def create_installments(self, contract):
        """إنشاء الأقساط للعقد"""
        return InstallmentService.create_installments_for_contract(contract)
    
    def get_success_url(self):
        return '/contracts/'


class ContractUpdateView(UpdateView):
    """تعديل عقد"""
    model = Contract
    template_name = 'accounting_app/contracts/form.html'
    fields = [
        'unit', 'customer', 'start', 'total_price', 'discount_amount',
        'broker_name', 'broker_percent', 'broker_amount', 'commission_safe_id',
        'down_payment_safe_id', 'maintenance_deposit', 'installment_type',
        'installment_count', 'extra_annual', 'annual_payment_value',
        'down_payment', 'payment_type'
    ]
    
    def form_valid(self, form):
        with transaction.atomic():
            response = super().form_valid(form)
            
            # إعادة إنشاء الأقساط إذا تغير نوع الدفع
            if form.cleaned_data['payment_type'] == 'installment':
                # حذف الأقساط القديمة
                Installment.objects.filter(unit=form.instance.unit, deleted_at__isnull=True).update(deleted_at=timezone.now())
                # إنشاء أقساط جديدة
                self.create_installments(form.instance)
            
            messages.success(self.request, 'تم تحديث العقد بنجاح')
            return response
    
    def create_installments(self, contract):
        """إنشاء الأقساط للعقد"""
        return InstallmentService.create_installments_for_contract(contract)
    
    def get_success_url(self):
        return '/contracts/'


class ContractDeleteView(DeleteView):
    """حذف عقد"""
    model = Contract
    template_name = 'accounting_app/contracts/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف العقد بنجاح')
        return redirect('/contracts/')


class InstallmentListView(ListView):
    """قائمة الأقساط"""
    model = Installment
    template_name = 'accounting_app/installments/list.html'
    context_object_name = 'installments'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Installment.objects.filter(deleted_at__isnull=True).select_related('unit')
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(unit__code__icontains=search) |
                Q(unit__name__icontains=search)
            )
        
        # التصفية حسب الحالة
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'due_date')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['status'] = self.request.GET.get('status', '')
        context['order_by'] = self.request.GET.get('order_by', 'due_date')
        return context


class InstallmentUpdateView(UpdateView):
    """تعديل قسط"""
    model = Installment
    template_name = 'accounting_app/installments/form.html'
    fields = ['amount', 'due_date', 'status', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث القسط بنجاح')
        return response
    
    def get_success_url(self):
        return '/installments/'


class SafeListView(ListView):
    """قائمة الخزائن"""
    model = Safe
    template_name = 'accounting_app/safes/list.html'
    context_object_name = 'safes'
    paginate_by = 20
    
    def get_queryset(self):
        return Safe.objects.filter(deleted_at__isnull=True).order_by('name')


class SafeCreateView(CreateView):
    """إضافة خزنة جديدة"""
    model = Safe
    template_name = 'accounting_app/safes/form.html'
    fields = ['name', 'balance']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة الخزنة بنجاح')
        return response
    
    def get_success_url(self):
        return '/safes/'


class SafeUpdateView(UpdateView):
    """تعديل خزنة"""
    model = Safe
    template_name = 'accounting_app/safes/form.html'
    fields = ['name', 'balance']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث الخزنة بنجاح')
        return response
    
    def get_success_url(self):
        return '/safes/'


class SafeDeleteView(DeleteView):
    """حذف خزنة"""
    model = Safe
    template_name = 'accounting_app/safes/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف الخزنة بنجاح')
        return redirect('/safes/')


class VoucherListView(ListView):
    """قائمة السندات"""
    model = Voucher
    template_name = 'accounting_app/vouchers/list.html'
    context_object_name = 'vouchers'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Voucher.objects.filter(deleted_at__isnull=True).select_related('safe')
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(payer__icontains=search) |
                Q(beneficiary__icontains=search)
            )
        
        # التصفية حسب النوع
        type_filter = self.request.GET.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'date')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['type'] = self.request.GET.get('type', '')
        context['order_by'] = self.request.GET.get('order_by', 'date')
        return context


class VoucherCreateView(CreateView):
    """إضافة سند جديد"""
    model = Voucher
    template_name = 'accounting_app/vouchers/form.html'
    fields = ['type', 'date', 'amount', 'safe', 'description', 'payer', 'beneficiary', 'linked_ref']
    
    def form_valid(self, form):
        # استخدام الخدمة لإنشاء السند
        voucher_data = {
            'type': form.cleaned_data['type'],
            'date': form.cleaned_data['date'],
            'amount': form.cleaned_data['amount'],
            'safe': form.cleaned_data['safe'],
            'description': form.cleaned_data['description'],
            'payer': form.cleaned_data.get('payer'),
            'beneficiary': form.cleaned_data.get('beneficiary'),
            'linked_ref': form.cleaned_data.get('linked_ref'),
        }
        
        VoucherService.create_voucher(voucher_data)
        messages.success(self.request, 'تم إضافة السند بنجاح')
        return redirect('/vouchers/')
    
    def get_success_url(self):
        return '/vouchers/'


class VoucherUpdateView(UpdateView):
    """تعديل سند"""
    model = Voucher
    template_name = 'accounting_app/vouchers/form.html'
    fields = ['type', 'date', 'amount', 'safe', 'description', 'payer', 'beneficiary', 'linked_ref']
    
    def form_valid(self, form):
        # استخدام الخدمة لتحديث السند
        voucher_data = {
            'type': form.cleaned_data['type'],
            'date': form.cleaned_data['date'],
            'amount': form.cleaned_data['amount'],
            'safe': form.cleaned_data['safe'],
            'description': form.cleaned_data['description'],
            'payer': form.cleaned_data.get('payer'),
            'beneficiary': form.cleaned_data.get('beneficiary'),
            'linked_ref': form.cleaned_data.get('linked_ref'),
        }
        
        VoucherService.update_voucher(self.object, voucher_data)
        messages.success(self.request, 'تم تحديث السند بنجاح')
        return redirect('/vouchers/')
    
    def get_success_url(self):
        return '/vouchers/'


class VoucherDeleteView(DeleteView):
    """حذف سند"""
    model = Voucher
    template_name = 'accounting_app/vouchers/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        VoucherService.delete_voucher(self.object)
        messages.success(request, 'تم حذف السند بنجاح')
        return redirect('/vouchers/')


# API Views للـ AJAX
def get_customers_api(request):
    """API للحصول على قائمة العملاء"""
    search = request.GET.get('search', '')
    customers = Customer.objects.filter(
        deleted_at__isnull=True,
        name__icontains=search
    )[:10]
    
    data = [{'id': c.id, 'name': c.name, 'phone': c.phone or ''} for c in customers]
    return JsonResponse(data, safe=False)


def get_units_api(request):
    """API للحصول على قائمة الوحدات"""
    search = request.GET.get('search', '')
    units = Unit.objects.filter(
        deleted_at__isnull=True
    ).filter(
        Q(code__icontains=search) | Q(name__icontains=search)
    )[:10]
    
    data = [{'id': u.id, 'code': u.code, 'name': u.name or '', 'total_price': float(u.total_price)} for u in units]
    return JsonResponse(data, safe=False)


def get_safes_api(request):
    """API للحصول على قائمة الخزائن"""
    safes = Safe.objects.filter(deleted_at__isnull=True).order_by('name')
    data = [{'id': s.id, 'name': s.name, 'balance': float(s.balance)} for s in safes]
    return JsonResponse(data, safe=False)


# Partner Views
class PartnerListView(ListView):
    """قائمة الشركاء"""
    model = Partner
    template_name = 'accounting_app/partners/list.html'
    context_object_name = 'partners'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Partner.objects.filter(deleted_at__isnull=True)
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class PartnerCreateView(CreateView):
    """إضافة شريك جديد"""
    model = Partner
    template_name = 'accounting_app/partners/form.html'
    fields = ['name', 'phone', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة الشريك بنجاح')
        return response
    
    def get_success_url(self):
        return '/partners/'


class PartnerUpdateView(UpdateView):
    """تعديل شريك"""
    model = Partner
    template_name = 'accounting_app/partners/form.html'
    fields = ['name', 'phone', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث الشريك بنجاح')
        return response
    
    def get_success_url(self):
        return '/partners/'


class PartnerDeleteView(DeleteView):
    """حذف شريك"""
    model = Partner
    template_name = 'accounting_app/partners/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف الشريك بنجاح')
        return redirect('/partners/')


# Broker Views
class BrokerListView(ListView):
    """قائمة السماسرة"""
    model = Broker
    template_name = 'accounting_app/brokers/list.html'
    context_object_name = 'brokers'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Broker.objects.filter(deleted_at__isnull=True)
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class BrokerCreateView(CreateView):
    """إضافة سمسار جديد"""
    model = Broker
    template_name = 'accounting_app/brokers/form.html'
    fields = ['name', 'phone', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة السمسار بنجاح')
        return response
    
    def get_success_url(self):
        return '/brokers/'


class BrokerUpdateView(UpdateView):
    """تعديل سمسار"""
    model = Broker
    template_name = 'accounting_app/brokers/form.html'
    fields = ['name', 'phone', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث السمسار بنجاح')
        return response
    
    def get_success_url(self):
        return '/brokers/'


class BrokerDeleteView(DeleteView):
    """حذف سمسار"""
    model = Broker
    template_name = 'accounting_app/brokers/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف السمسار بنجاح')
        return redirect('/brokers/')


# Partner Group Views
class PartnerGroupListView(ListView):
    """قائمة مجموعات الشركاء"""
    model = PartnerGroup
    template_name = 'accounting_app/partner_groups/list.html'
    context_object_name = 'partner_groups'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = PartnerGroup.objects.filter(deleted_at__isnull=True)
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class PartnerGroupCreateView(CreateView):
    """إضافة مجموعة شركاء جديدة"""
    model = PartnerGroup
    template_name = 'accounting_app/partner_groups/form.html'
    fields = ['name', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة مجموعة الشركاء بنجاح')
        return response
    
    def get_success_url(self):
        return '/partner-groups/'


class PartnerGroupUpdateView(UpdateView):
    """تعديل مجموعة شركاء"""
    model = PartnerGroup
    template_name = 'accounting_app/partner_groups/form.html'
    fields = ['name', 'notes']
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث مجموعة الشركاء بنجاح')
        return response
    
    def get_success_url(self):
        return '/partner-groups/'


class PartnerGroupDeleteView(DeleteView):
    """حذف مجموعة شركاء"""
    model = PartnerGroup
    template_name = 'accounting_app/partner_groups/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف مجموعة الشركاء بنجاح')
        return redirect('/partner-groups/')


# Transfer Views
class TransferListView(ListView):
    """قائمة التحويلات"""
    model = Transfer
    template_name = 'accounting_app/transfers/list.html'
    context_object_name = 'transfers'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = Transfer.objects.filter(deleted_at__isnull=True).select_related('from_safe', 'to_safe')
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(from_safe__name__icontains=search) |
                Q(to_safe__name__icontains=search)
            )
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'created_at')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['order_by'] = self.request.GET.get('order_by', 'created_at')
        return context


class TransferCreateView(CreateView):
    """إضافة تحويل جديد"""
    model = Transfer
    template_name = 'accounting_app/transfers/form.html'
    fields = ['from_safe', 'to_safe', 'amount', 'description']
    
    def form_valid(self, form):
        # استخدام الخدمة لإنشاء التحويل
        transfer_data = {
            'from_safe': form.cleaned_data['from_safe'],
            'to_safe': form.cleaned_data['to_safe'],
            'amount': form.cleaned_data['amount'],
            'description': form.cleaned_data['description'],
        }
        
        TransferService.create_transfer(transfer_data)
        messages.success(self.request, 'تم إضافة التحويل بنجاح')
        return redirect('/transfers/')
    
    def get_success_url(self):
        return '/transfers/'


class TransferDeleteView(DeleteView):
    """حذف تحويل"""
    model = Transfer
    template_name = 'accounting_app/transfers/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        TransferService.delete_transfer(self.object)
        messages.success(request, 'تم حذف التحويل بنجاح')
        return redirect('/transfers/')


# Debt Views
class PartnerDebtListView(ListView):
    """قائمة ديون الشركاء"""
    model = PartnerDebt
    template_name = 'accounting_app/debts/partner_debts.html'
    context_object_name = 'debts'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = PartnerDebt.objects.filter(deleted_at__isnull=True).select_related('partner')
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(partner__name__icontains=search)
        
        # التصفية حسب الحالة
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'due_date')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['status'] = self.request.GET.get('status', '')
        context['order_by'] = self.request.GET.get('order_by', 'due_date')
        return context


class BrokerDueListView(ListView):
    """قائمة ديون السماسرة"""
    model = BrokerDue
    template_name = 'accounting_app/debts/broker_dues.html'
    context_object_name = 'dues'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = BrokerDue.objects.filter(deleted_at__isnull=True).select_related('broker')
        
        # البحث
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(broker__name__icontains=search)
        
        # التصفية حسب الحالة
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # الترتيب
        order_by = self.request.GET.get('order_by', 'due_date')
        queryset = queryset.order_by(order_by)
        
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search'] = self.request.GET.get('search', '')
        context['status'] = self.request.GET.get('status', '')
        context['order_by'] = self.request.GET.get('order_by', 'due_date')
        return context


# Unit Partner Management Views
class UnitPartnersView(DetailView):
    """عرض شركاء الوحدة"""
    model = Unit
    template_name = 'accounting_app/units/partners.html'
    context_object_name = 'unit'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        unit = self.get_object()
        
        # حساب إجمالي النسب
        total_percentage = unit.unit_partners.aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        context['total_percentage'] = total_percentage
        
        return context


class UnitAddPartnerView(CreateView):
    """إضافة شريك للوحدة"""
    model = UnitPartner
    template_name = 'accounting_app/units/add_partner.html'
    fields = ['partner', 'percentage']
    
    def dispatch(self, request, *args, **kwargs):
        self.unit = get_object_or_404(Unit, pk=kwargs['unit_id'])
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form):
        form.instance.unit = self.unit
        
        # التحقق من أن النسبة لا تتجاوز 100%
        current_total = self.unit.unit_partners.aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        if current_total + form.instance.percentage > 100:
            form.add_error('percentage', 'إجمالي النسب لا يمكن أن يتجاوز 100%')
            return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة الشريك بنجاح')
        return response
    
    def get_success_url(self):
        return f'/units/{self.unit.id}/partners/'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['unit'] = self.unit
        
        # حساب النسبة المتبقية
        current_total = self.unit.unit_partners.aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        context['total_percentage'] = current_total
        context['remaining_percentage'] = 100 - current_total
        
        return context


class UnitEditPartnerView(UpdateView):
    """تعديل شريك الوحدة"""
    model = UnitPartner
    template_name = 'accounting_app/units/edit_partner.html'
    fields = ['partner', 'percentage']
    
    def dispatch(self, request, *args, **kwargs):
        self.unit = get_object_or_404(Unit, pk=kwargs['unit_id'])
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form):
        # التحقق من أن النسبة لا تتجاوز 100%
        current_total = self.unit.unit_partners.exclude(
            id=self.object.id
        ).aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        if current_total + form.instance.percentage > 100:
            form.add_error('percentage', 'إجمالي النسب لا يمكن أن يتجاوز 100%')
            return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم تحديث الشريك بنجاح')
        return response
    
    def get_success_url(self):
        return f'/units/{self.unit.id}/partners/'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['unit'] = self.unit
        
        # حساب النسبة المتبقية
        current_total = self.unit.unit_partners.exclude(
            id=self.object.id
        ).aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        
        context['total_percentage'] = current_total
        context['remaining_percentage'] = 100 - current_total
        
        return context


class UnitRemovePartnerView(DeleteView):
    """حذف شريك الوحدة"""
    model = UnitPartner
    template_name = 'accounting_app/units/confirm_remove_partner.html'
    
    def dispatch(self, request, *args, **kwargs):
        self.unit = get_object_or_404(Unit, pk=kwargs['unit_id'])
        return super().dispatch(request, *args, **kwargs)
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم حذف الشريك بنجاح')
        return redirect(f'/units/{self.unit.id}/partners/')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['unit'] = self.unit
        return context


# Unit Partner Group Management Views
class UnitPartnerGroupsView(DetailView):
    """عرض مجموعات شركاء الوحدة"""
    model = Unit
    template_name = 'accounting_app/units/partner_groups.html'
    context_object_name = 'unit'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        unit = self.get_object()
        
        # حساب إجمالي الشركاء من جميع المجموعات
        total_partners = 0
        for unit_partner_group in unit.unit_partner_groups.all():
            total_partners += unit_partner_group.partner_group.partners.count()
        
        context['total_partners'] = total_partners
        
        return context


class UnitAddPartnerGroupView(CreateView):
    """إضافة مجموعة شركاء للوحدة"""
    model = UnitPartnerGroup
    template_name = 'accounting_app/units/add_partner_group.html'
    fields = ['partner_group']
    
    def dispatch(self, request, *args, **kwargs):
        self.unit = get_object_or_404(Unit, pk=kwargs['unit_id'])
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form):
        form.instance.unit = self.unit
        
        # التحقق من عدم وجود المجموعة مسبقاً
        if UnitPartnerGroup.objects.filter(
            unit=self.unit, 
            partner_group=form.instance.partner_group,
            deleted_at__isnull=True
        ).exists():
            form.add_error('partner_group', 'هذه المجموعة مرتبطة بالوحدة بالفعل')
            return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, 'تم إضافة مجموعة الشركاء بنجاح')
        return response
    
    def get_success_url(self):
        return f'/units/{self.unit.id}/partner-groups/'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['unit'] = self.unit
        
        # حساب إجمالي الشركاء
        total_partners = 0
        for unit_partner_group in self.unit.unit_partner_groups.all():
            total_partners += unit_partner_group.partner_group.partners.count()
        
        context['total_partners'] = total_partners
        
        return context


class UnitRemovePartnerGroupView(DeleteView):
    """إزالة مجموعة شركاء من الوحدة"""
    model = UnitPartnerGroup
    template_name = 'accounting_app/units/confirm_remove_partner_group.html'
    
    def dispatch(self, request, *args, **kwargs):
        self.unit = get_object_or_404(Unit, pk=kwargs['unit_id'])
        return super().dispatch(request, *args, **kwargs)
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.deleted_at = timezone.now()
        self.object.save()
        messages.success(request, 'تم إزالة مجموعة الشركاء بنجاح')
        return redirect(f'/units/{self.unit.id}/partner-groups/')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['unit'] = self.unit
        return context