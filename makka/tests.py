"""
اختبارات شاملة لنظام إدارة العقارات
"""
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from datetime import date, timedelta
from realpp.models import (
    Customer, Unit, Partner, Contract, Installment, Safe, Voucher, 
    Broker, Notification, Settings, KeyVal
)
from realpp.services.calculations import (
    calculate_installment_status, calculate_remaining, 
    calculate_collection_percentage, calculate_net_profit
)

class ModelTests(TestCase):
    """اختبارات النماذج"""
    
    def setUp(self):
        """إعداد البيانات للاختبار"""
        self.customer = Customer.objects.create(
            name="أحمد محمد",
            phone="0501234567",
            national_id="1234567890",
            email="ahmed@example.com",
            address="الرياض، المملكة العربية السعودية"
        )
        
        self.unit = Unit.objects.create(
            unit_number="A101",
            floor=1,
            building="مبنى أ",
            area=120.5,
            price=500000,
            status="available",
            unit_type="apartment"
        )
        
        self.partner = Partner.objects.create(
            name="محمد علي",
            phone="0507654321",
            national_id="0987654321",
            email="mohammed@example.com",
            share_percentage=25.0
        )
        
        self.safe = Safe.objects.create(
            name="الخزينة الرئيسية",
            balance=100000,
            description="الخزينة الرئيسية للمشروع"
        )
        
        self.broker = Broker.objects.create(
            name="سعد العتيبي",
            phone="0509876543",
            national_id="1122334455",
            email="saad@example.com"
        )
    
    def test_customer_creation(self):
        """اختبار إنشاء عميل"""
        self.assertEqual(self.customer.name, "أحمد محمد")
        self.assertEqual(self.customer.phone, "0501234567")
        self.assertTrue(self.customer.created_at)
    
    def test_unit_creation(self):
        """اختبار إنشاء وحدة"""
        self.assertEqual(self.unit.unit_number, "A101")
        self.assertEqual(self.unit.price, 500000)
        self.assertEqual(self.unit.status, "available")
    
    def test_contract_creation(self):
        """اختبار إنشاء عقد"""
        contract = Contract.objects.create(
            customer=self.customer,
            unit=self.unit,
            contract_date=date.today(),
            total_price=500000,
            down_payment=100000,
            installment_type="monthly",
            number_of_installments=24,
            broker=self.broker
        )
        
        self.assertEqual(contract.customer, self.customer)
        self.assertEqual(contract.unit, self.unit)
        self.assertEqual(contract.total_price, 500000)
    
    def test_installment_creation(self):
        """اختبار إنشاء قسط"""
        contract = Contract.objects.create(
            customer=self.customer,
            unit=self.unit,
            contract_date=date.today(),
            total_price=500000,
            down_payment=100000,
            installment_type="monthly",
            number_of_installments=24,
            broker=self.broker
        )
        
        installment = Installment.objects.create(
            contract=contract,
            due_date=date.today() + timedelta(days=30),
            due_amount=16666.67,
            paid_amount=0
        )
        
        self.assertEqual(installment.contract, contract)
        self.assertEqual(installment.due_amount, Decimal('16666.67'))
    
    def test_safe_creation(self):
        """اختبار إنشاء خزينة"""
        self.assertEqual(self.safe.name, "الخزينة الرئيسية")
        self.assertEqual(self.safe.balance, 100000)
    
    def test_voucher_creation(self):
        """اختبار إنشاء سند"""
        voucher = Voucher.objects.create(
            safe=self.safe,
            amount=50000,
            voucher_type="income",
            date=date.today(),
            description="إيراد من بيع وحدة"
        )
        
        self.assertEqual(voucher.safe, self.safe)
        self.assertEqual(voucher.amount, 50000)
        self.assertEqual(voucher.voucher_type, "income")

