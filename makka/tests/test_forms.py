"""
Test cases for the forms.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError

from realpp.forms import (
    CustomerForm, UnitForm, ContractForm, SafeForm, TransferForm,
    BrokerForm, InstallmentForm, SearchForm, DateRangeForm, ImportForm
)
from realpp.models import Customer, Unit, Contract, Safe, Broker, Partner


class CustomerFormTest(TestCase):
    """Test cases for CustomerForm."""
    
    def test_valid_customer_form(self):
        """Test valid customer form data."""
        form_data = {
            'name': 'أحمد محمد',
            'customer_type': 'individual',
            'phone': '+966501234567',
            'email': 'ahmed@example.com',
            'national_id': '1234567890',
            'city': 'الرياض',
            'district': 'النخيل'
        }
        form = CustomerForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_customer_form_phone_validation(self):
        """Test phone number validation."""
        form_data = {
            'name': 'أحمد محمد',
            'customer_type': 'individual',
            'phone': '123',  # Invalid phone
            'email': 'ahmed@example.com'
        }
        form = CustomerForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('phone', form.errors)
    
    def test_customer_form_national_id_validation(self):
        """Test national ID validation."""
        form_data = {
            'name': 'أحمد محمد',
            'customer_type': 'individual',
            'phone': '+966501234567',
            'national_id': '123'  # Invalid national ID
        }
        form = CustomerForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('national_id', form.errors)
    
    def test_customer_form_required_fields(self):
        """Test required fields validation."""
        form_data = {
            'name': '',  # Required field
            'customer_type': 'individual',
            'phone': '+966501234567'
        }
        form = CustomerForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('name', form.errors)


class UnitFormTest(TestCase):
    """Test cases for UnitForm."""
    
    def test_valid_unit_form(self):
        """Test valid unit form data."""
        form_data = {
            'unit_number': 'A101',
            'unit_type': 'apartment',
            'floor': 1,
            'building': 'A',
            'area': 120.5,
            'price': 500000.00,
            'status': 'available'
        }
        form = UnitForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_unit_form_price_validation(self):
        """Test price validation."""
        form_data = {
            'unit_number': 'A101',
            'unit_type': 'apartment',
            'floor': 1,
            'building': 'A',
            'area': 120.5,
            'price': -1000.00,  # Invalid price
            'status': 'available'
        }
        form = UnitForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('price', form.errors)
    
    def test_unit_form_area_validation(self):
        """Test area validation."""
        form_data = {
            'unit_number': 'A101',
            'unit_type': 'apartment',
            'floor': 1,
            'building': 'A',
            'area': -100.0,  # Invalid area
            'price': 500000.00,
            'status': 'available'
        }
        form = UnitForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('area', form.errors)


class ContractFormTest(TestCase):
    """Test cases for ContractForm."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567'
        )
        
        self.unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00
        )
    
    def test_valid_contract_form(self):
        """Test valid contract form data."""
        form_data = {
            'contract_number': 'C2024001',
            'customer': self.customer.id,
            'unit': self.unit.id,
            'total_price': 500000.00,
            'discount': 50000.00,
            'final_price': 450000.00,
            'down_payment': 100000.00,
            'installment_type': 'monthly',
            'installment_count': 24,
            'status': 'active'
        }
        form = ContractForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_contract_form_discount_validation(self):
        """Test discount validation."""
        form_data = {
            'contract_number': 'C2024001',
            'customer': self.customer.id,
            'unit': self.unit.id,
            'total_price': 500000.00,
            'discount': 600000.00,  # Discount greater than total price
            'final_price': 450000.00,
            'down_payment': 100000.00,
            'installment_type': 'monthly',
            'installment_count': 24,
            'status': 'active'
        }
        form = ContractForm(data=form_data)
        self.assertFalse(form.is_valid())
    
    def test_contract_form_down_payment_validation(self):
        """Test down payment validation."""
        form_data = {
            'contract_number': 'C2024001',
            'customer': self.customer.id,
            'unit': self.unit.id,
            'total_price': 500000.00,
            'discount': 50000.00,
            'final_price': 450000.00,
            'down_payment': 500000.00,  # Down payment greater than total price
            'installment_type': 'monthly',
            'installment_count': 24,
            'status': 'active'
        }
        form = ContractForm(data=form_data)
        self.assertFalse(form.is_valid())


