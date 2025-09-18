"""
Forms for the accounting application
"""

from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from .models import (
    Customer, Unit, Partner, Contract, Installment, Safe, Voucher, Broker,
    PartnerDebt, BrokerDue, PartnerGroup, UnitPartner, PartnerGroupPartner,
    UnitPartnerGroup, Transfer, Notification, PartnerDailyTransaction
)


class CustomerForm(forms.ModelForm):
    """Form for Customer model"""
    
    class Meta:
        model = Customer
        fields = ['name', 'phone', 'national_id', 'address', 'status', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'اسم العميل'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'رقم الهاتف'}),
            'national_id': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'الرقم القومي'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'العنوان'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'ملاحظات'}),
        }
    
    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        if phone:
            # Check for duplicate phone numbers
            if Customer.objects.filter(phone=phone, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('رقم الهاتف موجود بالفعل')
        return phone
    
    def clean_national_id(self):
        national_id = self.cleaned_data.get('national_id')
        if national_id:
            # Check for duplicate national IDs
            if Customer.objects.filter(national_id=national_id, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('الرقم القومي موجود بالفعل')
        return national_id


class UnitForm(forms.ModelForm):
    """Form for Unit model"""
    
    class Meta:
        model = Unit
        fields = ['code', 'unit_type', 'area', 'price', 'status', 'description']
        widgets = {
            'code': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'كود الوحدة'}),
            'unit_type': forms.Select(attrs={'class': 'form-select'}),
            'area': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'المساحة بالمتر المربع'}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'السعر', 'step': '0.01'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'وصف الوحدة'}),
        }
    
    def clean_code(self):
        code = self.cleaned_data.get('code')
        if code:
            # Check for duplicate codes
            if Unit.objects.filter(code=code, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('كود الوحدة موجود بالفعل')
        return code
    
    def clean_price(self):
        price = self.cleaned_data.get('price')
        if price and price <= 0:
            raise ValidationError('السعر يجب أن يكون أكبر من صفر')
        return price


class PartnerForm(forms.ModelForm):
    """Form for Partner model"""
    
    class Meta:
        model = Partner
        fields = ['name', 'phone', 'national_id', 'address', 'status', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'اسم الشريك'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'رقم الهاتف'}),
            'national_id': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'الرقم القومي'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'العنوان'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'ملاحظات'}),
        }
    
    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        if phone:
            # Check for duplicate phone numbers
            if Partner.objects.filter(phone=phone, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('رقم الهاتف موجود بالفعل')
        return phone
    
    def clean_national_id(self):
        national_id = self.cleaned_data.get('national_id')
        if national_id:
            # Check for duplicate national IDs
            if Partner.objects.filter(national_id=national_id, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('الرقم القومي موجود بالفعل')
        return national_id


class ContractForm(forms.ModelForm):
    """Form for Contract model"""
    
    class Meta:
        model = Contract
        fields = [
            'unit', 'customer', 'start', 'total_price', 'discount_amount',
            'broker_name', 'broker_percent', 'down_payment', 'maintenance_deposit',
            'installment_type', 'installment_count', 'extra_annual', 'annual_payment_value',
            'payment_type'
        ]
        widgets = {
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'customer': forms.Select(attrs={'class': 'form-select'}),
            'start': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'total_price': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'discount_amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'broker_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'اسم السمسار'}),
            'broker_percent': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
            'down_payment': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'maintenance_deposit': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'installment_type': forms.Select(attrs={'class': 'form-select'}),
            'installment_count': forms.NumberInput(attrs={'class': 'form-control', 'min': '1'}),
            'extra_annual': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
            'annual_payment_value': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'payment_type': forms.Select(attrs={'class': 'form-select'}),
        }
    
    def clean_total_price(self):
        total_price = self.cleaned_data.get('total_price')
        if total_price and total_price <= 0:
            raise ValidationError('السعر الإجمالي يجب أن يكون أكبر من صفر')
        return total_price
    
    def clean_broker_percent(self):
        broker_percent = self.cleaned_data.get('broker_percent')
        if broker_percent and (broker_percent < 0 or broker_percent > 100):
            raise ValidationError('نسبة السمسار يجب أن تكون بين 0 و 100')
        return broker_percent


class InstallmentForm(forms.ModelForm):
    """Form for Installment model"""
    
    class Meta:
        model = Installment
        fields = ['unit', 'contract', 'amount', 'due_date', 'status', 'notes']
        widgets = {
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'contract': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'ملاحظات'}),
        }
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('المبلغ يجب أن يكون أكبر من صفر')
        return amount


class SafeForm(forms.ModelForm):
    """Form for Safe model"""
    
    class Meta:
        model = Safe
        fields = ['name', 'description', 'initial_balance']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'اسم الخزنة'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'وصف الخزنة'}),
            'initial_balance': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': 'الرصيد الابتدائي'}),
        }
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        if name:
            # Check for duplicate names
            if Safe.objects.filter(name=name, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('اسم الخزنة موجود بالفعل')
        return name


class VoucherForm(forms.ModelForm):
    """Form for Voucher model"""
    
    class Meta:
        model = Voucher
        fields = ['type', 'amount', 'date', 'description', 'safe', 'unit', 'contract']
        widgets = {
            'type': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'وصف السند'}),
            'safe': forms.Select(attrs={'class': 'form-select'}),
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'contract': forms.Select(attrs={'class': 'form-select'}),
        }
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('المبلغ يجب أن يكون أكبر من صفر')
        return amount