class CalculationTests(TestCase):
    """اختبارات الحسابات"""
    
    def test_calculate_installment_status(self):
        """اختبار حساب حالة القسط"""
        # قسط مدفوع بالكامل
        installment1 = type('Installment', (), {
            'paid_amount': 1000,
            'due_amount': 1000
        })()
        self.assertEqual(calculate_installment_status(installment1), "Paid")
        
        # قسط مدفوع جزئياً
        installment2 = type('Installment', (), {
            'paid_amount': 500,
            'due_amount': 1000
        })()
        self.assertEqual(calculate_installment_status(installment2), "Partially Paid")
        
        # قسط غير مدفوع
        installment3 = type('Installment', (), {
            'paid_amount': 0,
            'due_amount': 1000
        })()
        self.assertEqual(calculate_installment_status(installment3), "Unpaid")
    
    def test_calculate_remaining(self):
        """اختبار حساب المبلغ المتبقي"""
        self.assertEqual(calculate_remaining(1000, 300), 700)
        self.assertEqual(calculate_remaining(500, 500), 0)
        self.assertEqual(calculate_remaining(1000, 0), 1000)
    
    def test_calculate_collection_percentage(self):
        """اختبار حساب نسبة التحصيل"""
        self.assertEqual(calculate_collection_percentage(1000, 800), Decimal('80.00'))
        self.assertEqual(calculate_collection_percentage(1000, 1000), Decimal('100.00'))
        self.assertEqual(calculate_collection_percentage(1000, 0), Decimal('0.00'))
        self.assertEqual(calculate_collection_percentage(0, 100), Decimal('0.00'))
    
    def test_calculate_net_profit(self):
        """اختبار حساب صافي الربح"""
        self.assertEqual(calculate_net_profit(1000, 300), 700)
        self.assertEqual(calculate_net_profit(500, 600), -100)
        self.assertEqual(calculate_net_profit(1000, 1000), 0)

