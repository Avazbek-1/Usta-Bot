# Farg'ona Usta — CLAUDE.md

## Loyiha haqida
Telegram Bot + Web App: Farg'ona viloyati uchun qurilish ustalari platformasi.
Usta topish, ro'yxatdan o'tish, reyting berish.

## Tech Stack
- **Bot**: Grammy (Node.js) — faqat "Ilovani ochish" tugmasi
- **Web App**: Vanilla HTML/CSS/JS (SPA — bitta sahifa, client-side routing)
- **Server**: Express.js (API + static files)
- **DB**: LowDB (JSON fayl — `data/db.json`)
- **Deploy**: Render.com (bepul tier)

## Fayl tuzilmasi
```
fargona-usta/
├── bot/index.js         ← Grammy bot (/start → Web App tugma)
├── server/index.js      ← Express server + barcha API endpointlar
├── webapp/
│   ├── index.html       ← SPA skeleton
│   ├── style.css        ← CSS variables + barcha stillar
│   └── app.js           ← Barcha JS: router, render, bind funksiyalar
├── data/db.json         ← Ma'lumotlar (masters, clients, reviews, waiting_clients)
├── .env                 ← BOT_TOKEN, ADMIN_ID, WEBAPP_URL, PORT, NODE_ENV
└── package.json         ← type: "module", scripts: start/dev
```

## Ishga tushirish
```bash
npm run dev   # nodemon bilan (development)
npm start     # production
```
Server: http://localhost:3000
.env da BOT_TOKEN va ADMIN_ID to'ldirilmasa bot o'chiq ishlaydi (faqat server).

## API Endpointlar
```
GET  /health                          → { ok: true }
GET  /api/user/:telegram_id           → { role: 'master'|'client'|'new', data }
POST /api/masters                     → yangi usta yaratish
GET  /api/masters/search?profession=&district=  → qidiruv (reyting bo'yicha)
GET  /api/masters/:id                 → usta profili + reviews
GET  /api/masters/by-tg/:telegram_id  → telegram_id bo'yicha usta
PUT  /api/masters/:id                 → profil tahrirlash
POST /api/masters/:id/contact         → kontakt (views++ contacts++)
POST /api/masters/:id/view            → ko'rish (views++)
POST /api/masters/:id/photos          → rasm qo'shish (max 10)
DELETE /api/masters/:id/photos/:index → rasm o'chirish
POST /api/reviews                     → baho berish
POST /api/waiting                     → usta yo'q bo'lsa raqam qoldirish
```

## Web App sahifalari (app.js)
| Sahifa | Konstanta | Tavsif |
|---|---|---|
| Loading | PAGES.LOADING | Spinner |
| Onboarding | PAGES.ONBOARDING | Usta/Mijoz tanlash |
| Master Home | PAGES.MASTER_HOME | Statistika + bottom nav |
| Register | PAGES.REGISTER | 3 qadamli ro'yxat |
| Client Home | PAGES.CLIENT_HOME | Kasb tanlash grid |
| Search | PAGES.SEARCH | Hudud tanlash |
| Results | PAGES.RESULTS | Ustalar ro'yxati |
| Profile | PAGES.PROFILE | Usta profili (mijoz ko'radi) |
| My Profile | PAGES.MY_PROFILE | Usta o'z profili |
| Edit Profile | PAGES.EDIT_PROFILE | Profil tahrirlash |
| Photos | PAGES.PHOTOS | Rasm boshqarish |
| Rating | PAGES.RATING | Yulduz baho berish |
| Not Found | PAGES.NOT_FOUND | 404 |

## Dizayn qoidalari (O'ZGARTIRILMASIN)
- Fon: `#f7f8fa`, Karta: `#ffffff`, Ko'k: `#0088cc`
- Tugmalar: `min-height: 48px`, `border-radius: 12px`
- Max kenglik: `480px` (mobil)
- Til: O'zbek, qisqa jumlalar
- Bot faqat bitta tugma ko'rsatadi: "Ilovani ochish"
- Barcha funksiyalar Web App ichida

## Bajarilgan bosqichlar
- [x] BOSQICH 1 — Loyiha sozlash
- [x] BOSQICH 2 — Server + Bot
- [x] BOSQICH 3 — Web App asosi + Router
- [x] BOSQICH 4 — Onboarding
- [x] BOSQICH 5 — Usta ro'yxatdan o'tish (3 qadam)
- [x] BOSQICH 6 — Usta bosh sahifasi
- [x] BOSQICH 7 — Rasmlar sahifasi
- [x] BOSQICH 8 — Mijoz bosh sahifasi + qidiruv
- [x] BOSQICH 9 — Natijalar + usta profili
- [x] BOSQICH 10 — Baho berish
- [x] BOSQICH 11 — Error handling + polishing
- [ ] BOSQICH 12 — Production deploy (Render.com)

## Keyingi qadam: BOSQICH 12 — Deploy
1. GitHub repo yaratish va push qilish
2. Render.com da "New Web Service" → GitHub ulash
3. Environment variables qo'shish (BOT_TOKEN, ADMIN_ID, WEBAPP_URL, NODE_ENV=production)
4. Build: `npm install`, Start: `npm start`
5. Persistent disk: `/data` path, 1GB (db.json uchun)
6. node-cron bilan keep-alive ping qo'shish (har 14 daqiqa)
7. BOT_TOKEN va WEBAPP_URL ni real qiymatlar bilan yangilash

## Muhim eslatmalar
- `data/db.json` production da `/data/db.json` bo'ladi (Render disk)
- Rasm yuklash hozir base64 DataURL sifatida saqlanadi — production uchun yetarli
- `userId` Telegram WebApp dan keladi; dev modeda `12345` fallback ishlatiladi
- Usta o'ziga baho bera olmaydi (server tekshiradi)
- Bitta mijoz bitta ustaga faqat 1 marta baho bera oladi
