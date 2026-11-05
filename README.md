# Codak Agency — Vanilla HTML, CSS, JavaScript

الموقع يعيد إنتاج النسخة المنشورة الأصلية من صفحات React كـ HTML/CSS/JavaScript من دون React في الواجهة. هيكل الصفحات يطابق سلوك الموقع القديم: الصفحة الرئيسية تحتوي الخدمات والأعمال والفريق والأسئلة الشائعة، وصفحتا التواصل وبدء المشروع منفصلتان. روابط الخدمات والأعمال والفريق تنتقل إلى أقسام الرئيسية.

اللغات والمسارات: `/en/` و`/ar/` و`/fr/` و`/es/` و`/de/`، ولكل لغة صفحتا `/contact/` و`/quote/`. العربية RTL وباقي اللغات LTR. ملفات HTML داخل `site/`، CSS داخل `css/`، JavaScript داخل `js/`، والأصول الأصلية داخل `public/`.

## التشغيل المحلي

1. ثبّت Node.js 18 أو أحدث.
2. انسخ `backend/.env.example` إلى `backend/.env`.
3. ضع `BOT_TOKEN` و`ADMIN_CHAT_ID` في `backend/.env`، واترك `ALLOWED_ORIGIN=https://codak-agency.online` و`PORT=3000` للتشغيل المحلي.
4. من مجلد `CODAK-Agency` شغّل `npm install` ثم `npm start`.
5. افتح `http://localhost:3000` أو `http://localhost:3000/ar/`.
6. فحص الخادم: `curl http://localhost:3000/api/health`.
7. جرّب طلباً: `curl -X POST http://localhost:3000/api/order -H "Content-Type: application/json" -d '{"name":"Test User","phone":"+201012345678","service":"Website","budget":"Under $500"}'`.

## إعداد Telegram

1. افتح `@BotFather` وأرسل `/newbot`، أكمل الاسم واسم المستخدم، ثم خزّن التوكن الذي يعطيك إياه في `BOT_TOKEN`.
2. ابحث عن البوت وافتح المحادثة معه وأرسل `/start`.
3. للحصول على `ADMIN_CHAT_ID` افتح `https://api.telegram.org/bot<TOKEN>/getUpdates` بعد إرسال `/start`، وخذ `message.chat.id`.
4. لا تضع التوكن في HTML أو JavaScript أو Git. غيّر أي توكن سبق مشاركته علناً.

الـ Webhook جاهز على `/api/telegram/webhook` ويرد على `/start`. بعد النشر عيّنه مرة واحدة بعنوان HTTPS الخاص بالخادم: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR-HOST/api/telegram/webhook`.

## النشر على Render

اربط مستودع GitHub الذي يحتوي مجلد الموقع. إذا كان جذر المستودع هو `CODAK-Agency` فاترك Root Directory `.`؛ إذا كان جذر المستودع هو المجلد الأب فاجعل Root Directory `CODAK-Agency`. استخدم Build Command `npm install` وStart Command `npm start`. أضف Environment Variables التالية من لوحة Render: `BOT_TOKEN`، `ADMIN_CHAT_ID`، `ALLOWED_ORIGIN=https://codak-agency.online`، و`PORT=10000`. بعد ظهور رابط الخدمة اضبط Webhook عليه. Render مناسب لتشغيل Express المستمر.

## النشر على Vercel

استورد المشروع واجعل Root Directory مجلد `CODAK-Agency` إذا كان المستودع يحوي المجلد الأب. أضف `BOT_TOKEN` و`ADMIN_CHAT_ID` و`ALLOWED_ORIGIN` من Dashboard. إعداد `vercel.json` يوجّه واجهة الموقع و`api/index.js` يشغّل واجهة الـ API كـ Serverless Function. عيّن Webhook إلى رابط Vercel على `/api/telegram/webhook`.

## DNS وGoogle Search Console

اربط `codak-agency.online` من Hostinger باستخدام سجلات DNS التي تعرضها منصة النشر نفسها (عادةً A للجذر وCNAME لـ `www`؛ لا تستخدم عنواناً ثابتاً غير الذي تعرضه المنصة). بعد تفعيل HTTPS أضف النطاق إلى Google Search Console وأرسل `https://codak-agency.online/sitemap.xml`.

## ملفات الأمان والنشر

ملف `.gitignore` يستبعد `.env` و`backend/.env` و`node_modules`. لا ترفع ملف البيئة أو تضع التوكن في المتصفح. إذا ظهر CORS فتأكد أن `ALLOWED_ORIGIN` يطابق أصل الواجهة حرفياً. إذا لم تصل رسالة تيليجرام فتحقق من صلاحية التوكن و`ADMIN_CHAT_ID` ومن أنك أرسلت `/start` للبوت. أصول الموقع التي تُستخدم مباشرة موجودة في `public/`.