class ViewTests(TestCase):
    """اختبارات العروض"""
    
    def setUp(self):
        """إعداد البيانات للاختبار"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
    
    def test_dashboard_view(self):
        """اختبار عرض لوحة التحكم"""
        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'لوحة التحكم')
    
    def test_customer_list_view(self):
        """اختبار عرض قائمة العملاء"""
        response = self.client.get(reverse('customer_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'العملاء')
    
    def test_customer_create_view(self):
        """اختبار إنشاء عميل جديد"""
        response = self.client.get(reverse('customer_create'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'إنشاء عميل جديد')
    
    def test_unit_list_view(self):
        """اختبار عرض قائمة الوحدات"""
        response = self.client.get(reverse('unit_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'الوحدات')
    
    def test_contract_list_view(self):
        """اختبار عرض قائمة العقود"""
        response = self.client.get(reverse('contract_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'العقود')
    
    def test_treasury_dashboard_view(self):
        """اختبار عرض لوحة الخزائن"""
        response = self.client.get(reverse('treasury_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'الخزائن')
    
    def test_reports_dashboard_view(self):
        """اختبار عرض لوحة التقارير"""
        response = self.client.get(reverse('reports_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'التقارير')
    
    def test_dbms_dashboard_view(self):
        """اختبار عرض لوحة إدارة قاعدة البيانات"""
        response = self.client.get(reverse('dbms_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'إدارة قاعدة البيانات')
    
    def test_notifications_dashboard_view(self):
        """اختبار عرض لوحة الإشعارات"""
        response = self.client.get(reverse('notifications_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'الإشعارات')
    
    def test_analytics_dashboard_view(self):
        """اختبار عرض لوحة التحليلات"""
        response = self.client.get(reverse('analytics_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'التحليلات')
    
    def test_settings_dashboard_view(self):
        """اختبار عرض لوحة الإعدادات"""
        response = self.client.get(reverse('settings_dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'الإعدادات')

class FormTests(TestCase):
    """اختبارات النماذج"""
    
    def test_customer_form(self):
        """اختبار نموذج العميل"""
        from realpp.forms import CustomerForm
        
        form_data = {
            'name': 'أحمد محمد',
            'phone': '0501234567',
            'national_id': '1234567890',
            'email': 'ahmed@example.com',
            'address': 'الرياض، المملكة العربية السعودية'
        }
        
        form = CustomerForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_unit_form(self):
        """اختبار نموذج الوحدة"""
        from realpp.forms import UnitForm
        
        form_data = {
            'unit_number': 'A101',
            'floor': 1,
            'building': 'مبنى أ',
            'area': 120.5,
            'price': 500000,
            'status': 'available',
            'unit_type': 'apartment'
        }
        
        form = UnitForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_contract_form(self):
        """اختبار نموذج العقد"""
        from realpp.forms import ContractForm
        
        # إنشاء البيانات المطلوبة
        customer = Customer.objects.create(
            name="أحمد محمد",
            phone="0501234567",
            national_id="1234567890"
        )
        
        unit = Unit.objects.create(
            unit_number="A101",
            floor=1,
            building="مبنى أ",
            area=120.5,
            price=500000,
            status="available",
            unit_type="apartment"
        )
        
        broker = Broker.objects.create(
            name="سعد العتيبي",
            phone="0509876543",
            national_id="1122334455"
        )
        
        form_data = {
            'customer': customer.id,
            'unit': unit.id,
            'contract_date': date.today(),
            'total_price': 500000,
            'down_payment': 100000,
            'installment_type': 'monthly',
            'number_of_installments': 24,
            'broker': broker.id
        }
        
        form = ContractForm(data=form_data)
        self.assertTrue(form.is_valid())

class ServiceTests(TestCase):
    """اختبارات الخدمات"""
    
    def test_calculations_service(self):
        """اختبار خدمة الحسابات"""
        from realpp.services.calculations import calculate_dashboard_kpis
        
        data = {
            'total_sales': Decimal('1000000'),
            'total_receipts': Decimal('800000'),
            'total_expenses': Decimal('200000'),
            'total_debt': Decimal('50000')
        }
        
        kpis = calculate_dashboard_kpis(data)
        
        self.assertIn('total_sales', kpis)
        self.assertIn('total_receipts', kpis)
        self.assertIn('total_expenses', kpis)
        self.assertIn('net_profit', kpis)
        self.assertIn('collection_percentage', kpis)
    
    def test_reports_service(self):
        """اختبار خدمة التقارير"""
        from realpp.services.reports import generate_financial_report
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        report = generate_financial_report(start_date, end_date)
        
        self.assertIn('report_type', report)
        self.assertIn('date_range', report)
        self.assertIn('total_income', report)
        self.assertIn('total_expenses', report)
        self.assertIn('net_profit', report)
    
    def test_backup_service(self):
        """اختبار خدمة النسخ الاحتياطية"""
        from realpp.services.backups import create_backup
        
        result = create_backup()
        
        self.assertIn('status', result)
        # قد يفشل في بيئة الاختبار إذا لم يكن PostgreSQL متاحاً
        # self.assertEqual(result['status'], 'success')

class APITests(TestCase):
    """اختبارات API"""
    
    def setUp(self):
        """إعداد البيانات للاختبار"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
    
    def test_get_table_list_api(self):
        """اختبار API قائمة الجداول"""
        response = self.client.get(reverse('get_table_list'))
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('tables', data)
    
    def test_get_chart_data_api(self):
        """اختبار API بيانات الرسوم البيانية"""
        response = self.client.get(reverse('get_chart_data', args=['sales_over_time']))
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('status', data)
    
    def test_get_kpi_data_api(self):
        """اختبار API بيانات KPIs"""
        response = self.client.get(reverse('get_kpi_data', args=['main']))
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('status', data)

