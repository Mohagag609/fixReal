"""
Django management command to set up the database with initial data.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from datetime import date

from realpp.models import (
    Customer, Unit, Contract, Installment, Safe, Transfer,
    Broker, Partner, PartnerDebt, AuditLog, Settings, KeyVal
)


class Command(BaseCommand):
    """Set up database with initial data."""
    
    help = 'Set up the database with initial data for testing and development'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--sample-data',
            action='store_true',
            help='Create sample data for testing',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all data before creating new data',
        )
    
    def handle(self, *args, **options):
        """Handle the command."""
        self.stdout.write('Setting up database...')
        
        if options['reset']:
            self.reset_data()
        
        if options['sample_data']:
            self.create_sample_data()
        
        self.create_initial_settings()
        
        self.stdout.write(
            self.style.SUCCESS('Database setup completed successfully!')
        )
    
    def reset_data(self):
        """Reset all data."""
        self.stdout.write('Resetting all data...')
        
        # Delete all data in reverse order of dependencies
        Installment.objects.all().delete()
        Contract.objects.all().delete()
        Unit.objects.all().delete()
        Customer.objects.all().delete()
        Transfer.objects.all().delete()
        Safe.objects.all().delete()
        Broker.objects.all().delete()
        Partner.objects.all().delete()
        PartnerDebt.objects.all().delete()
        AuditLog.objects.all().delete()
        Settings.objects.all().delete()
        KeyVal.objects.all().delete()
        
        self.stdout.write('All data reset.')
    
    def create_sample_data(self):
        """Create sample data for testing."""
        self.stdout.write('Creating sample data...')
        
        with transaction.atomic():
            # Create customers
            customers = self.create_customers()
            
            # Create units
            units = self.create_units()
            
            # Create contracts
            contracts = self.create_contracts(customers, units)
            
            # Create installments
            self.create_installments(contracts)
            
            # Create safes
            safes = self.create_safes()
            
            # Create transfers
            self.create_transfers(safes)
            
            # Create brokers
            brokers = self.create_brokers()
            
            # Create partners
            partners = self.create_partners()
            
            # Create partner debts
            self.create_partner_debts(partners)
        
        self.stdout.write('Sample data created successfully!')
    
    def create_customers(self):
        """Create sample customers."""
        customers_data = [
            {
                'name': 'أحمد محمد العلي',
                'customer_type': 'individual',
                'phone': '+966501234567',
                'email': 'ahmed.ali@example.com',
                'national_id': '1234567890',
                'city': 'الرياض',
                'district': 'النخيل',
                'address': 'شارع الملك فهد، حي النخيل',
                'occupation': 'مهندس',
                'workplace': 'شركة التقنية المتقدمة'
            },
            {
                'name': 'فاطمة أحمد السعيد',
                'customer_type': 'individual',
                'phone': '+966501234568',
                'email': 'fatima.saeed@example.com',
                'national_id': '1234567891',
                'city': 'جدة',
                'district': 'الزهراء',
                'address': 'شارع التحلية، حي الزهراء',
                'occupation': 'طبيبة',
                'workplace': 'مستشفى الملك فهد'
            },
            {
                'name': 'شركة العقارات المتميزة',
                'customer_type': 'company',
                'phone': '+966501234569',
                'email': 'info@realestate.com',
                'national_id': '1234567892',
                'city': 'الدمام',
                'district': 'الخبر',
                'address': 'شارع الملك عبدالعزيز، حي الخبر',
                'occupation': 'شركة عقارية',
                'workplace': 'مكتب الشركة الرئيسي'
            }
        ]
        
        customers = []
        for data in customers_data:
            customer = Customer.objects.create(**data)
            customers.append(customer)
        
        self.stdout.write(f'Created {len(customers)} customers')
        return customers
    
    def create_units(self):
        """Create sample units."""
        units_data = [
            {
                'unit_number': 'A101',
                'unit_type': 'apartment',
                'floor': 1,
                'building': 'A',
                'area': Decimal('120.5'),
                'rooms': 3,
                'bathrooms': 2,
                'price': Decimal('500000.00'),
                'discount': Decimal('50000.00'),
                'status': 'sold',
                'has_balcony': True,
                'has_parking': True,
                'has_elevator': True,
                'has_garden': False,
                'description': 'شقة مكونة من 3 غرف وصالتين وحمامين مع شرفة وموقف سيارات'
            },
            {
                'unit_number': 'A102',
                'unit_type': 'apartment',
                'floor': 1,
                'building': 'A',
                'area': Decimal('100.0'),
                'rooms': 2,
                'bathrooms': 2,
                'price': Decimal('400000.00'),
                'discount': Decimal('0.00'),
                'status': 'available',
                'has_balcony': True,
                'has_parking': False,
                'has_elevator': True,
                'has_garden': False,
                'description': 'شقة مكونة من غرفتين وصالتين وحمامين مع شرفة'
            },
            {
                'unit_number': 'B201',
                'unit_type': 'villa',
                'floor': 0,
                'building': 'B',
                'area': Decimal('250.0'),
                'rooms': 4,
                'bathrooms': 3,
                'price': Decimal('800000.00'),
                'discount': Decimal('100000.00'),
                'status': 'reserved',
                'has_balcony': True,
                'has_parking': True,
                'has_elevator': False,
                'has_garden': True,
                'description': 'فيلا مكونة من 4 غرف وصالتين و3 حمامات مع حديقة وموقف سيارات'
            },
            {
                'unit_number': 'C301',
                'unit_type': 'office',
                'floor': 3,
                'building': 'C',
                'area': Decimal('80.0'),
                'rooms': 1,
                'bathrooms': 1,
                'price': Decimal('300000.00'),
                'discount': Decimal('0.00'),
                'status': 'available',
                'has_balcony': False,
                'has_parking': True,
                'has_elevator': True,
                'has_garden': False,
                'description': 'مكتب مكون من غرفة واحدة وحمام مع موقف سيارات'
            }
        ]
        
        units = []
        for data in units_data:
            unit = Unit.objects.create(**data)
            units.append(unit)
        
        self.stdout.write(f'Created {len(units)} units')
        return units
    
    def create_contracts(self, customers, units):
        """Create sample contracts."""
        contracts_data = [
            {
                'contract_number': 'C2024001',
                'customer': customers[0],
                'unit': units[0],
                'total_price': Decimal('500000.00'),
                'discount': Decimal('50000.00'),
                'final_price': Decimal('450000.00'),
                'down_payment': Decimal('100000.00'),
                'down_payment_percentage': Decimal('22.22'),
                'installment_type': 'monthly',
                'installment_count': 24,
                'installment_amount': Decimal('14583.33'),
                'installment_start_date': date(2024, 2, 1),
                'status': 'active',
                'notes': 'عقد بيع شقة في المبنى أ'
            },
            {
                'contract_number': 'C2024002',
                'customer': customers[1],
                'unit': units[2],
                'total_price': Decimal('800000.00'),
                'discount': Decimal('100000.00'),
                'final_price': Decimal('700000.00'),
                'down_payment': Decimal('200000.00'),
                'down_payment_percentage': Decimal('28.57'),
                'installment_type': 'quarterly',
                'installment_count': 12,
                'installment_amount': Decimal('41666.67'),
                'installment_start_date': date(2024, 3, 1),
                'status': 'active',
                'notes': 'عقد بيع فيلا في المبنى ب'
            }
        ]
        
        contracts = []
        for data in contracts_data:
            contract = Contract.objects.create(**data)
            contracts.append(contract)
        
        self.stdout.write(f'Created {len(contracts)} contracts')
        return contracts
    
    def create_installments(self, contracts):
        """Create sample installments."""
        installments_data = []
        
        for contract in contracts:
            for i in range(1, min(contract.installment_count + 1, 6)):  # Create first 5 installments
                due_date = contract.installment_start_date
                if contract.installment_type == 'monthly':
                    due_date = due_date.replace(month=due_date.month + i - 1)
                elif contract.installment_type == 'quarterly':
                    due_date = due_date.replace(month=due_date.month + (i - 1) * 3)
                
                status = 'paid' if i <= 2 else 'pending'
                paid_date = due_date if status == 'paid' else None
                paid_amount = contract.installment_amount if status == 'paid' else Decimal('0.00')
                
                installments_data.append({
                    'contract': contract,
                    'installment_number': i,
                    'amount': contract.installment_amount,
                    'due_date': due_date,
                    'paid_date': paid_date,
                    'paid_amount': paid_amount,
                    'status': status,
                    'notes': f'القسط رقم {i}'
                })
        
        for data in installments_data:
            Installment.objects.create(**data)
        
        self.stdout.write(f'Created {len(installments_data)} installments')
    
    def create_safes(self):
        """Create sample safes."""
        safes_data = [
            {
                'name': 'الخزينة الرئيسية',
                'description': 'خزينة المبيعات الرئيسية',
                'max_balance': Decimal('1000000.00'),
                'is_active': True
            },
            {
                'name': 'خزينة الطوارئ',
                'description': 'خزينة الطوارئ والاحتياطي',
                'max_balance': Decimal('500000.00'),
                'is_active': True
            },
            {
                'name': 'خزينة الأقساط',
                'description': 'خزينة تحصيل الأقساط',
                'max_balance': Decimal('2000000.00'),
                'is_active': True
            }
        ]
        
        safes = []
        for data in safes_data:
            safe = Safe.objects.create(**data)
            safes.append(safe)
        
        self.stdout.write(f'Created {len(safes)} safes')
        return safes
    
    def create_transfers(self, safes):
        """Create sample transfers."""
        transfers_data = [
            {
                'from_safe': safes[0],
                'to_safe': safes[1],
                'amount': Decimal('50000.00'),
                'status': 'completed',
                'notes': 'تحويل للخزينة الاحتياطية'
            },
            {
                'from_safe': safes[1],
                'to_safe': safes[2],
                'amount': Decimal('30000.00'),
                'status': 'completed',
                'notes': 'تحويل لخزينة الأقساط'
            }
        ]
        
        for data in transfers_data:
            Transfer.objects.create(**data)
        
        self.stdout.write(f'Created {len(transfers_data)} transfers')
    
    def create_brokers(self):
        """Create sample brokers."""
        brokers_data = [
            {
                'name': 'محمد الوسيط',
                'phone': '+966501234570',
                'email': 'mohamed.broker@example.com',
                'commission_rate': Decimal('2.5'),
                'is_active': True
            },
            {
                'name': 'علي الوسيط',
                'phone': '+966501234571',
                'email': 'ali.broker@example.com',
                'commission_rate': Decimal('3.0'),
                'is_active': True
            }
        ]
        
        brokers = []
        for data in brokers_data:
            broker = Broker.objects.create(**data)
            brokers.append(broker)
        
        self.stdout.write(f'Created {len(brokers)} brokers')
        return brokers
    
    def create_partners(self):
        """Create sample partners."""
        partners_data = [
            {
                'name': 'شركة الشريك الأول',
                'phone': '+966501234572',
                'email': 'partner1@example.com',
                'is_active': True
            },
            {
                'name': 'شركة الشريك الثاني',
                'phone': '+966501234573',
                'email': 'partner2@example.com',
                'is_active': True
            }
        ]
        
        partners = []
        for data in partners_data:
            partner = Partner.objects.create(**data)
            partners.append(partner)
        
        self.stdout.write(f'Created {len(partners)} partners')
        return partners
    
    def create_partner_debts(self, partners):
        """Create sample partner debts."""
        debts_data = [
            {
                'partner': partners[0],
                'amount': Decimal('100000.00'),
                'due_date': date(2024, 12, 31),
                'status': 'pending',
                'notes': 'دين الشريك الأول'
            },
            {
                'partner': partners[1],
                'amount': Decimal('150000.00'),
                'due_date': date(2024, 11, 30),
                'status': 'pending',
                'notes': 'دين الشريك الثاني'
            }
        ]
        
        for data in debts_data:
            PartnerDebt.objects.create(**data)
        
        self.stdout.write(f'Created {len(debts_data)} partner debts')
    
    def create_initial_settings(self):
        """Create initial system settings."""
        settings_data = [
            {
                'key': 'company_name',
                'value': 'مكة العقارية',
                'description': 'اسم الشركة'
            },
            {
                'key': 'company_phone',
                'value': '+966501234567',
                'description': 'هاتف الشركة'
            },
            {
                'key': 'company_email',
                'value': 'info@makka.com',
                'description': 'بريد الشركة الإلكتروني'
            },
            {
                'key': 'default_currency',
                'value': 'SAR',
                'description': 'العملة الافتراضية'
            },
            {
                'key': 'default_installment_type',
                'value': 'monthly',
                'description': 'نوع التقسيط الافتراضي'
            },
            {
                'key': 'default_commission_rate',
                'value': '2.5',
                'description': 'نسبة العمولة الافتراضية'
            }
        ]
        
        for data in settings_data:
            Settings.objects.get_or_create(
                key=data['key'],
                defaults={
                    'value': data['value'],
                    'description': data['description']
                }
            )
        
        self.stdout.write('Initial settings created')