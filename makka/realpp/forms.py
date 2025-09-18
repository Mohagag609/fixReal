"""
Django forms for the real estate management system.
This module contains all form classes for data input and validation.
"""

from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .models import (
    Customer, Unit, Partner, UnitPartner, Contract, Installment,
    PartnerDebt, Safe, Transfer, Voucher, Broker, BrokerDue,
    PartnerGroup, PartnerGroupPartner, UnitPartnerGroup, AuditLog,
    Settings, KeyVal, User, Notification
)


class CustomerForm(forms.ModelForm):
    """Form for Customer model."""
    
    class Meta:
        model = Customer
        fields = [
            'name', 'customer_type', 'phone', 'email', 'national_id',
            'date_of_birth', 'city', 'district', 'address', 'occupation',
            'workplace', 'notes'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'الاسم الكامل'
            }),
            'customer_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+966xxxxxxxxx'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'example@email.com'
            }),
            'national_id': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '1234567890',
                'maxlength': '10'
            }),
            'date_of_birth': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'city': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'المدينة'
            }),
            'district': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'الحي'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'العنوان التفصيلي'
            }),
            'occupation': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'المهنة'
            }),
            'workplace': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'مكان العمل'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'ملاحظات إضافية'
            })
        }
    
    def clean_phone(self):
        """Validate phone number format."""
        phone = self.cleaned_data.get('phone')
        if phone:
            # Remove all non-digit characters
            phone_digits = ''.join(filter(str.isdigit, phone))
            
            # Check if it's a valid Saudi phone number
            if len(phone_digits) == 9 and phone_digits.startswith(('5', '4', '6')):
                return f'+966{phone_digits}'
            elif len(phone_digits) == 12 and phone_digits.startswith('966'):
                return f'+{phone_digits}'
            else:
                raise ValidationError('رقم الهاتف غير صحيح')
        
        return phone
    
    def clean_national_id(self):
        """Validate national ID format."""
        national_id = self.cleaned_data.get('national_id')
        if national_id:
            # Remove all non-digit characters
            national_id_digits = ''.join(filter(str.isdigit, national_id))
            
            # Check if it's a valid Saudi national ID
            if len(national_id_digits) != 10:
                raise ValidationError('رقم الهوية الوطنية يجب أن يكون 10 أرقام')
            
            # Basic validation for Saudi national ID
            if not national_id_digits.startswith(('1', '2')):
                raise ValidationError('رقم الهوية الوطنية غير صحيح')
        
        return national_id


class UnitForm(forms.ModelForm):
    """Form for Unit model."""
    
    class Meta:
        model = Unit
        fields = [
            'unit_number', 'unit_type', 'floor', 'building', 'area',
            'rooms', 'bathrooms', 'price', 'discount', 'status',
            'has_balcony', 'has_parking', 'has_elevator', 'has_garden',
            'description', 'notes'
        ]
        widgets = {
            'unit_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'رقم الوحدة'
            }),
            'unit_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'floor': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'الطابق'
            }),
            'building': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'المبنى'
            }),
            'area': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'المساحة بالمتر المربع',
                'step': '0.01'
            }),
            'rooms': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'عدد الغرف'
            }),
            'bathrooms': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'عدد دورات المياه'
            }),
            'price': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'السعر بالريال',
                'step': '0.01'
            }),
            'discount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'الخصم بالريال',
                'step': '0.01'
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'has_balcony': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'has_parking': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'has_elevator': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'has_garden': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'وصف الوحدة'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'ملاحظات إضافية'
            })
        }
    
    def clean_price(self):
        """Validate price is positive."""
        price = self.cleaned_data.get('price')
        if price and price <= 0:
            raise ValidationError('السعر يجب أن يكون أكبر من صفر')
        return price
    
    def clean_area(self):
        """Validate area is positive."""
        area = self.cleaned_data.get('area')
        if area and area <= 0:
            raise ValidationError('المساحة يجب أن تكون أكبر من صفر')
        return area


