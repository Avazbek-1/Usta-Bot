import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';
import { bot } from '../bot/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../webapp')));

const dbPath = process.env.NODE_ENV === 'production' ? '/data/db.json' : path.join(__dirname, '../data/db.json');
const defaultData = { masters: [], clients: [], reviews: [], waiting_clients: [] };

let db;

async function initDb() {
  db = await JSONFilePreset(dbPath, defaultData);
}

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// GET /api/user/:telegram_id
app.get('/api/user/:telegram_id', async (req, res) => {
  await db.read();
  const tid = Number(req.params.telegram_id);
  const master = db.data.masters.find(m => m.telegram_id === tid);
  if (master) return res.json({ role: 'master', data: master });
  const client = db.data.clients.find(c => c.telegram_id === tid);
  if (client) return res.json({ role: 'client', data: client });
  res.json({ role: 'new' });
});

// POST /api/masters
app.post('/api/masters', async (req, res) => {
  await db.read();
  const { telegram_id, name, phone, profession, district, photos } = req.body;
  if (!telegram_id || !name || !phone || !profession || !district) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  const existing = db.data.masters.find(m => m.telegram_id === telegram_id);
  if (existing) return res.status(409).json({ error: 'Bu usta allaqachon ro\'yxatdan o\'tgan' });

  const newMaster = {
    id: Date.now(),
    telegram_id,
    name,
    phone,
    profession,
    district,
    photos: photos || [],
    rating: 0,
    review_count: 0,
    views: 0,
    contacts: 0,
    is_active: true,
    created_at: new Date().toISOString()
  };
  db.data.masters.push(newMaster);

  // Clientlar ro'yxatiga ham qo'sh
  if (!db.data.clients.find(c => c.telegram_id === telegram_id)) {
    db.data.clients.push({ telegram_id, phone, created_at: new Date().toISOString() });
  }

  await db.write();

  // Admin ga xabar
  try {
    if (process.env.ADMIN_ID) {
      await bot.api.sendMessage(process.env.ADMIN_ID, `🆕 Yangi usta: ${name}\nKasb: ${profession}\nHudud: ${district}\nTelefon: ${phone}`);
    }
  } catch (_) {}

  res.json({ ok: true, master: newMaster });
});

// GET /api/masters/search?profession=&district=
app.get('/api/masters/search', async (req, res) => {
  await db.read();
  const { profession, district } = req.query;
  let results = db.data.masters.filter(m => m.is_active);
  if (profession) results = results.filter(m => m.profession === profession);
  if (district) results = results.filter(m => m.district === district);
  results.sort((a, b) => b.rating - a.rating);
  res.json(results);
});

// GET /api/masters/:id
app.get('/api/masters/:id', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.id === Number(req.params.id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });

  const reviews = db.data.reviews.filter(r => r.master_id === master.id).slice(-10);
  res.json({ ...master, reviews });
});

// POST /api/masters/:id/contact
app.post('/api/masters/:id/contact', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.id === Number(req.params.id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });
  master.views++;
  master.contacts++;
  await db.write();
  res.json({ ok: true, phone: master.phone });
});

// POST /api/masters/:id/view
app.post('/api/masters/:id/view', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.id === Number(req.params.id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });
  master.views++;
  await db.write();
  res.json({ ok: true });
});

// POST /api/reviews
app.post('/api/reviews', async (req, res) => {
  await db.read();
  const { master_id, client_telegram_id, rating, comment } = req.body;
  if (!master_id || !client_telegram_id || !rating) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Reyting 1-5 oraliqda bo\'lishi kerak' });

  const master = db.data.masters.find(m => m.id === Number(master_id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });

  if (master.telegram_id === Number(client_telegram_id)) {
    return res.status(403).json({ error: 'O\'zingizga baho bera olmaysiz' });
  }

  const already = db.data.reviews.find(r => r.master_id === Number(master_id) && r.client_telegram_id === Number(client_telegram_id));
  if (already) return res.status(409).json({ error: 'Siz bu ustaga allaqachon baho bergansiz' });

  const review = {
    id: Date.now(),
    master_id: Number(master_id),
    client_telegram_id: Number(client_telegram_id),
    rating: Number(rating),
    comment: comment || '',
    created_at: new Date().toISOString()
  };
  db.data.reviews.push(review);

  // Reytingni yangilash
  const masterReviews = db.data.reviews.filter(r => r.master_id === master.id);
  master.rating = Math.round((masterReviews.reduce((s, r) => s + r.rating, 0) / masterReviews.length) * 10) / 10;
  master.review_count = masterReviews.length;

  await db.write();
  res.json({ ok: true, review });
});

// POST /api/waiting
app.post('/api/waiting', async (req, res) => {
  await db.read();
  const { telegram_id, phone, profession, district } = req.body;
  if (!telegram_id || !profession || !district) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  const already = db.data.waiting_clients.find(w => w.telegram_id === telegram_id && w.profession === profession && w.district === district);
  if (already) return res.json({ ok: true, message: 'Allaqachon qo\'shilgan' });

  db.data.waiting_clients.push({
    telegram_id,
    phone: phone || '',
    profession,
    district,
    created_at: new Date().toISOString()
  });
  await db.write();
  res.json({ ok: true });
});

// PUT /api/masters/:id
app.put('/api/masters/:id', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.id === Number(req.params.id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });
  const { name, phone, profession, district } = req.body;
  if (name) master.name = name;
  if (phone) master.phone = phone;
  if (profession) master.profession = profession;
  if (district) master.district = district;
  await db.write();
  res.json({ ok: true, master });
});

// POST /api/masters/:id/photos
app.post('/api/masters/:id/photos', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.id === Number(req.params.id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });
  if (master.photos.length >= 10) return res.status(400).json({ error: 'Maksimal 10 ta rasm' });

  const { photo_url } = req.body;
  if (!photo_url) return res.status(400).json({ error: 'photo_url kerak' });

  master.photos.push(photo_url);
  await db.write();
  res.json({ ok: true, photos: master.photos });
});

// DELETE /api/masters/:id/photos/:index
app.delete('/api/masters/:id/photos/:index', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.id === Number(req.params.id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });
  const idx = Number(req.params.index);
  if (idx < 0 || idx >= master.photos.length) return res.status(400).json({ error: 'Noto\'g\'ri index' });
  master.photos.splice(idx, 1);
  await db.write();
  res.json({ ok: true, photos: master.photos });
});

// GET /api/masters/:telegram_id/by-tg
app.get('/api/masters/by-tg/:telegram_id', async (req, res) => {
  await db.read();
  const master = db.data.masters.find(m => m.telegram_id === Number(req.params.telegram_id));
  if (!master) return res.status(404).json({ error: 'Usta topilmadi' });
  res.json(master);
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server ishlamoqda: http://localhost:${PORT}`);
  });
  if (process.env.BOT_TOKEN && process.env.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
    bot.start();
    console.log('Bot ishlamoqda...');
  } else {
    console.log('BOT_TOKEN topilmadi — bot o\'chirilgan (faqat server ishlamoqda)');
  }
}

start().catch(console.error);
