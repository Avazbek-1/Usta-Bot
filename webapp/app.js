// === CONSTANTS ===
const PROFESSIONS = [
  { id: 'suvoqchi',  emoji: '🪣', label: 'Suvoqchi' },
  { id: 'elektrik',  emoji: '⚡', label: 'Elektrik' },
  { id: 'plitachi',  emoji: '🔲', label: 'Plitachi' },
  { id: 'boyoqchi',  emoji: '🎨', label: "Bo'yoqchi" },
  { id: 'santexnik', emoji: '🔧', label: 'Santexnik' },
  { id: 'gipschi',   emoji: '🏗️', label: 'Gipschi' },
  { id: 'derazachi', emoji: '🪟', label: 'Derazachi' },
  { id: 'shipchi',   emoji: '⬆️', label: 'Ship ustasi' },
  { id: 'temirchi',  emoji: '🔩', label: 'Temirchi' },
  { id: 'boshqa',    emoji: '🛠️', label: 'Boshqa' },
];

const DISTRICTS = [
  { id: 'fargona_shahar', emoji: '🏙️', label: "Farg'ona shahar" },
  { id: 'margilan',       emoji: '🕌', label: "Marg'ilon" },
  { id: 'qoqon',          emoji: '🌆', label: "Qo'qon" },
  { id: 'quva',           emoji: '📍', label: 'Quva' },
  { id: 'beshariq',       emoji: '📍', label: 'Beshariq' },
  { id: 'buvayda',        emoji: '📍', label: 'Buvayda' },
  { id: 'dangara',        emoji: '📍', label: "Dang'ara" },
  { id: 'oltiariq',       emoji: '📍', label: 'Oltiariq' },
  { id: 'rishton',        emoji: '📍', label: 'Rishton' },
  { id: 'uchkoprik',      emoji: '📍', label: "Uchko'prik" },
];

// === TELEGRAM INIT ===
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) {
  tg.expand();
  tg.setHeaderColor('#0088cc');
  tg.ready();
}

const tgUser = tg ? tg.initDataUnsafe?.user : null;
const userId = tgUser?.id || null;

// === STATE ===
const PAGES = {
  LOADING: 'loading',
  ONBOARDING: 'onboarding',
  MASTER_HOME: 'master_home',
  CLIENT_HOME: 'client_home',
  REGISTER: 'register',
  SEARCH: 'search',
  RESULTS: 'results',
  PROFILE: 'profile',
  MY_PROFILE: 'my_profile',
  PHOTOS: 'photos',
  RATING: 'rating',
  NOT_FOUND: 'not_found',
  EDIT_PROFILE: 'edit_profile',
  ORDER_FORM: 'order_form',
  ORDERS: 'orders',
};

let currentPage = PAGES.LOADING;
let appState = {};
let masterData = null;
let currentNav = 'home';

// === BACK BUTTON ===
const ROOT_PAGES = [PAGES.LOADING, PAGES.ONBOARDING, PAGES.MASTER_HOME, PAGES.CLIENT_HOME];

function goBack() {
  switch (currentPage) {
    case PAGES.REGISTER:     regStep > 1 ? (regStep--, render()) : window.goBackFromRegister(); break;
    case PAGES.SEARCH:       navigate(PAGES.CLIENT_HOME); break;
    case PAGES.RESULTS:      navigate(PAGES.SEARCH); break;
    case PAGES.PROFILE:      navigate(PAGES.RESULTS); break;
    case PAGES.RATING:       navigate(PAGES.PROFILE); break;
    case PAGES.PHOTOS:       navigate(PAGES.MASTER_HOME); break;
    case PAGES.EDIT_PROFILE: navigate(PAGES.MASTER_HOME); break;
    case PAGES.MY_PROFILE:   navigate(PAGES.MASTER_HOME); break;
    case PAGES.NOT_FOUND:    navigate(PAGES.ONBOARDING); break;
    case PAGES.ORDER_FORM:   navigate(PAGES.CLIENT_HOME); break;
    case PAGES.ORDERS:       navigate(PAGES.MASTER_HOME); break;
    default: break;
  }
}

if (tg && tg.BackButton) {
  tg.BackButton.onClick(goBack);
}

// === ROUTER ===
function navigate(page, data = {}) {
  appState = { ...appState, ...data };
  currentPage = page;
  if (page === PAGES.MASTER_HOME) currentNav = 'home';
  else if (page === PAGES.CLIENT_HOME) currentNav = 'search';
  if (tg && tg.BackButton) {
    ROOT_PAGES.includes(page) ? tg.BackButton.hide() : tg.BackButton.show();
  }
  render();
}

function render() {
  const app = document.getElementById('app');
  switch (currentPage) {
    case PAGES.LOADING:      app.innerHTML = renderLoading(); break;
    case PAGES.ONBOARDING:   app.innerHTML = renderOnboarding(); break;
    case PAGES.MASTER_HOME:  app.innerHTML = renderMasterHome(); bindMasterHome(); break;
    case PAGES.CLIENT_HOME:  app.innerHTML = renderClientHome(); bindClientHome(); break;
    case PAGES.REGISTER:     app.innerHTML = renderRegister(); bindRegister(); break;
    case PAGES.SEARCH:       app.innerHTML = renderSearch(); bindSearch(); break;
    case PAGES.RESULTS:      app.innerHTML = renderResults(); bindResults(); break;
    case PAGES.PROFILE:      app.innerHTML = renderProfile(); bindProfile(); break;
    case PAGES.MY_PROFILE:   app.innerHTML = renderMyProfile(); bindMyProfile(); break;
    case PAGES.PHOTOS:       app.innerHTML = renderPhotos(); bindPhotos(); break;
    case PAGES.RATING:       app.innerHTML = renderRating(); bindRating(); break;
    case PAGES.NOT_FOUND:    app.innerHTML = renderNotFound(); bindNotFound(); break;
    case PAGES.EDIT_PROFILE: app.innerHTML = renderEditProfile(); bindEditProfile(); break;
    case PAGES.ORDER_FORM:   app.innerHTML = renderOrderForm(); bindOrderForm(); break;
    case PAGES.ORDERS:       app.innerHTML = renderOrders(); bindOrders(); break;
    default: app.innerHTML = renderLoading();
  }
}

// === API ===
async function api(method, path, body, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const opts = { method, headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(path, opts);
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server xatosi');
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('So\'rov vaqti tugadi (10s)');
    throw err;
  }
}

