# Farg'ona Usta — CLAUDE.md

## Loyiha haqida
Telegram Bot + Web App: Farg'ona viloyati uchun qurilish ustalari platformasi.
Usta topish, ro'yxatdan o'tish, reyting berish, buyurtma tizimi.

## Tech Stack
- **Bot**: Grammy (Node.js) — faqat "Ilovani ochish" tugmasi
- **Web App**: Vanilla HTML/CSS/JS (SPA — bitta sahifa, client-side routing)
- **Server**: Express.js 5.x, ESM modules (`"type": "module"`)
- **DB**: JSONBin.io REST API (in-memory, write-through; `JSONBIN_API_KEY`, `JSONBIN_BIN_ID`)
- **Deploy**: Railway (yoki Render.com)

## Fayl tuzilmasi
```
fargona-usta/
├── bot/index.js         ← Grammy bot (/start → Web App tugma)
├── server/index.js      ← Express server + barcha API endpointlar
├── webapp/
│   ├── index.html       ← SPA skeleton; globalFileInput body ichida, #app dan tashqarida
│   ├── style.css        ← CSS variables + barcha stillar
│   └── app.js           ← Barcha JS: router, render, bind funksiyalar
├── .env                 ← BOT_TOKEN, ADMIN_ID, WEBAPP_URL, PORT, NODE_ENV,
│                           JSONBIN_API_KEY, JSONBIN_BIN_ID
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
GET  /health
GET  /api/user/:telegram_id           → { role: 'master'|'client'|'new', data }
POST /api/masters                     → yangi usta yaratish
GET  /api/masters/search?profession=&district=
GET  /api/masters/by-tg/:telegram_id  ← /:id DAN OLDIN kelishi shart (route order)
GET  /api/masters/:id                 → usta profili + reviews
PUT  /api/masters/:id                 → profil tahrirlash
POST /api/masters/:id/contact         → views++ contacts++
POST /api/masters/:id/view            → views++
POST /api/masters/:id/photos          → rasm qo'shish (max 10)
DELETE /api/masters/:id/photos/:index → rasm o'chirish
POST /api/reviews                     → baho berish
POST /api/waiting                     → usta yo'q bo'lsa kutish ro'yxati
POST /api/orders                      → buyurtma yaratish (client)
GET  /api/orders?professions=         → buyurtmalarni kasblar bo'yicha filter
POST /api/orders/:id/contact          → contacts++, client_telegram_id qaytaradi
```

