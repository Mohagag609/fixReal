from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class BaseModel(models.Model):
    """Base model with common fields"""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")
    
    class Meta:
        abstract = True


class Customer(BaseModel):
    """العملاء"""
    name = models.CharField(max_length=255, verbose_name="الاسم")
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="رقم الهاتف")
    national_id = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="الرقم القومي")
    address = models.TextField(null=True, blank=True, verbose_name="العنوان")
    status = models.CharField(max_length=50, default="نشط", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "عميل"
        verbose_name_plural = "العملاء"
        indexes = [
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['name']),
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]
    
    def get_contracts(self):
        """الحصول على العقود المرتبطة بالعميل"""
        return self.contracts.filter(deleted_at__isnull=True)
    
    def get_total_contracts(self):
        """حساب إجمالي عدد العقود"""
        return self.get_contracts().count()
    
    def get_total_investment(self):
        """حساب إجمالي الاستثمار"""
        return self.get_contracts().aggregate(
            total=models.Sum('total_price')
        )['total'] or 0
    
    def get_total_down_payment(self):
        """حساب إجمالي المقدم"""
        return self.get_contracts().aggregate(
            total=models.Sum('down_payment')
        )['total'] or 0
    
    def get_total_discount(self):
        """حساب إجمالي الخصم"""
        return self.get_contracts().aggregate(
            total=models.Sum('discount_amount')
        )['total'] or 0
    
    def get_units(self):
        """الحصول على الوحدات المرتبطة بالعميل"""
        return Unit.objects.filter(
            contracts__customer=self,
            contracts__deleted_at__isnull=True
        ).distinct()
    
    def get_total_units(self):
        """حساب إجمالي عدد الوحدات"""
        return self.get_units().count()
    
    def __str__(self):
        return self.name


class Unit(BaseModel):
    """الوحدات العقارية"""
    UNIT_TYPE_CHOICES = [
        ('سكني', 'سكني'),
        ('تجاري', 'تجاري'),
        ('إداري', 'إداري'),
        ('صناعي', 'صناعي'),
    ]
    
    STATUS_CHOICES = [
        ('متاحة', 'متاحة'),
        ('محجوزة', 'محجوزة'),
        ('مباعة', 'مباعة'),
    ]
    
    code = models.CharField(max_length=100, unique=True, verbose_name="كود الوحدة")
    name = models.CharField(max_length=255, null=True, blank=True, verbose_name="اسم الوحدة")
    unit_type = models.CharField(max_length=50, choices=UNIT_TYPE_CHOICES, default="سكني", verbose_name="نوع الوحدة")
    area = models.CharField(max_length=100, null=True, blank=True, verbose_name="المساحة")
    floor = models.CharField(max_length=50, null=True, blank=True, verbose_name="الطابق")
    building = models.CharField(max_length=100, null=True, blank=True, verbose_name="المبنى")
    total_price = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="السعر الإجمالي")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="متاحة", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "وحدة"
        verbose_name_plural = "الوحدات"
        indexes = [
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['unit_type', 'deleted_at']),
            models.Index(fields=['total_price']),
            models.Index(fields=['created_at']),
            models.Index(fields=['code']),
        ]
    
    def save(self, *args, **kwargs):
        # توليد كود الوحدة تلقائياً إذا لم يكن موجوداً
        if not self.code:
            self.code = self.generate_unit_code()
        super().save(*args, **kwargs)
    
    def generate_unit_code(self):
        """توليد كود الوحدة تلقائياً"""
        from django.db.models import Max
        # البحث عن آخر كود
        last_unit = Unit.objects.filter(
            code__startswith=f"{self.unit_type}-"
        ).aggregate(max_code=Max('code'))
        
        if last_unit['max_code']:
            # استخراج الرقم من آخر كود
            try:
                last_number = int(last_unit['max_code'].split('-')[-1])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1
        
        return f"{self.unit_type}-{new_number:04d}"
    
    def get_total_partner_percentage(self):
        """حساب إجمالي نسبة الشركاء"""
        total = self.unit_partners.filter(deleted_at__isnull=True).aggregate(
            total=models.Sum('percentage')
        )['total'] or 0
        return total
    
    def validate_partner_percentages(self):
        """التحقق من صحة نسب الشركاء"""
        total = self.get_total_partner_percentage()
        return abs(total - 100) < 0.01  # السماح بفروق صغيرة
    
    def get_contract(self):
        """الحصول على العقد المرتبط بالوحدة"""
        return self.contracts.filter(deleted_at__isnull=True).first()
    
    def is_available(self):
        """التحقق من توفر الوحدة"""
        return self.status == 'متاحة' and not self.get_contract()
    
    def __str__(self):
        return f"{self.code} - {self.name or 'بدون اسم'}"


