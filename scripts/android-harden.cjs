#!/usr/bin/env node
/*
 * يُشغَّل بعد "npx cap add android" وقبل البناء. يعدّل مشروع أندرويد المُولَّد تلقائياً:
 *  1) يعطّل النسخ الاحتياطي التلقائي (allowBackup) فلا تتسرب بيانات الحسابات إلى حساب جوجل/ADB.
 *  2) يمنع الاتصال غير المشفّر (cleartext) على مستوى النظام عبر network_security_config.
 *  3) يضبط versionCode/versionName: بدون versionCode متصاعد يرفض أندرويد تحديث التطبيق فوق نسخة مثبّتة.
 * يفشل بصوت عالٍ (exit 1) إن لم يجد ما يعدّله، كي لا يُنتَج بناء غير محكم بصمت.
 */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const androidDir = path.join(cwd, 'android');
const manifestPath = path.join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const gradlePath = path.join(androidDir, 'app', 'build.gradle');
const xmlDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');

const fail = (msg) => { console.error('✗ android-harden: ' + msg); process.exit(1); };
for (const p of [manifestPath, gradlePath]) if (!fs.existsSync(p)) fail(`الملف غير موجود: ${p} — هل شغّلت "npx cap add android" أولاً؟`);

// ---------- AndroidManifest.xml ----------
let manifest = fs.readFileSync(manifestPath, 'utf8');
const tagMatch = manifest.match(/<application\b[^>]*>/);
if (!tagMatch) fail('لم أجد وسم <application> في AndroidManifest.xml');
const originalTag = tagMatch[0];
if (/android:debuggable\s*=\s*"true"/.test(originalTag)) fail('وُجد android:debuggable="true" في الـManifest');

let tag = originalTag;
const setAttr = (name, value) => {
  const re = new RegExp('\\s' + name + '\\s*=\\s*"[^"]*"');
  tag = re.test(tag)
    ? tag.replace(re, () => ` ${name}="${value}"`)
    : tag.replace(/<application\b/, () => `<application\n        ${name}="${value}"`);
};
setAttr('android:allowBackup', 'false');
setAttr('android:usesCleartextTraffic', 'false');
setAttr('android:networkSecurityConfig', '@xml/network_security_config');
manifest = manifest.replace(originalTag, () => tag);
fs.writeFileSync(manifestPath, manifest);

fs.mkdirSync(xmlDir, { recursive: true });
fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'),
`<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- لا اتصال غير مشفّر، ولا الوثوق إلا بشهادات النظام (لا شهادات يضيفها المستخدم). -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
`);

// ---------- app/build.gradle ----------
const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
const versionName = String(pkg.version || '');
if (!/^[0-9A-Za-z.+-]+$/.test(versionName)) fail(`نسق version غير صالح في package.json: "${versionName}"`);
// عدد الدقائق منذ 1970: رقم متصاعد دائماً حتى لو أُعيد إنشاء المستودع (حدّه الأقصى لأندرويد 2.1 مليار).
const versionCode = parseInt(process.env.VERSION_CODE || String(Math.floor(Date.now() / 60000)), 10);
if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) fail(`versionCode غير صالح: ${versionCode}`);

let gradle = fs.readFileSync(gradlePath, 'utf8');
if (!/versionCode\s+\d+/.test(gradle)) fail('لم أجد "versionCode N" في app/build.gradle (تغيّر قالب Capacitor؟)');
if (!/versionName\s+"[^"]*"/.test(gradle)) fail('لم أجد versionName "..." في app/build.gradle (تغيّر قالب Capacitor؟)');
gradle = gradle.replace(/versionCode\s+\d+/, () => `versionCode ${versionCode}`)
               .replace(/versionName\s+"[^"]*"/, () => `versionName "${versionName}"`);
fs.writeFileSync(gradlePath, gradle);

// ---------- تحقق نهائي ----------
const mf = fs.readFileSync(manifestPath, 'utf8');
const gr = fs.readFileSync(gradlePath, 'utf8');
const ok = /android:allowBackup="false"/.test(mf) && /android:usesCleartextTraffic="false"/.test(mf) &&
  /android:networkSecurityConfig="@xml\/network_security_config"/.test(mf) &&
  gr.includes(`versionCode ${versionCode}`) && gr.includes(`versionName "${versionName}"`);
if (!ok) fail('فشل التحقق النهائي بعد التعديل');
console.log(`✓ android-harden: allowBackup=false, cleartext=false, networkSecurityConfig، versionName=${versionName}, versionCode=${versionCode}`);
