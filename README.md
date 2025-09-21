# نظام إدارة العقارات المتطور

نظام شامل لإدارة العقارات والعملاء والعقود والمدفوعات مبني بتقنيات حديثة.

## 🚀 المميزات

- **إدارة العملاء**: إضافة وتعديل وحذف بيانات العملاء
- **إدارة الوحدات**: تتبع الوحدات السكنية والتجارية
- **إدارة العقود**: إنشاء ومتابعة العقود
- **نظام الأقساط**: تتبع المدفوعات والأقساط المستحقة
- **إدارة الخزائن**: تتبع الأرصدة والمعاملات المالية
- **نظام السندات**: إيصالات القبض وسندات الدفع
- **إدارة الشركاء**: تتبع الشراكات والمستحقات
- **التقارير المالية**: تقارير شاملة ومخططات بيانية
- **واجهة عصرية**: تصميم احترافي مع دعم الوضع الليلي
- **استجابة كاملة**: يعمل على جميع الأجهزة

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Neon)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod
- **Charts**: Recharts

## 📦 التثبيت والتشغيل

### المتطلبات
- Node.js 18+ 
- npm أو yarn
- PostgreSQL database

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd estate-management-system-v2
```

2. **تثبيت المكتبات**
```bash
npm install
```

3. **إعداد قاعدة البيانات**
```bash
# إنشاء ملف .env.local وإضافة رابط قاعدة البيانات
DATABASE_URL="your-postgresql-connection-string"

# إنشاء الجداول
node setup-database.js

# إدخال البيانات الأولية (اختياري)
node seed-database.js
```

4. **تشغيل المشروع**
```bash
npm run dev
```

5. **فتح المتصفح**
```
http://localhost:3000
```

## 🗄️ هيكل قاعدة البيانات

### الجداول الرئيسية:
- `customers` - بيانات العملاء
- `units` - الوحدات العقارية
- `contracts` - العقود
- `installments` - الأقساط
- `safes` - الخزائن
- `vouchers` - السندات
- `partners` - الشركاء
- `brokers` - السماسرة

## 🌐 API Routes

### العملاء
- `GET /api/customers` - جلب قائمة العملاء
- `POST /api/customers` - إضافة عميل جديد
- `PUT /api/customers` - تحديث بيانات العميل
- `DELETE /api/customers` - حذف العميل

### الوحدات
- `GET /api/units` - جلب قائمة الوحدات
- `POST /api/units` - إضافة وحدة جديدة
- `PUT /api/units` - تحديث بيانات الوحدة
- `DELETE /api/units` - حذف الوحدة

### الخزائن
- `GET /api/safes` - جلب قائمة الخزائن
- `POST /api/safes` - إضافة خزنة جديدة
- `PUT /api/safes` - تحديث بيانات الخزنة
- `DELETE /api/safes` - حذف الخزنة

### لوحة التحكم
- `GET /api/dashboard` - جلب إحصائيات لوحة التحكم

## 📁 هيكل المشروع

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── globals.css        # الأنماط العامة
│   ├── layout.tsx         # Layout رئيسي
│   └── page.tsx          # الصفحة الرئيسية
├── components/            # مكونات React
│   ├── ui/               # مكونات UI الأساسية
│   ├── app-layout.tsx    # Layout التطبيق
│   ├── dashboard-content.tsx
│   ├── header.tsx
│   └── sidebar.tsx
├── lib/                   # المكتبات والأدوات
│   ├── db.ts             # اتصال قاعدة البيانات
│   └── utils.ts          # دوال مساعدة
├── types/                 # تعريفات TypeScript
│   └── index.ts
├── utils/                 # دوال الحسابات
│   └── calculations.ts
└── features/              # ميزات التطبيق (مستقبلية)
```

## 🎨 الواجهة

- **تصميم عصري**: واجهة نظيفة وبسيطة
- **الوضع الليلي**: دعم كامل للوضع الليلي والنهاري
- **استجابة كاملة**: يعمل على الهواتف والأجهزة اللوحية
- **حركات سلسة**: انتقالات وحركات احترافية
- **أيقونات واضحة**: استخدام أيقونات Lucide React

## 📊 المميزات المالية

- **تتبع الأرصدة**: مراقبة أرصدة الخزائن
- **إدارة المدفوعات**: تسجيل الإيصالات والمدفوعات
- **تقارير شاملة**: تقارير مالية تفصيلية
- **حسابات دقيقة**: حسابات آلية للأرباح والخسائر
- **تتبع الأقساط**: مراقبة الأقساط المستحقة والمتأخرة

## 🔒 الأمان

- **التحقق من البيانات**: استخدام Zod للتحقق من صحة البيانات
- **SQL Injection Protection**: حماية من هجمات SQL
- **Soft Delete**: حذف آمن للبيانات
- **Audit Trail**: تتبع جميع العمليات

## 📱 الاستجابة

- **Mobile First**: مصمم للهواتف أولاً
- **Tablet Optimized**: محسن للأجهزة اللوحية
- **Desktop Ready**: واجهة كاملة للحاسوب

## 🚀 النشر

### Vercel (موصى به)
```bash
npm run build
# Deploy to Vercel
```

### Netlify
```bash
npm run build
# Deploy to Netlify
```

### Docker
```bash
# إنشاء صورة Docker
docker build -t estate-management .

# تشغيل الحاوية
docker run -p 3000:3000 estate-management
```

## 🤝 المساهمة

نرحب بجميع المساهمات! يرجى اتباع هذه الخطوات:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للحصول على الدعم، يرجى فتح issue في GitHub أو التواصل معنا.

## 🎯 الخطط المستقبلية

- [ ] نظام المصادقة والصلاحيات
- [ ] تطبيق الجوال
- [ ] تصدير التقارير إلى PDF/Excel
- [ ] إشعارات فورية
- [ ] نظام النسخ الاحتياطي التلقائي
- [ ] دعم اللغات المتعددة
- [ ] API متقدم للتكامل الخارجي

---

**تم تطوير هذا النظام بعناية فائقة لضمان الأداء العالي والاستقرار** ⚡