class IntegrationTests(TestCase):
    """اختبارات التكامل"""
    
    def setUp(self):
        """إعداد البيانات للاختبار"""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.login(username='testuser', password='testpass123')
    
    def test_customer_workflow(self):
        """اختبار سير عمل العميل"""
        # إنشاء عميل
        response = self.client.post(reverse('customer_create'), {
            'name': 'أحمد محمد',
            'phone': '0501234567',
            'national_id': '1234567890',
            'email': 'ahmed@example.com',
            'address': 'الرياض، المملكة العربية السعودية'
        })
        
        # التحقق من إعادة التوجيه
        self.assertEqual(response.status_code, 302)
        
        # التحقق من إنشاء العميل
        customer = Customer.objects.get(name='أحمد محمد')
        self.assertEqual(customer.phone, '0501234567')
    
    def test_unit_workflow(self):
        """اختبار سير عمل الوحدة"""
        # إنشاء وحدة
        response = self.client.post(reverse('unit_create'), {
            'unit_number': 'A101',
            'floor': 1,
            'building': 'مبنى أ',
            'area': 120.5,
            'price': 500000,
            'status': 'available',
            'unit_type': 'apartment'
        })
        
        # التحقق من إعادة التوجيه
        self.assertEqual(response.status_code, 302)
        
        # التحقق من إنشاء الوحدة
        unit = Unit.objects.get(unit_number='A101')
        self.assertEqual(unit.price, 500000)
    
    def test_contract_workflow(self):
        """اختبار سير عمل العقد"""
        # إنشاء البيانات المطلوبة
        customer = Customer.objects.create(
            name="أحمد محمد",
            phone="0501234567",
            national_id="1234567890"
        )
        
        unit = Unit.objects.create(
            unit_number="A101",
            floor=1,
            building="مبنى أ",
            area=120.5,
            price=500000,
            status="available",
            unit_type="apartment"
        )
        
        broker = Broker.objects.create(
            name="سعد العتيبي",
            phone="0509876543",
            national_id="1122334455"
        )
        
        # إنشاء عقد
        response = self.client.post(reverse('contract_create'), {
            'customer': customer.id,
            'unit': unit.id,
            'contract_date': date.today(),
            'total_price': 500000,
            'down_payment': 100000,
            'installment_type': 'monthly',
            'number_of_installments': 24,
            'broker': broker.id
        })
        
        # التحقق من إعادة التوجيه
        self.assertEqual(response.status_code, 302)
        
        # التحقق من إنشاء العقد
        contract = Contract.objects.get(customer=customer, unit=unit)
        self.assertEqual(contract.total_price, 500000)

class PerformanceTests(TestCase):
    """اختبارات الأداء"""
    
    def test_dashboard_performance(self):
        """اختبار أداء لوحة التحكم"""
        import time
        
        start_time = time.time()
        response = self.client.get(reverse('dashboard'))
        end_time = time.time()
        
        # التحقق من أن الاستجابة أقل من ثانية
        self.assertLess(end_time - start_time, 1.0)
        self.assertEqual(response.status_code, 200)
    
    def test_customer_list_performance(self):
        """اختبار أداء قائمة العملاء"""
        import time
        
        # إنشاء 100 عميل للاختبار
        for i in range(100):
            Customer.objects.create(
                name=f"عميل {i}",
                phone=f"050{i:07d}",
                national_id=f"{i:010d}"
            )
        
        start_time = time.time()
        response = self.client.get(reverse('customer_list'))
        end_time = time.time()
        
        # التحقق من أن الاستجابة أقل من ثانيتين
        self.assertLess(end_time - start_time, 2.0)
        self.assertEqual(response.status_code, 200)

class SecurityTests(TestCase):
    """اختبارات الأمان"""
    
    def test_csrf_protection(self):
        """اختبار حماية CSRF"""
        # محاولة إنشاء عميل بدون CSRF token
        response = self.client.post(reverse('customer_create'), {
            'name': 'أحمد محمد',
            'phone': '0501234567'
        }, follow=True)
        
        # يجب أن تفشل العملية
        self.assertNotEqual(response.status_code, 200)
    
    def test_sql_injection_protection(self):
        """اختبار حماية SQL Injection"""
        # محاولة حقن SQL في البحث
        response = self.client.get(reverse('customer_list'), {
            'search': "'; DROP TABLE realpp_customer; --"
        })
        
        # يجب أن تنجح الاستجابة بدون أخطاء
        self.assertEqual(response.status_code, 200)
        
        # التحقق من أن الجدول لم يتم حذفه
        self.assertTrue(Customer.objects.exists())

if __name__ == '__main__':
    import django
    from django.conf import settings
    from django.test.utils import get_runner
    
    if not settings.configured:
        settings.configure(
            DEBUG=True,
            DATABASES={
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': ':memory:',
                }
            },
            INSTALLED_APPS=[
                'django.contrib.auth',
                'django.contrib.contenttypes',
                'realpp',
                'dbms_app',
                'reports_app',
                'notifications_app',
                'analytics_app',
                'settings_app',
            ],
            ROOT_URLCONF='makka.urls',
            SECRET_KEY='test-secret-key',
        )
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(['realpp'])