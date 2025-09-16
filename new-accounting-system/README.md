# نظام المحاسبة الجديد

نظام محاسبي متكامل مبني بـ Next.js و Prisma مع دعم SQLite و PostgreSQL.

## الميزات

- **إدارة العملاء**: إضافة وتعديل وحذف العملاء
- **إدارة الوحدات**: إدارة الوحدات العقارية
- **إدارة العقود**: إنشاء ومتابعة العقود
- **إدارة الشركاء**: إدارة الشركاء ومجموعات الشركاء
- **إدارة الخزائن**: إدارة الخزائن والتحويلات
- **إدارة الشيكات**: إصدار ومتابعة الشيكات
- **إدارة الأقساط**: جدولة ومتابعة الأقساط
- **التقارير**: تقارير شاملة ومفصلة
- **الإعدادات**: إعدادات النظام المتقدمة

## التقنيات المستخدمة

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Database**: Prisma ORM
- **Database**: SQLite (تطوير) + PostgreSQL (إنتاج)
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Icons**: Lucide React

## التثبيت والتشغيل

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd new-accounting-system
```

### 2. تثبيت التبعيات

```bash
npm install
```

### 3. إعداد قاعدة البيانات

#### للتطوير المحلي (SQLite):

```bash
# نسخ ملف البيئة
cp .env.example .env

# إنشاء قاعدة البيانات
npm run db:push

# إضافة البيانات الأولية
npm run db:seed
```

#### للإنتاج (PostgreSQL):

```bash
# تحديث ملف .env
DATABASE_URL="postgresql://user:password@host:port/database"
DATABASE_PROVIDER="postgresql"

# تشغيل migrations
npm run db:migrate:deploy

# إضافة البيانات الأولية
npm run db:seed
```

### 4. تشغيل المشروع

```bash
# التطوير
npm run dev

# الإنتاج
npm run build
npm run start
```

## النشر على Netlify

### 1. إعداد متغيرات البيئة

في Netlify، أضف هذه المتغيرات في Site Settings > Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_fjdbuB2cR3rW@ep-snowy-sunset-adekgsy7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_PROVIDER=postgresql
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 2. إعدادات البناء

- **Build Command**: `./build.sh`
- **Publish Directory**: `.next`
- **Node Version**: 18

### 3. النشر

1. اربط مستودع GitHub مع Netlify
2. اختر الفرع الرئيسي
3. أضف متغيرات البيئة
4. اضغط على "Deploy site"

## الأوامر المتاحة

```bash
# التطوير
npm run dev              # تشغيل خادم التطوير
npm run build            # بناء المشروع للإنتاج
npm run start            # تشغيل خادم الإنتاج
npm run lint             # فحص الكود
npm run lint:fix         # إصلاح أخطاء الكود
npm run type-check       # فحص أنواع TypeScript

# قاعدة البيانات
npm run db:generate      # توليد Prisma Client
npm run db:push          # دفع التغييرات لقاعدة البيانات
npm run db:migrate       # إنشاء migration جديد
npm run db:migrate:deploy # تشغيل migrations للإنتاج
npm run db:studio        # فتح Prisma Studio
npm run db:seed          # إضافة البيانات الأولية
npm run db:reset         # إعادة تعيين قاعدة البيانات
npm run db:setup         # إعداد قاعدة البيانات للإنتاج

# الصيانة
npm run clean            # تنظيف الملفات المؤقتة
npm run fresh            # إعادة تثبيت كامل
```

## هيكل المشروع

```
src/
├── app/                 # صفحات Next.js
│   ├── api/            # API Routes
│   ├── customers/      # صفحة العملاء
│   ├── units/          # صفحة الوحدات
│   ├── contracts/      # صفحة العقود
│   ├── partners/       # صفحة الشركاء
│   ├── safes/          # صفحة الخزائن
│   ├── treasury/       # صفحة الخزينة
│   ├── vouchers/       # صفحة الشيكات
│   ├── installments/   # صفحة الأقساط
│   ├── brokers/        # صفحة الوسطاء
│   ├── reports/        # صفحة التقارير
│   └── settings/       # صفحة الإعدادات
├── components/         # مكونات React
│   ├── ui/            # مكونات واجهة المستخدم
│   ├── forms/         # نماذج الإدخال
│   ├── tables/        # جداول البيانات
│   └── layout/        # مكونات التخطيط
├── lib/               # مكتبات مساعدة
│   ├── prisma.ts      # إعداد Prisma Client
│   ├── utils.ts       # دوال مساعدة
│   └── exportUtils.ts # أدوات التصدير
└── types/             # تعريفات TypeScript

