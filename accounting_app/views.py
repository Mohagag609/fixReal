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


class DashboardView(ListView):
    """الصفحة الرئيسية"""
    template_name = 'accounting_app/dashboard.html'
    context_object_name = 'kpis'
    
    def get_queryset(self):
        # حساب المؤشرات الرئيسية
        total_contracts = Contract.objects.filter(deleted_at__isnull=True).count()
        total_customers = Customer.objects.filter(deleted_at__isnull=True).count()
        total_units = Unit.objects.filter(deleted_at__isnull=True).count()
        total_installments = Installment.objects.filter(deleted_at__isnull=True).count()
        
        # حساب المبالغ المالية
        total_contracts_value = Contract.objects.filter(deleted_at__isnull=True).aggregate(
            total=Sum('total_price')
        )['total'] or Decimal('0')
        
        total_installments_value = Installment.objects.filter(
            deleted_at__isnull=True,
            status='مدفوع'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        pending_installments = Installment.objects.filter(
            deleted_at__isnull=True,
            status='معلق'
        ).count()
        
        return {
            'total_contracts': total_contracts,
            'total_customers': total_customers,
            'total_units': total_units,
            'total_installments': total_installments,
            'total_contracts_value': total_contracts_value,
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
        # التحقق من التكرار
        if form.cleaned_data.get('phone'):
            if Customer.objects.filter(phone=form.cleaned_data['phone'], deleted_at__isnull=True).exists():
                form.add_error('phone', 'رقم الهاتف موجود بالفعل')
                return self.form_invalid(form)
        
        if form.cleaned_data.get('national_id'):
            if Customer.objects.filter(national_id=form.cleaned_data['national_id'], deleted_at__isnull=True).exists():
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
        # التحقق من التكرار
        if form.cleaned_data.get('phone'):
            if Customer.objects.filter(phone=form.cleaned_data['phone'], deleted_at__isnull=True).exclude(id=self.object.id).exists():
                form.add_error('phone', 'رقم الهاتف موجود بالفعل')
                return self.form_invalid(form)
        
        if form.cleaned_data.get('national_id'):
            if Customer.objects.filter(national_id=form.cleaned_data['national_id'], deleted_at__isnull=True).exclude(id=self.object.id).exists():
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
        if contract.installment_count <= 0:
            return
        
        # حساب قيمة القسط
        remaining_amount = contract.total_price - contract.discount_amount - contract.down_payment
        installment_amount = remaining_amount / contract.installment_count
        
        # إنشاء الأقساط
        for i in range(contract.installment_count):
            due_date = contract.start + timezone.timedelta(days=30 * (i + 1))
            Installment.objects.create(
                unit=contract.unit,
                amount=installment_amount,
                due_date=due_date,
                status='معلق'
            )
    
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
        if contract.installment_count <= 0:
            return
        
        # حساب قيمة القسط
        remaining_amount = contract.total_price - contract.discount_amount - contract.down_payment
        installment_amount = remaining_amount / contract.installment_count
        
        # إنشاء الأقساط
        for i in range(contract.installment_count):
            due_date = contract.start + timezone.timedelta(days=30 * (i + 1))
            Installment.objects.create(
                unit=contract.unit,
                amount=installment_amount,
                due_date=due_date,
                status='معلق'
            )
    
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
        with transaction.atomic():
            response = super().form_valid(form)
            
            # تحديث رصيد الخزنة
            safe = form.instance.safe
            if form.cleaned_data['type'] == 'receipt':
                safe.balance += form.cleaned_data['amount']
            else:  # payment
                safe.balance -= form.cleaned_data['amount']
            safe.save()
            
            messages.success(self.request, 'تم إضافة السند بنجاح')
            return response
    
    def get_success_url(self):
        return '/vouchers/'


class VoucherUpdateView(UpdateView):
    """تعديل سند"""
    model = Voucher
    template_name = 'accounting_app/vouchers/form.html'
    fields = ['type', 'date', 'amount', 'safe', 'description', 'payer', 'beneficiary', 'linked_ref']
    
    def form_valid(self, form):
        with transaction.atomic():
            # إعادة حساب رصيد الخزنة القديمة
            old_voucher = Voucher.objects.get(id=self.object.id)
            old_safe = old_voucher.safe
            if old_voucher.type == 'receipt':
                old_safe.balance -= old_voucher.amount
            else:  # payment
                old_safe.balance += old_voucher.amount
            old_safe.save()
            
            response = super().form_valid(form)
            
            # تحديث رصيد الخزنة الجديدة
            new_safe = form.instance.safe
            if form.cleaned_data['type'] == 'receipt':
                new_safe.balance += form.cleaned_data['amount']
            else:  # payment
                new_safe.balance -= form.cleaned_data['amount']
            new_safe.save()
            
            messages.success(self.request, 'تم تحديث السند بنجاح')
            return response
    
    def get_success_url(self):
        return '/vouchers/'


class VoucherDeleteView(DeleteView):
    """حذف سند"""
    model = Voucher
    template_name = 'accounting_app/vouchers/confirm_delete.html'
    
    def delete(self, request, *args, **kwargs):
        with transaction.atomic():
            self.object = self.get_object()
            
            # إعادة حساب رصيد الخزنة
            safe = self.object.safe
            if self.object.type == 'receipt':
                safe.balance -= self.object.amount
            else:  # payment
                safe.balance += self.object.amount
            safe.save()
            
            self.object.deleted_at = timezone.now()
            self.object.save()
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