// === HTML ESCAPE (XSS prevention) ===
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// === IMAGE COMPRESSION ===
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Rasm yuklanmadi'));
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// === GLOBAL FILE PICKER ===
let _fileCallback = null;
let _pickerLastOpen = 0;

function openFilePicker(callback) {
  const now = Date.now();
  if (now - _pickerLastOpen < 1500) return; // phantom click protection
  _pickerLastOpen = now;
  _fileCallback = callback;
  const input = document.getElementById('globalFileInput');
  input.value = '';
  input.click();
}

function initFilePicker() {
  document.getElementById('globalFileInput').addEventListener('change', async (e) => {
    _pickerLastOpen = 0; // reset so next open works immediately
    const file = e.target.files[0];
    if (!file || !_fileCallback) return;
    const cb = _fileCallback;
    _fileCallback = null;
    showToast('⏳ Rasm siqilmoqda...');
    try {
      const compressed = await compressImage(file);
      cb(compressed);
    } catch (err) {
      showToast('❌ ' + err.message);
    }
  });

  // Agar foydalanuvchi galereyani yopsa (fayl tanlamasdan), cooldown reset bo'lsin
  window.addEventListener('focus', () => {
    setTimeout(() => { _pickerLastOpen = 0; }, 600);
  });
}

// === PHONE INPUT MASK ===
function setupPhoneInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  if (!el.value || el.value.replace(/\D/g, '').length < 3) el.value = '+998 ';

  el.addEventListener('keydown', (e) => {
    const pos = el.selectionStart;
    if ((e.key === 'Backspace' || e.key === 'Delete') && pos <= 5 && el.selectionEnd <= 5) {
      e.preventDefault();
    }
  });

  el.addEventListener('input', () => {
    const digits = el.value.replace(/\D/g, '');
    let local = digits.startsWith('998') ? digits.slice(3) : digits;
    local = local.slice(0, 9);
    let fmt = '+998 ';
    if (local.length > 0) fmt += local.slice(0, 2);
    if (local.length > 2) fmt += '-' + local.slice(2, 5);
    if (local.length > 5) fmt += '-' + local.slice(5, 7);
    if (local.length > 7) fmt += '-' + local.slice(7, 9);
    el.value = fmt;
  });

  el.addEventListener('focus', () => {
    if (!el.value.startsWith('+998')) el.value = '+998 ';
    setTimeout(() => el.setSelectionRange(el.value.length, el.value.length), 0);
  });
}

function normalizePhone(formatted) {
  const d = formatted.replace(/\D/g, '');
  return '+' + d;
}

function isPhoneValid(formatted) {
  const d = formatted.replace(/\D/g, '');
  return d.length === 12 && d.startsWith('998');
}

// === TOAST ===
let _toastTimer = null;
function showToast(msg, duration = 2500) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  if (_toastTimer) clearTimeout(_toastTimer);
  t.textContent = msg;
  t.classList.add('show');
  _toastTimer = setTimeout(() => { t.classList.remove('show'); _toastTimer = null; }, duration);
}

