from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Customer(models.Model):
    """نموذج العملاء - مطابق لـ Prisma Customer"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    name = models.CharField(max_length=255, verbose_name="الاسم")
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, verbose_name="رقم الهاتف")
    national_id = models.CharField(max_length=14, unique=True, null=True, blank=True, verbose_name="الرقم القومي")
    address = models.TextField(null=True, blank=True, verbose_name="العنوان")
    status = models.CharField(max_length=50, default="نشط", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'customers'
        verbose_name = 'عميل'
        verbose_name_plural = 'العملاء'
        indexes = [
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['name']),
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name


class Unit(models.Model):
    """نموذج الوحدات - مطابق لـ Prisma Unit"""
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

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    code = models.CharField(max_length=100, unique=True, verbose_name="كود الوحدة")
    name = models.CharField(max_length=255, null=True, blank=True, verbose_name="الاسم")
    unit_type = models.CharField(max_length=50, choices=UNIT_TYPE_CHOICES, default="سكني", verbose_name="نوع الوحدة")
    area = models.CharField(max_length=100, null=True, blank=True, verbose_name="المساحة")
    floor = models.CharField(max_length=50, null=True, blank=True, verbose_name="الطابق")
    building = models.CharField(max_length=100, null=True, blank=True, verbose_name="المبنى")
    total_price = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="السعر الإجمالي")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="متاحة", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'units'
        verbose_name = 'وحدة'
        verbose_name_plural = 'الوحدات'
        indexes = [
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['unit_type', 'deleted_at']),
            models.Index(fields=['total_price']),
            models.Index(fields=['created_at']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name or 'بدون اسم'}"


class Partner(models.Model):
    """نموذج الشركاء - مطابق لـ Prisma Partner"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    name = models.CharField(max_length=255, verbose_name="الاسم")
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="رقم الهاتف")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'partners'
        verbose_name = 'شريك'
        verbose_name_plural = 'الشركاء'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['phone']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name


class UnitPartner(models.Model):
    """نموذج شركاء الوحدات - مطابق لـ Prisma UnitPartner"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, verbose_name="الوحدة")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, verbose_name="الشريك")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="النسبة المئوية")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'unit_partners'
        verbose_name = 'شريك وحدة'
        verbose_name_plural = 'شركاء الوحدات'
        unique_together = ['unit', 'partner']
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['partner', 'deleted_at']),
        ]

    def __str__(self):
        return f"{self.unit.code} - {self.partner.name} ({self.percentage}%)"


class Contract(models.Model):
    """نموذج العقود - مطابق لـ Prisma Contract"""
    PAYMENT_TYPE_CHOICES = [
        ('installment', 'تقسيط'),
        ('cash', 'نقدي'),
    ]
    
    INSTALLMENT_TYPE_CHOICES = [
        ('شهري', 'شهري'),
        ('ربع سنوي', 'ربع سنوي'),
        ('نصف سنوي', 'نصف سنوي'),
        ('سنوي', 'سنوي'),
    ]

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, verbose_name="الوحدة")
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name="العميل")
    start = models.DateTimeField(verbose_name="تاريخ البداية")
    total_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="السعر الإجمالي")
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="مبلغ الخصم")
    broker_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="اسم السمسار")
    broker_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="نسبة السمسار")
    broker_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="مبلغ السمسار")
    commission_safe_id = models.CharField(max_length=25, null=True, blank=True, verbose_name="خزنة العمولة")
    down_payment_safe_id = models.CharField(max_length=25, null=True, blank=True, verbose_name="خزنة الدفعة المقدمة")
    maintenance_deposit = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="وديعة الصيانة")
    installment_type = models.CharField(max_length=50, choices=INSTALLMENT_TYPE_CHOICES, default="شهري", verbose_name="نوع القسط")
    installment_count = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name="عدد الأقساط")
    extra_annual = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name="سنوات إضافية")
    annual_payment_value = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="قيمة الدفع السنوي")
    down_payment = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name="الدفعة المقدمة")
    payment_type = models.CharField(max_length=50, choices=PAYMENT_TYPE_CHOICES, default="installment", verbose_name="نوع الدفع")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'contracts'
        verbose_name = 'عقد'
        verbose_name_plural = 'العقود'
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['customer', 'deleted_at']),
            models.Index(fields=['start']),
            models.Index(fields=['total_price']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"عقد {self.unit.code} - {self.customer.name}"


class Installment(models.Model):
    """نموذج الأقساط - مطابق لـ Prisma Installment"""
    STATUS_CHOICES = [
        ('معلق', 'معلق'),
        ('جزئي', 'جزئي'),
        ('مدفوع', 'مدفوع'),
    ]

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, verbose_name="الوحدة")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'installments'
        verbose_name = 'قسط'
        verbose_name_plural = 'الأقساط'
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['due_date']),
            models.Index(fields=['amount']),
        ]

    def __str__(self):
        return f"قسط {self.unit.code} - {self.amount} ({self.status})"


class PartnerDebt(models.Model):
    """نموذج ديون الشركاء - مطابق لـ Prisma PartnerDebt"""
    STATUS_CHOICES = [
        ('معلق', 'معلق'),
        ('جزئي', 'جزئي'),
        ('مدفوع', 'مدفوع'),
    ]

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, verbose_name="الشريك")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'partner_debts'
        verbose_name = 'دين شريك'
        verbose_name_plural = 'ديون الشركاء'

    def __str__(self):
        return f"دين {self.partner.name} - {self.amount} ({self.status})"


class Safe(models.Model):
    """نموذج الخزائن - مطابق لـ Prisma Safe"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    name = models.CharField(max_length=255, unique=True, verbose_name="الاسم")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="الرصيد")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'safes'
        verbose_name = 'خزنة'
        verbose_name_plural = 'الخزائن'

    def __str__(self):
        return f"{self.name} - {self.balance}"


