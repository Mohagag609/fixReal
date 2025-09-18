# خريطة الهجرة: Next.js/Prisma إلى Django/PostgreSQL

## نظرة عامة
تم نقل مشروع إدارة العقارات من Next.js + Prisma + PostgreSQL إلى Django + PostgreSQL مع الحفاظ على جميع الوظائف والميزات.

## 1. نماذج البيانات (Prisma → Django ORM)

| النموذج القديم | النموذج الجديد | الحقول الرئيسية | العلاقات |
|---------------|----------------|-----------------|----------|
| Customer | Customer | name, phone, national_id, address, email, notes | contract_set |
| Unit | Unit | unit_number, floor, building, area, price, status, unit_type | contract_set, unitpartner_set |
| Partner | Partner | name, phone, national_id, address, email, share_percentage | unitpartner_set, partnergrouppartner_set |
| Contract | Contract | customer, unit, contract_date, total_price, down_payment, discount | customer (FK), unit (FK), broker (FK) |
| Installment | Installment | contract, due_date, due_amount, paid_amount, status | contract (FK) |
| Safe | Safe | name, balance, description | voucher_set, transfer_to_safe, transfer_from_safe |
| Voucher | Voucher | safe, amount, voucher_type, date, description | safe (FK) |
| Broker | Broker | name, phone, national_id, address, email | contract_set, brokerdue_set |
| Notification | Notification | user, message, is_read, created_at | user (FK) |

## 2. منطق الأعمال والحسابات

| الوظيفة القديمة (TypeScript) | الوظيفة الجديدة (Python) | الوصف |
|------------------------------|---------------------------|--------|
| calculateInstallmentStatus | calculate_installment_status | حساب حالة القسط |
| calculateRemaining | calculate_remaining | حساب المبلغ المتبقي |
| calculateCollectionPercentage | calculate_collection_percentage | حساب نسبة التحصيل |
| calculateNetProfit | calculate_net_profit | حساب صافي الربح |
| calculateTotalSales | calculate_total_sales | حساب إجمالي المبيعات |
| calculateDashboardKPIs | calculate_dashboard_kpis | حساب مؤشرات الأداء الرئيسية |

## 3. مسارات API (Next.js → Django)

| المسار القديم | العرض الجديد | URL الجديد | الوصف |
|---------------|---------------|-------------|--------|
| /api/dashboard | dashboard_view | / | لوحة التحكم الرئيسية |
| /api/customers | customer_list | /customers/ | قائمة العملاء |
| /api/customers (POST) | customer_create | /customers/create/ | إنشاء عميل جديد |
| /api/units | unit_list | /units/ | قائمة الوحدات |
| /api/contracts | contract_list | /contracts/ | قائمة العقود |
| /api/treasury | treasury_dashboard | /treasury/ | لوحة الخزائن |
| /api/reports | reports_dashboard | /reports/ | لوحة التقارير |
| /api/dbms | dbms_dashboard | /dbms/ | إدارة قاعدة البيانات |
| /api/notifications | notifications_dashboard | /notifications/ | إدارة الإشعارات |
| /api/analytics | analytics_dashboard | /analytics/ | التحليلات |
| /api/settings | settings_dashboard | /settings/ | الإعدادات |

## 4. الميزات الجديدة المضافة

### إدارة قاعدة البيانات
- نسخ احتياطية تلقائية
- استيراد وتصدير البيانات
- تحسين الأداء
- مراقبة قاعدة البيانات

### نظام الإشعارات
- إشعارات تلقائية
- تنبيهات الاستحقاق
- إدارة الإشعارات
- تصنيف الإشعارات

### التحليلات المتقدمة
- رسوم بيانية تفاعلية
- مؤشرات الأداء الرئيسية
- تحليلات المبيعات
- تحليلات العملاء

### إدارة الإعدادات
- إعدادات النظام
- مفاتيح وقيم مخصصة
- نسخ احتياطي للإعدادات
- استيراد وتصدير الإعدادات

## 5. التحسينات المطبقة

### الأداء
- تحسين استعلامات قاعدة البيانات
- استخدام الفهارس المناسبة
- تحسين تحميل الصفحات
- استخدام التخزين المؤقت

### الأمان
- حماية CSRF
- التحقق من البيانات
- تشفير كلمات المرور
- حماية الملفات

### سهولة الاستخدام
- واجهة مستخدم حديثة
- تصميم متجاوب
- رسائل خطأ واضحة
- تنقل سهل

---

**ملاحظة**: تم الحفاظ على جميع الوظائف والميزات من المشروع القديم مع إضافة ميزات جديدة وتحسينات في الأداء والأمان.