class BrokerForm(forms.ModelForm):
    """Form for Broker model"""
    
    class Meta:
        model = Broker
        fields = ['name', 'phone', 'national_id', 'address', 'status', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'اسم السمسار'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'رقم الهاتف'}),
            'national_id': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'الرقم القومي'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'العنوان'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'ملاحظات'}),
        }
    
    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        if phone:
            # Check for duplicate phone numbers
            if Broker.objects.filter(phone=phone, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('رقم الهاتف موجود بالفعل')
        return phone
    
    def clean_national_id(self):
        national_id = self.cleaned_data.get('national_id')
        if national_id:
            # Check for duplicate national IDs
            if Broker.objects.filter(national_id=national_id, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('الرقم القومي موجود بالفعل')
        return national_id


class PartnerGroupForm(forms.ModelForm):
    """Form for PartnerGroup model"""
    
    class Meta:
        model = PartnerGroup
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'اسم المجموعة'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'وصف المجموعة'}),
        }
    
    def clean_name(self):
        name = self.cleaned_data.get('name')
        if name:
            # Check for duplicate names
            if PartnerGroup.objects.filter(name=name, deleted_at__isnull=True).exclude(pk=self.instance.pk).exists():
                raise ValidationError('اسم المجموعة موجود بالفعل')
        return name


class TransferForm(forms.ModelForm):
    """Form for Transfer model"""
    
    class Meta:
        model = Transfer
        fields = ['from_safe', 'to_safe', 'amount', 'date', 'description', 'unit', 'contract']
        widgets = {
            'from_safe': forms.Select(attrs={'class': 'form-select'}),
            'to_safe': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'وصف التحويل'}),
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'contract': forms.Select(attrs={'class': 'form-select'}),
        }
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('المبلغ يجب أن يكون أكبر من صفر')
        return amount
    
    def clean(self):
        cleaned_data = super().clean()
        from_safe = cleaned_data.get('from_safe')
        to_safe = cleaned_data.get('to_safe')
        amount = cleaned_data.get('amount')
        
        if from_safe and to_safe and from_safe == to_safe:
            raise ValidationError('لا يمكن التحويل من الخزنة إلى نفسها')
        
        if from_safe and amount and not from_safe.can_transfer(amount):
            raise ValidationError('الرصيد غير كافي للتحويل')
        
        return cleaned_data


class PartnerDailyTransactionForm(forms.ModelForm):
    """Form for PartnerDailyTransaction model"""
    
    class Meta:
        model = PartnerDailyTransaction
        fields = [
            'partner', 'unit', 'contract', 'transaction_type', 'amount',
            'description', 'transaction_date', 'partner_share'
        ]
        widgets = {
            'partner': forms.Select(attrs={'class': 'form-select'}),
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'contract': forms.Select(attrs={'class': 'form-select'}),
            'transaction_type': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'وصف المعاملة'}),
            'transaction_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'partner_share': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
        }
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('المبلغ يجب أن يكون أكبر من صفر')
        return amount
    
    def clean_partner_share(self):
        partner_share = self.cleaned_data.get('partner_share')
        if partner_share and (partner_share < 0 or partner_share > 100):
            raise ValidationError('نسبة الشريك يجب أن تكون بين 0 و 100')
        return partner_share


class UnitPartnerForm(forms.ModelForm):
    """Form for UnitPartner model"""
    
    class Meta:
        model = UnitPartner
        fields = ['unit', 'partner', 'percentage']
        widgets = {
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'partner': forms.Select(attrs={'class': 'form-select'}),
            'percentage': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
        }
    
    def clean_percentage(self):
        percentage = self.cleaned_data.get('percentage')
        if percentage and (percentage < 0 or percentage > 100):
            raise ValidationError('النسبة يجب أن تكون بين 0 و 100')
        return percentage


class PartnerGroupPartnerForm(forms.ModelForm):
    """Form for PartnerGroupPartner model"""
    
    class Meta:
        model = PartnerGroupPartner
        fields = ['partner_group', 'partner', 'percentage']
        widgets = {
            'partner_group': forms.Select(attrs={'class': 'form-select'}),
            'partner': forms.Select(attrs={'class': 'form-select'}),
            'percentage': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
        }
    
    def clean_percentage(self):
        percentage = self.cleaned_data.get('percentage')
        if percentage and (percentage < 0 or percentage > 100):
            raise ValidationError('النسبة يجب أن تكون بين 0 و 100')
        return percentage


class UnitPartnerGroupForm(forms.ModelForm):
    """Form for UnitPartnerGroup model"""
    
    class Meta:
        model = UnitPartnerGroup
        fields = ['unit', 'partner_group', 'percentage']
        widgets = {
            'unit': forms.Select(attrs={'class': 'form-select'}),
            'partner_group': forms.Select(attrs={'class': 'form-select'}),
            'percentage': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0', 'max': '100'}),
        }
    
    def clean_percentage(self):
        percentage = self.cleaned_data.get('percentage')
        if percentage and (percentage < 0 or percentage > 100):
            raise ValidationError('النسبة يجب أن تكون بين 0 و 100')
        return percentage


class PartnerDebtForm(forms.ModelForm):
    """Form for PartnerDebt model"""
    
    class Meta:
        model = PartnerDebt
        fields = ['partner', 'contract', 'amount', 'due_date', 'status', 'notes']
        widgets = {
            'partner': forms.Select(attrs={'class': 'form-select'}),
            'contract': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'ملاحظات'}),
        }
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('المبلغ يجب أن يكون أكبر من صفر')
        return amount


class BrokerDueForm(forms.ModelForm):
    """Form for BrokerDue model"""
    
    class Meta:
        model = BrokerDue
        fields = ['broker', 'contract', 'amount', 'due_date', 'status', 'notes']
        widgets = {
            'broker': forms.Select(attrs={'class': 'form-select'}),
            'contract': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'ملاحظات'}),
        }
    
    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError('المبلغ يجب أن يكون أكبر من صفر')
        return amount