class ContractForm(forms.ModelForm):
    """Form for Contract model."""
    
    class Meta:
        model = Contract
        fields = [
            'contract_number', 'customer', 'unit', 'total_price', 'discount',
            'final_price', 'down_payment', 'down_payment_percentage',
            'installment_type', 'installment_count', 'installment_amount',
            'installment_start_date', 'broker', 'broker_commission',
            'status', 'notes'
        ]
        widgets = {
            'contract_number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'رقم العقد'
            }),
            'customer': forms.Select(attrs={
                'class': 'form-control'
            }),
            'unit': forms.Select(attrs={
                'class': 'form-control'
            }),
            'total_price': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'إجمالي السعر',
                'step': '0.01'
            }),
            'discount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'الخصم',
                'step': '0.01'
            }),
            'final_price': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'السعر النهائي',
                'step': '0.01',
                'readonly': True
            }),
            'down_payment': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'المقدم',
                'step': '0.01'
            }),
            'down_payment_percentage': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'نسبة المقدم',
                'step': '0.01',
                'readonly': True
            }),
            'installment_type': forms.Select(attrs={
                'class': 'form-control'
            }),
            'installment_count': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'عدد الأقساط'
            }),
            'installment_amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'مبلغ القسط',
                'step': '0.01',
                'readonly': True
            }),
            'installment_start_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'broker': forms.Select(attrs={
                'class': 'form-control'
            }),
            'broker_commission': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'عمولة الوسيط',
                'step': '0.01'
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'ملاحظات العقد'
            })
        }
    
    def clean(self):
        """Validate contract data."""
        cleaned_data = super().clean()
        total_price = cleaned_data.get('total_price')
        discount = cleaned_data.get('discount', 0)
        down_payment = cleaned_data.get('down_payment', 0)
        
        if total_price and discount and discount >= total_price:
            raise ValidationError('الخصم لا يمكن أن يكون أكبر من أو يساوي السعر الإجمالي')
        
        if total_price and down_payment and down_payment > total_price:
            raise ValidationError('المقدم لا يمكن أن يكون أكبر من السعر الإجمالي')
        
        return cleaned_data


class SafeForm(forms.ModelForm):
    """Form for Safe model."""
    
    class Meta:
        model = Safe
        fields = ['name', 'description', 'max_balance', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'اسم الخزينة'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'وصف الخزينة'
            }),
            'max_balance': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'الحد الأقصى',
                'step': '0.01'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }


class TransferForm(forms.ModelForm):
    """Form for Transfer model."""
    
    class Meta:
        model = Transfer
        fields = ['from_safe', 'to_safe', 'amount', 'notes', 'status']
        widgets = {
            'from_safe': forms.Select(attrs={
                'class': 'form-control'
            }),
            'to_safe': forms.Select(attrs={
                'class': 'form-control'
            }),
            'amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'المبلغ',
                'step': '0.01'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'ملاحظات التحويل'
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            })
        }
    
    def clean(self):
        """Validate transfer data."""
        cleaned_data = super().clean()
        from_safe = cleaned_data.get('from_safe')
        to_safe = cleaned_data.get('to_safe')
        amount = cleaned_data.get('amount')
        
        if from_safe and to_safe and from_safe == to_safe:
            raise ValidationError('لا يمكن التحويل من وإلى نفس الخزينة')
        
        if from_safe and amount and amount > from_safe.current_balance:
            raise ValidationError('المبلغ أكبر من الرصيد المتاح في الخزينة المصدر')
        
        return cleaned_data


class BrokerForm(forms.ModelForm):
    """Form for Broker model."""
    
    class Meta:
        model = Broker
        fields = ['name', 'phone', 'email', 'commission_rate', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'اسم الوسيط'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '+966xxxxxxxxx'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'example@email.com'
            }),
            'commission_rate': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'نسبة العمولة',
                'step': '0.01'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }


class InstallmentForm(forms.ModelForm):
    """Form for Installment model."""
    
    class Meta:
        model = Installment
        fields = [
            'contract', 'installment_number', 'amount', 'due_date',
            'paid_date', 'paid_amount', 'status', 'notes'
        ]
        widgets = {
            'contract': forms.Select(attrs={
                'class': 'form-control'
            }),
            'installment_number': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'رقم القسط'
            }),
            'amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'مبلغ القسط',
                'step': '0.01'
            }),
            'due_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'paid_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'paid_amount': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'المبلغ المدفوع',
                'step': '0.01'
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'ملاحظات القسط'
            })
        }


class SearchForm(forms.Form):
    """Generic search form."""
    
    search_query = forms.CharField(
        max_length=255,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'البحث...'
        })
    )
    
    def clean_search_query(self):
        """Clean and validate search query."""
        query = self.cleaned_data.get('search_query')
        if query:
            return query.strip()
        return query


class DateRangeForm(forms.Form):
    """Form for date range selection."""
    
    start_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    
    end_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    
    def clean(self):
        """Validate date range."""
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise ValidationError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية')
        
        return cleaned_data


class ImportForm(forms.Form):
    """Form for data import."""
    
    file = forms.FileField(
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': '.txt,.csv,.xlsx'
        })
    )
    
    def clean_file(self):
        """Validate uploaded file."""
        file = self.cleaned_data.get('file')
        if file:
            # Check file size (max 10MB)
            if file.size > 10 * 1024 * 1024:
                raise ValidationError('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت')
            
            # Check file extension
            allowed_extensions = ['.txt', '.csv', '.xlsx']
            file_extension = file.name.lower().split('.')[-1]
            if f'.{file_extension}' not in allowed_extensions:
                raise ValidationError('نوع الملف غير مدعوم. الأنواع المدعومة: txt, csv, xlsx')
        
        return file