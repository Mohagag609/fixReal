# نظام المحاسبة - Accounting System

نظام محاسبي متطور لإدارة العقارات والعقود مبني باستخدام Next.js و Prisma.

## المميزات

- 🏠 **إدارة الوحدات العقارية** - إضافة وتعديل وحذف الوحدات
- 👥 **إدارة العملاء** - قاعدة بيانات شاملة للعملاء
- 📋 **إدارة العقود** - إنشاء وإدارة عقود البيع
- 💰 **إدارة الخزائن** - تتبع الأرصدة المالية
- 🧾 **إدارة الشيكات** - تسجيل الواردات والمصروفات
- 📊 **التقارير** - لوحة تحكم شاملة مع الإحصائيات
- 🎨 **واجهة حديثة** - تصميم عصري مع Framer Motion
- 📱 **متجاوب** - يعمل على جميع الأجهزة

## التقنيات المستخدمة

### Backend
- **Next.js 15** - إطار عمل React
- **TypeScript** - لغة البرمجة
- **Prisma** - ORM لقاعدة البيانات
- **SQLite** - قاعدة البيانات للتطوير
- **PostgreSQL** - قاعدة البيانات للإنتاج

### Frontend
- **React 19** - مكتبة واجهة المستخدم
- **TailwindCSS** - إطار عمل CSS
- **Framer Motion** - مكتبة الحركات
- **React Hook Form** - إدارة النماذج
- **Zod** - التحقق من البيانات
- **TanStack Table** - جداول البيانات

## التثبيت والتشغيل

### المتطلبات
- Node.js 18+ 
- npm أو yarn

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd new-accounting-system
```

### 2. تثبيت الحزم
```bash
npm install
```

### 3. إعداد قاعدة البيانات

#### للتطوير (SQLite)
```bash
# إنشاء قاعدة البيانات
npx prisma db push

# إضافة بيانات تجريبية
npm run db:seed
```

#### للإنتاج (PostgreSQL)
1. قم بتعديل ملف `.env`:
```env
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://username:password@localhost:5432/accounting_system"
```

2. تشغيل المايجريشن:
```bash
npx prisma migrate dev
```

### 4. تشغيل المشروع
```bash
# للتطوير
npm run dev

# للبناء
npm run build
npm run start
```

## هيكل المشروع

```
src/
├── app/                    # صفحات Next.js
│   ├── api/               # API routes
│   ├── customers/         # صفحة العملاء
│   ├── units/            # صفحة الوحدات
│   ├── contracts/        # صفحة العقود
│   ├── safes/            # صفحة الخزائن
│   ├── vouchers/         # صفحة الشيكات
│   └── page.tsx          # الصفحة الرئيسية
├── components/            # مكونات React
│   ├── ui/               # مكونات واجهة المستخدم
│   ├── forms/            # نماذج البيانات
│   ├── tables/           # جداول البيانات
│   └── layout/           # مكونات التخطيط
├── lib/                  # مكتبات مساعدة
│   ├── prisma.ts         # Prisma Client
│   └── utils.ts          # دوال مساعدة
└── types/                # تعريفات TypeScript
```

## قاعدة البيانات

### النماذج الرئيسية

- **Customer** - العملاء
- **Unit** - الوحدات العقارية
- **Contract** - العقود
- **Safe** - الخزائن
- **Voucher** - الشيكات
- **Installment** - الأقساط
- **Partner** - الشركاء

### العلاقات

- العميل يمكن أن يكون له عدة عقود
- الوحدة يمكن أن تكون مرتبطة بعدة عقود
- الخزينة تحتوي على عدة شيكات
- العقد يمكن أن يكون له عدة أقساط

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

### الخزائن
- `GET /api/safes` - جلب جميع الخزائن
- `POST /api/safes` - إنشاء خزينة جديدة
- `GET /api/safes/[id]` - جلب خزينة محددة
- `PUT /api/safes/[id]` - تحديث خزينة
- `DELETE /api/safes/[id]` - حذف خزينة

### الشيكات
- `GET /api/vouchers` - جلب جميع الشيكات
- `POST /api/vouchers` - إنشاء شيك جديد
- `GET /api/vouchers/[id]` - جلب شيك محدد
- `PUT /api/vouchers/[id]` - تحديث شيك
- `DELETE /api/vouchers/[id]` - حذف شيك

### التقارير
- `GET /api/reports/dashboard` - بيانات لوحة التحكم

## التخصيص

### الألوان
يمكن تخصيص الألوان من خلال ملف `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',    // الأزرق الأساسي
        secondary: '#0d9488',  // التركواز الثانوي
      }
    }
  }
}
```

### الخطوط
يمكن تغيير الخطوط من خلال ملف `layout.tsx`:

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
```

## النشر

### Vercel
1. اربط المشروع بـ Vercel
2. أضف متغيرات البيئة
3. انشر المشروع

### Docker
```bash
# بناء الصورة
docker build -t accounting-system .

# تشغيل الحاوية
docker run -p 3000:3000 accounting-system
```

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. إنشاء Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

للحصول على الدعم، يرجى فتح issue في GitHub أو التواصل عبر البريد الإلكتروني.

---

تم تطوير هذا المشروع باستخدام أحدث التقنيات لضمان الأداء والموثوقية.