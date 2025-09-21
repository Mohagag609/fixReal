# دليل النشر على Render

## إعداد Backend (Laravel)

### 1. إنشاء Web Service جديد
- اختر "Web Service" من لوحة Render
- اربط المستودع GitHub
- اختر الفرع المطلوب

### 2. إعداد Build & Deploy
- **Build Command**: 
  ```bash
  composer install --no-dev --prefer-dist && php artisan migrate --force && php artisan config:cache
  ```
- **Start Command**: 
  ```bash
  php artisan serve --host=0.0.0.0 --port=$PORT
  ```

### 3. متغيرات البيئة
```env
APP_NAME="Estate Management System"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://your-app-name.onrender.com

DB_CONNECTION=mysql
DB_HOST=your-mysql-host
DB_PORT=3306
DB_DATABASE=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

### 4. إعداد قاعدة البيانات
- استخدم MySQL من Render أو أي مزود آخر
- تأكد من إعداد متغيرات البيئة قبل النشر
- ستعمل المايجريشن تلقائياً عند النشر

## إعداد Frontend (Angular)

### 1. إنشاء Static Site
- اختر "Static Site" من لوحة Render
- اربط المستودع GitHub
- اختر الفرع المطلوب

### 2. إعداد Build
- **Build Command**: 
  ```bash
  npm ci && npm run build
  ```
- **Publish Directory**: `dist/estate-management`

### 3. متغيرات البيئة
```env
API_URL=https://your-backend-app.onrender.com/api
```

### 4. تحديث Environment
تأكد من تحديث `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-app.onrender.com/api'
};
```

## خطوات النشر

### 1. إعداد المستودع
```bash
git add .
git commit -m "Initial commit - Estate Management System"
git push origin main
```

### 2. نشر Backend
1. اذهب إلى Render Dashboard
2. اضغط "New +" → "Web Service"
3. اربط المستودع
4. اختر "backend" كـ Root Directory
5. أضف متغيرات البيئة
6. اضغط "Create Web Service"

### 3. نشر Frontend
1. اذهب إلى Render Dashboard
2. اضغط "New +" → "Static Site"
3. اربط المستودع
4. اختر "frontend" كـ Root Directory
5. أضف متغيرات البيئة
6. اضغط "Create Static Site"

### 4. تحديث Frontend Environment
بعد نشر Backend، احصل على URL الخاص به وحدث Frontend:
```bash
cd frontend
# تحديث environment.prod.ts
git add .
git commit -m "Update API URL for production"
git push origin main
```

## اختبار النشر

### 1. اختبار Backend
```bash
curl https://your-backend-app.onrender.com/api/health
```

### 2. اختبار Frontend
- اذهب إلى URL الخاص بـ Frontend
- تأكد من تحميل البيانات من API
- اختبر الوظائف الأساسية

## استكشاف الأخطاء

### Backend Issues
- تحقق من logs في Render Dashboard
- تأكد من صحة متغيرات البيئة
- تحقق من اتصال قاعدة البيانات

### Frontend Issues
- تحقق من console في المتصفح
- تأكد من صحة API URL
- تحقق من CORS settings في Laravel

## تحسين الأداء

### Backend
- استخدم Redis للـ Cache
- فعّل OPcache
- استخدم CDN للـ Assets

### Frontend
- فعّل Gzip compression
- استخدم CDN
- فعّل Service Worker

## المراقبة

- استخدم Render Metrics لمراقبة الأداء
- أضف Health Checks
- راقب استخدام قاعدة البيانات
- راقب استجابة API

## النسخ الاحتياطية

- فعّل النسخ الاحتياطية لقاعدة البيانات
- احتفظ بنسخة من الكود
- وثق إعدادات البيئة

## التحديثات

### Backend
```bash
git add .
git commit -m "Update backend"
git push origin main
# سيتم النشر تلقائياً
```

### Frontend
```bash
git add .
git commit -m "Update frontend"
git push origin main
# سيتم النشر تلقائياً
```