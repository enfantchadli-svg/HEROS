const { app, BrowserWindow, shell, Menu, session } = require('electron');
const path = require('path');
const APP_ID = 'com.heroes.future'; // نفس appId في package.json: هوية التطبيق في ويندوز (AppUserModelID)

// التطبيق محلي بالكامل؛ الصلاحية الوحيدة المسموحة هي نسخ نص إلى الحافظة (زر "نسخ الكود").
// كل شيء آخر (كاميرا، ميكروفون، موقع، إشعارات...) مرفوض افتراضياً.
const ALLOWED_PERMISSIONS = new Set(['clipboard-sanitized-write']);

// لا يُفتح خارج التطبيق إلا روابط https (مثل نتائج يوتيوب)، ولا يُفتح أي بروتوكول آخر (file: وsmb: ...).
function openExternalSafely(url) {
  try {
    if (new URL(url).protocol === 'https:') shell.openExternal(url);
  } catch (_) { /* رابط غير صالح: تجاهله */ }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 420,
    minHeight: 600,
    title: 'أبطال المستقبل',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged // أدوات المطوّر متاحة عند التجربة فقط، لا في النسخة المثبّتة
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'www', 'index.html'));

  // التطبيق صفحة واحدة لا تتنقل أبداً: أي محاولة فتح نافذة أو تنقل أو تحويل تُمنع داخل التطبيق،
  // وإن كانت رابط https تُفتح في المتصفح الافتراضي.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: 'deny' };
  });
  const blockNavigation = (event, url) => {
    event.preventDefault();
    openExternalSafely(url);
  };
  win.webContents.on('will-navigate', blockNavigation);
  win.webContents.on('will-redirect', blockNavigation);
}

// منع عناصر <webview> نهائياً (غير مستخدمة، وهي سطح هجوم معروف).
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault());
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId(APP_ID);
    const ses = session.defaultSession;
    ses.setPermissionRequestHandler((_wc, permission, callback) => callback(ALLOWED_PERMISSIONS.has(permission)));
    ses.setPermissionCheckHandler((_wc, permission) => ALLOWED_PERMISSIONS.has(permission));
    ses.setDevicePermissionHandler(() => false); // USB / HID / Serial / Bluetooth
    createWindow();
  });

  app.on('window-all-closed', () => app.quit());
}
