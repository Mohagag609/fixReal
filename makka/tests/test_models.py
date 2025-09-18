"""
Test cases for the real estate management system models.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date, datetime

from realpp.models import (
    Customer, Unit, Contract, Installment, Safe, Transfer,
    Broker, Partner, PartnerDebt
)


class CustomerModelTest(TestCase):
    """Test cases for Customer model."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = Customer.objects.create(
            name="أحمد محمد",
            customer_type="individual",
            phone="+966501234567",
            email="ahmed@example.com",
            national_id="1234567890"
        )
    
    def test_customer_creation(self):
        """Test customer creation."""
        self.assertEqual(self.customer.name, "أحمد محمد")
        self.assertEqual(self.customer.customer_type, "individual")
        self.assertEqual(self.customer.phone, "+966501234567")
        self.assertTrue(self.customer.is_active)
    
    def test_customer_str(self):
        """Test customer string representation."""
        self.assertEqual(str(self.customer), "أحمد محمد")
    
    def test_customer_phone_validation(self):
        """Test phone number validation."""
        # Test valid phone number
        customer = Customer(
            name="Test Customer",
            customer_type="individual",
            phone="+966501234567"
        )
        customer.full_clean()
        
        # Test invalid phone number
        customer.phone = "123"
        with self.assertRaises(ValidationError):
            customer.full_clean()
    
    def test_customer_national_id_validation(self):
        """Test national ID validation."""
        # Test valid national ID
        customer = Customer(
            name="Test Customer",
            customer_type="individual",
            phone="+966501234567",
            national_id="1234567890"
        )
        customer.full_clean()
        
        # Test invalid national ID
        customer.national_id = "123"
        with self.assertRaises(ValidationError):
            customer.full_clean()


class UnitModelTest(TestCase):
    """Test cases for Unit model."""
    
    def setUp(self):
        """Set up test data."""
        self.unit = Unit.objects.create(
            unit_number="A101",
            unit_type="apartment",
            floor=1,
            building="A",
            area=120.5,
            price=500000.00,
            status="available"
        )
    
    def test_unit_creation(self):
        """Test unit creation."""
        self.assertEqual(self.unit.unit_number, "A101")
        self.assertEqual(self.unit.unit_type, "apartment")
        self.assertEqual(self.unit.floor, 1)
        self.assertEqual(self.unit.area, Decimal('120.5'))
        self.assertEqual(self.unit.price, Decimal('500000.00'))
    
    def test_unit_str(self):
        """Test unit string representation."""
        self.assertEqual(str(self.unit), "A101")
    
    def test_unit_final_price_calculation(self):
        """Test final price calculation."""
        self.unit.discount = Decimal('50000.00')
        self.unit.save()
        self.assertEqual(self.unit.final_price, Decimal('450000.00'))
    
    def test_unit_price_validation(self):
        """Test price validation."""
        # Test valid price
        unit = Unit(
            unit_number="B102",
            unit_type="apartment",
            floor=2,
            building="B",
            area=100.0,
            price=400000.00
        )
        unit.full_clean()
        
        # Test invalid price (negative)
        unit.price = -1000.00
        with self.assertRaises(ValidationError):
            unit.full_clean()


