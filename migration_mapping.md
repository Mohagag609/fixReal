# Migration Mapping: Prisma to Django ORM

هذا الملف يوثق ربط الجداول بين مشروع Next.js (Prisma) ومشروع Django الجديد.

## 📋 جدول المقارنة

| Prisma Model | Django Model | Status | Notes |
|--------------|--------------|--------|-------|
| `Customer` | `Customer` | ✅ Complete | جميع الحقول منقولة |
| `Unit` | `Unit` | ✅ Complete | جميع الحقول منقولة |
| `Partner` | `Partner` | ✅ Complete | جميع الحقول منقولة |
| `UnitPartner` | `UnitPartner` | ✅ Complete | جميع الحقول منقولة |
| `Contract` | `Contract` | ✅ Complete | جميع الحقول منقولة |
| `Installment` | `Installment` | ⚠️ Partial | مفقود حقل `contract` |
| `PartnerDebt` | `PartnerDebt` | ⚠️ Partial | مفقود حقل `contract` |
| `Safe` | `Safe` | ✅ Complete | جميع الحقول منقولة |
| `Transfer` | `Transfer` | ⚠️ Partial | مفقود حقل `contract` |
| `Voucher` | `Voucher` | ⚠️ Partial | مفقود حقل `unit` |
| `Broker` | `Broker` | ✅ Complete | جميع الحقول منقولة |
| `BrokerDue` | `BrokerDue` | ⚠️ Partial | مفقود حقل `contract` |
| `PartnerGroup` | `PartnerGroup` | ✅ Complete | جميع الحقول منقولة |
| `PartnerGroupPartner` | `PartnerGroupPartner` | ✅ Complete | جميع الحقول منقولة |
| `UnitPartnerGroup` | `UnitPartnerGroup` | ⚠️ Partial | مفقود حقل `contract` |
| `AuditLog` | `AuditLog` | ✅ Complete | جميع الحقول منقولة |
| `Settings` | `Settings` | ✅ Complete | جميع الحقول منقولة |
| `KeyVal` | `KeyVal` | ✅ Complete | جميع الحقول منقولة |
| `User` | ❌ Missing | ❌ Not Implemented | مطلوب إضافة |
| `Notification` | ❌ Missing | ❌ Not Implemented | مطلوب إضافة |

## 🔧 الحقول المطلوب إضافتها

### 1. نموذج User
```python
class User(BaseModel):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=50, default='user')
    is_active = models.BooleanField(default=True)
```

### 2. نموذج Notification
```python
class Notification(BaseModel):
    type = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    message = models.TextField()
    category = models.CharField(max_length=100)
    acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    data = models.JSONField(null=True, blank=True)
```

### 3. إضافة حقل contract للـ Installment
```python
# في نموذج Installment
contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='installments', null=True, blank=True)
```

### 4. إضافة حقل contract للـ PartnerDebt
```python
# في نموذج PartnerDebt
contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='partner_debts', null=True, blank=True)
```

### 5. إضافة حقل contract للـ BrokerDue
```python
# في نموذج BrokerDue
contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='broker_dues', null=True, blank=True)
```

### 6. إضافة حقل contract للـ Transfer
```python
# في نموذج Transfer
contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='transfers', null=True, blank=True)
```

### 7. إضافة حقل unit للـ Voucher
```python
# في نموذج Voucher
unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='vouchers', null=True, blank=True)
```

### 8. إضافة حقل contract للـ UnitPartner
```python
# في نموذج UnitPartner
contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='unit_partners', null=True, blank=True)
```

### 9. إضافة حقل contract للـ UnitPartnerGroup
```python
# في نموذج UnitPartnerGroup
contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='unit_partner_groups', null=True, blank=True)
```

## 🔄 العلاقات المطلوب تحديثها

### 1. علاقة Contract -> Installments
```python
# في نموذج Contract
installments = models.ManyToManyField(Installment, through='ContractInstallment')
```

### 2. علاقة Contract -> PartnerDebts
```python
# في نموذج Contract
partner_debts = models.ManyToManyField(PartnerDebt, through='ContractPartnerDebt')
```

### 3. علاقة Contract -> BrokerDues
```python
# في نموذج Contract
broker_dues = models.ManyToManyField(BrokerDue, through='ContractBrokerDue')
```

### 4. علاقة Contract -> Transfers
```python
# في نموذج Contract
transfers = models.ManyToManyField(Transfer, through='ContractTransfer')
```

### 5. علاقة Unit -> Vouchers
```python
# في نموذج Unit
vouchers = models.ManyToManyField(Voucher, through='UnitVoucher')
```

### 6. علاقة Contract -> UnitPartners
```python
# في نموذج Contract
unit_partners = models.ManyToManyField(UnitPartner, through='ContractUnitPartner')
```

### 7. علاقة Contract -> UnitPartnerGroups
```python
# في نموذج Contract
unit_partner_groups = models.ManyToManyField(UnitPartnerGroup, through='ContractUnitPartnerGroup')
```

## 📝 ملاحظات مهمة

1. **Soft Delete**: جميع النماذج تستخدم `deleted_at` للحذف المنطقي
2. **Timestamps**: جميع النماذج تحتوي على `created_at` و `updated_at`
3. **Validation**: استخدام `MinValueValidator` للحقول المالية
4. **Indexes**: إضافة فهارس للأداء الأمثل
5. **Relationships**: استخدام `related_name` للعلاقات العكسية
6. **Null/Blank**: الحقول الاختيارية تستخدم `null=True, blank=True`

## 🚀 خطوات التنفيذ

1. **إنشاء نماذج جديدة**: User, Notification
2. **تحديث النماذج الموجودة**: إضافة الحقول المفقودة
3. **إنشاء migrations**: `python manage.py makemigrations`
4. **تطبيق migrations**: `python manage.py migrate`
5. **تحديث admin**: إضافة النماذج الجديدة
6. **تحديث views**: إضافة الوظائف المطلوبة
7. **تحديث templates**: إضافة الواجهات المطلوبة
8. **تحديث urls**: إضافة المسارات الجديدة

## 🔍 اختبارات مطلوبة

1. **اختبار النماذج**: التأكد من صحة الحقول والعلاقات
2. **اختبار الـ CRUD**: التأكد من عمل جميع العمليات
3. **اختبار العلاقات**: التأكد من صحة الربط بين الجداول
4. **اختبار الأداء**: التأكد من سرعة الاستعلامات
5. **اختبار الواجهة**: التأكد من عمل جميع الصفحات

## 📊 إحصائيات المشروع

- **إجمالي النماذج**: 20 نموذج
- **النماذج المكتملة**: 12 نموذج (60%)
- **النماذج الجزئية**: 6 نماذج (30%)
- **النماذج المفقودة**: 2 نموذج (10%)
- **الحقول المطلوب إضافتها**: 9 حقول
- **العلاقات المطلوب تحديثها**: 7 علاقات

## 🎯 الأولويات

### عالية الأولوية
1. إضافة نموذج User
2. إضافة نموذج Notification
3. ربط العقود بالأقساط
4. ربط العقود بالديون

### متوسطة الأولوية
1. ربط العقود بالتحويلات
2. ربط الوحدات بالسندات
3. ربط العقود بشركاء الوحدات

### منخفضة الأولوية
1. تحسين الأداء
2. إضافة المزيد من الفهارس
3. تحسين الواجهة