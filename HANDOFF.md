# ANUBIS AI — Agent Handoff

كل البيانات اللي أي إيجنت محتاجها عشان يشتغل على المشروع ده.

## الروابط الأساسية

| الخدمة | الرابط |
|---|---|
| الموقع (Production) | https://anubis-website-sigma.vercel.app |
| Vercel Dashboard | https://vercel.com/mohamed-atef1/anubis-website |
| GitHub Repo | https://github.com/MohamedAtef321/Anubis-Website (public) |
| Google Sheet (Waitlist) | https://docs.google.com/spreadsheets/d/1rEhBDFChGVD5w9ObrEzXARVWOHVhw7wckbPDhl1DZ38/edit |
| Apps Script Project | https://script.google.com/home/projects/1JPMNEACW4YdP1jAghr0dBM_MXZcv3mjQaJA7lW4BsgWyP1reyOT_eVzE/edit |
| Web App URL (webhook) | https://script.google.com/macros/s/AKfycbyKby5aFDdsohCuXXI4ZVpL-L8JTPJ7pjC5o3LMsSjCDMT_9kF_WULk6ynoOShEeMhe/exec |

## حسابات الوصول

- **Owner Google/GitHub/Vercel:** www.xzorrodx@gmail.com
- **Agent access email:** mohamed.atef.54321@gmail.com — Editor on Google Sheet + Apps Script (دعوة اتسنت لحد ما يعمل login أول مرة). GitHub repo عام (public) فممكن clone من غير دعوة.
- **Vercel team:** mohamed-atef1 (Hobby plan)

## بنية المشروع

```
index.html            — الصفحة الرئيسية (Coming Soon + Join Waitlist في آخر الصفحة #summon فقط)
architecture.html     — صفحة Architecture
capabilities.html     — صفحة Capabilities
enterprise.html       — صفحة Enterprise
prophecy.html         — صفحة Prophecy
css/style.css         — التنسيق الأساسي
css/pages.css         — تنسيق الصفحات الفرعية
js/main.js            — السكربت الرئيسي
js/waitlist.js        — فورم Waitlist → يبعت POST للـ webhook (Google Apps Script)
apps-script/Code.gs   — كود الـ Apps Script اللي بيكتب في الشيت
assets/               — vendor libraries (bootstrap, aos, glighthouse, isotope, purecounter)
```

## كيفية عمل الـ Waitlist

1. المستخدم يكتب إيميله في الفورم (popup) في آخر الصفحة.
2. `js/waitlist.js` يبعت `POST` بصيغة `text/plain` للـ Web App URL:
```json
{
  "email": "user@example.com",
  "submission_id": "wl-...",
  "timestamp": "ISO 8601",
  "pagePath": "/index.html",
  "userAgent": "...",
  "timezone": "Africa/Cairo"
}
```
3. `Code.gs` يستقبل ويزيد row جديد في تبويب `Waitlist` بالشيت + توقيت القاهرة.
4. الاستجابة: `{"ok":true,"at":"YYYY-MM-DD HH:mm:ss"}`

## Deploy workflow

- **GitHub:** push على branch `main` → الريبو public، مفيش protection.
- **Vercel:** deploy يدوي حاليًا عبر CLI:
  ```bash
  cd <project-dir>
  vercel --prod --yes
  ```
  أو من الداشبورد. الـ production alias الحالي: `anubis-website-sigma.vercel.app`.
- لو عايز تربط GitHub→Vercel تلقائي: لازم تسجل دخول GitHub في المتصفح الأول وتعمل Install لتطبيق Vercel على الريبو.

## ملاحظات مهمة

- **BrowserOS neo** هو المتصفح الأساسي للأتمتة: MCP على `http://127.0.0.1:9010/mcp` (session-based, JSON-RPC).
- متغيرات البيئة: مفيش secrets في الكود — كل حاجة client-side static site.
- الـ webhook مربوط مباشرة في `js/waitlist.js` (مش localStorage) — cache version `?v=8`؛ لو عدلت الـ JS زوّد الرقم.
- لو الـ webhook بطيء أول مرة بعد فترة طويلة، ده طبيعي (Apps Script cold start).
- Sheet tab: `Waitlist`. الأعمدة: timestamp_cairo + باقي الحقول.

## آخر تحديث

- 2026-08-23: تحويل الموقع إلى Coming Soon + Join Waitlist، رفع على GitHub، Deploy على Vercel، ومشاركة الشيت والـ Apps Script مع mohamed.atef.54321@gmail.com.
