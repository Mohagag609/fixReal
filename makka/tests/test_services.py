"""
Test cases for the services.
"""

from django.test import TestCase
from decimal import Decimal
from datetime import date, datetime
from unittest.mock import patch, mock_open

from realpp.models import Customer, Unit, Contract, Installment, Safe, Transfer, Broker
from realpp.services.calculations import (
    calculate_installment_status,
    calculate_remaining,
    calculate_collection_percentage,
    calculate_total_sales,
    calculate_unit_counts,
    calculate_dashboard_kpis
)
from realpp.services.reports import generate_report
from realpp.services.dbms import DatabaseManager
from realpp.services.backups import BackupManager


class CalculationsServiceTest(TestCase):
    """Test cases for calculations service."""
    
    def setUp(self):
        """Set up test data."""
        # Create customer
        self.customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567'
        )
        
        # Create unit
        self.unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00,
            status='sold'
        )
        
        # Create contract
        self.contract = Contract.objects.create(
            contract_number='C2024001',
            customer=self.customer,
            unit=self.unit,
            total_price=500000.00,
            discount=50000.00,
            final_price=450000.00,
            down_payment=100000.00,
            installment_type='monthly',
            installment_count=24,
            status='active'
        )
        
        # Create installments
        self.installment1 = Installment.objects.create(
            contract=self.contract,
            installment_number=1,
            amount=14583.33,
            due_date=date(2024, 2, 1),
            paid_date=date(2024, 2, 1),
            paid_amount=14583.33,
            status='paid'
        )
        
        self.installment2 = Installment.objects.create(
            contract=self.contract,
            installment_number=2,
            amount=14583.33,
            due_date=date(2024, 3, 1),
            status='pending'
        )
        
        self.installment3 = Installment.objects.create(
            contract=self.contract,
            installment_number=3,
            amount=14583.33,
            due_date=date(2024, 1, 1),  # Past due
            status='overdue'
        )
    
    def test_calculate_installment_status(self):
        """Test installment status calculation."""
        # Test paid installment
        status = calculate_installment_status(self.installment1)
        self.assertEqual(status, 'paid')
        
        # Test pending installment
        status = calculate_installment_status(self.installment2)
        self.assertEqual(status, 'pending')
        
        # Test overdue installment
        status = calculate_installment_status(self.installment3)
        self.assertEqual(status, 'overdue')
    
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
            unit_number='A102',
            unit_type='apartment',
            floor=1,
            building='A',
            area=100.0,
            price=400000.00,
            status='available'
        )
        
        Unit.objects.create(
            unit_number='A103',
            unit_type='apartment',
            floor=1,
            building='A',
            area=110.0,
            price=450000.00,
            status='reserved'
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


class ReportsServiceTest(TestCase):
    """Test cases for reports service."""
    
    def setUp(self):
        """Set up test data."""
        # Create customer
        self.customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567'
        )
        
        # Create unit
        self.unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00,
            status='sold'
        )
        
        # Create contract
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
    
    def test_generate_financial_report_pdf(self):
        """Test financial report generation in PDF format."""
        response = generate_report('financial', 'pdf')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('financial_report_', response['Content-Disposition'])
    
    def test_generate_financial_report_excel(self):
        """Test financial report generation in Excel format."""
        response = generate_report('financial', 'excel')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertIn('financial_report_', response['Content-Disposition'])
    
    def test_generate_units_report_pdf(self):
        """Test units report generation in PDF format."""
        response = generate_report('units', 'pdf')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('units_report_', response['Content-Disposition'])
    
    def test_generate_units_report_excel(self):
        """Test units report generation in Excel format."""
        response = generate_report('units', 'excel')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertIn('units_report_', response['Content-Disposition'])
    
    def test_generate_customers_report_pdf(self):
        """Test customers report generation in PDF format."""
        response = generate_report('customers', 'pdf')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('customers_report_', response['Content-Disposition'])
    
    def test_generate_customers_report_excel(self):
        """Test customers report generation in Excel format."""
        response = generate_report('customers', 'excel')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertIn('customers_report_', response['Content-Disposition'])
    
    def test_generate_report_invalid_type(self):
        """Test report generation with invalid type."""
        with self.assertRaises(ValueError):
            generate_report('invalid_type', 'pdf')
    
    def test_generate_report_invalid_format(self):
        """Test report generation with invalid format."""
        with self.assertRaises(ValueError):
            generate_report('financial', 'invalid_format')


