#!/usr/bin/env node
/*
 * فحص أمان ساكن لملف www/index.html — يُشغَّل تلقائياً قبل كل بناء (npm run check).
 * الهدف: لأن كل تعديلاتك تتم في index.html وحده، فهذا الفحص ينبّهك فوراً إذا أُضيف شيء
 * سيحجبه الـCSP (فيظهر التطبيق فارغاً بصمت) أو يفتح باباً غير مقصود.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'www', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const errors = [];

// 1) وجود CSP وصرامته في الاتجاهات الحساسة
const m = html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]*)"/i);
if (!m) {
  errors.push("لا توجد وسمة Content-Security-Policy في <head>.");
} else {
  const csp = m[1];
  for (const d of ["default-src 'none'", "connect-src 'none'", "object-src 'none'", "frame-src 'none'", "base-uri 'none'"]) {
    if (!csp.includes(d)) errors.push(`CSP يجب أن يحتوي ${d}`);
  }
  if (/(^|[\s;])\*([\s;]|$)/.test(csp)) errors.push("CSP يحتوي علامة * (يسمح بكل المصادر).");
  if (/\shttp:(\s|;|$)/.test(csp)) errors.push("CSP يسمح بمصادر http غير مشفّرة.");
}

// 2) نطاقات خارجية مسموحة فقط
const ALLOWED_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'www.youtube.com', 'www.w3.org']);
const hosts = new Set([...html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map(x => x[1].toLowerCase()));
for (const h of hosts) {
  if (!ALLOWED_HOSTS.has(h)) errors.push(`نطاق خارجي غير مسموح: ${h} — أضفه إلى CSP وإلى ALLOWED_HOSTS في هذا الملف إن كان مقصوداً.`);
}

// 3) واجهات تتطلب الشبكة أو تحمّل مورداً خارجياً (سيحجبها connect-src 'none' / script-src)
const banned = [
  [/\bfetch\s*\(/, 'fetch()'], [/XMLHttpRequest/, 'XMLHttpRequest'], [/new\s+WebSocket/, 'WebSocket'],
  [/new\s+EventSource/, 'EventSource'], [/sendBeacon/, 'navigator.sendBeacon'],
  [/<script[^>]+\bsrc\s*=/i, '<script src=...>'], [/<iframe/i, '<iframe>'], [/<object|<embed/i, '<object>/<embed>'],
];
for (const [re, name] of banned) {
  if (re.test(html)) errors.push(`استخدام ${name} سيُحجب بسياسة CSP الحالية. عدّل CSP عمداً إن كنت تحتاجه (انظر SECURITY.md).`);
}

if (errors.length) {
  console.error('✗ فحص الأمان فشل:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ فحص الأمان نجح (CSP موجود، ${hosts.size} نطاقات خارجية مسموحة فقط، لا طلبات شبكة).`);
