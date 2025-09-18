"""
Test cases for the views.
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from decimal import Decimal

from realpp.models import Customer, Unit, Contract, Safe, Broker


class DashboardViewTest(TestCase):
    """Test cases for dashboard view."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
    
    def test_dashboard_view(self):
        """Test dashboard view."""
        response = self.client.get(reverse('realpp:dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'لوحة التحكم')
    
    def test_dashboard_with_data(self):
        """Test dashboard view with data."""
        # Create test data
        customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567'
        )
        
        unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00,
            status='sold'
        )
        
        contract = Contract.objects.create(
            contract_number='C2024001',
            customer=customer,
            unit=unit,
            total_price=500000.00,
            final_price=450000.00,
            down_payment=100000.00,
            installment_type='monthly',
            installment_count=24,
            status='active'
        )
        
        response = self.client.get(reverse('realpp:dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'أحمد محمد')


class CustomerViewsTest(TestCase):
    """Test cases for customer views."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
        
        self.customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567',
            email='ahmed@example.com'
        )
    
    def test_customers_list_view(self):
        """Test customers list view."""
        response = self.client.get(reverse('realpp:customers_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'أحمد محمد')
    
    def test_customers_create_view_get(self):
        """Test customers create view GET."""
        response = self.client.get(reverse('realpp:customers_create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'إضافة عميل جديد')
    
    def test_customers_create_view_post(self):
        """Test customers create view POST."""
        form_data = {
            'name': 'محمد أحمد',
            'customer_type': 'individual',
            'phone': '+966501234568',
            'email': 'mohamed@example.com'
        }
        response = self.client.post(reverse('realpp:customers_create'), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful creation
        
        # Check if customer was created
        self.assertTrue(Customer.objects.filter(name='محمد أحمد').exists())
    
    def test_customers_detail_view(self):
        """Test customers detail view."""
        response = self.client.get(reverse('realpp:customers_detail', args=[self.customer.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'أحمد محمد')
    
    def test_customers_edit_view_get(self):
        """Test customers edit view GET."""
        response = self.client.get(reverse('realpp:customers_edit', args=[self.customer.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'تعديل العميل')
    
    def test_customers_edit_view_post(self):
        """Test customers edit view POST."""
        form_data = {
            'name': 'أحمد محمد المحدث',
            'customer_type': 'individual',
            'phone': '+966501234567',
            'email': 'ahmed.updated@example.com'
        }
        response = self.client.post(reverse('realpp:customers_edit', args=[self.customer.id]), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful update
        
        # Check if customer was updated
        updated_customer = Customer.objects.get(id=self.customer.id)
        self.assertEqual(updated_customer.name, 'أحمد محمد المحدث')
    
    def test_customers_delete_view(self):
        """Test customers delete view."""
        response = self.client.post(reverse('realpp:customers_delete', args=[self.customer.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check if customer was deleted
        self.assertFalse(Customer.objects.filter(id=self.customer.id).exists())


class UnitViewsTest(TestCase):
    """Test cases for unit views."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
        
        self.unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00,
            status='available'
        )
    
    def test_units_list_view(self):
        """Test units list view."""
        response = self.client.get(reverse('realpp:units_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'A101')
    
    def test_units_create_view_get(self):
        """Test units create view GET."""
        response = self.client.get(reverse('realpp:units_create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'إضافة وحدة جديدة')
    
    def test_units_create_view_post(self):
        """Test units create view POST."""
        form_data = {
            'unit_number': 'A102',
            'unit_type': 'apartment',
            'floor': 2,
            'building': 'A',
            'area': 100.0,
            'price': 400000.00,
            'status': 'available'
        }
        response = self.client.post(reverse('realpp:units_create'), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful creation
        
        # Check if unit was created
        self.assertTrue(Unit.objects.filter(unit_number='A102').exists())
    
    def test_units_detail_view(self):
        """Test units detail view."""
        response = self.client.get(reverse('realpp:units_detail', args=[self.unit.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'A101')
    
    def test_units_edit_view_get(self):
        """Test units edit view GET."""
        response = self.client.get(reverse('realpp:units_edit', args=[self.unit.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'تعديل الوحدة')
    
    def test_units_edit_view_post(self):
        """Test units edit view POST."""
        form_data = {
            'unit_number': 'A101',
            'unit_type': 'apartment',
            'floor': 1,
            'building': 'A',
            'area': 130.0,  # Updated area
            'price': 550000.00,  # Updated price
            'status': 'available'
        }
        response = self.client.post(reverse('realpp:units_edit', args=[self.unit.id]), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful update
        
        # Check if unit was updated
        updated_unit = Unit.objects.get(id=self.unit.id)
        self.assertEqual(updated_unit.area, Decimal('130.0'))
        self.assertEqual(updated_unit.price, Decimal('550000.00'))
    
    def test_units_delete_view(self):
        """Test units delete view."""
        response = self.client.post(reverse('realpp:units_delete', args=[self.unit.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check if unit was deleted
        self.assertFalse(Unit.objects.filter(id=self.unit.id).exists())


class ContractViewsTest(TestCase):
    """Test cases for contract views."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
        
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
            price=500000.00,
            status='available'
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
    
    def test_contracts_list_view(self):
        """Test contracts list view."""
        response = self.client.get(reverse('realpp:contracts_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'C2024001')
    
    def test_contracts_create_view_get(self):
        """Test contracts create view GET."""
        response = self.client.get(reverse('realpp:contracts_create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'عقد جديد')
    
    def test_contracts_create_view_post(self):
        """Test contracts create view POST."""
        form_data = {
            'contract_number': 'C2024002',
            'customer': self.customer.id,
            'unit': self.unit.id,
            'total_price': 600000.00,
            'final_price': 550000.00,
            'down_payment': 150000.00,
            'installment_type': 'monthly',
            'installment_count': 30,
            'status': 'active'
        }
        response = self.client.post(reverse('realpp:contracts_create'), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful creation
        
        # Check if contract was created
        self.assertTrue(Contract.objects.filter(contract_number='C2024002').exists())
    
    def test_contracts_detail_view(self):
        """Test contracts detail view."""
        response = self.client.get(reverse('realpp:contracts_detail', args=[self.contract.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'C2024001')
    
    def test_contracts_edit_view_get(self):
        """Test contracts edit view GET."""
        response = self.client.get(reverse('realpp:contracts_edit', args=[self.contract.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'تعديل العقد')
    
    def test_contracts_edit_view_post(self):
        """Test contracts edit view POST."""
        form_data = {
            'contract_number': 'C2024001',
            'customer': self.customer.id,
            'unit': self.unit.id,
            'total_price': 500000.00,
            'final_price': 450000.00,
            'down_payment': 120000.00,  # Updated down payment
            'installment_type': 'monthly',
            'installment_count': 24,
            'status': 'active'
        }
        response = self.client.post(reverse('realpp:contracts_edit', args=[self.contract.id]), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful update
        
        # Check if contract was updated
        updated_contract = Contract.objects.get(id=self.contract.id)
        self.assertEqual(updated_contract.down_payment, Decimal('120000.00'))
    
    def test_contracts_delete_view(self):
        """Test contracts delete view."""
        response = self.client.post(reverse('realpp:contracts_delete', args=[self.contract.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check if contract was deleted
        self.assertFalse(Contract.objects.filter(id=self.contract.id).exists())


class TreasuryViewsTest(TestCase):
    """Test cases for treasury views."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
        
        self.safe = Safe.objects.create(
            name='الخزينة الرئيسية',
            description='خزينة المبيعات الرئيسية',
            max_balance=1000000.00,
            is_active=True
        )
    
    def test_treasury_dashboard_view(self):
        """Test treasury dashboard view."""
        response = self.client.get(reverse('realpp:treasury_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'إدارة الخزينة')
    
    def test_safes_list_view(self):
        """Test safes list view."""
        response = self.client.get(reverse('realpp:safes_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'الخزينة الرئيسية')
    
    def test_safes_create_view_get(self):
        """Test safes create view GET."""
        response = self.client.get(reverse('realpp:safes_create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'إضافة خزينة جديدة')
    
    def test_safes_create_view_post(self):
        """Test safes create view POST."""
        form_data = {
            'name': 'خزينة جديدة',
            'description': 'وصف الخزينة الجديدة',
            'max_balance': 500000.00,
            'is_active': True
        }
        response = self.client.post(reverse('realpp:safes_create'), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful creation
        
        # Check if safe was created
        self.assertTrue(Safe.objects.filter(name='خزينة جديدة').exists())
    
    def test_safes_detail_view(self):
        """Test safes detail view."""
        response = self.client.get(reverse('realpp:safes_detail', args=[self.safe.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'الخزينة الرئيسية')
    
    def test_safes_edit_view_get(self):
        """Test safes edit view GET."""
        response = self.client.get(reverse('realpp:safes_edit', args=[self.safe.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'تعديل الخزينة')
    
    def test_safes_edit_view_post(self):
        """Test safes edit view POST."""
        form_data = {
            'name': 'الخزينة الرئيسية المحدثة',
            'description': 'وصف محدث',
            'max_balance': 1500000.00,
            'is_active': True
        }
        response = self.client.post(reverse('realpp:safes_edit', args=[self.safe.id]), form_data)
        self.assertEqual(response.status_code, 302)  # Redirect after successful update
        
        # Check if safe was updated
        updated_safe = Safe.objects.get(id=self.safe.id)
        self.assertEqual(updated_safe.name, 'الخزينة الرئيسية المحدثة')
        self.assertEqual(updated_safe.max_balance, Decimal('1500000.00'))
    
    def test_safes_delete_view(self):
        """Test safes delete view."""
        response = self.client.post(reverse('realpp:safes_delete', args=[self.safe.id]))
        self.assertEqual(response.status_code, 200)
        
        # Check if safe was deleted
        self.assertFalse(Safe.objects.filter(id=self.safe.id).exists())


class ReportsViewsTest(TestCase):
    """Test cases for reports views."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
    
    def test_reports_dashboard_view(self):
        """Test reports dashboard view."""
        response = self.client.get(reverse('realpp:reports_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'التقارير والإحصائيات')
    
    def test_generate_report_view(self):
        """Test generate report view."""
        response = self.client.get(reverse('realpp:generate_report', args=['financial', 'pdf']))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')


class ErrorViewsTest(TestCase):
    """Test cases for error views."""
    
    def setUp(self):
        """Set up test data."""
        self.client = Client()
    
    def test_custom_404_view(self):
        """Test custom 404 view."""
        response = self.client.get('/nonexistent-page/')
        self.assertEqual(response.status_code, 404)
        self.assertContains(response, 'الصفحة غير موجودة')
    
    def test_custom_500_view(self):
        """Test custom 500 view."""
        # This would need to be tested with a view that raises an exception
        pass
    
    def test_custom_403_view(self):
        """Test custom 403 view."""
        # This would need to be tested with a view that raises a 403 error
        pass
    
    def test_custom_400_view(self):
        """Test custom 400 view."""
        # This would need to be tested with a view that raises a 400 error
        pass