class DatabaseManagerTest(TestCase):
    """Test cases for database manager."""
    
    def setUp(self):
        """Set up test data."""
        self.db_manager = DatabaseManager()
    
    def test_get_database_info(self):
        """Test getting database information."""
        info = self.db_manager.get_database_info()
        
        self.assertIn('database_name', info)
        self.assertIn('database_host', info)
        self.assertIn('database_port', info)
        self.assertIn('database_size', info)
        self.assertIn('table_sizes', info)
        self.assertIn('active_connections', info)
    
    def test_optimize_database(self):
        """Test database optimization."""
        result = self.db_manager.optimize_database()
        
        self.assertIn('success', result)
        self.assertIn('message', result)
        self.assertIn('timestamp', result)
    
    def test_get_database_health(self):
        """Test getting database health metrics."""
        health = self.db_manager.get_database_health()
        
        self.assertIn('long_queries', health)
        self.assertIn('locks', health)
        self.assertIn('total_connections', health)
        self.assertIn('dead_tuples', health)
        self.assertIn('health_score', health)
        self.assertIn('timestamp', health)
    
    def test_cleanup_old_data(self):
        """Test cleaning up old data."""
        result = self.db_manager.cleanup_old_data(days=30)
        
        self.assertIn('success', result)
        self.assertIn('message', result)
        self.assertIn('timestamp', result)
    
    def test_run_migrations(self):
        """Test running migrations."""
        result = self.db_manager.run_migrations()
        
        self.assertIn('success', result)
        self.assertIn('message', result)
        self.assertIn('timestamp', result)
    
    def test_get_table_statistics(self):
        """Test getting table statistics."""
        stats = self.db_manager.get_table_statistics()
        
        self.assertIn('table_statistics', stats)
        self.assertIn('timestamp', stats)


class BackupManagerTest(TestCase):
    """Test cases for backup manager."""
    
    def setUp(self):
        """Set up test data."""
        self.backup_manager = BackupManager()
    
    def test_list_backups(self):
        """Test listing backups."""
        backups = self.backup_manager.list_backups()
        
        self.assertIsInstance(backups, list)
    
    def test_cleanup_old_backups(self):
        """Test cleaning up old backups."""
        result = self.backup_manager.cleanup_old_backups(days=30)
        
        self.assertIn('success', result)
        self.assertIn('message', result)
        self.assertIn('timestamp', result)
    
    def test_get_backup_size(self):
        """Test getting backup size."""
        # Test with non-existent file
        size = self.backup_manager.get_backup_size('nonexistent_file.txt')
        self.assertEqual(size, 0)
    
    def test_schedule_automatic_backup(self):
        """Test scheduling automatic backup."""
        result = self.backup_manager.schedule_automatic_backup('daily')
        
        self.assertIn('success', result)
        self.assertIn('message', result)
        self.assertIn('frequency', result)
        self.assertIn('timestamp', result)
    
    @patch('os.path.exists')
    def test_delete_backup_file_not_found(self, mock_exists):
        """Test deleting non-existent backup."""
        mock_exists.return_value = False
        
        result = self.backup_manager.delete_backup('nonexistent_backup.zip')
        
        self.assertFalse(result['success'])
        self.assertIn('Backup file not found', result['message'])
    
    @patch('os.path.exists')
    @patch('os.remove')
    def test_delete_backup_success(self, mock_remove, mock_exists):
        """Test successful backup deletion."""
        mock_exists.return_value = True
        mock_remove.return_value = None
        
        result = self.backup_manager.delete_backup('test_backup.zip')
        
        self.assertTrue(result['success'])
        self.assertIn('deleted successfully', result['message'])
    
    @patch('os.path.exists')
    @patch('os.remove')
    def test_delete_backup_error(self, mock_remove, mock_exists):
        """Test backup deletion with error."""
        mock_exists.return_value = True
        mock_remove.side_effect = OSError('Permission denied')
        
        result = self.backup_manager.delete_backup('test_backup.zip')
        
        self.assertFalse(result['success'])
        self.assertIn('Permission denied', result['message'])