// === HELPERS ===
function getInitials(name) {
  return String(name || '?').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getProfLabel(id) {
  return PROFESSIONS.find(p => p.id === id) || { emoji: '🛠️', label: id };
}

function getProfLabels(master) {
  const arr = master.professions || (master.profession ? [master.profession] : []);
  return arr.map(id => getProfLabel(id));
}

function renderProfBadges(master) {
  return getProfLabels(master).map(p => `${p.emoji} ${p.label}`).join(' · ');
}

function getDistrictLabel(id) {
  return DISTRICTS.find(d => d.id === id) || { emoji: '📍', label: id };
}

function renderStars(rating, count) {
  if (!rating || rating === 0) {
    return count > 0
      ? `⭐ ${count} izoh`
      : `<span style="color:#aaa;font-size:13px">Yangi usta</span>`;
  }
  const full = Math.round(rating);
  const stars = '⭐'.repeat(full) + '☆'.repeat(5 - full);
  return `${stars} <span style="color:#666;font-size:13px">${rating}${count > 0 ? ' · ' + count + ' izoh' : ''}</span>`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('uz-UZ');
}

// === PAGES ===

function renderLoading() {
  return `<div class="loading-screen"><div class="spinner"></div><p>Yuklanmoqda...</p></div>`;
}

// --- ONBOARDING ---
function renderOnboarding() {
  return `
  <div class="onboarding">
    <div class="onboarding-logo">🏗️</div>
    <div class="onboarding-title">Farg'ona Usta</div>
    <div class="onboarding-sub">Qurilish platformasi</div>
    <div class="onboarding-btns">
      <button class="btn-primary" onclick="handleOnboarding('master')">👷 Men ustaman</button>
      <button class="btn-secondary btn-gap" onclick="handleOnboarding('client')">🏠 Menga usta kerak</button>
    </div>
  </div>`;
}

async function handleOnboarding(role) {
  if (role === 'master') {
    if (masterData) {
      navigate(PAGES.MASTER_HOME);
    } else {
      navigate(PAGES.REGISTER);
    }
  } else {
    navigate(PAGES.CLIENT_HOME);
  }
}
window.handleOnboarding = handleOnboarding;

// --- MASTER HOME ---
function renderMasterHome() {
  if (!masterData) return renderLoading();
  const dist = getDistrictLabel(masterData.district);
  const initials = getInitials(masterData.name);
  return `
  <div class="page">
    <div class="profile-header card" style="margin:0;border-radius:0;cursor:pointer" id="masterProfileHeader">
      <div class="avatar avatar-lg">${esc(initials)}</div>
      <div class="name">${esc(masterData.name)}</div>
      <div class="profession">${renderProfBadges(masterData)}</div>
      <div class="profession">${dist.emoji} ${esc(dist.label)}</div>
      <div style="color:var(--blue);font-size:13px;margin-top:6px">👁 Profilimni ko'rish</div>
    </div>
    <div class="page-content">
      <div class="stats-row card">
        <div class="stat-card">
          <div class="stat-value">${masterData.views || 0}</div>
          <div class="stat-label">Ko'rish</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${masterData.contacts || 0}</div>
          <div class="stat-label">Murojaat</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${masterData.rating > 0 ? '⭐' + masterData.rating : '—'}</div>
          <div class="stat-label">Reyting</div>
        </div>
      </div>
      <button class="btn-primary" id="addPhotoBtn">📸 Rasm qo'shish</button>
      <button class="btn-secondary btn-gap" id="editProfileBtn">✏️ Profilni tahrirlash</button>
      <button class="btn-ghost btn-gap" onclick="navigate('${PAGES.ONBOARDING}')">↩ Rolni o'zgartirish</button>
    </div>
    <nav class="bottom-nav">
      <button class="nav-btn ${currentNav==='home'?'active':''}" onclick="setNav('home')">
        <span class="nav-icon">🏠</span><span>Bosh</span>
      </button>
      <button class="nav-btn ${currentNav==='photos'?'active':''}" onclick="setNav('photos')">
        <span class="nav-icon">📸</span><span>Rasmlar</span>
      </button>
      <button class="nav-btn ${currentNav==='orders'?'active':''}" onclick="setNav('orders')">
        <span class="nav-icon">📋</span><span>Buyurtmalar</span>
      </button>
      <button class="nav-btn ${currentNav==='profile'?'active':''}" onclick="setNav('profile')">
        <span class="nav-icon">👤</span><span>Profil</span>
      </button>
    </nav>
  </div>`;
}

function bindMasterHome() {
  document.getElementById('masterProfileHeader')?.addEventListener('click', () => navigate(PAGES.MY_PROFILE));
  document.getElementById('addPhotoBtn')?.addEventListener('click', () => navigate(PAGES.PHOTOS));
  document.getElementById('editProfileBtn')?.addEventListener('click', () => navigate(PAGES.EDIT_PROFILE));
}

window.setNav = function(tab) {
  currentNav = tab;
  if (tab === 'home') navigate(PAGES.MASTER_HOME);
  else if (tab === 'photos') navigate(PAGES.PHOTOS);
  else if (tab === 'profile') navigate(PAGES.EDIT_PROFILE);
  else if (tab === 'orders') navigate(PAGES.ORDERS);
};

// --- REGISTER (3 steps) ---
let regStep = 1;
let regData = { name: '', professions: [], district: '', phone: '', photos: [] };
let _isSubmitting = false;

function renderRegister() {
  const dots = [1,2,3].map(i => `<div class="dot ${i < regStep ? 'done' : i === regStep ? 'active' : ''}"></div>`).join('');
  if (regStep === 1) return renderRegStep1(dots);
  if (regStep === 2) return renderRegStep2(dots);
  return renderRegStep3(dots);
}

function renderRegStep1(dots) {
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="goBackFromRegister()">←</button>
      <div style="flex:1">
        <div class="page-title">Ro'yxatdan o'tish</div>
        <div style="display:flex;gap:6px;margin-top:6px">${dots}</div>
      </div>
      <span style="color:#999;font-size:13px">1/3</span>
    </div>
    <div class="page-content">
      <div class="form-group">
        <label class="form-label">Ismingiz</label>
        <input type="text" id="regName" placeholder="Ism va familiya" value="${esc(regData.name)}" maxlength="50">
        <div class="form-error" id="nameErr"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Kasbingiz</label>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">Bir yoki bir necha kasb tanlang</div>
        <div class="chip-grid" id="profGrid">
          ${PROFESSIONS.map(p => `
            <div class="chip ${regData.professions.includes(p.id)?'selected':''}" data-prof="${p.id}">
              ${p.emoji} ${p.label}
            </div>`).join('')}
        </div>
        <div class="form-error" id="profErr"></div>
      </div>
      <button class="btn-primary" id="step1Next">Davom etish →</button>
    </div>
  </div>`;
}

function renderRegStep2(dots) {
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="regBack()">←</button>
      <div style="flex:1">
        <div class="page-title">Ro'yxatdan o'tish</div>
        <div style="display:flex;gap:6px;margin-top:6px">${dots}</div>
      </div>
      <span style="color:#999;font-size:13px">2/3</span>
    </div>
    <div class="page-content">
      <div class="form-group">
        <label class="form-label">Hudud</label>
        <div class="chip-grid" id="distGrid">
          ${DISTRICTS.map(d => `
            <div class="chip ${regData.district===d.id?'selected':''}" data-dist="${d.id}">
              ${d.emoji} ${d.label}
            </div>`).join('')}
        </div>
        <div class="form-error" id="distErr"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Telefon raqam</label>
        <input type="tel" id="regPhone" placeholder="+998 99-123-45-67" value="${regData.phone || '+998 '}" inputmode="numeric">
        <div class="form-error" id="phoneErr"></div>
      </div>
      <button class="btn-primary" id="step2Next">Davom etish →</button>
    </div>
  </div>`;
}

function renderRegStep3(dots) {
  const photoSlots = [];
  for (let i = 0; i < 3; i++) {
    if (i < regData.photos.length) {
      photoSlots.push(`<div class="photo-cell"><img src="${regData.photos[i]}" alt=""></div>`);
    } else {
      photoSlots.push(`<div class="photo-cell empty" id="addPhoto${i}">+</div>`);
    }
  }
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="regBack()">←</button>
      <div style="flex:1">
        <div class="page-title">Deyarli tayyor!</div>
        <div style="display:flex;gap:6px;margin-top:6px">${dots}</div>
      </div>
      <span style="color:#999;font-size:13px">3/3</span>
    </div>
    <div class="page-content">
      <div class="form-group">
        <label class="form-label">Ishlaringiz rasmlari (ixtiyoriy)</label>
        <div class="photo-grid">${photoSlots.join('')}</div>
      </div>
      <button class="btn-primary" id="finishReg">✅ Ro'yxatdan o'tish</button>
      <button class="btn-ghost btn-gap" id="skipPhotos">O'tkazib yuborish</button>
    </div>
  </div>`;
}

function bindRegister() {
  if (regStep === 1) {
    document.querySelectorAll('#profGrid .chip').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.prof;
        if (regData.professions.includes(id)) {
          regData.professions = regData.professions.filter(p => p !== id);
          el.classList.remove('selected');
        } else {
          regData.professions.push(id);
          el.classList.add('selected');
        }
      });
    });
    document.getElementById('step1Next')?.addEventListener('click', () => {
      regData.name = document.getElementById('regName').value.trim();
      let ok = true;
      if (regData.name.length < 2) {
        document.getElementById('nameErr').textContent = 'Ism kamida 2 belgi bo\'lsin';
        ok = false;
      } else document.getElementById('nameErr').textContent = '';
      if (regData.professions.length === 0) {
        document.getElementById('profErr').textContent = 'Kamida bitta kasb tanlang';
        ok = false;
      } else document.getElementById('profErr').textContent = '';
      if (ok) { regStep = 2; render(); }
    });
  } else if (regStep === 2) {
    setupPhoneInput('regPhone');
    document.querySelectorAll('#distGrid .chip').forEach(el => {
      el.addEventListener('click', () => {
        regData.district = el.dataset.dist;
        document.querySelectorAll('#distGrid .chip').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
      });
    });
    document.getElementById('step2Next')?.addEventListener('click', () => {
      const rawPhone = document.getElementById('regPhone').value;
      regData.phone = normalizePhone(rawPhone);
      let ok = true;
      if (!regData.district) {
        document.getElementById('distErr').textContent = 'Hududni tanlang';
        ok = false;
      } else document.getElementById('distErr').textContent = '';
      if (!isPhoneValid(rawPhone)) {
        document.getElementById('phoneErr').textContent = 'To\'liq raqam kiriting: +998 99-123-45-67';
        ok = false;
      } else document.getElementById('phoneErr').textContent = '';
      if (ok) { regStep = 3; render(); }
    });
  } else {
    document.querySelectorAll('.photo-cell.empty').forEach(el => {
      el.addEventListener('click', () => {
        openFilePicker((compressed) => {
          if (regData.photos.length < 3) {
            regData.photos.push(compressed);
            render();
          }
        });
      });
    });
    document.getElementById('finishReg')?.addEventListener('click', submitRegister);
    document.getElementById('skipPhotos')?.addEventListener('click', submitRegister);
  }
}

async function submitRegister() {
  if (_isSubmitting) return;
  _isSubmitting = true;
  document.querySelectorAll('#finishReg, #skipPhotos').forEach(b => { if (b) b.disabled = true; });
  try {
    const payload = {
      telegram_id: userId || Date.now(),
      name: regData.name,
      phone: regData.phone,
      professions: regData.professions,
      district: regData.district,
      photos: regData.photos,
    };
    const res = await api('POST', '/api/masters', payload);
    masterData = res.master;
    regStep = 1;
    regData = { name: '', professions: [], district: '', phone: '', photos: [] };
    _isSubmitting = false;
    showToast('✅ Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
    navigate(PAGES.MASTER_HOME);
  } catch (err) {
    _isSubmitting = false;
    document.querySelectorAll('#finishReg, #skipPhotos').forEach(b => { if (b) b.disabled = false; });
    showToast('❌ ' + err.message);
  }
}

window.regBack = function() {
  if (regStep > 1) { regStep--; render(); }
};

window.goBackFromRegister = function() {
  regStep = 1;
  regData = { name: '', professions: [], district: '', phone: '', photos: [] };
  navigate(PAGES.ONBOARDING);
};

// --- CLIENT HOME ---
function renderClientHome() {
  const isMasterBrowsing = masterData !== null;

  const header = isMasterBrowsing
    ? `<div class="page-header">
        <button class="back-btn" onclick="navigate('${PAGES.MASTER_HOME}')">←</button>
        <div class="page-title">Usta qidirish</div>
       </div>`
    : `<div style="background:var(--blue);padding:24px 16px 20px">
        <div style="color:white;font-size:22px;font-weight:800">Farg'ona Usta 🏗️</div>
        <div style="color:rgba(255,255,255,0.8);font-size:15px;margin-top:4px">Qanday usta kerak?</div>
       </div>`;

  const navBtns = isMasterBrowsing ? '' : `
  <nav class="bottom-nav">
    <button class="nav-btn ${currentNav==='search'?'active':''}" onclick="setClientNav('search')">
      <span class="nav-icon">🔍</span><span>Qidirish</span>
    </button>
    <button class="nav-btn ${currentNav==='reviews'?'active':''}" onclick="setClientNav('reviews')">
      <span class="nav-icon">⭐</span><span>Baholarim</span>
    </button>
  </nav>`;

  return `
  <div class="page">
    ${header}
    <div class="page-content">
      <div class="chip-grid" id="profSelect">
        ${PROFESSIONS.map(p => `
          <div class="chip" data-prof="${p.id}">${p.emoji} ${p.label}</div>`).join('')}
      </div>
      ${!isMasterBrowsing ? `
        <div style="margin-top:8px;padding-top:16px;border-top:1px solid #eee">
          <div style="font-size:13px;color:#888;text-align:center;margin-bottom:10px">Kerakli ustani topmadingizmi?</div>
          <button class="btn-secondary" onclick="navigate('${PAGES.ORDER_FORM}')">📝 Buyurtma berish</button>
        </div>
        <button class="btn-ghost btn-gap" onclick="navigate('${PAGES.ONBOARDING}')">↩ Rolni o'zgartirish</button>` : ''}
    </div>
    ${navBtns}
  </div>`;
}

function bindClientHome() {
  document.querySelectorAll('#profSelect .chip').forEach(el => {
    el.addEventListener('click', () => {
      navigate(PAGES.SEARCH, { selectedProfession: el.dataset.prof });
    });
  });
}

window.setClientNav = function(tab) {
  currentNav = tab;
  if (tab === 'search') navigate(PAGES.CLIENT_HOME);
  else showToast('Baholarim tez orada ⭐');
};

// --- SEARCH (district selection) ---
function renderSearch() {
  const prof = getProfLabel(appState.selectedProfession);
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.CLIENT_HOME}')">←</button>
      <div class="page-title">${prof.emoji} ${esc(prof.label)}</div>
    </div>
    <div class="page-content">
      <div style="color:#666;margin-bottom:12px;font-size:15px">Qaysi hududda?</div>
      <div class="chip-grid" id="distSelect">
        ${DISTRICTS.map(d => `
          <div class="chip" data-dist="${d.id}">${d.emoji} ${d.label}</div>`).join('')}
      </div>
    </div>
  </div>`;
}

function bindSearch() {
  document.querySelectorAll('#distSelect .chip').forEach(el => {
    el.addEventListener('click', async () => {
      navigate(PAGES.LOADING);
      try {
        const q = `?profession=${appState.selectedProfession}&district=${el.dataset.dist}`;
        const results = await api('GET', '/api/masters/search' + q);
        navigate(PAGES.RESULTS, { searchResults: results, selectedDistrict: el.dataset.dist });
      } catch (err) {
        showToast('❌ ' + err.message);
        navigate(PAGES.SEARCH);
      }
    });
  });
}

// --- RESULTS ---
function renderResults() {
  const results = appState.searchResults || [];
  const prof = getProfLabel(appState.selectedProfession);
  const dist = getDistrictLabel(appState.selectedDistrict);

  if (results.length === 0) {
    return `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" onclick="navigate('${PAGES.SEARCH}')">←</button>
        <div class="page-title">${prof.emoji} ${esc(prof.label)} · ${esc(dist.label)}</div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">😔</div>
        <div class="empty-title">Hozircha usta yo'q</div>
        <div class="empty-text">Bu hududda hozircha ${esc(prof.label.toLowerCase())} yo'q.</div>
        <div style="height:24px"></div>
        <button class="btn-primary" onclick="navigate('${PAGES.ORDER_FORM}')">📝 Buyurtma berish</button>
        <button class="btn-secondary btn-gap" id="leaveNumber">📱 Raqamni qoldirish</button>
        <button class="btn-ghost btn-gap" onclick="navigate('${PAGES.SEARCH}')">← Boshqa qidirish</button>
      </div>
    </div>`;
  }

  const cards = results.map(m => `
    <div class="master-card" data-id="${m.id}">
      <div class="avatar">${getInitials(m.name)}</div>
      <div class="info">
        <div class="name">${esc(m.name)}</div>
        <div class="meta">${renderStars(m.rating, m.review_count)}</div>
      </div>
      <div class="arrow">›</div>
    </div>`).join('');

  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.SEARCH}')">←</button>
      <div class="page-title">${prof.emoji} ${esc(prof.label)} · ${esc(dist.label)}</div>
    </div>
    <div class="page-content">
      <div style="color:#666;margin-bottom:12px;font-size:14px">${results.length} ta usta topildi</div>
      ${cards}
    </div>
  </div>`;
}

function bindResults() {
  document.querySelectorAll('.master-card').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.dataset.id;
      navigate(PAGES.LOADING);
      try {
        await api('POST', `/api/masters/${id}/view`);
        const master = await api('GET', `/api/masters/${id}`);
        navigate(PAGES.PROFILE, { viewedMaster: master });
      } catch (err) {
        showToast('❌ ' + err.message);
        navigate(PAGES.RESULTS);
      }
    });
  });

  document.getElementById('leaveNumber')?.addEventListener('click', async () => {
    if (!userId) { showToast('Telegram orqali kirish kerak'); return; }
    try {
      await api('POST', '/api/waiting', {
        telegram_id: userId,
        profession: appState.selectedProfession,
        district: appState.selectedDistrict,
      });
      showToast('✅ Raqamingiz qoldirildi! Usta paydo bo\'lganda xabar beramiz.');
    } catch (err) {
      showToast('❌ ' + err.message);
    }
  });
}

// --- PROFILE (client views master) ---
function renderProfile() {
  const m = appState.viewedMaster;
  if (!m) return renderLoading();
  const dist = getDistrictLabel(m.district);

  const photos = m.photos && m.photos.length > 0
    ? `<div class="photo-grid">${m.photos.slice(0, 6).map((p, i) => `<div class="photo-cell" data-url="${p}" data-idx="${i}"><img src="${p}" alt="" loading="lazy"></div>`).join('')}</div>`
    : '<div style="color:#999;font-size:14px;text-align:center;padding:12px">Rasmlar yo\'q</div>';

  const reviews = m.reviews && m.reviews.length > 0
    ? m.reviews.map(r => `
      <div class="review-card">
        <div class="review-stars">${'⭐'.repeat(r.rating)}</div>
        ${r.comment ? `<div class="review-text">"${esc(r.comment)}"</div>` : ''}
        <div class="review-date">${formatDate(r.created_at)}</div>
      </div>`).join('')
    : '<div style="color:#999;font-size:14px">Hali izoh yo\'q</div>';

  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.RESULTS}')">←</button>
      <div class="page-title">Usta profili</div>
    </div>
    <div class="profile-header card" style="margin:0;border-radius:0">
      <div class="avatar avatar-lg">${getInitials(m.name)}</div>
      <div class="name">${esc(m.name)}</div>
      <div class="profession">${renderProfBadges(m)}</div>
      <div class="profession">${dist.emoji} ${esc(dist.label)}</div>
    </div>
    <div class="page-content">
      <div class="stats-row card">
        <div class="stat-card">
          <div class="stat-value">${m.rating > 0 ? m.rating : '—'}</div>
          <div class="stat-label">Reyting</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${m.review_count || 0}</div>
          <div class="stat-label">Izoh</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${m.photos ? m.photos.length : 0}</div>
          <div class="stat-label">Rasm</div>
        </div>
      </div>
      <div class="card">
        <div class="form-label" style="margin-bottom:10px">Ishlar rasmlari</div>
        ${photos}
      </div>
      <div class="card">
        <div class="form-label" style="margin-bottom:10px">Izohlar</div>
        ${reviews}
      </div>
      ${m.telegram_id === userId
        ? `<div style="text-align:center;padding:12px;color:var(--text-secondary);font-size:14px">Bu sizning profilingiz</div>`
        : `<button class="btn-primary" id="contactBtn">📞 Bog'lanish</button>
           <button class="btn-secondary btn-gap" id="rateBtn">⭐ Baho berish</button>`
      }
    </div>
  </div>`;
}

