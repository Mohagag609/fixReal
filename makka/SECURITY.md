# سياسة الأمان

نحن نأخذ الأمان على محمل الجد ونقدر جهود الباحثين الأمنيين في مساعدتنا على الحفاظ على أمان نظام إدارة العقارات.

## الإبلاغ عن الثغرات الأمنية

إذا اكتشفت ثغرة أمنية، يرجى **عدم** إنشاء issue عام. بدلاً من ذلك، يرجى:

1. إرسال بريد إلكتروني إلى: security@makka.com
2. أو استخدام [GitHub Security Advisories](https://github.com/yourusername/makka/security/advisories)

### معلومات مطلوبة

يرجى تضمين المعلومات التالية في تقريرك:

- وصف مفصل للثغرة
- خطوات إعادة إنتاج المشكلة
- التأثير المحتمل
- أي حلول أو اقتراحات

### استجابة الأمان

- سنقوم بالرد على تقريرك خلال 48 ساعة
- سنقوم بالتحقق من الثغرة خلال 7 أيام
- سنقوم بإصلاح الثغرة خلال 30 يوم
- سنقوم بإصدار تحديث أمني عند توفر الإصلاح

## الثغرات المعروفة

### الثغرات التي تم إصلاحها

| الإصدار | التاريخ | الوصف | الخطورة |
|---------|---------|--------|----------|
| 1.0.0 | 2024-01-01 | إصلاح ثغرة CSRF | عالية |
| 1.0.0 | 2024-01-01 | إصلاح ثغرة SQL Injection | عالية |
| 1.0.0 | 2024-01-01 | إصلاح ثغرة XSS | متوسطة |

### الثغرات قيد الإصلاح

| الوصف | الخطورة | الإصدار المتوقع |
|--------|----------|------------------|
| تحسين حماية الملفات | منخفضة | 1.0.1 |

## أفضل الممارسات الأمنية

### للمطورين

1. **تشفير كلمات المرور**
   ```python
   from django.contrib.auth.hashers import make_password
   password = make_password('user_password')
   ```

2. **حماية CSRF**
   ```html
   {% csrf_token %}
   ```

3. **التحقق من البيانات**
   ```python
   from django.core.exceptions import ValidationError
   
   def validate_phone(value):
       if not value.isdigit():
           raise ValidationError('رقم الهاتف يجب أن يحتوي على أرقام فقط')
   ```

4. **استخدام HTTPS**
   ```python
   SECURE_SSL_REDIRECT = True
   SECURE_HSTS_SECONDS = 31536000
   ```

5. **تحديث المكتبات**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

### للمستخدمين

1. **استخدام كلمات مرور قوية**
   - 8 أحرف على الأقل
   - مزيج من الأحرف والأرقام والرموز
   - تجنب المعلومات الشخصية

2. **تحديث النظام بانتظام**
   - تثبيت التحديثات الأمنية
   - تحديث المتصفح
   - تحديث نظام التشغيل

3. **النسخ الاحتياطية**
   - إنشاء نسخ احتياطية منتظمة
   - تخزين النسخ في مكان آمن
   - اختبار استعادة النسخ

4. **مراقبة النشاط**
   - مراجعة سجلات النظام
   - مراقبة محاولات الدخول
   - الإبلاغ عن الأنشطة المشبوهة

## إعدادات الأمان

### Django Settings

```python
# الأمان
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# الجلسات
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# كلمات المرور
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

### Nginx Settings

```nginx
# حماية من XSS
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header Referrer-Policy "strict-origin-when-cross-origin";

# حماية من Clickjacking
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";

# حماية من MIME sniffing
add_header X-Content-Type-Options nosniff;

# حماية من Information disclosure
server_tokens off;
```

## مراجعة الأمان

### فحص الأمان التلقائي

```bash
# فحص المكتبات
safety check

# فحص الكود
bandit -r .

# فحص التبعيات
pip-audit
```

### فحص الأمان اليدوي

1. **فحص الثغرات**
   - SQL Injection
   - XSS (Cross-Site Scripting)
   - CSRF (Cross-Site Request Forgery)
   - Authentication bypass
   - Authorization bypass

2. **فحص التكوين**
   - إعدادات قاعدة البيانات
   - إعدادات الخادم
   - إعدادات الشبكة
   - إعدادات التطبيق

3. **فحص البيانات**
   - تشفير البيانات الحساسة
   - حماية الملفات
   - النسخ الاحتياطية
   - استعادة البيانات

## التدريب الأمني

### للمطورين

1. **دورة Django Security**
   - حماية CSRF
   - حماية XSS
   - حماية SQL Injection
   - إدارة الجلسات

2. **دورة Web Security**
   - OWASP Top 10
   - Secure Coding
   - Security Testing
   - Incident Response

### للمستخدمين

1. **دورة الأمان الأساسية**
   - كلمات المرور
   - التصيد الاحتيالي
   - البرمجيات الخبيثة
   - الشبكات الآمنة

2. **دورة إدارة النظام**
   - النسخ الاحتياطية
   - التحديثات
   - المراقبة
   - الاستجابة للحوادث

## الاستجابة للحوادث

### خطة الاستجابة

1. **التعرف على الحادث**
   - مراقبة النظام
   - تحليل السجلات
   - تحديد نطاق الحادث

2. **احتواء الحادث**
   - عزل الأنظمة المتأثرة
   - منع انتشار الحادث
   - الحفاظ على الأدلة

3. **استئصال الحادث**
   - إزالة التهديد
   - إصلاح الثغرات
   - استعادة الأنظمة

4. **الاسترداد**
   - اختبار الأنظمة
   - مراقبة الأداء
   - توثيق الدروس المستفادة

### جهات الاتصال

- **فريق الأمان**: security@makka.com
- **فريق التطوير**: dev@makka.com
- **فريق العمليات**: ops@makka.com
- **الإدارة**: admin@makka.com

## التحديثات الأمنية

### جدول التحديثات

- **التحديثات الحرجة**: خلال 24 ساعة
- **التحديثات العالية**: خلال 7 أيام
- **التحديثات المتوسطة**: خلال 30 يوم
- **التحديثات المنخفضة**: خلال 90 يوم

### إشعارات الأمان

- **البريد الإلكتروني**: للمستخدمين المسجلين
- **الموقع**: إشعارات على الموقع
- **GitHub**: إشعارات في المستودع
- **وسائل التواصل**: للثغرات الحرجة

## الشكر والتقدير

نقدر جهود الباحثين الأمنيين الذين يساعدوننا في الحفاظ على أمان النظام. سنقوم بتكريم المساهمين في:

- صفحة الأمان
- تقرير الأمان السنوي
- مؤتمرات الأمان
- وسائل التواصل الاجتماعي

---

## روابط مفيدة

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)