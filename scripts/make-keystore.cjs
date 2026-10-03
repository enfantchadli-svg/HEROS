#!/usr/bin/env node
/*
 * ينشئ مفتاح توقيع أندرويد (مرة واحدة في عمر التطبيق) ويجهّز القيم الأربع لأسرار GitHub.
 * المتطلب: JDK مثبّت (الأمر keytool). يأتي مع Android Studio أيضاً.
 * الاستخدام:   npm run keystore
 * الناتج في المجلد الحالي:
 *   heroes-release.jks     ← المفتاح نفسه. احتفظ بنسخة خارج GitHub (فقدانه = لا تحديثات للتطبيق).
 *   keystore-secrets.txt   ← القيم التي تلصقها في GitHub Secrets. احذفه بعد النسخ.
 * الملفان مُدرجان في .gitignore حتى لا يُرفعا بالخطأ.
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const jks = path.join(process.cwd(), 'heroes-release.jks');
const secrets = path.join(process.cwd(), 'keystore-secrets.txt');
const alias = 'heroes';

if (fs.existsSync(jks) || fs.existsSync(secrets)) {
  console.error('✗ heroes-release.jks أو keystore-secrets.txt موجود بالفعل. لن أكتب فوقه (فقدان المفتاح القديم يعني عدم إمكانية تحديث التطبيق).');
  process.exit(1);
}

const password = crypto.randomBytes(18).toString('base64url'); // 24 رمزاً بلا رموز تُربك الصدفة
try {
  execFileSync('keytool', [
    '-genkeypair', '-v', '-keystore', jks, '-alias', alias,
    '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10000',
    '-storepass:env', 'HK_PW', '-keypass:env', 'HK_PW', // كلمة السر عبر متغير بيئة لا وسيط أمر (لا تظهر في قائمة العمليات)
    '-dname', 'CN=Heroes Future'
  ], { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, HK_PW: password } });
} catch (e) {
  console.error('✗ تعذّر تشغيل keytool. ثبّت JDK 17 (أو Android Studio) ثم أعد المحاولة.');
  process.exit(1);
}

const b64 = fs.readFileSync(jks).toString('base64');
fs.writeFileSync(secrets,
`أنشئ أربعة أسرار في GitHub: Settings ← Secrets and variables ← Actions ← New repository secret

الاسم:  ANDROID_KEYSTORE_BASE64
القيمة: ${b64}

الاسم:  ANDROID_KEYSTORE_PASSWORD
القيمة: ${password}

الاسم:  ANDROID_KEY_ALIAS
القيمة: ${alias}

الاسم:  ANDROID_KEY_PASSWORD
القيمة: ${password}
`, { mode: 0o600 });

console.log('\n✓ تم إنشاء المفتاح.');
console.log('  1) انسخ heroes-release.jks إلى مكان آمن خارج GitHub (فلاشة / مدير كلمات مرور).');
console.log('  2) افتح keystore-secrets.txt والصق القيم الأربع في GitHub Secrets، ثم احذف الملف.');