class Transfer(models.Model):
    """نموذج التحويلات - مطابق لـ Prisma Transfer"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    from_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_from', verbose_name="من خزنة")
    to_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_to', verbose_name="إلى خزنة")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="المبلغ")
    description = models.TextField(null=True, blank=True, verbose_name="الوصف")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'transfers'
        verbose_name = 'تحويل'
        verbose_name_plural = 'التحويلات'

    def __str__(self):
        return f"تحويل من {self.from_safe.name} إلى {self.to_safe.name} - {self.amount}"


class Voucher(models.Model):
    """نموذج السندات - مطابق لـ Prisma Voucher"""
    TYPE_CHOICES = [
        ('receipt', 'إيصال استلام'),
        ('payment', 'إيصال دفع'),
    ]

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name="النوع")
    date = models.DateTimeField(verbose_name="التاريخ")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="المبلغ")
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, verbose_name="الخزنة")
    description = models.TextField(verbose_name="الوصف")
    payer = models.CharField(max_length=255, null=True, blank=True, verbose_name="المدفوع له")
    beneficiary = models.CharField(max_length=255, null=True, blank=True, verbose_name="المستفيد")
    linked_ref = models.CharField(max_length=25, null=True, blank=True, verbose_name="المرجع المرتبط")
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="الوحدة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'vouchers'
        verbose_name = 'سند'
        verbose_name_plural = 'السندات'

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount} ({self.safe.name})"


class Broker(models.Model):
    """نموذج السماسرة - مطابق لـ Prisma Broker"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    name = models.CharField(max_length=255, unique=True, verbose_name="الاسم")
    phone = models.CharField(max_length=20, null=True, blank=True, verbose_name="رقم الهاتف")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'brokers'
        verbose_name = 'سمسار'
        verbose_name_plural = 'السماسرة'

    def __str__(self):
        return self.name


class BrokerDue(models.Model):
    """نموذج مستحقات السماسرة - مطابق لـ Prisma BrokerDue"""
    STATUS_CHOICES = [
        ('معلق', 'معلق'),
        ('جزئي', 'جزئي'),
        ('مدفوع', 'مدفوع'),
    ]

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    broker = models.ForeignKey(Broker, on_delete=models.CASCADE, verbose_name="السمسار")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'broker_dues'
        verbose_name = 'مستحق سمسار'
        verbose_name_plural = 'مستحقات السماسرة'

    def __str__(self):
        return f"مستحق {self.broker.name} - {self.amount} ({self.status})"