class Partner(BaseModel):
    """الشركاء"""
    name = models.CharField(max_length=255, verbose_name="الاسم")
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="رقم الهاتف")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "شريك"
        verbose_name_plural = "الشركاء"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['phone']),
            models.Index(fields=['deleted_at']),
        ]
    
    def get_total_debt(self):
        """حساب إجمالي ديون الشريك"""
        return self.partner_debts.filter(
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_paid_debt(self):
        """حساب إجمالي الديون المدفوعة"""
        return self.partner_debts.filter(
            status='مدفوع',
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_pending_debt(self):
        """حساب إجمالي الديون المعلقة"""
        return self.partner_debts.filter(
            status='معلق',
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_units(self):
        """الحصول على الوحدات المرتبطة بالشريك"""
        return Unit.objects.filter(
            unit_partners__partner=self,
            unit_partners__deleted_at__isnull=True
        ).distinct()
    
    def get_total_units(self):
        """حساب إجمالي عدد الوحدات"""
        return self.get_units().count()
    
    def get_total_investment(self):
        """حساب إجمالي الاستثمار"""
        total = 0
        for unit in self.get_units():
            unit_partner = unit.unit_partners.filter(
                partner=self,
                deleted_at__isnull=True
            ).first()
            if unit_partner:
                total += (unit.total_price * unit_partner.percentage) / 100
        return total
    
    def get_daily_income(self, date):
        """حساب الدخل اليومي"""
        return self.daily_transactions.filter(
            transaction_type='income',
            transaction_date=date,
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_daily_expense(self, date):
        """حساب المصروف اليومي"""
        return self.daily_transactions.filter(
            transaction_type='expense',
            transaction_date=date,
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_daily_balance(self, date):
        """حساب الرصيد اليومي"""
        income = self.get_daily_income(date)
        expense = self.get_daily_expense(date)
        return income - expense
    
    def get_running_balance(self, date):
        """حساب الرصيد المتراكم حتى تاريخ معين"""
        transactions = self.daily_transactions.filter(
            transaction_date__lte=date,
            deleted_at__isnull=True
        ).order_by('transaction_date', 'created_at')
        
        balance = 0
        for transaction in transactions:
            if transaction.transaction_type == 'income':
                balance += transaction.amount
            elif transaction.transaction_type == 'expense':
                balance -= transaction.amount
        
        return balance
    
    def generate_daily_ledger(self, start_date, end_date):
        """توليد كشف الحساب اليومي"""
        from django.db.models import Sum, Count
        from datetime import timedelta
        
        current_date = start_date
        ledgers = []
        
        while current_date <= end_date:
            daily_income = self.get_daily_income(current_date)
            daily_expense = self.get_daily_expense(current_date)
            transaction_count = self.daily_transactions.filter(
                transaction_date=current_date,
                deleted_at__isnull=True
            ).count()
            
            # إنشاء أو تحديث كشف الحساب اليومي
            ledger, created = PartnerLedger.objects.get_or_create(
                partner=self,
                date=current_date,
                defaults={
                    'total_income': daily_income,
                    'total_expense': daily_expense,
                    'transaction_count': transaction_count
                }
            )
            
            if not created:
                ledger.total_income = daily_income
                ledger.total_expense = daily_expense
                ledger.transaction_count = transaction_count
                ledger.save()
            
            ledgers.append(ledger)
            current_date += timedelta(days=1)
        
        return ledgers
    
    def get_monthly_summary(self, year, month):
        """حساب ملخص شهري"""
        from django.db.models import Sum
        from datetime import date
        
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        transactions = self.daily_transactions.filter(
            transaction_date__range=[start_date, end_date],
            deleted_at__isnull=True
        )
        
        total_income = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_expense = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_balance': total_income - total_expense,
            'transaction_count': transactions.count()
        }
    
    def __str__(self):
        return self.name


class UnitPartner(BaseModel):
    """ربط الوحدات بالشركاء"""
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='unit_partners', verbose_name="الوحدة")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='unit_partners', verbose_name="الشريك")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='unit_partners', null=True, blank=True, verbose_name="العقد")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="النسبة المئوية")
    
    class Meta:
        verbose_name = "شريك وحدة"
        verbose_name_plural = "شركاء الوحدات"
        unique_together = ['unit', 'partner']
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['partner', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
        ]
    
    def __str__(self):
        return f"{self.unit.code} - {self.partner.name} ({self.percentage}%)"