function bindProfile() {
  const m = appState.viewedMaster;
  document.getElementById('contactBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await api('POST', `/api/masters/${m.id}/contact`);
      btn.disabled = false;
      showContactModal(res.phone, m.telegram_id);
    } catch (err) {
      btn.disabled = false;
      showToast('❌ ' + err.message);
    }
  });

  document.getElementById('rateBtn')?.addEventListener('click', () => {
    navigate(PAGES.RATING, { ratingMasterId: m.id, ratingMasterName: m.name });
  });

  document.querySelectorAll('.photo-cell[data-url]').forEach(el => {
    el.addEventListener('click', () => showFullscreen(el.dataset.url));
  });
}

function showContactModal(phone, telegramId) {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-overlay';
  overlay.style.cssText = 'display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,0.55)';

  const sheet = document.createElement('div');
  sheet.style.cssText = 'background:#fff;border-radius:20px 20px 0 0;padding:24px 16px 32px;display:flex;flex-direction:column;gap:12px';

  const title = document.createElement('div');
  title.style.cssText = 'font-weight:700;font-size:17px;text-align:center;margin-bottom:4px';
  title.textContent = "Usta bilan bog'lanish";

  const callLink = document.createElement('a');
  callLink.href = `tel:${phone}`;
  callLink.style.cssText = 'display:block;text-align:center;text-decoration:none;background:var(--blue);color:#fff;padding:14px;border-radius:12px;font-weight:600;font-size:15px';
  callLink.textContent = '📞 Qo\'ng\'iroq qilish';
  callLink.addEventListener('click', () => overlay.remove());

  const tgLink = document.createElement('a');
  tgLink.href = `tg://user?id=${telegramId}`;
  tgLink.style.cssText = 'display:block;text-align:center;text-decoration:none;background:#f0f2f5;color:#222;padding:14px;border-radius:12px;font-weight:600;font-size:15px';
  tgLink.textContent = '✈️ Telegram orqali yozish';
  tgLink.addEventListener('click', () => overlay.remove());

  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = 'background:none;border:none;color:var(--text-secondary);font-size:15px;padding:10px;cursor:pointer';
  cancelBtn.textContent = 'Bekor qilish';
  cancelBtn.addEventListener('click', () => overlay.remove());

  sheet.appendChild(title);
  sheet.appendChild(callLink);
  sheet.appendChild(tgLink);
  sheet.appendChild(cancelBtn);
  overlay.appendChild(sheet);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function showFullscreen(url) {
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-overlay';

  const img = document.createElement('img');
  img.src = url;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'fullscreen-close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => overlay.remove());

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// --- MY PROFILE ---
function renderMyProfile() {
  if (!masterData) return renderLoading();
  const dist = getDistrictLabel(masterData.district);
  const photos = masterData.photos && masterData.photos.length > 0
    ? `<div class="photo-grid">${masterData.photos.slice(0, 6).map(p => `<div class="photo-cell" data-url="${p}"><img src="${p}" alt="" loading="lazy"></div>`).join('')}</div>`
    : '<div style="color:#999;font-size:14px;text-align:center;padding:12px">Rasmlar yo\'q</div>';
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.MASTER_HOME}')">←</button>
      <div class="page-title">Mening profilim</div>
    </div>
    <div class="profile-header card" style="margin:0;border-radius:0">
      <div class="avatar avatar-lg">${esc(getInitials(masterData.name))}</div>
      <div class="name">${esc(masterData.name)}</div>
      <div class="profession">${renderProfBadges(masterData)}</div>
      <div class="profession">${dist.emoji} ${esc(dist.label)}</div>
      <div class="profession">📞 ${esc(masterData.phone)}</div>
    </div>
    <div class="page-content">
      <div class="stats-row card">
        <div class="stat-card"><div class="stat-value">${masterData.rating > 0 ? masterData.rating : '—'}</div><div class="stat-label">Reyting</div></div>
        <div class="stat-card"><div class="stat-value">${masterData.review_count}</div><div class="stat-label">Izoh</div></div>
        <div class="stat-card"><div class="stat-value">${masterData.views}</div><div class="stat-label">Ko'rish</div></div>
      </div>
      <div class="card">
        <div class="form-label" style="margin-bottom:10px">Ishlar rasmlari</div>
        ${photos}
      </div>
      <button class="btn-primary" onclick="navigate('${PAGES.EDIT_PROFILE}')">✏️ Profilni tahrirlash</button>
      <button class="btn-secondary btn-gap" onclick="navigate('${PAGES.PHOTOS}')">📸 Rasmlarni boshqarish</button>
    </div>
  </div>`;
}

function bindMyProfile() {
  document.querySelectorAll('.photo-cell[data-url]').forEach(el => {
    el.addEventListener('click', () => showFullscreen(el.dataset.url));
  });
}

// --- EDIT PROFILE ---
function renderEditProfile() {
  if (!masterData) return renderLoading();
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.MASTER_HOME}')">←</button>
      <div class="page-title">Profilni tahrirlash</div>
    </div>
    <div class="page-content">
      <div class="form-group">
        <label class="form-label">Ism</label>
        <input type="text" id="editName" value="${esc(masterData.name)}" maxlength="50">
      </div>
      <div class="form-group">
        <label class="form-label">Kasb (bir nechtasini tanlash mumkin)</label>
        <div class="chip-grid" id="editProfGrid">
          ${PROFESSIONS.map(p => `
            <div class="chip ${(masterData.professions || (masterData.profession ? [masterData.profession] : [])).includes(p.id) ? 'selected' : ''}" data-prof="${p.id}">
              ${p.emoji} ${p.label}
            </div>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Hudud</label>
        <div class="chip-grid" id="editDistGrid">
          ${DISTRICTS.map(d => `
            <div class="chip ${masterData.district===d.id?'selected':''}" data-dist="${d.id}">
              ${d.emoji} ${d.label}
            </div>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Telefon</label>
        <input type="tel" id="editPhone" value="${esc(masterData.phone)}" inputmode="numeric">
      </div>
      <button class="btn-primary" id="saveEditBtn">💾 Saqlash</button>
    </div>
    <nav class="bottom-nav">
      <button class="nav-btn" onclick="setNav('home')"><span class="nav-icon">🏠</span><span>Bosh</span></button>
      <button class="nav-btn" onclick="setNav('photos')"><span class="nav-icon">📸</span><span>Rasmlar</span></button>
      <button class="nav-btn" onclick="setNav('orders')"><span class="nav-icon">📋</span><span>Buyurtmalar</span></button>
      <button class="nav-btn active"><span class="nav-icon">👤</span><span>Profil</span></button>
    </nav>
  </div>`;
}

function bindEditProfile() {
  setupPhoneInput('editPhone');
  let editProfs = [...(masterData.professions || (masterData.profession ? [masterData.profession] : []))];
  let editDist = masterData.district;

  document.querySelectorAll('#editProfGrid .chip').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.prof;
      if (editProfs.includes(id)) {
        editProfs = editProfs.filter(p => p !== id);
        el.classList.remove('selected');
      } else {
        editProfs.push(id);
        el.classList.add('selected');
      }
    });
  });

  document.querySelectorAll('#editDistGrid .chip').forEach(el => {
    el.addEventListener('click', () => {
      editDist = el.dataset.dist;
      document.querySelectorAll('#editDistGrid .chip').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  document.getElementById('saveEditBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const name = document.getElementById('editName').value.trim();
    const rawPhone = document.getElementById('editPhone').value;
    const phone = normalizePhone(rawPhone);
    if (name.length < 2) { showToast('Ism kamida 2 belgi'); return; }
    if (editProfs.length === 0) { showToast('Kamida bitta kasb tanlang'); return; }
    if (!isPhoneValid(rawPhone)) { showToast('To\'liq raqam kiriting'); return; }
    btn.disabled = true;
    try {
      const res = await api('PUT', `/api/masters/${masterData.id}`, { name, phone, professions: editProfs, district: editDist });
      masterData = res.master;
      showToast('✅ Saqlandi');
      navigate(PAGES.MASTER_HOME);
    } catch (err) {
      btn.disabled = false;
      showToast('❌ ' + err.message);
    }
  });
}

// --- PHOTOS ---
function renderPhotos() {
  if (!masterData) return renderLoading();
  const photos = masterData.photos || [];
  const slots = [];
  const totalSlots = Math.max(photos.length + (photos.length < 10 ? 1 : 0), 3);
  for (let i = 0; i < totalSlots; i++) {
    if (i < photos.length) {
      slots.push(`<div class="photo-cell" data-idx="${i}"><img src="${photos[i]}" alt="" loading="lazy"><div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.5);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;cursor:pointer" data-del="${i}">✕</div></div>`);
    } else if (i === photos.length && photos.length < 10) {
      slots.push(`<div class="photo-cell empty" id="photoAdd">+</div>`);
    } else {
      slots.push(`<div class="photo-cell" style="background:var(--bg);border:1.5px dashed var(--border)"></div>`);
    }
  }
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.MASTER_HOME}')">←</button>
      <div class="page-title">Rasmlarim (${photos.length}/10)</div>
    </div>
    <div class="page-content">
      <div class="photo-grid">${slots.join('')}</div>
      <div style="height:16px"></div>
      ${photos.length < 10 ? '<button class="btn-secondary" id="addNewPhoto">📸 Rasm qo\'shish</button>' : ''}
    </div>
    <nav class="bottom-nav">
      <button class="nav-btn" onclick="setNav('home')"><span class="nav-icon">🏠</span><span>Bosh</span></button>
      <button class="nav-btn active"><span class="nav-icon">📸</span><span>Rasmlar</span></button>
      <button class="nav-btn" onclick="setNav('orders')"><span class="nav-icon">📋</span><span>Buyurtmalar</span></button>
      <button class="nav-btn" onclick="setNav('profile')"><span class="nav-icon">👤</span><span>Profil</span></button>
    </nav>
  </div>`;
}

function bindPhotos() {
  let _uploading = false;

  const uploadPhoto = () => {
    if (_uploading) return;
    openFilePicker(async (compressed) => {
      if (_uploading) return;
      _uploading = true;
      const addBtn = document.getElementById('addNewPhoto');
      const cellBtn = document.getElementById('photoAdd');
      if (addBtn) addBtn.disabled = true;
      if (cellBtn) cellBtn.style.pointerEvents = 'none';
      try {
        const res = await api('POST', `/api/masters/${masterData.id}/photos`, { photo_url: compressed });
        masterData.photos = res.photos;
        render();
        showToast('✅ Rasm qo\'shildi');
      } catch (err) {
        _uploading = false;
        if (addBtn) addBtn.disabled = false;
        if (cellBtn) cellBtn.style.pointerEvents = '';
        showToast('❌ ' + err.message);
      }
    });
  };

  document.getElementById('photoAdd')?.addEventListener('click', uploadPhoto);
  document.getElementById('addNewPhoto')?.addEventListener('click', uploadPhoto);

  document.querySelectorAll('[data-del]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (el.dataset.deleting) return;
      el.dataset.deleting = '1';
      const idx = Number(el.dataset.del);
      try {
        const res = await api('DELETE', `/api/masters/${masterData.id}/photos/${idx}`);
        masterData.photos = res.photos;
        render();
        showToast('🗑️ Rasm o\'chirildi');
      } catch (err) {
        delete el.dataset.deleting;
        showToast('❌ ' + err.message);
      }
    });
  });

  document.querySelectorAll('.photo-cell[data-idx]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.querySelector('img')) showFullscreen(el.querySelector('img').src);
    });
  });
}

// --- RATING ---
let selectedRating = 0;

function renderRating() {
  const name = appState.ratingMasterName || 'Usta';
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.PROFILE}')">←</button>
      <div class="page-title">Baho berish</div>
    </div>
    <div class="page-content">
      <div class="card" style="text-align:center">
        <div style="font-weight:600;font-size:16px;margin-bottom:16px">${esc(name)}</div>
        <div class="stars-input" id="starsInput">
          <span data-star="1">☆</span>
          <span data-star="2">☆</span>
          <span data-star="3">☆</span>
          <span data-star="4">☆</span>
          <span data-star="5">☆</span>
        </div>
        <div style="color:#999;font-size:13px" id="starHint">Yulduzga bosing</div>
      </div>
      <div class="form-group">
        <label class="form-label">Izoh (ixtiyoriy)</label>
        <textarea id="reviewComment" placeholder="Fikringizni yozing..."></textarea>
      </div>
      <button class="btn-primary" id="saveRating">✅ Saqlash</button>
      <button class="btn-ghost btn-gap" onclick="navigate('${PAGES.PROFILE}')">Bekor qilish</button>
    </div>
  </div>`;
}

function bindRating() {
  selectedRating = 0;
  const stars = document.querySelectorAll('#starsInput span');
  const hint = document.getElementById('starHint');
  const labels = ['', 'Yomon', "Qoniqarsiz", "O'rtacha", 'Yaxshi', 'A\'lo'];

  stars.forEach((star) => {
    star.addEventListener('click', () => {
      selectedRating = Number(star.dataset.star);
      stars.forEach((s, j) => {
        s.textContent = j < selectedRating ? '⭐' : '☆';
      });
      hint.textContent = labels[selectedRating];
    });
  });

  document.getElementById('saveRating')?.addEventListener('click', async (e) => {
    if (!selectedRating) { showToast('Yulduz tanlang'); return; }
    const btn = e.currentTarget;
    btn.disabled = true;
    const comment = document.getElementById('reviewComment').value.trim();
    try {
      await api('POST', '/api/reviews', {
        master_id: appState.ratingMasterId,
        client_telegram_id: userId || 0,
        rating: selectedRating,
        comment,
      });
      showToast('✅ Bahoyingiz saqlandi!');
      const master = await api('GET', `/api/masters/${appState.ratingMasterId}`);
      navigate(PAGES.PROFILE, { viewedMaster: master });
    } catch (err) {
      btn.disabled = false;
      showToast('❌ ' + err.message);
    }
  });
}

// --- ORDER FORM (client creates order) ---
function renderOrderForm() {
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.CLIENT_HOME}')">←</button>
      <div class="page-title">Buyurtma berish</div>
    </div>
    <div class="page-content">
      <div class="form-group">
        <label class="form-label">Qanday usta kerak?</label>
        <div class="chip-grid" id="orderProfGrid">
          ${PROFESSIONS.map(p => `<div class="chip" data-prof="${p.id}">${p.emoji} ${p.label}</div>`).join('')}
        </div>
        <div class="form-error" id="orderProfErr"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Hudud</label>
        <div class="chip-grid" id="orderDistGrid">
          ${DISTRICTS.map(d => `<div class="chip" data-dist="${d.id}">${d.emoji} ${d.label}</div>`).join('')}
        </div>
        <div class="form-error" id="orderDistErr"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Qisqacha tavsif (ixtiyoriy)</label>
        <textarea id="orderDesc" placeholder="Masalan: vannaxona 15 kv.m, seramika yotqizish..." maxlength="300"></textarea>
      </div>
      <button class="btn-primary" id="orderSubmitBtn">📝 Buyurtma yuborish</button>
    </div>
  </div>`;
}

function bindOrderForm() {
  let orderProf = '';
  let orderDist = '';

  document.querySelectorAll('#orderProfGrid .chip').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#orderProfGrid .chip').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      orderProf = el.dataset.prof;
    });
  });

  document.querySelectorAll('#orderDistGrid .chip').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('#orderDistGrid .chip').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      orderDist = el.dataset.dist;
    });
  });

  document.getElementById('orderSubmitBtn')?.addEventListener('click', async () => {
    document.getElementById('orderProfErr').textContent = '';
    document.getElementById('orderDistErr').textContent = '';
    if (!orderProf) { document.getElementById('orderProfErr').textContent = 'Kasb tanlang'; return; }
    if (!orderDist) { document.getElementById('orderDistErr').textContent = 'Hudud tanlang'; return; }
    if (!userId) { showToast('Telegram orqali kirish kerak'); return; }

    const desc = document.getElementById('orderDesc').value.trim();
    const btn = document.getElementById('orderSubmitBtn');
    if (btn) btn.disabled = true;
    try {
      await api('POST', '/api/orders', {
        client_telegram_id: userId,
        client_name: tgUser?.first_name || 'Mijoz',
        profession: orderProf,
        district: orderDist,
        description: desc,
      });
      showToast('✅ Buyurtma yuborildi! Ustalar siz bilan bog\'lanadi.');
      navigate(PAGES.CLIENT_HOME);
    } catch (err) {
      showToast('❌ ' + err.message);
      if (btn) btn.disabled = false;
    }
  });
}

// --- ORDERS (master sees incoming orders) ---
function renderOrders() {
  return `
  <div class="page">
    <div class="page-header">
      <button class="back-btn" onclick="navigate('${PAGES.MASTER_HOME}')">←</button>
      <div class="page-title">Buyurtmalar</div>
    </div>
    <div class="page-content" id="ordersList">
      <div style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div>
    </div>
    <nav class="bottom-nav">
      <button class="nav-btn" onclick="setNav('home')"><span class="nav-icon">🏠</span><span>Bosh</span></button>
      <button class="nav-btn" onclick="setNav('photos')"><span class="nav-icon">📸</span><span>Rasmlar</span></button>
      <button class="nav-btn active"><span class="nav-icon">📋</span><span>Buyurtmalar</span></button>
      <button class="nav-btn" onclick="setNav('profile')"><span class="nav-icon">👤</span><span>Profil</span></button>
    </nav>
  </div>`;
}

async function bindOrders() {
  if (!masterData) return;

  try {
    const profStr = (masterData.professions || []).join(',');
    const orders = await api('GET', `/api/orders?professions=${encodeURIComponent(profStr)}`);

    const container = document.getElementById('ordersList');
    if (!container) return; // foydalanuvchi sahifadan ketgan

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:48px 16px;color:#999">
          <div style="font-size:44px;margin-bottom:12px">📋</div>
          <div style="font-weight:700;font-size:16px;color:#555;margin-bottom:8px">Hozircha buyurtma yo'q</div>
          <div style="font-size:14px">Sizning kasbingizga mos buyurtmalar shu yerda ko'rinadi</div>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(o => {
      const prof = PROFESSIONS.find(p => p.id === o.profession);
      const dist = DISTRICTS.find(d => d.id === o.district);
      return `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-weight:700;font-size:15px">${prof?.emoji || '🛠️'} ${esc(prof?.label || o.profession)}</div>
            <div style="font-size:12px;color:#aaa">${formatDate(o.created_at)}</div>
          </div>
          <div style="font-size:14px;color:#666;margin-bottom:4px">${dist?.emoji || '📍'} ${esc(dist?.label || o.district)}</div>
          <div style="font-size:13px;color:#888;margin-bottom:8px">👤 ${esc(o.client_name)}</div>
          ${o.description ? `<div style="font-size:14px;color:#333;background:#f7f8fa;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-style:italic">"${esc(o.description)}"</div>` : ''}
          <button class="btn-primary order-contact-btn" style="padding:10px" data-oid="${o.id}" data-ctid="${o.client_telegram_id}">✈️ Telegram orqali bog'lanish</button>
        </div>`;
    }).join('');

    container.querySelectorAll('.order-contact-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        try { await api('POST', `/api/orders/${btn.dataset.oid}/contact`); } catch (_) {}
        window.open(`tg://user?id=${btn.dataset.ctid}`, '_blank');
        btn.disabled = false;
      });
    });
  } catch (err) {
    const container = document.getElementById('ordersList');
    if (container) container.innerHTML = `<div style="text-align:center;padding:40px;color:#999">Xato yuz berdi</div>`;
  }
}

// --- NOT FOUND ---
function renderNotFound() {
  return `
  <div class="page">
    <div class="empty-state" style="margin-top:80px">
      <div class="empty-icon">😔</div>
      <div class="empty-title">Sahifa topilmadi</div>
      <div class="empty-text">Bunday sahifa mavjud emas</div>
      <div style="height:24px"></div>
      <button class="btn-primary" onclick="navigate('${PAGES.ONBOARDING}')">🏠 Bosh sahifa</button>
    </div>
  </div>`;
}

function bindNotFound() {}

// === INIT ===
async function init() {
  render(); // show loading

  if (!userId) {
    // Telegram dan tashqarida ochilgan (test uchun)
    navigate(PAGES.ONBOARDING);
    return;
  }

  try {
    const user = await api('GET', `/api/user/${userId}`);
    if (user.role === 'master') {
      masterData = user.data;
      navigate(PAGES.MASTER_HOME);
    } else if (user.role === 'client') {
      navigate(PAGES.CLIENT_HOME);
    } else {
      navigate(PAGES.ONBOARDING);
    }
  } catch (err) {
    navigate(PAGES.ONBOARDING);
  }
}

// Make navigate global
window.navigate = navigate;

initFilePicker();
init();
