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
    
    def __str__(self):
        return self.name


class UnitPartner(BaseModel):
    """ربط الوحدات بالشركاء"""
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='unit_partners', verbose_name="الوحدة")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='unit_partners', verbose_name="الشريك")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="النسبة المئوية")
    
    class Meta:
        verbose_name = "شريك وحدة"
        verbose_name_plural = "شركاء الوحدات"
        unique_together = ['unit', 'partner']
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['partner', 'deleted_at']),
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
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "قسط"
        verbose_name_plural = "الأقساط"
        indexes = [
            models.Index(fields=['unit', 'deleted_at']),
            models.Index(fields=['status', 'deleted_at']),
            models.Index(fields=['due_date']),
            models.Index(fields=['amount']),
        ]
    
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
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "دين شريك"
        verbose_name_plural = "ديون الشركاء"
    
    def __str__(self):
        return f"دين {self.partner.name} - {self.amount}"


class Safe(BaseModel):
    """الخزائن"""
    name = models.CharField(max_length=255, unique=True, verbose_name="اسم الخزنة")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, verbose_name="الرصيد")
    
    class Meta:
        verbose_name = "خزنة"
        verbose_name_plural = "الخزائن"
    
    def __str__(self):
        return f"{self.name} - {self.balance}"


class Transfer(BaseModel):
    """التحويلات بين الخزائن"""
    from_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_from', verbose_name="من خزنة")
    to_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_to', verbose_name="إلى خزنة")
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    description = models.TextField(null=True, blank=True, verbose_name="الوصف")
    
    class Meta:
        verbose_name = "تحويل"
        verbose_name_plural = "التحويلات"
    
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
    description = models.TextField(verbose_name="الوصف")
    payer = models.CharField(max_length=255, null=True, blank=True, verbose_name="المدفوع له")
    beneficiary = models.CharField(max_length=255, null=True, blank=True, verbose_name="المستفيد")
    linked_ref = models.CharField(max_length=100, null=True, blank=True, verbose_name="المرجع المرتبط")
    
    class Meta:
        verbose_name = "سند"
        verbose_name_plural = "السندات"
    
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
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], verbose_name="المبلغ")
    due_date = models.DateTimeField(verbose_name="تاريخ الاستحقاق")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="معلق", verbose_name="الحالة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "دين سمسار"
        verbose_name_plural = "ديون السماسرة"
    
    def __str__(self):
        return f"دين {self.broker.name} - {self.amount}"


class PartnerGroup(BaseModel):
    """مجموعات الشركاء"""
    name = models.CharField(max_length=255, unique=True, verbose_name="اسم المجموعة")
    notes = models.TextField(null=True, blank=True, verbose_name="ملاحظات")
    
    class Meta:
        verbose_name = "مجموعة شركاء"
        verbose_name_plural = "مجموعات الشركاء"
    
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
    
    class Meta:
        verbose_name = "وحدة مجموعة شركاء"
        verbose_name_plural = "وحدات مجموعات الشركاء"
        unique_together = ['unit', 'partner_group']
    
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