class Contract(BaseModel):
    """العقود"""
    PAYMENT_TYPE_CHOICES = [
        ('installment', 'تقسيط'),
        ('cash', 'كاش'),
    ]
    
    INSTALLMENT_TYPE_CHOICES = [
        ('شهري', 'شهري'),
        ('ربع سنوي', 'ربع سنوي'),
        ('نصف سنوي', 'نصف سنوي'),
        ('سنوي', 'سنوي'),
    ]
    
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='contracts', verbose_name="الوحدة")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contracts', verbose_name="العميل")
    start = models.DateTimeField(verbose_name="تاريخ البدء")
    total_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="السعر الإجمالي")
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="مبلغ الخصم")
    broker_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="اسم السمسار")
    broker_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="نسبة العمولة")
    broker_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="مبلغ العمولة")
    commission_safe_id = models.CharField(max_length=100, null=True, blank=True, verbose_name="خزنة العمولة")
    down_payment_safe_id = models.CharField(max_length=100, null=True, blank=True, verbose_name="خزنة المقدم")
    maintenance_deposit = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="وديعة الصيانة")
    installment_type = models.CharField(max_length=50, choices=INSTALLMENT_TYPE_CHOICES, default="شهري", verbose_name="نوع الأقساط")
    installment_count = models.PositiveIntegerField(default=0, verbose_name="عدد الأقساط")
    extra_annual = models.PositiveIntegerField(default=0, verbose_name="الدفعات السنوية الإضافية")
    annual_payment_value = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="قيمة الدفعة السنوية")
    down_payment = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="المقدم")
    payment_type = models.CharField(max_length=50, choices=PAYMENT_TYPE_CHOICES, default="installment", verbose_name="نوع الدفع")
    
    class Meta:
        verbose_name = "عقد"
        verbose_name_plural = "العقود"
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['customer', 'deleted_at']),
            models.Index(fields=['start']),
            models.Index(fields=['total_price']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # حساب مبلغ السمسار تلقائياً
        if self.broker_percent and self.total_price:
            self.broker_amount = (self.total_price * self.broker_percent) / 100
        super().save(*args, **kwargs)
    
    def get_total_installments(self):
        """حساب إجمالي عدد الأقساط"""
        return self.installment_count + self.extra_annual
    
    def get_installment_base_amount(self):
        """حساب المبلغ الأساسي للأقساط"""
        return self.total_price - self.maintenance_deposit
    
    def get_total_after_discount_and_down_payment(self):
        """حساب المبلغ المتبقي بعد الخصم والمقدم"""
        base = self.get_installment_base_amount()
        return base - self.discount_amount - self.down_payment
    
    def get_annual_payments_total(self):
        """حساب إجمالي الدفعات السنوية"""
        return self.extra_annual * self.annual_payment_value
    
    def get_remaining_after_annual_payments(self):
        """حساب المبلغ المتبقي بعد الدفعات السنوية"""
        total_after_discount = self.get_total_after_discount_and_down_payment()
        annual_total = self.get_annual_payments_total()
        return total_after_discount - annual_total
    
    def get_regular_installment_amount(self):
        """حساب مبلغ القسط العادي"""
        remaining = self.get_remaining_after_annual_payments()
        if self.installment_count > 0:
            return remaining / self.installment_count
        return Decimal('0.00')
    
    def __str__(self):
        return f"عقد {self.unit.code} - {self.customer.name}"


class Installment(BaseModel):
    """الأقساط"""
    STATUS_CHOICES = [
        ('معلق', 'معلق'),
        ('مدفوع', 'مدفوع'),
        ('متأخر', 'متأخر'),
    ]
    
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='installments', verbose_name="الوحدة")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='installments', null=True, blank=True, verbose_name="العقد")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "قسط"
        verbose_name_plural = "الأقساط"
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['due_date']),
            models.Index(fields=['amount']),
        ]
    
    def save(self, *args, **kwargs):
        # التحقق من صحة البيانات
        if self.amount <= 0:
            raise ValueError("مبلغ القسط يجب أن يكون أكبر من صفر")
        super().save(*args, **kwargs)
    
    def mark_as_paid(self):
        """تحديد القسط كمُدفوع"""
        self.status = 'مدفوع'
        self.save(update_fields=['status'])
    
    def mark_as_unpaid(self):
        """تحديد القسط كغير مدفوع"""
        self.status = 'غير مدفوع'
        self.save(update_fields=['status'])
    
    def is_overdue(self):
        """التحقق من تأخر القسط"""
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.status != 'مدفوع'
    
    def get_days_overdue(self):
        """حساب عدد أيام التأخير"""
        if self.is_overdue():
            from django.utils import timezone
            return (timezone.now().date() - self.due_date).days
        return 0
    
    def get_contract(self):
        """الحصول على العقد المرتبط بالوحدة"""
        return self.unit.get_contract()
    
    def __str__(self):
        return f"قسط {self.unit.code} - {self.amount} ({self.due_date.strftime('%Y-%m-%d')})"