class ContractModelTest(TestCase):
    """Test cases for Contract model."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = Customer.objects.create(
            name="أحمد محمد",
            customer_type="individual",
            phone="+966501234567"
        )
        
        self.unit = Unit.objects.create(
            unit_number="A101",
            unit_type="apartment",
            floor=1,
            building="A",
            area=120.5,
            price=500000.00
        )
        
        self.contract = Contract.objects.create(
            contract_number="C2024001",
            customer=self.customer,
            unit=self.unit,
            total_price=500000.00,
            discount=50000.00,
            final_price=450000.00,
            down_payment=100000.00,
            installment_type="monthly",
            installment_count=24,
            status="active"
        )
    
    def test_contract_creation(self):
        """Test contract creation."""
        self.assertEqual(self.contract.contract_number, "C2024001")
        self.assertEqual(self.contract.customer, self.customer)
        self.assertEqual(self.contract.unit, self.unit)
        self.assertEqual(self.contract.total_price, Decimal('500000.00'))
        self.assertEqual(self.contract.final_price, Decimal('450000.00'))
    
    def test_contract_str(self):
        """Test contract string representation."""
        self.assertEqual(str(self.contract), "C2024001")
    
    def test_contract_remaining_amount(self):
        """Test remaining amount calculation."""
        remaining = self.contract.final_price - self.contract.down_payment
        self.assertEqual(remaining, Decimal('350000.00'))
    
    def test_contract_installment_amount(self):
        """Test installment amount calculation."""
        remaining = self.contract.final_price - self.contract.down_payment
        installment_amount = remaining / self.contract.installment_count
        self.assertEqual(installment_amount, Decimal('14583.33'))


class InstallmentModelTest(TestCase):
    """Test cases for Installment model."""
    
    def setUp(self):
        """Set up test data."""
        self.customer = Customer.objects.create(
            name="أحمد محمد",
            customer_type="individual",
            phone="+966501234567"
        )
        
        self.unit = Unit.objects.create(
            unit_number="A101",
            unit_type="apartment",
            floor=1,
            building="A",
            area=120.5,
            price=500000.00
        )
        
        self.contract = Contract.objects.create(
            contract_number="C2024001",
            customer=self.customer,
            unit=self.unit,
            total_price=500000.00,
            final_price=450000.00,
            down_payment=100000.00,
            installment_type="monthly",
            installment_count=24
        )
        
        self.installment = Installment.objects.create(
            contract=self.contract,
            installment_number=1,
            amount=14583.33,
            due_date=date(2024, 2, 1),
            status="pending"
        )
    
    def test_installment_creation(self):
        """Test installment creation."""
        self.assertEqual(self.installment.contract, self.contract)
        self.assertEqual(self.installment.installment_number, 1)
        self.assertEqual(self.installment.amount, Decimal('14583.33'))
        self.assertEqual(self.installment.status, "pending")
    
    def test_installment_str(self):
        """Test installment string representation."""
        expected = f"Installment {self.installment.installment_number} - {self.contract.contract_number}"
        self.assertEqual(str(self.installment), expected)


class SafeModelTest(TestCase):
    """Test cases for Safe model."""
    
    def setUp(self):
        """Set up test data."""
        self.safe = Safe.objects.create(
            name="الخزينة الرئيسية",
            description="خزينة المبيعات الرئيسية",
            max_balance=1000000.00,
            is_active=True
        )
    
    def test_safe_creation(self):
        """Test safe creation."""
        self.assertEqual(self.safe.name, "الخزينة الرئيسية")
        self.assertEqual(self.safe.max_balance, Decimal('1000000.00'))
        self.assertTrue(self.safe.is_active)
    
    def test_safe_str(self):
        """Test safe string representation."""
        self.assertEqual(str(self.safe), "الخزينة الرئيسية")


class TransferModelTest(TestCase):
    """Test cases for Transfer model."""
    
    def setUp(self):
        """Set up test data."""
        self.from_safe = Safe.objects.create(
            name="الخزينة المصدر",
            max_balance=1000000.00
        )
        
        self.to_safe = Safe.objects.create(
            name="الخزينة الهدف",
            max_balance=1000000.00
        )
        
        self.transfer = Transfer.objects.create(
            from_safe=self.from_safe,
            to_safe=self.to_safe,
            amount=50000.00,
            status="completed"
        )
    
    def test_transfer_creation(self):
        """Test transfer creation."""
        self.assertEqual(self.transfer.from_safe, self.from_safe)
        self.assertEqual(self.transfer.to_safe, self.to_safe)
        self.assertEqual(self.transfer.amount, Decimal('50000.00'))
        self.assertEqual(self.transfer.status, "completed")
    
    def test_transfer_str(self):
        """Test transfer string representation."""
        expected = f"Transfer from {self.from_safe.name} to {self.to_safe.name}"
        self.assertEqual(str(self.transfer), expected)


class BrokerModelTest(TestCase):
    """Test cases for Broker model."""
    
    def setUp(self):
        """Set up test data."""
        self.broker = Broker.objects.create(
            name="محمد الوسيط",
            phone="+966501234567",
            email="broker@example.com",
            commission_rate=2.5,
            is_active=True
        )
    
    def test_broker_creation(self):
        """Test broker creation."""
        self.assertEqual(self.broker.name, "محمد الوسيط")
        self.assertEqual(self.broker.commission_rate, Decimal('2.5'))
        self.assertTrue(self.broker.is_active)
    
    def test_broker_str(self):
        """Test broker string representation."""
        self.assertEqual(str(self.broker), "محمد الوسيط")


class PartnerModelTest(TestCase):
    """Test cases for Partner model."""
    
    def setUp(self):
        """Set up test data."""
        self.partner = Partner.objects.create(
            name="شركة الشريك",
            phone="+966501234567",
            email="partner@example.com",
            is_active=True
        )
    
    def test_partner_creation(self):
        """Test partner creation."""
        self.assertEqual(self.partner.name, "شركة الشريك")
        self.assertTrue(self.partner.is_active)
    
    def test_partner_str(self):
        """Test partner string representation."""
        self.assertEqual(str(self.partner), "شركة الشريك")


class PartnerDebtModelTest(TestCase):
    """Test cases for PartnerDebt model."""
    
    def setUp(self):
        """Set up test data."""
        self.partner = Partner.objects.create(
            name="شركة الشريك",
            phone="+966501234567"
        )
        
        self.partner_debt = PartnerDebt.objects.create(
            partner=self.partner,
            amount=100000.00,
            due_date=date(2024, 12, 31),
            status="pending"
        )
    
    def test_partner_debt_creation(self):
        """Test partner debt creation."""
        self.assertEqual(self.partner_debt.partner, self.partner)
        self.assertEqual(self.partner_debt.amount, Decimal('100000.00'))
        self.assertEqual(self.partner_debt.status, "pending")
    
    def test_partner_debt_str(self):
        """Test partner debt string representation."""
        expected = f"Debt for {self.partner.name} - {self.partner_debt.amount}"
        self.assertEqual(str(self.partner_debt), expected)