class PartnerGroup(models.Model):
    """نموذج مجموعات الشركاء - مطابق لـ Prisma PartnerGroup"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    name = models.CharField(max_length=255, unique=True, verbose_name="الاسم")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'partner_groups'
        verbose_name = 'مجموعة شركاء'
        verbose_name_plural = 'مجموعات الشركاء'

    def __str__(self):
        return self.name


class PartnerGroupPartner(models.Model):
    """نموذج شركاء المجموعات - مطابق لـ Prisma PartnerGroupPartner"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    partner_group = models.ForeignKey(PartnerGroup, on_delete=models.CASCADE, verbose_name="مجموعة الشركاء")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, verbose_name="الشريك")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], verbose_name="النسبة المئوية")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'partner_group_partners'
        verbose_name = 'شريك مجموعة'
        verbose_name_plural = 'شركاء المجموعات'
        unique_together = ['partner_group', 'partner']

    def __str__(self):
        return f"{self.partner_group.name} - {self.partner.name} ({self.percentage}%)"


class UnitPartnerGroup(models.Model):
    """نموذج مجموعات شركاء الوحدات - مطابق لـ Prisma UnitPartnerGroup"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, verbose_name="الوحدة")
    partner_group = models.ForeignKey(PartnerGroup, on_delete=models.CASCADE, verbose_name="مجموعة الشركاء")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الحذف")

    class Meta:
        db_table = 'unit_partner_groups'
        verbose_name = 'مجموعة شركاء وحدة'
        verbose_name_plural = 'مجموعات شركاء الوحدات'
        unique_together = ['unit', 'partner_group']

    def __str__(self):
        return f"{self.unit.code} - {self.partner_group.name}"


class AuditLog(models.Model):
    """نموذج سجل التدقيق - مطابق لـ Prisma AuditLog"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    action = models.CharField(max_length=100, verbose_name="الإجراء")
    entity_type = models.CharField(max_length=100, verbose_name="نوع الكيان")
    entity_id = models.CharField(max_length=25, verbose_name="معرف الكيان")
    old_values = models.JSONField(null=True, blank=True, verbose_name="القيم القديمة")
    new_values = models.JSONField(null=True, blank=True, verbose_name="القيم الجديدة")
    user_id = models.CharField(max_length=25, null=True, blank=True, verbose_name="معرف المستخدم")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="عنوان IP")
    user_agent = models.TextField(null=True, blank=True, verbose_name="وكيل المستخدم")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")

    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'سجل تدقيق'
        verbose_name_plural = 'سجلات التدقيق'

    def __str__(self):
        return f"{self.action} - {self.entity_type} - {self.created_at}"


class Settings(models.Model):
    """نموذج الإعدادات - مطابق لـ Prisma Settings"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    key = models.CharField(max_length=255, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")

    class Meta:
        db_table = 'settings'
        verbose_name = 'إعداد'
        verbose_name_plural = 'الإعدادات'

    def __str__(self):
        return f"{self.key} = {self.value}"


class KeyVal(models.Model):
    """نموذج القيم المفتاحية - مطابق لـ Prisma KeyVal"""
    id = models.CharField(max_length=25, primary_key=True, unique=True)
    key = models.CharField(max_length=255, unique=True, verbose_name="المفتاح")
    value = models.TextField(verbose_name="القيمة")

    class Meta:
        db_table = 'keyval'
        verbose_name = 'قيمة مفتاحية'
        verbose_name_plural = 'القيم المفتاحية'

    def __str__(self):
        return f"{self.key} = {self.value}"


class Notification(models.Model):
    """نموذج الإشعارات - مطابق لـ Prisma Notification"""
    TYPE_CHOICES = [
        ('critical', 'حرج'),
        ('important', 'مهم'),
        ('info', 'معلومات'),
    ]

    id = models.CharField(max_length=25, primary_key=True, unique=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name="النوع")
    title = models.CharField(max_length=255, verbose_name="العنوان")
    message = models.TextField(verbose_name="الرسالة")
    category = models.CharField(max_length=100, verbose_name="الفئة")
    acknowledged = models.BooleanField(default=False, verbose_name="تم الإقرار")
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الإقرار")
    acknowledged_by = models.CharField(max_length=25, null=True, blank=True, verbose_name="أقر بواسطة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الانتهاء")
    data = models.JSONField(null=True, blank=True, verbose_name="البيانات")

    class Meta:
        db_table = 'notifications'
        verbose_name = 'إشعار'
        verbose_name_plural = 'الإشعارات'

    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"