class PartnerDebt(BaseModel):
    """ديون الشركاء"""
    STATUS_CHOICES = [
        ('معلق', 'معلق'),
        ('مدفوع', 'مدفوع'),
        ('متأخر', 'متأخر'),
    ]
    
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='partner_debts', verbose_name="الشريك")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='partner_debts', null=True, blank=True, verbose_name="العقد")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "دين شريك"
        verbose_name_plural = "ديون الشركاء"
        indexes = [
            models.Index(fields=['partner', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['due_date']),
        ]
    
    def save(self, *args, **kwargs):
        # التحقق من صحة البيانات
        if self.amount <= 0:
            raise ValueError("مبلغ الدين يجب أن يكون أكبر من صفر")
        super().save(*args, **kwargs)
    
    def mark_as_paid(self):
        """تحديد الدين كمُدفوع"""
        self.status = 'مدفوع'
        self.save(update_fields=['status'])
    
    def mark_as_unpaid(self):
        """تحديد الدين كغير مدفوع"""
        self.status = 'معلق'
        self.save(update_fields=['status'])
    
    def is_overdue(self):
        """التحقق من تأخر الدين"""
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.status != 'مدفوع'
    
    def get_days_overdue(self):
        """حساب عدد أيام التأخير"""
        if self.is_overdue():
            from django.utils import timezone
            return (timezone.now().date() - self.due_date).days
        return 0
    
    def __str__(self):
        return f"دين {self.partner.name} - {self.amount}"


class Safe(BaseModel):
    """الخزائن"""
    name = models.CharField(max_length=255, unique=True, verbose_name="اسم الخزنة")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="الرصيد")
    
    class Meta:
        verbose_name = "خزنة"
        verbose_name_plural = "الخزائن"
    
    def save(self, *args, **kwargs):
        # التحقق من صحة البيانات
        if self.balance < 0:
            raise ValueError("رصيد الخزنة لا يمكن أن يكون سالباً")
        super().save(*args, **kwargs)
    
    def get_total_receipts(self):
        """حساب إجمالي الإيصالات"""
        return self.vouchers.filter(
            type='receipt',
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_total_payments(self):
        """حساب إجمالي المدفوعات"""
        return self.vouchers.filter(
            type='payment',
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_transfers_in(self):
        """حساب إجمالي التحويلات الواردة"""
        return self.transfers_to.filter(
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_transfers_out(self):
        """حساب إجمالي التحويلات الصادرة"""
        return self.transfers_from.filter(
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def calculate_balance(self):
        """حساب الرصيد بناءً على المعاملات"""
        receipts = self.get_total_receipts()
        payments = self.get_total_payments()
        transfers_in = self.get_transfers_in()
        transfers_out = self.get_transfers_out()
        
        return receipts - payments + transfers_in - transfers_out
    
    def update_balance(self):
        """تحديث الرصيد بناءً على المعاملات"""
        self.balance = self.calculate_balance()
        self.save(update_fields=['balance'])
    
    def can_transfer(self, amount):
        """التحقق من إمكانية التحويل"""
        return self.balance >= amount
    
    def __str__(self):
        return f"{self.name} - {self.balance}"


class Transfer(BaseModel):
    """التحويلات بين الخزائن"""
    from_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_from', verbose_name="من خزنة")
    to_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_to', verbose_name="إلى خزنة")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='transfers', null=True, blank=True, verbose_name="العقد")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    description = models.TextField(null=True, blank=True, verbose_name="الوصف")
    
    class Meta:
        verbose_name = "تحويل"
        verbose_name_plural = "التحويلات"
        indexes = [
            models.Index(fields=['from_safe', 'deleted_at']),
            models.Index(fields=['to_safe', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # تحديث رصيدي الخزنين عند حفظ التحويل
        super().save(*args, **kwargs)
        self.update_safe_balances()
    
    def update_safe_balances(self):
        """تحديث رصيدي الخزنين"""
        if self.from_safe and self.to_safe:
            # تقليل رصيد الخزنة المصدر
            self.from_safe.balance -= self.amount
            self.from_safe.save(update_fields=['balance'])
            
            # زيادة رصيد الخزنة الهدف
            self.to_safe.balance += self.amount
            self.to_safe.save(update_fields=['balance'])
    
    def delete(self, *args, **kwargs):
        # إعادة حساب رصيدي الخزنين عند الحذف
        if self.from_safe and self.to_safe:
            # عكس العملية
            self.from_safe.balance += self.amount
            self.from_safe.save(update_fields=['balance'])
            
            self.to_safe.balance -= self.amount
            self.to_safe.save(update_fields=['balance'])
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"تحويل من {self.from_safe.name} إلى {self.to_safe.name} - {self.amount}"


class Voucher(BaseModel):
    """السندات"""
    TYPE_CHOICES = [
        ('receipt', 'سند قبض'),
        ('payment', 'سند دفع'),
    ]
    
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name="نوع السند")
    date = models.DateTimeField(verbose_name="التاريخ")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='vouchers', verbose_name="الخزنة")
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='vouchers', null=True, blank=True, verbose_name="الوحدة")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='vouchers', null=True, blank=True, verbose_name="العقد")
    description = models.TextField(verbose_name="الوصف")
    payer = models.CharField(max_length=255, null=True, blank=True, verbose_name="المدفوع له")
    beneficiary = models.CharField(max_length=255, null=True, blank=True, verbose_name="المستفيد")
    linked_ref = models.CharField(max_length=100, null=True, blank=True, verbose_name="المرجع المرتبط")
    
    class Meta:
        verbose_name = "سند"
        verbose_name_plural = "السندات"
        indexes = [
            models.Index(fields=['type', 'deleted_at']),
            models.Index(fields=['date']),
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
        ]
    
    def save(self, *args, **kwargs):
        # تحديث رصيد الخزنة عند حفظ السند
        super().save(*args, **kwargs)
        self.update_safe_balance()
    
    def update_safe_balance(self):
        """تحديث رصيد الخزنة"""
        if self.safe:
            # حساب التغيير في الرصيد
            balance_change = self.amount if self.type == 'receipt' else -self.amount
            # تحديث الرصيد
            self.safe.balance += balance_change
            self.safe.save(update_fields=['balance'])
    
    def delete(self, *args, **kwargs):
        # إعادة حساب رصيد الخزنة عند الحذف
        if self.safe:
            # عكس التغيير في الرصيد
            balance_change = -self.amount if self.type == 'receipt' else self.amount
            self.safe.balance += balance_change
            self.safe.save(update_fields=['balance'])
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.amount} ({self.date.strftime('%Y-%m-%d')})"


class Broker(BaseModel):
    """السماسرة"""
    name = models.CharField(max_length=255, unique=True, verbose_name="الاسم")
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="رقم الهاتف")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "سمسار"
        verbose_name_plural = "السماسرة"
    
    def get_total_due(self):
        """حساب إجمالي ديون السمسار"""
        return self.broker_dues.filter(
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_paid_due(self):
        """حساب إجمالي الديون المدفوعة"""
        return self.broker_dues.filter(
            status='مدفوع',
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_pending_due(self):
        """حساب إجمالي الديون المعلقة"""
        return self.broker_dues.filter(
            status='معلق',
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('amount'))['total'] or 0
    
    def get_contracts(self):
        """الحصول على العقود المرتبطة بالسمسار"""
        return Contract.objects.filter(
            broker_name=self.name,
            deleted_at__isnull=True
        )
    
    def get_total_contracts(self):
        """حساب إجمالي عدد العقود"""
        return self.get_contracts().count()
    
    def get_total_commission(self):
        """حساب إجمالي العمولة"""
        return self.get_contracts().aggregate(
            total=models.Sum('broker_amount')
        )['total'] or 0
    
    def __str__(self):
        return self.name


class BrokerDue(BaseModel):
    """ديون السماسرة"""
    STATUS_CHOICES = [
        ('معلق', 'معلق'),
        ('مدفوع', 'مدفوع'),
        ('متأخر', 'متأخر'),
    ]
    
    broker = models.ForeignKey(Broker, on_delete=models.CASCADE, related_name='broker_dues', verbose_name="السمسار")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='broker_dues', null=True, blank=True, verbose_name="العقد")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "دين سمسار"
        verbose_name_plural = "ديون السماسرة"
        indexes = [
            models.Index(fields=['broker', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['due_date']),
        ]
    
    def save(self, *args, **kwargs):
        # التحقق من صحة البيانات
        if self.amount <= 0:
            raise ValueError("مبلغ الدين يجب أن يكون أكبر من صفر")
        super().save(*args, **kwargs)
    
    def mark_as_paid(self):
        """تحديد الدين كمُدفوع"""
        self.status = 'مدفوع'
        self.save(update_fields=['status'])
    
    def mark_as_unpaid(self):
        """تحديد الدين كغير مدفوع"""
        self.status = 'معلق'
        self.save(update_fields=['status'])
    
    def is_overdue(self):
        """التحقق من تأخر الدين"""
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.status != 'مدفوع'
    
    def get_days_overdue(self):
        """حساب عدد أيام التأخير"""
        if self.is_overdue():
            from django.utils import timezone
            return (timezone.now().date() - self.due_date).days
        return 0
    
    def __str__(self):
        return f"دين {self.broker.name} - {self.amount}"


class PartnerGroup(BaseModel):
    """مجموعات الشركاء"""
    name = models.CharField(max_length=255, unique=True, verbose_name="اسم المجموعة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "مجموعة شركاء"
        verbose_name_plural = "مجموعات الشركاء"
    
    def get_partners(self):
        """الحصول على الشركاء في المجموعة"""
        return Partner.objects.filter(
            partner_group_partners__partner_group=self,
            partner_group_partners__deleted_at__isnull=True
        ).distinct()
    
    def get_total_partners(self):
        """حساب إجمالي عدد الشركاء"""
        return self.get_partners().count()
    
    def get_total_percentage(self):
        """حساب إجمالي النسب في المجموعة"""
        return self.partner_group_partners.filter(
            deleted_at__isnull=True
        ).aggregate(total=models.Sum('percentage'))['total'] or 0
    
    def validate_percentages(self):
        """التحقق من صحة النسب"""
        total = self.get_total_percentage()
        return abs(total - 100) < 0.01  # السماح بفروق صغيرة
    
    def get_units(self):
        """الحصول على الوحدات المرتبطة بالمجموعة"""
        return Unit.objects.filter(
            unit_partner_groups__partner_group=self,
            unit_partner_groups__deleted_at__isnull=True
        ).distinct()
    
    def get_total_units(self):
        """حساب إجمالي عدد الوحدات"""
        return self.get_units().count()
    
    def __str__(self):
        return self.name


class PartnerGroupPartner(BaseModel):
    """ربط الشركاء بالمجموعات"""
    partner_group = models.ForeignKey(PartnerGroup, on_delete=models.CASCADE, related_name='partners', verbose_name="مجموعة الشركاء")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='partner_groups', verbose_name="الشريك")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="النسبة المئوية")
    
    class Meta:
        verbose_name = "شريك مجموعة"
        verbose_name_plural = "شركاء المجموعات"
        unique_together = ['partner_group', 'partner']
    
    def __str__(self):
        return f"{self.partner_group.name} - {self.partner.name} ({self.percentage}%)"


class UnitPartnerGroup(BaseModel):
    """ربط الوحدات بمجموعات الشركاء"""
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='unit_partner_groups', verbose_name="الوحدة")
    partner_group = models.ForeignKey(PartnerGroup, on_delete=models.CASCADE, related_name='unit_partner_groups', verbose_name="مجموعة الشركاء")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='unit_partner_groups', null=True, blank=True, verbose_name="العقد")
    
    class Meta:
        verbose_name = "وحدة مجموعة شركاء"
        verbose_name_plural = "وحدات مجموعات الشركاء"
        unique_together = ['unit', 'partner_group']
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['partner_group', 'deleted_at']),
            models.Index(fields=['contract', 'deleted_at']),
        ]
    
    def __str__(self):
        return f"{self.unit.code} - {self.partner_group.name}"


