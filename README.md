# أبطال المستقبل v1.0

## تجربة فورية
افتح `www/index.html` في أي متصفح (كروم/إيدج/سفاري). هذا هو التطبيق كله، وكل التعديلات تتم في هذا الملف فقط.
> إن أضفت مصدراً خارجياً (سكربت، صورة من الإنترنت، طلب شبكة) فعدّل سياسة الأمان أعلى الملف أولاً. وإلا سيفشل `npm run check` ويخبرك بالسبب. التفاصيل في `SECURITY.md`.

## ⚠️ اقرأ هذا أولاً: لماذا كانت الأجهزة تعتبر التطبيق غير آمن؟
لأن نسخة أندرويد كانت **debug** وملفات ويندوز **بلا توقيع**. الحل وخطواته الكاملة في **[SECURITY.md](SECURITY.md)**. باختصار، مرة واحدة فقط:
1. `npm install` ثم `npm run keystore` (يلزم JDK) ← ينشئ مفتاح التوقيع ويجهّز القيم.
2. الصق القيم الأربع في GitHub: Settings ← Secrets and variables ← Actions. **واحفظ `heroes-release.jks` خارج GitHub.**

## بناء APK وWindows بلا تثبيت شيء (GitHub Actions)
1. أنشئ مستودعاً جديداً على github.com وارفع **محتويات** هذا المجلد (وليس المجلد نفسه).
   تأكد أن المجلد المخفي `.github` والملف `capacitor.config.json` (بنقطة، لا شرطة سفلية) موجودان.
2. نفّذ خطوات التوقيع أعلاه (أندرويد).
3. افتح تبويب **Actions** ثم **Build apps** ثم **Run workflow**.
4. بعد دقائق نزّل من Artifacts: `heroes-android-apk` (APK موقّع) و`heroes-windows` (Setup وPortable).
5. **لنشر نسخة للمستخدمين:** `git tag v0.9.1` ثم `git push origin v0.9.1` ← تظهر الملفات في صفحة **Releases** مع `SHA256SUMS.txt`.
6. أندرويد: انسخ الـAPK للهاتف وافتحه. إن ظهر تنبيه Play Protect فاختر «التثبيت على أي حال».
   **أول مرة بعد هذا التحديث يجب حذف النسخة القديمة من الهاتف أولاً (يمسح البيانات المحلية)**، التفاصيل في SECURITY.md.
   ويندوز: شغّل `Heroes-Setup-<الإصدار>-x64.exe` (أو `Heroes-Portable-...` للنسخة المحمولة)؛ إن ظهرت شاشة SmartScreen فاختر «مزيد من المعلومات ثم تشغيل على أي حال».

## البناء على جهازك
ثبّت Node.js 20 ثم:
- ويندوز: `npm install` ثم `npm start` للتجربة، و`npm run build:win` للبناء (الناتج في dist/).
- أندرويد (يلزم Android Studio): `npm install` ثم `npx cap add android` ثم `npm run android:harden` ثم `npx cap sync android` ثم `npx cap open android` ثم Build > Generate Signed Bundle / APK **واختر Release** (لا Debug) مع مفتاحك.