prisma/
├── schema.prisma      # مخطط قاعدة البيانات
├── migrations/        # ملفات Migration
└── seed.ts           # بيانات أولية
```

## API Endpoints

### العملاء
- `GET /api/customers` - جلب جميع العملاء
- `POST /api/customers` - إنشاء عميل جديد
- `GET /api/customers/[id]` - جلب عميل محدد
- `PUT /api/customers/[id]` - تحديث عميل
- `DELETE /api/customers/[id]` - حذف عميل

### الوحدات
- `GET /api/units` - جلب جميع الوحدات
- `POST /api/units` - إنشاء وحدة جديدة
- `GET /api/units/[id]` - جلب وحدة محددة
- `PUT /api/units/[id]` - تحديث وحدة
- `DELETE /api/units/[id]` - حذف وحدة

### العقود
- `GET /api/contracts` - جلب جميع العقود
- `POST /api/contracts` - إنشاء عقد جديد
- `GET /api/contracts/[id]` - جلب عقد محدد
- `PUT /api/contracts/[id]` - تحديث عقد
- `DELETE /api/contracts/[id]` - حذف عقد

### الشركاء
- `GET /api/partners` - جلب جميع الشركاء
- `POST /api/partners` - إنشاء شريك جديد
- `GET /api/partners/[id]` - جلب شريك محدد
- `PUT /api/partners/[id]` - تحديث شريك
- `DELETE /api/partners/[id]` - حذف شريك

### الخزائن
- `GET /api/safes` - جلب جميع الخزائن
- `POST /api/safes` - إنشاء خزينة جديدة
- `GET /api/safes/[id]` - جلب خزينة محددة
- `PUT /api/safes/[id]` - تحديث خزينة
- `DELETE /api/safes/[id]` - حذف خزينة

### التحويلات
- `GET /api/transfers` - جلب جميع التحويلات
- `POST /api/transfers` - إنشاء تحويل جديد
- `GET /api/transfers/[id]` - جلب تحويل محدد
- `PUT /api/transfers/[id]` - تحديث تحويل
- `DELETE /api/transfers/[id]` - حذف تحويل

### الشيكات
- `GET /api/vouchers` - جلب جميع الشيكات
- `POST /api/vouchers` - إنشاء شيك جديد
- `GET /api/vouchers/[id]` - جلب شيك محدد
- `PUT /api/vouchers/[id]` - تحديث شيك
- `DELETE /api/vouchers/[id]` - حذف شيك

### الأقساط
- `GET /api/installments` - جلب جميع الأقساط
- `POST /api/installments` - إنشاء قسط جديد
- `GET /api/installments/[id]` - جلب قسط محدد
- `PUT /api/installments/[id]` - تحديث قسط
- `DELETE /api/installments/[id]` - حذف قسط

### الوسطاء
- `GET /api/brokers` - جلب جميع الوسطاء
- `POST /api/brokers` - إنشاء وسيط جديد
- `GET /api/brokers/[id]` - جلب وسيط محدد
- `PUT /api/brokers/[id]` - تحديث وسيط
- `DELETE /api/brokers/[id]` - حذف وسيط

### التقارير
- `GET /api/reports/dashboard` - إحصائيات لوحة التحكم

## التخصيص

### الألوان

يمكن تخصيص الألوان في `src/app/globals.css`:

```css
:root {
  --color-primary: #1a2b4c;     /* الأزرق الداكن */
  --color-secondary: #00a896;   /* التركوازي */
  --color-background: #f8f9fa;  /* الخلفية الفاتحة */
  --color-card-background: #ffffff; /* خلفية البطاقات */
}
```

### الخطوط

يمكن تخصيص الخطوط في `tailwind.config.js`:

```javascript
theme: {
  extend: {
    fontFamily: {
      'arabic': ['Cairo', 'sans-serif'],
    },
  },
}
```

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

إذا واجهت أي مشاكل أو لديك أسئلة، يرجى فتح issue في المستودع.

## التحديثات المستقبلية

- [ ] نظام المصادقة
- [ ] إدارة المستخدمين والصلاحيات
- [ ] تطبيق الهاتف المحمول
- [ ] تكامل مع أنظمة الدفع
- [ ] تقارير متقدمة
- [ ] إشعارات فورية
- [ ] نسخ احتياطية تلقائية