class AuditLog(BaseModel):
    """سجل التدقيق"""
    action = models.CharField(max_length=100, verbose_name="الإجراء")
    entity_type = models.CharField(max_length=100, verbose_name="نوع الكيان")
    entity_id = models.CharField(max_length=100, verbose_name="معرف الكيان")
    old_values = models.TextField(null=True, blank=True, verbose_name="القيم القديمة")
    new_values = models.TextField(null=True, blank=True, verbose_name="القيم الجديدة")
    user_id = models.CharField(max_length=100, null=True, blank=True, verbose_name="معرف المستخدم")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="عنوان IP")
    user_agent = models.TextField(null=True, blank=True, verbose_name="وكيل المستخدم")
    
    class Meta:
        verbose_name = "سجل تدقيق"
        verbose_name_plural = "سجلات التدقيق"
    
    def __str__(self):
        return f"{self.action} - {self.entity_type} - {self.entity_id}"


class Settings(BaseModel):
    """الإعدادات"""
    key = models.CharField(max_length=255, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")
    
    class Meta:
        verbose_name = "إعداد"
        verbose_name_plural = "الإعدادات"
    
    def __str__(self):
        return f"{self.key} = {self.value}"


class KeyVal(BaseModel):
    """قيم المفاتيح"""
    key = models.CharField(max_length=255, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")
    
    class Meta:
        verbose_name = "قيمة مفتاح"
        verbose_name_plural = "قيم المفاتيح"
    
    def __str__(self):
        return f"{self.key} = {self.value}"


class Notification(BaseModel):
    """الإشعارات"""
    TYPE_CHOICES = [
        ('info', 'معلومات'),
        ('warning', 'تحذير'),
        ('error', 'خطأ'),
        ('success', 'نجاح'),
    ]
    
    CATEGORY_CHOICES = [
        ('contract', 'عقد'),
        ('installment', 'قسط'),
        ('payment', 'دفع'),
        ('debt', 'دين'),
        ('system', 'نظام'),
    ]
    
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name="نوع الإشعار")
    title = models.CharField(max_length=255, verbose_name="العنوان")
    message = models.TextField(verbose_name="الرسالة")
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, verbose_name="الفئة")
    acknowledged = models.BooleanField(default=False, verbose_name="تم الإقرار")
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الإقرار")
    acknowledged_by = models.CharField(max_length=100, null=True, blank=True, verbose_name="المقِر")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الانتهاء")
    data = models.JSONField(null=True, blank=True, verbose_name="بيانات إضافية")
    
    class Meta:
        verbose_name = "إشعار"
        verbose_name_plural = "الإشعارات"
        indexes = [
            models.Index(fields=['type', 'deleted_at']),
            models.Index(fields=['category', 'deleted_at']),
            models.Index(fields=['acknowledged', 'deleted_at']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['created_at']),
        ]
    
    def save(self, *args, **kwargs):
        # التحقق من صحة البيانات
        if not self.title or not self.message:
            raise ValueError("العنوان والرسالة مطلوبان")
        super().save(*args, **kwargs)
    
    def acknowledge(self, acknowledged_by=None):
        """إقرار الإشعار"""
        self.acknowledged = True
        self.acknowledged_at = timezone.now()
        if acknowledged_by:
            self.acknowledged_by = acknowledged_by
        self.save(update_fields=['acknowledged', 'acknowledged_at', 'acknowledged_by'])
    
    def is_expired(self):
        """التحقق من انتهاء صلاحية الإشعار"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def is_acknowledged(self):
        """التحقق من إقرار الإشعار"""
        return self.acknowledged
    
    def get_priority(self):
        """حساب أولوية الإشعار"""
        if self.type == 'error':
            return 1  # أعلى أولوية
        elif self.type == 'warning':
            return 2
        elif self.type == 'info':
            return 3
        else:
            return 4  # أقل أولوية
    
    def __str__(self):
        return f"{self.title} - {self.get_type_display()}"


class PartnerDailyTransaction(BaseModel):
    """المعاملات اليومية للشريك"""
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='daily_transactions', verbose_name="الشريك")
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='partner_daily_transactions', null=True, blank=True, verbose_name="الوحدة")
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='partner_daily_transactions', null=True, blank=True, verbose_name="العقد")
    transaction_type = models.CharField(max_length=50, choices=[
        ('income', 'دخل'),
        ('expense', 'مصروف'),
        ('closing', 'إقفال يومي'),
    ], verbose_name="نوع المعاملة")
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="المبلغ")
    description = models.TextField(verbose_name="البيان")
    transaction_date = models.DateField(verbose_name="تاريخ المعاملة")
    partner_share = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="نسبة الشريك")
    running_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="الرصيد المتراكم")
    
    class Meta:
        verbose_name = "معاملة يومية للشريك"
        verbose_name_plural = "المعاملات اليومية للشركاء"
        indexes = [
            models.Index(fields=['partner', 'transaction_date']),
            models.Index(fields=['transaction_type', 'deleted_at']),
            models.Index(fields=['transaction_date']),
        ]
    
    def save(self, *args, **kwargs):
        # حساب نسبة الشريك تلقائياً
        if self.unit and self.partner:
            unit_partner = UnitPartner.objects.filter(
                unit=self.unit,
                partner=self.partner,
                deleted_at__isnull=True
            ).first()
            if unit_partner:
                self.partner_share = unit_partner.percentage
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.partner.name} - {self.get_transaction_type_display()} - {self.amount}"


class PartnerLedger(BaseModel):
    """كشف حساب الشريك"""
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='ledgers', verbose_name="الشريك")
    date = models.DateField(verbose_name="التاريخ")
    total_income = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="إجمالي الدخل")
    total_expense = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="إجمالي المصروفات")
    net_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="الرصيد الصافي")
    transaction_count = models.PositiveIntegerField(default=0, verbose_name="عدد المعاملات")
    
    class Meta:
        verbose_name = "كشف حساب الشريك"
        verbose_name_plural = "كشوف حسابات الشركاء"
        unique_together = ['partner', 'date']
        indexes = [
            models.Index(fields=['partner', 'date']),
            models.Index(fields=['date']),
        ]
    
    def calculate_balance(self):
        """حساب الرصيد الصافي"""
        self.net_balance = self.total_income - self.total_expense
        return self.net_balance
    
    def save(self, *args, **kwargs):
        self.calculate_balance()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.partner.name} - {self.date} - {self.net_balance}"