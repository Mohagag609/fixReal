from django import forms
from django.forms import ModelForm, inlineformset_factory
from .models import (
    Customer, Vendor, Invoice, InvoiceItem, Bill, BillItem,
    Payment, JournalEntry, JournalEntryLine, Product, TaxRate
)


class CustomerForm(ModelForm):
    """Customer form"""
    class Meta:
        model = Customer
        fields = ['name', 'email', 'phone', 'address', 'tax_id', 'credit_limit', 'payment_terms', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'tax_id': forms.TextInput(attrs={'class': 'form-control'}),
            'credit_limit': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'payment_terms': forms.NumberInput(attrs={'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class VendorForm(ModelForm):
    """Vendor form"""
    class Meta:
        model = Vendor
        fields = ['name', 'email', 'phone', 'address', 'tax_id', 'payment_terms', 'notes']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'tax_id': forms.TextInput(attrs={'class': 'form-control'}),
            'payment_terms': forms.NumberInput(attrs={'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class InvoiceForm(ModelForm):
    """Invoice form"""
    class Meta:
        model = Invoice
        fields = ['customer', 'invoice_number', 'invoice_date', 'due_date', 'status', 'notes']
        widgets = {
            'customer': forms.Select(attrs={'class': 'form-control'}),
            'invoice_number': forms.TextInput(attrs={'class': 'form-control'}),
            'invoice_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
    
    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super().__init__(*args, **kwargs)
        if company:
            self.fields['customer'].queryset = Customer.objects.filter(company=company)


class InvoiceItemForm(ModelForm):
    """Invoice item form"""
    class Meta:
        model = InvoiceItem
        fields = ['description', 'quantity', 'unit_price', 'tax_rate']
        widgets = {
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'tax_rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }


InvoiceItemFormSet = inlineformset_factory(
    Invoice, InvoiceItem, form=InvoiceItemForm,
    extra=1, can_delete=True
)


class BillForm(ModelForm):
    """Bill form"""
    class Meta:
        model = Bill
        fields = ['vendor', 'bill_number', 'bill_date', 'due_date', 'status', 'notes']
        widgets = {
            'vendor': forms.Select(attrs={'class': 'form-control'}),
            'bill_number': forms.TextInput(attrs={'class': 'form-control'}),
            'bill_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'due_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
    
    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super().__init__(*args, **kwargs)
        if company:
            self.fields['vendor'].queryset = Vendor.objects.filter(company=company)


class BillItemForm(ModelForm):
    """Bill item form"""
    class Meta:
        model = BillItem
        fields = ['description', 'quantity', 'unit_price', 'tax_rate']
        widgets = {
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'tax_rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }


BillItemFormSet = inlineformset_factory(
    Bill, BillItem, form=BillItemForm,
    extra=1, can_delete=True
)


class PaymentForm(ModelForm):
    """Payment form"""
    class Meta:
        model = Payment
        fields = ['payment_type', 'customer', 'vendor', 'amount', 'payment_date', 'payment_method', 'reference', 'notes']
        widgets = {
            'payment_type': forms.Select(attrs={'class': 'form-control'}),
            'customer': forms.Select(attrs={'class': 'form-control'}),
            'vendor': forms.Select(attrs={'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'payment_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'payment_method': forms.Select(attrs={'class': 'form-control'}),
            'reference': forms.TextInput(attrs={'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
    
    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super().__init__(*args, **kwargs)
        if company:
            self.fields['customer'].queryset = Customer.objects.filter(company=company)
            self.fields['vendor'].queryset = Vendor.objects.filter(company=company)


class JournalEntryForm(ModelForm):
    """Journal entry form"""
    class Meta:
        model = JournalEntry
        fields = ['entry_number', 'entry_date', 'description', 'reference']
        widgets = {
            'entry_number': forms.TextInput(attrs={'class': 'form-control'}),
            'entry_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'reference': forms.TextInput(attrs={'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super().__init__(*args, **kwargs)
        if company:
            pass  # Add company-specific logic if needed


class JournalEntryLineForm(ModelForm):
    """Journal entry line form"""
    class Meta:
        model = JournalEntryLine
        fields = ['account', 'description', 'debit_amount', 'credit_amount']
        widgets = {
            'account': forms.Select(attrs={'class': 'form-control'}),
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'debit_amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'credit_amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }


JournalEntryLineFormSet = inlineformset_factory(
    JournalEntry, JournalEntryLine, form=JournalEntryLineForm,
    extra=2, can_delete=True
)


class ProductForm(ModelForm):
    """Product form"""
    class Meta:
        model = Product
        fields = ['name', 'description', 'sku', 'unit_price', 'cost_price', 'tax_rate', 'is_service', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'sku': forms.TextInput(attrs={'class': 'form-control'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'cost_price': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'tax_rate': forms.Select(attrs={'class': 'form-control'}),
            'is_service': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
    
    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super().__init__(*args, **kwargs)
        if company:
            self.fields['tax_rate'].queryset = TaxRate.objects.filter(company=company)


class TaxRateForm(ModelForm):
    """Tax rate form"""
    class Meta:
        model = TaxRate
        fields = ['name', 'rate', 'is_default', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'is_default': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }