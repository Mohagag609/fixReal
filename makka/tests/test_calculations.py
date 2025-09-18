"""
Test cases for the calculations service.
"""

from django.test import TestCase
from decimal import Decimal
from datetime import date, datetime

from realpp.models import Customer, Unit, Contract, Installment, Safe, Transfer
from realpp.services.calculations import (
    calculate_installment_status,
    calculate_remaining,
    calculate_collection_percentage,
    calculate_total_sales,
    calculate_unit_counts,
    calculate_dashboard_kpis
)


class CalculationsServiceTest(TestCase):
    """Test cases for calculations service."""
    
    def setUp(self):
        """Set up test data."""
        # Create customer
        self.customer = Customer.objects.create(
            name="أحمد محمد",
            customer_type="individual",
            phone="+966501234567"
        )
        
        # Create unit
        self.unit = Unit.objects.create(
            unit_number="A101",
            unit_type="apartment",
            floor=1,
            building="A",
            area=120.5,
            price=500000.00,
            status="sold"
        )
        
        # Create contract
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
        
        # Create installments
        self.installment1 = Installment.objects.create(
            contract=self.contract,
            installment_number=1,
            amount=14583.33,
            due_date=date(2024, 2, 1),
            paid_date=date(2024, 2, 1),
            paid_amount=14583.33,
            status="paid"
        )
        
        self.installment2 = Installment.objects.create(
            contract=self.contract,
            installment_number=2,
            amount=14583.33,
            due_date=date(2024, 3, 1),
            status="pending"
        )
        
        self.installment3 = Installment.objects.create(
            contract=self.contract,
            installment_number=3,
            amount=14583.33,
            due_date=date(2024, 1, 1),  # Past due
            status="overdue"
        )
    
    def test_calculate_installment_status(self):
        """Test installment status calculation."""
        # Test paid installment
        status = calculate_installment_status(self.installment1)
        self.assertEqual(status, "paid")
        
        # Test pending installment
        status = calculate_installment_status(self.installment2)
        self.assertEqual(status, "pending")
        
        # Test overdue installment
        status = calculate_installment_status(self.installment3)
        self.assertEqual(status, "overdue")
    
    def test_calculate_remaining(self):
        """Test remaining amount calculation."""
        result = calculate_remaining(self.contract)
        
        expected_remaining = self.contract.final_price - self.installment1.paid_amount
        self.assertEqual(result['remaining_amount'], expected_remaining)
        
        expected_percentage = (expected_remaining / self.contract.final_price) * 100
        self.assertAlmostEqual(result['remaining_percentage'], float(expected_percentage), places=2)
    
    def test_calculate_collection_percentage(self):
        """Test collection percentage calculation."""
        percentage = calculate_collection_percentage(self.contract)
        
        total_paid = self.installment1.paid_amount
        expected_percentage = (total_paid / self.contract.final_price) * 100
        self.assertAlmostEqual(percentage, float(expected_percentage), places=2)
    
    def test_calculate_total_sales(self):
        """Test total sales calculation."""
        result = calculate_total_sales()
        
        self.assertEqual(result['total_sales'], self.contract.final_price)
        self.assertEqual(result['total_contracts'], 1)
        self.assertEqual(result['active_contracts'], 1)
        self.assertEqual(result['completed_contracts'], 0)
    
    def test_calculate_unit_counts(self):
        """Test unit counts calculation."""
        # Create additional units
        Unit.objects.create(
            unit_number="A102",
            unit_type="apartment",
            floor=1,
            building="A",
            area=100.0,
            price=400000.00,
            status="available"
        )
        
        Unit.objects.create(
            unit_number="A103",
            unit_type="apartment",
            floor=1,
            building="A",
            area=110.0,
            price=450000.00,
            status="reserved"
        )
        
        result = calculate_unit_counts()
        
        self.assertEqual(result['total_units'], 3)
        self.assertEqual(result['available_units'], 1)
        self.assertEqual(result['sold_units'], 1)
        self.assertEqual(result['reserved_units'], 1)
    
    def test_calculate_dashboard_kpis(self):
        """Test dashboard KPIs calculation."""
        result = calculate_dashboard_kpis()
        
        self.assertEqual(result['total_sales'], self.contract.final_price)
        self.assertEqual(result['total_customers'], 1)
        self.assertEqual(result['total_units'], 1)
        self.assertEqual(result['available_units'], 0)
        self.assertEqual(result['sold_units'], 1)
        self.assertEqual(result['total_contracts'], 1)
        self.assertEqual(result['active_contracts'], 1)
        self.assertEqual(result['completed_contracts'], 0)
    
    def test_calculate_remaining_with_no_payments(self):
        """Test remaining calculation with no payments."""
        # Create contract with no installments
        contract = Contract.objects.create(
            contract_number="C2024002",
            customer=self.customer,
            unit=self.unit,
            total_price=300000.00,
            final_price=300000.00,
            down_payment=50000.00,
            installment_type="monthly",
            installment_count=12,
            status="active"
        )
        
        result = calculate_remaining(contract)
        
        expected_remaining = contract.final_price - contract.down_payment
        self.assertEqual(result['remaining_amount'], expected_remaining)
    
    def test_calculate_collection_percentage_with_no_payments(self):
        """Test collection percentage with no payments."""
        # Create contract with no installments
        contract = Contract.objects.create(
            contract_number="C2024003",
            customer=self.customer,
            unit=self.unit,
            total_price=200000.00,
            final_price=200000.00,
            down_payment=0.00,
            installment_type="monthly",
            installment_count=12,
            status="active"
        )
        
        percentage = calculate_collection_percentage(contract)
        self.assertEqual(percentage, 0.0)
    
    def test_calculate_collection_percentage_with_zero_final_price(self):
        """Test collection percentage with zero final price."""
        # Create contract with zero final price
        contract = Contract.objects.create(
            contract_number="C2024004",
            customer=self.customer,
            unit=self.unit,
            total_price=0.00,
            final_price=0.00,
            down_payment=0.00,
            installment_type="monthly",
            installment_count=12,
            status="active"
        )
        
        percentage = calculate_collection_percentage(contract)
        self.assertEqual(percentage, 0.0)