## Web App sahifalari (PAGES enum)
| Konstanta | Tavsif |
|---|---|
| LOADING | Spinner |
| ONBOARDING | Usta/Mijoz tanlash |
| MASTER_HOME | Statistika + bottom nav (home/photos/orders/profile) |
| REGISTER | 3 qadamli ro'yxat |
| CLIENT_HOME | Kasb tanlash grid + buyurtma berish linki |
| SEARCH | Hudud tanlash |
| RESULTS | Ustalar ro'yxati |
| PROFILE | Usta profili (mijoz ko'radi) |
| MY_PROFILE | Usta o'z profili (statistika + rasmlar) |
| EDIT_PROFILE | Profil tahrirlash |
| PHOTOS | Rasm boshqarish |
| RATING | Yulduz baho berish |
| ORDER_FORM | Buyurtma berish (client) |
| ORDERS | Kelgan buyurtmalar (master) |
| NOT_FOUND | 404 |

## Muhim arxitektura qarorlari

### Routing
- `navigate(page, data)` — appState ni merge qiladi, BackButton ni boshqaradi, render() chaqiradi
- `ROOT_PAGES` = [LOADING, ONBOARDING, MASTER_HOME, CLIENT_HOME] — bular da BackButton yashiriladi
- `goBack()` — Telegram BackButton uchun; REGISTER da `regStep > 1` bo'lsa qadam orqaga

### Rasm yuklash (kritik)
- `globalFileInput` — `display:none` EMAS, `position:fixed;top:-9999px` (Android WebView da
  display:none bilan galereya darhol yopiladi)
- `openFilePicker(callback)` — 1.5s phantom-click muhofazasi (`_pickerLastOpen` timestamp)
- `initFilePicker()` — change da va window.focus da `_pickerLastOpen = 0` reset
- Rasm siqish: 800×800 max, JPEG 70%, `compressImage()` Promise reject on error
- `bindPhotos()` da `_uploading` flag — bir vaqtda ikki upload oldini oladi

### XSS himoya
- `esc(str)` funksiyasi — barcha user-controlled data innerHTML ga kirishdan oldin escaped
- `renderProfBadges()` da `p.label` ham `esc()` orqali o'tadi
- Server: `photo_url` faqat `data:image/` bilan boshlansa qabul qilinadi (POST /photos ham, POST /api/masters ham)
- Qo'llanilgan: name, phone, district.label, prof.label, comment, client_name, description, usta ismi

### API timeout
- `api()` — `AbortController` bilan 10 soniya timeout; tugasa "So'rov vaqti tugadi (10s)"

### Double-submit oldini olish
- `submitRegister` — `_isSubmitting` flag + finishReg/skipPhotos disabled
- `saveEditBtn` — `btn.disabled = true` saqlash vaqtida (e.currentTarget saqlangan)
- `contactBtn` — `btn.disabled = true` API call vaqtida
- `saveRating` — `btn = e.currentTarget` then `btn.disabled = true` (async catch da null xatosi oldini olindi)
- `order-contact-btn` — `btn.disabled` guard
- `leaveNumber` — `btn.disabled = true` API call vaqtida
- `data-del` (photo delete) — `el.dataset.deleting` flag bilan himoyalangan

### Bog'lanish modal
- `showContactModal(phone, telegramId)` — bottom sheet overlay, addEventListener (inline onclick yo'q)
- `showFullscreen(url)` — to'liq ekran rasm, addEventListener

### Telegram deep link
- `window.open('tg://user?id=...', '_blank')` — window.location.href EMAS (SPA crash bo'ladi)

### Toast
- `_toastTimer` — clearTimeout bilan race condition tuzatildi

### bindOrders (async null-safety)
- `document.getElementById('ordersList')` — await DAN KEYIN tekshiriladi (foydalanuvchi ketib qolishi)

### Bot
- `/start` komandasi `WEBAPP_URL` yo'q bo'lsa text-only xabar yuboradi (Telegram API crash oldini olish)
- Dev modda `bot.api.deleteWebhook()` `bot.start()` dan oldin chaqiriladi (production deploydan keyin conflict oldini olish)

### DB (JSONBinDB)
- `initDb()` — barcha 5 massiv (`masters`, `clients`, `reviews`, `waiting_clients`, `orders`) mavjudligi tekshiriladi
- `write()` — faqat JSONBIN sozlangan bo'lsa ishlaydi, aks holda silent skip

## Dizayn qoidalari
- Fon: `#f7f8fa`, Karta: `#ffffff`, Ko'k: `#0088cc`
- Tugmalar: `min-height: 48px`, `border-radius: 12px`
- Max kenglik: `480px` (mobil)
- Til: O'zbek, qisqa jumlalar

## Muhim qoida — Interfeys soddaligi
**Interfeyni HECH QACHON murakkablashtirma.**
- Bug fix yoki yangi funksiya qo'shganda mavjud UI ni o'zgartirma
- Yangi sahifa, modal, dialog qo'shma — agar foydalanuvchi so'ramagan bo'lsa
- Tugmalar, formlar, navigatsiya — hozirgi holatda qolsin
- Faqat so'ralgan narsani qil, ortiqcha "yaxshilash" qilma

## Bajarilgan bosqichlar
- [x] BOSQICH 1–11 — Loyiha, Server, Bot, SPA, Onboarding, Ro'yxat, Usta/Mijoz sahifalari,
       Rasmlar, Qidiruv, Profil, Baho, Buyurtma tizimi, Bug fix + security
- [x] BUG ROUND 1 — initDb crash, saveRating null ref, order double-click, lowdb olib tashlandi
- [x] BUG ROUND 2 — foto race condition, bot WEBAPP_URL guard, webhook conflict, register dead code
- [x] BUG ROUND 3 — photo_url XSS (server), delete double-click, prof/dist label esc(), undefined fallback
- [x] BUG ROUND 4 — renderMyProfile undefined, renderProfBadges XSS, registration photos XSS, leaveNumber debounce
- [x] BUG ROUND 5 — iPhone galereya darhol yopilishi (pointer-events:none olib tashlandi), iOS visibilitychange cooldown, renderProfile/renderResults getInitials XSS
- [ ] BOSQICH 12 — Production deploy (Railway yoki Render.com)

## Keyingi qadam: BOSQICH 12 — Deploy
1. GitHub repo tayyor: https://github.com/Avazbek-1/Usta-Bot.git
2. Railway/Render da "New Web Service" → GitHub ulash
3. Environment variables: BOT_TOKEN, ADMIN_ID, WEBAPP_URL, NODE_ENV=production,
   JSONBIN_API_KEY, JSONBIN_BIN_ID
4. Build: `npm install`, Start: `npm start`
5. Webhook avtomatik o'rnatiladi (production modeda)

## Hal qilingan muhim xatolar (tarix)
- `getInitials(null)` → crash → `String(name || '?')` + `filter(Boolean)`
- `formatDate(null)` → "01/01/1970" → `isNaN(d.getTime())` tekshiruvi
- `by-tg/:tid` route `/:id` dan keyin edi → oldiniga ko'chirildi
- `handleOnboarding('master')` — masterData bo'lsa REGISTER emas MASTER_HOME ga boradi
- `goBack()` REGISTER step 2/3 da — qadam orqaga, ONBOARDING ga emas
- `showToast` race condition — `_toastTimer` clearTimeout
- `compressImage` — `reader.onerror` + `img.onerror` bilan reject
- `window.location.href = 'tg://'` → SPA crash → `window.open(..., '_blank')`
- Galereya darhol yopilishi → `display:none` → `position:fixed off-screen`
- Galereya qayta ochilishi → phantom click → 1.5s cooldown
- `saveRating` async catch da `e.currentTarget` null → `const btn = e.currentTarget` saqlandi
- `initDb()` faqat `orders` ni tekshirardi → barcha 5 massiv tekshiriladi
- `order-contact-btn` double-click → `btn.disabled` guard qo'shildi
- `lowdb` import qilinmasdan package.json da turardi → olib tashlandi
- `bindPhotos()` upload race condition → `_uploading` flag
- `bot /start` + `WEBAPP_URL` undefined → Telegram API xato → guard qo'shildi
- Dev `bot.start()` webhook conflict → `deleteWebhook()` oldin chaqirildi
- `register step3` `< 10` dead code → `< 3` (slot soni bilan mos)
- `POST /api/masters/:id/photos` `photo_url` validatsiyasiz → `data:image/` tekshiruvi
- `bindPhotos()` delete double-click → index siljishi → `data-deleting` flag
- `renderSearch/Results` `prof.label`, `dist.label` `esc()` siz → XSS
- `renderMasterHome()` `views||0`, `contacts||0` — eski yozuvlar undefined
- `renderProfile()` `review_count||0` — eski yozuvlar undefined
- `renderMyProfile()` `review_count||0`, `views||0` — o'tkazib yuborilgan sahifa
- `renderProfBadges()` `p.label` `esc()` siz → XSS (PUT professions validate qilinmaydi)
- `POST /api/masters` registration `photos` `data:image/` tekshiruvidan o'tmasdi → XSS
- `leaveNumber` tugmasi disabled guard yo'q edi → qo'shildi
- `globalFileInput` da `pointer-events:none` → iPhone galereya darhol yopilishi → olib tashlandi
- iOS da `window.focus` eventi yetarli emas → `visibilitychange` qo'shildi, timeout 600→300ms
- `renderProfile()` va `renderResults()` da `getInitials()` `esc()` siz → XSS → tuzatildi