class SafeFormTest(TestCase):
    """Test cases for SafeForm."""
    
    def test_valid_safe_form(self):
        """Test valid safe form data."""
        form_data = {
            'name': 'الخزينة الرئيسية',
            'description': 'خزينة المبيعات الرئيسية',
            'max_balance': 1000000.00,
            'is_active': True
        }
        form = SafeForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_safe_form_required_fields(self):
        """Test required fields validation."""
        form_data = {
            'name': '',  # Required field
            'max_balance': 1000000.00
        }
        form = SafeForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('name', form.errors)


class TransferFormTest(TestCase):
    """Test cases for TransferForm."""
    
    def setUp(self):
        """Set up test data."""
        self.from_safe = Safe.objects.create(
            name='الخزينة المصدر',
            max_balance=1000000.00
        )
        
        self.to_safe = Safe.objects.create(
            name='الخزينة الهدف',
            max_balance=1000000.00
        )
    
    def test_valid_transfer_form(self):
        """Test valid transfer form data."""
        form_data = {
            'from_safe': self.from_safe.id,
            'to_safe': self.to_safe.id,
            'amount': 50000.00,
            'status': 'completed'
        }
        form = TransferForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_transfer_form_same_safe_validation(self):
        """Test same safe validation."""
        form_data = {
            'from_safe': self.from_safe.id,
            'to_safe': self.from_safe.id,  # Same safe
            'amount': 50000.00,
            'status': 'completed'
        }
        form = TransferForm(data=form_data)
        self.assertFalse(form.is_valid())


class BrokerFormTest(TestCase):
    """Test cases for BrokerForm."""
    
    def test_valid_broker_form(self):
        """Test valid broker form data."""
        form_data = {
            'name': 'محمد الوسيط',
            'phone': '+966501234567',
            'email': 'broker@example.com',
            'commission_rate': 2.5,
            'is_active': True
        }
        form = BrokerForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_broker_form_required_fields(self):
        """Test required fields validation."""
        form_data = {
            'name': '',  # Required field
            'phone': '+966501234567'
        }
        form = BrokerForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('name', form.errors)


class InstallmentFormTest(TestCase):
    """Test cases for InstallmentForm."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567'
        )
        
        self.unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00
        )
        
        self.contract = Contract.objects.create(
            contract_number='C2024001',
            customer=self.customer,
            unit=self.unit,
            total_price=500000.00,
            final_price=450000.00,
            down_payment=100000.00,
            installment_type='monthly',
            installment_count=24,
            status='active'
        )
    
    def test_valid_installment_form(self):
        """Test valid installment form data."""
        form_data = {
            'contract': self.contract.id,
            'installment_number': 1,
            'amount': 14583.33,
            'due_date': '2024-02-01',
            'status': 'pending'
        }
        form = InstallmentForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_installment_form_required_fields(self):
        """Test required fields validation."""
        form_data = {
            'contract': self.contract.id,
            'installment_number': '',  # Required field
            'amount': 14583.33
        }
        form = InstallmentForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('installment_number', form.errors)


class SearchFormTest(TestCase):
    """Test cases for SearchForm."""
    
    def test_valid_search_form(self):
        """Test valid search form data."""
        form_data = {
            'search_query': 'أحمد'
        }
        form = SearchForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_empty_search_form(self):
        """Test empty search form."""
        form_data = {}
        form = SearchForm(data=form_data)
        self.assertTrue(form.is_valid())  # Empty search is valid


class DateRangeFormTest(TestCase):
    """Test cases for DateRangeForm."""
    
    def test_valid_date_range_form(self):
        """Test valid date range form data."""
        form_data = {
            'start_date': '2024-01-01',
            'end_date': '2024-12-31'
        }
        form = DateRangeForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_invalid_date_range_form(self):
        """Test invalid date range form data."""
        form_data = {
            'start_date': '2024-12-31',
            'end_date': '2024-01-01'  # End date before start date
        }
        form = DateRangeForm(data=form_data)
        self.assertFalse(form.is_valid())
    
    def test_empty_date_range_form(self):
        """Test empty date range form."""
        form_data = {}
        form = DateRangeForm(data=form_data)
        self.assertTrue(form.is_valid())  # Empty dates are valid


class ImportFormTest(TestCase):
    """Test cases for ImportForm."""
    
    def test_valid_import_form(self):
        """Test valid import form data."""
        # This would require a mock file upload
        form_data = {}
        form = ImportForm(data=form_data)
        # Note: File validation would need to be tested with actual file uploads
        self.assertTrue(form.is_valid())
    
    def test_import_form_file_validation(self):
        """Test file validation."""
        form_data = {}
        form = ImportForm(data=form_data)
        # Note: File validation would need to be tested with actual file uploads
        self.assertTrue(form.is_valid())