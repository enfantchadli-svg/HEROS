# أبطال المستقبل – تطبيق أندرويد + ويندوز

## الطريقة الأسهل (بدون تثبيت شيء): GitHub Actions
1. أنشئ مستودعًا جديدًا على GitHub وارفع محتويات هذا المجلد كاملة.
2. افتح تبويب Actions ← Build apps ← Run workflow.
3. بعد دقائق نزّل من Artifacts:
   - heroes-android-apk  → ملف APK للتثبيت على أندرويد
   - heroes-windows      → ملف Setup.exe (مثبّت) وملف Portable.exe

## البناء على جهازك
**ويندوز:** ثبّت Node.js ثم:
    npm install
    npm start            # تجربة
    npm run build:win    # الناتج في dist/

**أندرويد:** ثبّت Node.js و Android Studio ثم:
    npm install
    npx cap add android
    npx cap sync android
    npx cap open android   # ثم Build > Build APK

## تعديل التطبيق
عدّل الملف www/index.html فقط، ثم أعد البناء.

## الأيقونة
ملفات الأيقونة في مجلد assets (للأندرويد) و build (لويندوز). تُطبَّق تلقائيًا عند البناء.
