"""
Tests for accounting_app services
"""
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from .models import (
    Customer, Unit, Partner, Contract, Installment, Safe, Voucher, Broker,
    PartnerDebt, BrokerDue, PartnerGroup, UnitPartner, PartnerGroupPartner,
    UnitPartnerGroup, Transfer
)
from .services.financial_services import (
    SafeService, InstallmentService, ContractService, VoucherService, TransferService
)
from .services.validation_services import (
    CustomerValidationService, UnitValidationService, PartnerValidationService,
    PartnerGroupValidationService, FinancialValidationService
)


class CustomerValidationServiceTest(TestCase):
    """Test CustomerValidationService"""
    
    def setUp(self):
        self.customer = Customer.objects.create(
            name="أحمد محمد",
            phone="0501234567",
            national_id="1234567890"
        )
    
    def test_validate_phone_uniqueness_new_phone(self):
        """Test phone uniqueness validation for new phone"""
        self.assertTrue(CustomerValidationService.validate_phone_uniqueness("0509876543"))
    
    def test_validate_phone_uniqueness_existing_phone(self):
        """Test phone uniqueness validation for existing phone"""
        self.assertFalse(CustomerValidationService.validate_phone_uniqueness("0501234567"))
    
    def test_validate_phone_uniqueness_update_existing(self):
        """Test phone uniqueness validation when updating existing customer"""
        self.assertTrue(CustomerValidationService.validate_phone_uniqueness("0501234567", self.customer.id))
    
    def test_validate_national_id_uniqueness_new_id(self):
        """Test national ID uniqueness validation for new ID"""
        self.assertTrue(CustomerValidationService.validate_national_id_uniqueness("0987654321"))
    
    def test_validate_national_id_uniqueness_existing_id(self):
        """Test national ID uniqueness validation for existing ID"""
        self.assertFalse(CustomerValidationService.validate_national_id_uniqueness("1234567890"))
    
    def test_validate_national_id_uniqueness_update_existing(self):
        """Test national ID uniqueness validation when updating existing customer"""
        self.assertTrue(CustomerValidationService.validate_national_id_uniqueness("1234567890", self.customer.id))


class UnitValidationServiceTest(TestCase):
    """Test UnitValidationService"""
    
    def setUp(self):
        self.unit = Unit.objects.create(
            code="UNIT-001",
            name="وحدة 101",
            total_price=Decimal('500000.00')
        )
    
    def test_validate_code_uniqueness_new_code(self):
        """Test code uniqueness validation for new code"""
        self.assertTrue(UnitValidationService.validate_code_uniqueness("UNIT-002"))
    
    def test_validate_code_uniqueness_existing_code(self):
        """Test code uniqueness validation for existing code"""
        self.assertFalse(UnitValidationService.validate_code_uniqueness("UNIT-001"))
    
    def test_generate_unit_code(self):
        """Test unit code generation"""
        code = UnitValidationService.generate_unit_code("وحدة 102", "2", "المبنى أ")
        self.assertEqual(code, "وحدة 102-2-المبنى أ")


class PartnerValidationServiceTest(TestCase):
    """Test PartnerValidationService"""
    
    def setUp(self):
        self.unit = Unit.objects.create(
            code="UNIT-001",
            name="وحدة 101",
            total_price=Decimal('500000.00')
        )
        self.partner = Partner.objects.create(name="شريك 1")
        self.unit_partner = UnitPartner.objects.create(
            unit=self.unit,
            partner=self.partner,
            percentage=Decimal('50.00')
        )
    
    def test_validate_partner_percentage_valid(self):
        """Test partner percentage validation for valid percentage"""
        self.assertTrue(PartnerValidationService.validate_partner_percentage(
            self.unit, Decimal('30.00')
        ))
    
    def test_validate_partner_percentage_invalid(self):
        """Test partner percentage validation for invalid percentage"""
        self.assertFalse(PartnerValidationService.validate_partner_percentage(
            self.unit, Decimal('60.00')
        ))
    
    def test_get_remaining_percentage(self):
        """Test remaining percentage calculation"""
        remaining = PartnerValidationService.get_remaining_percentage(self.unit)
        self.assertEqual(remaining, Decimal('50.00'))