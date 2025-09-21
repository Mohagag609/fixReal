# 🚀 Next.js Dashboard with PostgreSQL

لوحة تحكم حديثة ومتطورة تم تطويرها باستخدام Next.js 14 و TypeScript و PostgreSQL.

## ✨ المميزات

- **واجهة حديثة**: تصميم عصري ومتجاوب مع جميع الأجهزة
- **قاعدة بيانات قوية**: PostgreSQL مع اتصال محلي
- **TypeScript**: كود آمن ومنظم
- **Tailwind CSS**: تصميم سريع وجميل
- **Dark Mode**: دعم الوضع المظلم والفاتح
- **مكونات UI**: مكتبة shadcn/ui للمكونات
- **رسوم بيانية**: إحصائيات وتقارير تفاعلية

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL, pg (node-postgres)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Code Quality**: ESLint, Prettier

## 🚀 التثبيت والتشغيل

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد قاعدة البيانات
تأكد من تشغيل PostgreSQL على الجهاز المحلي:
```bash
# إنشاء قاعدة البيانات
createdb dashboard_db

# أو باستخدام psql
psql -U postgres -c "CREATE DATABASE dashboard_db;"
```

### 3. إعداد متغيرات البيئة
انسخ ملف `.env.local` وعدل القيم حسب إعداداتك:
```bash
cp .env.local.example .env.local
```

### 4. تشغيل المشروع
```bash
npm run dev
```

افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

## 📁 بنية المشروع

```
src/
├── app/                    # صفحات Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # صفحة لوحة التحكم
│   ├── customers/         # صفحة العملاء
│   ├── invoices/          # صفحة الفواتير
│   ├── transactions/      # صفحة المعاملات
│   └── products/          # صفحة المنتجات
├── components/            # مكونات UI
│   └── ui/               # مكونات أساسية
├── features/             # ميزات المشروع
│   ├── customers/        # ميزة العملاء
│   ├── invoices/         # ميزة الفواتير
│   ├── transactions/     # ميزة المعاملات
│   └── products/         # ميزة المنتجات
├── lib/                  # مكتبات مساعدة
│   ├── db.ts            # اتصال قاعدة البيانات
│   └── utils.ts         # دوال مساعدة
└── utils/               # دوال الحسابات
    └── calculations.ts  # العمليات الحسابية
```

## 🎨 المكونات المتاحة

- **Button**: أزرار بتصميمات مختلفة
- **Input**: حقول إدخال النصوص
- **Card**: بطاقات لعرض المحتوى
- **Sidebar**: شريط جانبي للتنقل
- **Navbar**: شريط علوي مع البحث والإعدادات

## 📊 الصفحات المتاحة

- **الرئيسية**: صفحة الترحيب مع روابط سريعة
- **لوحة التحكم**: إحصائيات وتقارير شاملة
- **العملاء**: إدارة بيانات العملاء
- **الفواتير**: إنشاء وإدارة الفواتير
- **المعاملات**: تتبع المعاملات المالية
- **المنتجات**: إدارة المخزون والمنتجات

## 🔧 التطوير

### تشغيل في وضع التطوير
```bash
npm run dev
```

### بناء المشروع للإنتاج
```bash
npm run build
npm start
```

### فحص الكود
```bash
npm run lint
npm run type-check
```

## 📝 ملاحظات مهمة

- تأكد من تشغيل PostgreSQL قبل تشغيل المشروع
- المشروع مصمم للعمل محلياً فقط (بدون نظام مصادقة)
- جميع البيانات محفوظة في قاعدة البيانات المحلية
- يدعم اللغة العربية بالكامل مع اتجاه RTL

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى:
1. عمل Fork للمشروع
2. إنشاء branch جديد للميزة
3. عمل Commit للتغييرات
4. عمل Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

تم التطوير بـ ❤️ باستخدام Next.js و TypeScript