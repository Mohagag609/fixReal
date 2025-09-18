# دليل المساهمة

شكراً لك على اهتمامك بالمساهمة في نظام إدارة العقارات - مكة! نرحب بمساهماتك ونقدر وقتك وجهدك.

## كيفية المساهمة

### 1. الإبلاغ عن الأخطاء

إذا وجدت خطأ في النظام، يرجى:

1. التحقق من أن الخطأ لم يتم الإبلاغ عنه مسبقاً
2. إنشاء issue جديد مع:
   - وصف واضح للخطأ
   - خطوات إعادة إنتاج الخطأ
   - لقطات شاشة إن أمكن
   - معلومات النظام (نظام التشغيل، المتصفح، إلخ)

### 2. اقتراح ميزات جديدة

إذا كان لديك فكرة لميزة جديدة، يرجى:

1. التحقق من أن الميزة لم يتم اقتراحها مسبقاً
2. إنشاء issue جديد مع:
   - وصف مفصل للميزة
   - شرح الفوائد والاستخدام
   - أمثلة على الاستخدام إن أمكن

### 3. المساهمة بالكود

#### إعداد البيئة

1. Fork المشروع
2. Clone النسخة المنسوخة:
   ```bash
   git clone https://github.com/yourusername/makka.git
   cd makka
   ```

3. إنشاء بيئة افتراضية:
   ```bash
   python -m venv venv
   source venv/bin/activate  # على Windows: venv\Scripts\activate
   ```

4. تثبيت المتطلبات:
   ```bash
   pip install -r requirements-dev.txt
   ```

5. إعداد قاعدة البيانات:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. تشغيل الاختبارات:
   ```bash
   python manage.py test
   ```

#### إعداد Pre-commit

```bash
pre-commit install
```

#### سير العمل

1. إنشاء فرع جديد:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. إجراء التغييرات المطلوبة

3. تشغيل الاختبارات:
   ```bash
   python manage.py test
   ```

4. تشغيل فحص الجودة:
   ```bash
   make check
   ```

5. إضافة التغييرات:
   ```bash
   git add .
   git commit -m "Add: وصف التغيير"
   ```

6. دفع التغييرات:
   ```bash
   git push origin feature/your-feature-name
   ```

7. إنشاء Pull Request

## معايير الكود

### Python

- اتبع [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- استخدم [Black](https://black.readthedocs.io/) لتنسيق الكود
- استخدم [isort](https://pycqa.github.io/isort/) لترتيب الاستيرادات
- استخدم [flake8](https://flake8.pycqa.org/) لفحص الكود

### Django

- اتبع [Django Best Practices](https://docs.djangoproject.com/en/stable/topics/)
- استخدم أسماء واضحة ومفهومة
- أضف تعليقات للكود المعقد
- استخدم docstrings للوظائف والكلاسات

### HTML/CSS

- استخدم [Tailwind CSS](https://tailwindcss.com/) للتصميم
- اتبع معايير HTML5
- استخدم أسماء classes واضحة
- اجعل الكود متجاوب

### JavaScript

- استخدم [Alpine.js](https://alpinejs.dev/) للتفاعل
- اتبع معايير ES6+
- استخدم أسماء متغيرات واضحة
- تجنب الكود المكرر

## الاختبارات

### أنواع الاختبارات

1. **اختبارات الوحدة**: اختبار الوظائف الفردية
2. **اختبارات التكامل**: اختبار تفاعل المكونات
3. **اختبارات الأداء**: اختبار سرعة النظام
4. **اختبارات الأمان**: اختبار الثغرات الأمنية

### كتابة الاختبارات

```python
def test_customer_creation(self):
    """اختبار إنشاء عميل"""
    customer = Customer.objects.create(
        name="أحمد محمد",
        phone="0501234567"
    )
    self.assertEqual(customer.name, "أحمد محمد")
```

### تشغيل الاختبارات

```bash
# جميع الاختبارات
python manage.py test

# اختبارات محددة
python manage.py test realpp.tests.ModelTests

# اختبارات مع التغطية
pytest --cov=realpp
```

## التوثيق

### أنواع التوثيق

1. **توثيق الكود**: تعليقات و docstrings
2. **توثيق API**: وصف الوظائف والواجهات
3. **توثيق المستخدم**: دليل الاستخدام
4. **توثيق المطور**: دليل التطوير

### كتابة التوثيق

```python
def calculate_installment_status(installment):
    """
    حساب حالة القسط
    
    Args:
        installment: كائن القسط
        
    Returns:
        str: حالة القسط (Paid, Partially Paid, Unpaid)
    """
    if installment.paid_amount >= installment.due_amount:
        return "Paid"
    elif installment.paid_amount > 0:
        return "Partially Paid"
    else:
        return "Unpaid"
```

## مراجعة الكود

### معايير المراجعة

1. **الوظائف**: هل الكود يحقق الهدف المطلوب؟
2. **الأداء**: هل الكود سريع وفعال؟
3. **الأمان**: هل الكود آمن؟
4. **القراءة**: هل الكود واضح ومفهوم؟
5. **الاختبارات**: هل هناك اختبارات كافية؟

### عملية المراجعة

1. قراءة الكود بعناية
2. تشغيل الاختبارات
3. فحص الأمان
4. كتابة التعليقات
5. الموافقة أو طلب التغييرات

## الإصدارات

### تسمية الإصدارات

نستخدم [Semantic Versioning](https://semver.org/):

- **MAJOR**: تغييرات كبيرة غير متوافقة
- **MINOR**: ميزات جديدة متوافقة
- **PATCH**: إصلاحات متوافقة

### أمثلة

- `1.0.0` - الإصدار الأول
- `1.1.0` - إضافة ميزة جديدة
- `1.1.1` - إصلاح خطأ

## التواصل

### قنوات التواصل

- **GitHub Issues**: للأخطاء والاقتراحات
- **GitHub Discussions**: للمناقشات العامة
- **Email**: للتواصل المباشر

### آداب التواصل

1. كن محترفاً ومهذباً
2. استخدم اللغة العربية في التواصل
3. اكتب بوضوح ومفهوم
4. قدم معلومات كافية
5. كن صبوراً ومتفهماً

## الترخيص

بالمساهمة في هذا المشروع، فإنك توافق على أن مساهماتك ستكون مرخصة تحت رخصة MIT.

## شكر وتقدير

نقدر جميع المساهمات، سواء كانت:

- تقارير الأخطاء
- اقتراحات الميزات
- تحسينات الكود
- تحسينات التوثيق
- تحسينات الاختبارات
- تحسينات الأداء
- تحسينات الأمان

شكراً لك على مساهمتك في جعل هذا المشروع أفضل!

---

## روابط مفيدة

- [Django Documentation](https://docs.djangoproject.com/)
- [Python Style Guide](https://www.python.org/dev/peps/pep-0008/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)