class ServiceIntegrationTest(TestCase):
    """Integration tests for services."""
    
    def setUp(self):
        """Set up test data."""
        # Create customer
        self.customer = Customer.objects.create(
            name='أحمد محمد',
            customer_type='individual',
            phone='+966501234567'
        )
        
        # Create unit
        self.unit = Unit.objects.create(
            unit_number='A101',
            unit_type='apartment',
            floor=1,
            building='A',
            area=120.5,
            price=500000.00,
            status='sold'
        )
        
        # Create contract
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
        
        # Create installments
        self.installment1 = Installment.objects.create(
            contract=self.contract,
            installment_number=1,
            amount=14583.33,
            due_date=date(2024, 2, 1),
            paid_date=date(2024, 2, 1),
            paid_amount=14583.33,
            status='paid'
        )
        
        self.installment2 = Installment.objects.create(
            contract=self.contract,
            installment_number=2,
            amount=14583.33,
            due_date=date(2024, 3, 1),
            status='pending'
        )
    
    def test_calculations_with_real_data(self):
        """Test calculations with real data."""
        # Test remaining calculation
        remaining = calculate_remaining(self.contract)
        expected_remaining = self.contract.final_price - self.installment1.paid_amount
        self.assertEqual(remaining['remaining_amount'], expected_remaining)
        
        # Test collection percentage
        percentage = calculate_collection_percentage(self.contract)
        expected_percentage = (self.installment1.paid_amount / self.contract.final_price) * 100
        self.assertAlmostEqual(percentage, float(expected_percentage), places=2)
        
        # Test dashboard KPIs
        kpis = calculate_dashboard_kpis()
        self.assertEqual(kpis['total_sales'], self.contract.final_price)
        self.assertEqual(kpis['total_customers'], 1)
        self.assertEqual(kpis['total_units'], 1)
        self.assertEqual(kpis['total_contracts'], 1)
    
    def test_reports_with_real_data(self):
        """Test reports with real data."""
        # Test financial report
        response = generate_report('financial', 'pdf')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        
        # Test units report
        response = generate_report('units', 'excel')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        
        # Test customers report
        response = generate_report('customers', 'pdf')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
    
    def test_database_operations(self):
        """Test database operations."""
        db_manager = DatabaseManager()
        
        # Test getting database info
        info = db_manager.get_database_info()
        self.assertIsInstance(info, dict)
        self.assertIn('database_name', info)
        
        # Test getting database health
        health = db_manager.get_database_health()
        self.assertIsInstance(health, dict)
        self.assertIn('health_score', health)
        
        # Test running migrations
        result = db_manager.run_migrations()
        self.assertIn('success', result)
    
    def test_backup_operations(self):
        """Test backup operations."""
        backup_manager = BackupManager()
        
        # Test listing backups
        backups = backup_manager.list_backups()
        self.assertIsInstance(backups, list)
        
        # Test cleanup old backups
        result = backup_manager.cleanup_old_backups(days=30)
        self.assertIn('success', result)
        
        # Test scheduling automatic backup
        result = backup_manager.schedule_automatic_backup('daily')
        self.assertIn('success', result)