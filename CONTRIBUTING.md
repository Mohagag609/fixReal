# 🤝 دليل المساهمة

نرحب بمساهماتكم في تطوير نظام إدارة العقارات المتطور!

## 🚀 كيفية المساهمة

### 1. Fork المشروع
- اضغط على زر "Fork" في أعلى الصفحة
- استنسخ المشروع إلى حسابك الشخصي

### 2. إنشاء فرع جديد
```bash
git checkout -b feature/your-feature-name
```

### 3. إجراء التغييرات
- قم بالتعديلات المطلوبة
- تأكد من اتباع معايير الكود
- أضف اختبارات إذا لزم الأمر

### 4. اختبار التغييرات
```bash
npm run build
npm run lint
npm run type-check
```

### 5. رفع التغييرات
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 6. إنشاء Pull Request
- اذهب إلى صفحة المشروع
- اضغط على "New Pull Request"
- اكتب وصفاً واضحاً للتغييرات

## 📋 معايير الكود

### TypeScript
- استخدم TypeScript لجميع الملفات
- اكتب types واضحة ومفصلة
- تجنب استخدام `any` قدر الإمكان

### React Components
- استخدم functional components
- استخدم hooks بدلاً من class components
- اكتب props interfaces واضحة

### Styling
- استخدم Tailwind CSS
- اتبع design system الموجود
- تأكد من responsive design

### API Routes
- استخدم Zod للتحقق من البيانات
- أضف error handling شامل
- اكتب documentation للـ endpoints

## 🐛 الإبلاغ عن الأخطاء

### كيفية الإبلاغ
1. اذهب إلى صفحة Issues
2. اضغط على "New Issue"
3. اختر "Bug Report"
4. املأ النموذج بالتفاصيل

### معلومات مطلوبة
- وصف المشكلة
- خطوات إعادة إنتاج المشكلة
- المتوقع مقابل ما يحدث فعلاً
- لقطات شاشة إن أمكن
- معلومات النظام

## ✨ اقتراح ميزات جديدة

### كيفية الاقتراح
1. اذهب إلى صفحة Issues
2. اضغط على "New Issue"
3. اختر "Feature Request"
4. املأ النموذج بالتفاصيل

### معلومات مطلوبة
- وصف الميزة المقترحة
- سبب الحاجة لهذه الميزة
- كيف ستساعد المستخدمين
- أمثلة على الاستخدام

## 📚 التوثيق

### إضافة توثيق
- اكتب README واضح للميزات الجديدة
- أضف تعليقات في الكود
- حدث API documentation

### ترجمة التوثيق
- ساعد في ترجمة التوثيق للعربية
- تحقق من صحة الترجمة
- اقترح تحسينات في الصياغة

## 🔧 التطوير المحلي

### إعداد البيئة
```bash
# استنساخ المشروع
git clone <repository-url>
cd estate-management-system-v2-clean

# تثبيت التبعيات
npm install

# إعداد قاعدة البيانات
npm run db:setup

# تشغيل المشروع
npm run dev
```

### الاختبار
```bash
# فحص الكود
npm run lint
npm run type-check

# بناء المشروع
npm run build
```

## 📝 معايير Commit Messages

### التنسيق
```
type: description

Detailed description if needed
```

### الأنواع
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تحديث التوثيق
- `style`: تنسيق الكود
- `refactor`: إعادة هيكلة الكود
- `test`: إضافة اختبارات
- `chore`: مهام الصيانة

### أمثلة
```
feat: add customer search functionality
fix: resolve database connection issue
docs: update API documentation
style: format code with prettier
```

## 🎯 أولويات التطوير

### عالية الأولوية
- إصلاح الأخطاء الحرجة
- تحسين الأداء
- إضافة اختبارات
- تحسين الأمان

### متوسطة الأولوية
- ميزات جديدة
- تحسين UI/UX
- تحسين التوثيق
- تحسين التوافق

### منخفضة الأولوية
- تحسينات طفيفة
- إضافة ميزات اختيارية
- تحسينات في الكود

## 📞 التواصل

### قنوات التواصل
- GitHub Issues للمناقشات العامة
- GitHub Discussions للأسئلة
- Pull Request comments للمراجعة

### قواعد التواصل
- كن محترفاً ومهذباً
- استخدم اللغة العربية أو الإنجليزية
- قدم نقداً بناءً ومفيداً
- احترم آراء الآخرين

## 🙏 شكر وتقدير

نقدر جميع المساهمات مهما كانت صغيرة! كل مساهمة تساعد في تحسين المشروع.

---

**شكراً لمساهمتكم في تطوير نظام إدارة العقارات المتطور! 🎉**