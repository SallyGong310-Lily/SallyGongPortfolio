/* ==================================================== */
/* app.js：物理粒子引擎与能效交互中枢 */
/* 下半部：图文条目注册表 · 季节联动路由 · 正文渲染   */
/* ==================================================== */

const canvas = document.getElementById('season-canvas');
const ctx = canvas.getContext('2d');
let width, height;

let currentSeason = 'autumn';
let particles = [];
const MAX_PARTICLES = 32;

let isEcoMode = false;
let isTabActive = true;
let animationFrameId = null;

/* 特殊粒子：馆长的小信封（全站覆盖：主页与文章页均会飘落，点击拆信） */
let specialParticle = null;
let nextSpecialAt = performance.now() + 10000;   /* 首封约 10 秒后出现 */

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  if (width < 768 && particles.length > 14) {
    particles = particles.slice(0, 14);
  }
}
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor(isInitial = false) {
    this.reset(isInitial);
  }

  reset(isInitial = false) {
    const isLeft = Math.random() < 0.5;
    const marginSpan = width * 0.16;
    if (Math.random() < 0.90) {
      this.x = isLeft ? Math.random() * marginSpan : width - Math.random() * marginSpan;
    } else {
      this.x = Math.random() * width;
    }

    this.y = isInitial ? Math.random() * height : -30;
    this.opacity = 0.25 + Math.random() * 0.45;
    this.size = 8 + Math.random() * 9;
    this.speedY = 0.55 + Math.random() * 0.85;
    this.speedX = (Math.random() - 0.5) * 0.35;
    this.angle = Math.random() * Math.PI * 2;
    this.angularSpeed = 0.01 + Math.random() * 0.02;
    this.flip = Math.random() * Math.PI;
    this.flipSpeed = 0.015 + Math.random() * 0.02;

    if (currentSeason === 'summer') {
      this.speedY = 8 + Math.random() * 5;
      this.speedX = -1.2;
      this.len = 12 + Math.random() * 12;
      this.opacity = 0.15 + Math.random() * 0.2;
    }
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.angle) * 0.45;
    this.angle += this.angularSpeed;
    this.flip += this.flipSpeed;

    if (this.y > height + 40 || this.x < -40 || this.x > width + 40) {
      this.reset(false);
    }
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;

    const centerLeft = width * 0.2;
    const centerRight = width * 0.8;
    if (this.x > centerLeft && this.x < centerRight) {
      ctx.globalAlpha = this.opacity * 0.15;
    }

    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(Math.cos(this.flip), 1);

    if (currentSeason === 'autumn') {
      ctx.fillStyle = '#A33E1A';
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.6, -this.size * 0.6, this.size * 0.8, 0, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.8, 0, -this.size * 0.6, -this.size * 0.6, 0, -this.size);
      ctx.fill();
    }
    else if (currentSeason === 'spring') {
      ctx.fillStyle = '#E8A3B2';
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 0.7);
      ctx.bezierCurveTo(this.size * 0.5, -this.size * 0.7, this.size * 0.7, this.size * 0.3, 0, this.size * 0.8);
      ctx.bezierCurveTo(-this.size * 0.7, this.size * 0.3, -this.size * 0.5, -this.size * 0.7, 0, -this.size * 0.7);
      ctx.fill();
    }
    else if (currentSeason === 'summer') {
      ctx.strokeStyle = '#3A6375';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.speedX * 2.5, this.len);
      ctx.stroke();
    }
    else if (currentSeason === 'winter') {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

resizeCanvas();
for (let i = 0; i < MAX_PARTICLES; i++) {
  particles.push(new Particle(true));
}

/* ---------- 特殊粒子：馆长的小信封 ---------- */

const SEASON_ACCENT = { spring: '#3F624D', summer: '#155E75', autumn: '#9A3412', winter: '#334155' };
const SEASON_GLOW = { spring: '#F9A8D4', summer: '#7DD3FC', autumn: '#FDBA74', winter: '#BFDBFE' };

function spawnSpecial() {
  /* 只在页面两侧可见空白带生成，确保不被纸页遮挡、可被点击 */
  const sheetMax = Math.min(width, 1040);
  const margin = Math.max((width - sheetMax) / 2, 40);
  const sideX = 15 + Math.random() * Math.max(margin - 30, 10);
  specialParticle = {
    x: Math.random() < 0.5 ? sideX : width - sideX,
    y: -30,
    speedY: 0.45 + Math.random() * 0.25,
    angle: Math.random() * Math.PI * 2,
    swaySpeed: 0.008 + Math.random() * 0.008,
    life: 16,
    maxLife: 16
  };
  canvas.style.pointerEvents = 'auto';   /* 有信封可接时才接收点击 */
}

function updateSpecials() {
  if (!specialParticle) {
    if (performance.now() >= nextSpecialAt) spawnSpecial();
    return;
  }
  specialParticle.y += specialParticle.speedY;
  specialParticle.x += Math.sin(specialParticle.angle) * 0.4;
  specialParticle.angle += specialParticle.swaySpeed;
  specialParticle.life -= 1 / 60;
  if (specialParticle.y > height + 40 || specialParticle.life <= 0) {
    specialParticle = null;
    canvas.style.pointerEvents = 'none';
    nextSpecialAt = performance.now() + 15000 + Math.random() * 15000;   /* 之后每 15–30 秒一封 */
  }
}

function roundedRectPath(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawSpecial(s) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, s.life / 2)); /* 最后两秒渐隐 */
  ctx.translate(s.x, s.y);
  ctx.rotate(Math.sin(s.angle) * 0.22);

  /* 季节光晕 */
  ctx.shadowColor = SEASON_GLOW[currentSeason];
  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(253, 251, 247, 0.97)';
  const w = 32, h = 23;
  roundedRectPath(ctx, -w / 2, -h / 2, w, h, 3);
  ctx.fill();
  ctx.shadowBlur = 0;

  /* 信封封口折线 */
  ctx.strokeStyle = '#C9BFAF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(0, 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.stroke();

  /* 火漆封印（随季节变色） */
  ctx.fillStyle = SEASON_ACCENT[currentSeason];
  ctx.beginPath();
  ctx.arc(0, 2.5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

canvas.addEventListener('click', ev => {
  if (!specialParticle) return;
  const rect = canvas.getBoundingClientRect();
  const dx = ev.clientX - rect.left - specialParticle.x;
  const dy = ev.clientY - rect.top - specialParticle.y;
  if (dx * dx + dy * dy < 26 * 26) {
    specialParticle = null;
    canvas.style.pointerEvents = 'none';
    nextSpecialAt = performance.now() + 15000 + Math.random() * 15000;
    openCuratorNote();
  }
});

function renderLoop() {
  if (!isEcoMode && isTabActive) {
    ctx.clearRect(0, 0, width, height);
    updateSpecials();
    for (let p of particles) {
      p.update();
      p.draw();
    }
    if (specialParticle) drawSpecial(specialParticle);
  }
  animationFrameId = requestAnimationFrame(renderLoop);
}
renderLoop();

document.addEventListener('visibilitychange', () => {
  isTabActive = !document.hidden;
  if (!isTabActive) ctx.clearRect(0, 0, width, height);
});

function toggleEcoMode() {
  isEcoMode = !isEcoMode;
  const label = document.getElementById('eco-btn-label');
  if (isEcoMode) {
    ctx.clearRect(0, 0, width, height);
    specialParticle = null;
    canvas.style.pointerEvents = 'none';
    label.textContent = '静止态';
  } else {
    nextSpecialAt = performance.now() + 10000;
    label.textContent = '动效中';
  }
}

/* ---------- 季节节令 ---------- */

const SEASON_ZH = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' };
const SEASON_TEXT = {
  spring: '气象节律 · 芳春樱动',
  summer: '气象节律 · 绿荫微雨',
  autumn: '气象节律 · 秋风微拂',
  winter: '气象节律 · 岁暮初雪'
};
const MONTHS_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const MONTHS_ZH = ['一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'];

function monthToSeason(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/* 解析 YYYY.MM.DD（月份/日期须两位补零）；解析失败回退当前真实月份 */
function detectSeasonFromDate(dateStr) {
  const m = String(dateStr || '').match(/(\d{4})\.(\d{2})\.(\d{2})/);
  let month = m ? parseInt(m[2], 10) : NaN;
  if (!m) {
    const loose = String(dateStr || '').match(/\.(\d{1,2})\./);
    month = loose ? parseInt(loose[1], 10) : NaN;
  }
  if (isNaN(month) || month < 1 || month > 12) month = new Date().getMonth() + 1;
  return monthToSeason(month);
}

/* 主页（无文章态）的默认季节：按今天 */
const homeSeason = monthToSeason(new Date().getMonth() + 1);

/* 顶栏实时时间戳：读取访客系统时间的年 / 月 / 季节 */
const SEASON_EN = { spring: 'SPRING', summer: 'SUMMER', autumn: 'AUTUMN', winter: 'WINTER' };
function updateVolBadge() {
  const badge = document.getElementById('vol-badge');
  if (!badge) return;
  const now = new Date();
  badge.textContent = `VOL. ${now.getFullYear()} · ${MONTHS_EN[now.getMonth()].slice(0, 3)} · ${SEASON_EN[monthToSeason(now.getMonth() + 1)]}`;
}

function setSeason(seasonKey) {
  if (!SEASON_ZH[seasonKey]) return;
  currentSeason = seasonKey;
  document.body.className = `season-${seasonKey} min-h-screen flex flex-col justify-between relative py-4 sm:py-12 px-2 sm:px-6`;

  const indicator = document.getElementById('season-status-indicator');
  if (indicator) indicator.textContent = SEASON_TEXT[seasonKey];

  document.querySelectorAll('#season-switcher [data-season]').forEach(btn => {
    const active = btn.dataset.season === seasonKey;
    btn.classList.toggle('font-semibold', active);
    btn.classList.toggle('text-[var(--accent)]', active);
  });

  particles.forEach(p => p.reset(true));
}

/* ---------- 条目注册表 ---------- */

const DISPATCH_REGISTRY = {};

function registerDispatch(entry) {
  if (!entry || !entry.id) return;
  DISPATCH_REGISTRY[entry.id] = entry;
}

function getDispatch(id) {
  return DISPATCH_REGISTRY[id] || null;
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- 主页：特写与编年目次 ---------- */

function formatFeaturedDate(dateStr) {
  const m = String(dateStr || '').match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return dateStr || '';
  return MONTHS_EN[parseInt(m[2], 10) - 1].slice(0, 3) + ' ' + m[1];
}

function formatArticleDate(dateStr) {
  const m = String(dateStr || '').match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return dateStr || '';
  return `${MONTHS_EN[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
}

function featuredCardHTML(e) {
  const monthMatch = String(e.date || '').match(/\.(\d{2})\./);
  const kicker = monthMatch ? MONTHS_ZH[parseInt(monthMatch[1], 10) - 1] : '本月';
  const cover = e.cover || {};
  const blurb = (e.card && e.card.blurb) || e.subhead || '';
  /* 封面原片未落盘时显示占位字；图片加载成功后自动覆盖占位 */
  const coverInner = cover.src
    ? `<div class="w-full h-64 sm:h-96 bg-[var(--photo-frame-bg)] flex items-center justify-center text-[var(--muted)] font-sans text-xs tracking-wider darkroom-img"><span class="opacity-75">${esc(cover.alt || '[ 封面原片 · 悬浮显影 ]')}</span></div>
       <img src="${esc(cover.src)}" alt="${esc(cover.alt || e.title)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover darkroom-img" onerror="this.remove()">`
    : `<div class="w-full h-64 sm:h-96 bg-[var(--photo-frame-bg)] flex items-center justify-center text-[var(--muted)] font-sans text-xs tracking-wider darkroom-img"><span class="opacity-75">${esc(cover.alt || '[ 封面原片 · 悬浮显影 ]')}</span></div>`;
  return `<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center cursor-pointer group" data-dispatch="${esc(e.id)}" tabindex="0" role="link">
    <div class="lg:col-span-7 relative bg-[var(--photo-mat)] overflow-hidden shadow-xs">
      <div class="absolute -top-3 -left-6 w-24 h-10 washi-tape z-20 rotate-[-35deg]"></div>
      ${coverInner}
    </div>
    <div class="lg:col-span-5 flex flex-col justify-center space-y-3">
      <div class="font-sans text-[11px] uppercase tracking-widest text-[var(--accent)] font-semibold">Featured Dispatch · ${kicker}特写</div>
      <h2 class="text-xl sm:text-3xl font-normal leading-snug group-hover:text-[var(--muted)] transition-colors">${esc(e.title)}</h2>
      <p class="text-[var(--muted)] text-sm leading-relaxed font-light prose-editorial">${esc(blurb)}</p>
      <div class="pt-2 font-sans text-xs text-[var(--muted)] flex items-center gap-3">
        <span>文 / ${esc((e.byline && e.byline.author) || '宣传委员')}</span>
        <span>·</span>
        <time>${esc(formatFeaturedDate(e.date))}</time>
        <span>·</span>
        <span>${esc(e.readTime || '6 min read')}</span>
      </div>
    </div>
  </div>`;
}

function cardHTML(e) {
  const season = detectSeasonFromDate(e.date);
  const number = (e.card && e.card.number) || 'No. ' + e.id.replace(/^dispatch-/, '');
  const blurb = (e.card && e.card.blurb) || e.subhead || '';
  const note = e.card && e.card.note ? ' · ' + e.card.note : '';
  return `<article class="flex flex-col justify-between border-b border-[var(--rule)] pb-6 cursor-pointer group" data-dispatch="${esc(e.id)}" tabindex="0" role="link">
    <div>
      <div class="flex justify-between items-center font-sans text-[11px] text-[var(--muted)] tracking-wider uppercase mb-2">
        <span class="text-[var(--accent)] font-medium">${esc(number)} · ${esc((e.card && e.card.tag) || e.tag || SEASON_ZH[season])}</span>
        <time>${esc(e.date)}</time>
      </div>
      <h4 class="text-lg sm:text-xl font-normal leading-snug mb-2 group-hover:text-[var(--muted)] transition-colors">${esc(e.title)}</h4>
      <p class="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-light line-clamp-3">${esc(blurb)}</p>
    </div>
    <div class="mt-4 pt-3 border-t border-[var(--rule)]/50 flex items-center justify-between font-sans text-xs text-[var(--muted)]">
      <span>${SEASON_ZH[season]}${esc(note)}</span>
      <span class="group-hover:translate-x-1 transition-transform">展开阅读 →</span>
    </div>
  </article>`;
}

function renderHomeIndex() {
  /* 目录按条目编号倒序（No. 10 → No. 01，最新在上），特写位由 featured 标记决定 */
  const list = Object.values(DISPATCH_REGISTRY).sort((a, b) => {
    const na = parseInt(String(a.id).replace(/^dispatch-/, ''), 10) || 0;
    const nb = parseInt(String(b.id).replace(/^dispatch-/, ''), 10) || 0;
    return nb - na;
  });
  const featured = list.find(e => e.featured) || list[0];
  const fe = document.getElementById('featured-dispatch');
  if (fe) fe.innerHTML = featured ? featuredCardHTML(featured) : '';
  /* 特写篇目同样收录于编年目录（排序自然居首） */
  const grid = document.getElementById('dispatch-grid');
  if (grid) grid.innerHTML = list.map(cardHTML).join('');
}

/* ---------- 正文视图渲染 ---------- */

let currentAudio = null;

function setupAudio(audioCfg) {
  const pill = document.getElementById('audio-pill-box');
  if (!audioCfg || !audioCfg.src) {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio = null;
    }
    if (pill) pill.classList.add('hidden');
    return;
  }
  if (pill) pill.classList.remove('hidden');
  document.getElementById('audio-title').textContent = audioCfg.title || '现场原声音频胶囊';
  document.getElementById('audio-caption').textContent = audioCfg.caption || '';
  document.getElementById('audio-duration').textContent = audioCfg.duration ? ' · ' + audioCfg.duration : '';
  if (!currentAudio) {
    currentAudio = new Audio();
    currentAudio.addEventListener('play', () => setAudioUI(true));
    currentAudio.addEventListener('pause', () => setAudioUI(false));
    currentAudio.addEventListener('error', () => setAudioUI(false)); // 文件 404：静默回退
  }
  currentAudio.src = audioCfg.src;
  setAudioUI(false);
}

function setAudioUI(playing) {
  const pill = document.getElementById('audio-pill-box');
  if (pill) pill.classList.toggle('audio-playing', playing);
  const icon = document.getElementById('play-icon');
  if (icon) icon.textContent = playing ? '❚❚' : '▶';
}

function toggleAudio() {
  if (!currentAudio) return;
  if (currentAudio.paused) currentAudio.play().catch(() => setAudioUI(false));
  else currentAudio.pause();
}

function pauseAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  setAudioUI(false);
}

function renderArticle(entry) {
  const season = detectSeasonFromDate(entry.date);
  setSeason(season);

  document.getElementById('art-tag').textContent = 'Dispatch · ' + (entry.tag || 'Ledger');
  document.getElementById('art-date').textContent = formatArticleDate(entry.date);
  document.getElementById('art-season-badge').textContent = `Dispatches · ${season.toUpperCase()} Climate Active`;
  document.getElementById('art-title').textContent = entry.title;

  const subhead = document.getElementById('art-subhead');
  subhead.textContent = entry.subhead || '';
  subhead.classList.toggle('hidden', !entry.subhead);

  const byline = document.getElementById('art-byline');
  if (entry.byline) {
    let parts = [];
    if (Array.isArray(entry.byline.parts)) {
      parts = entry.byline.parts.slice();   // 自定义署名行（如「图文 / 暖冬会小组」）
    } else {
      if (entry.byline.author) parts.push('文 / ' + entry.byline.author);
      if (entry.byline.photo) parts.push('摄影 / ' + entry.byline.photo);
      if (entry.byline.wordCount) parts.push(entry.byline.wordCount);
    }
    byline.innerHTML = parts.map(esc).join('<span class="text-[var(--rule)]">/</span>');
    byline.classList.remove('hidden');
  } else {
    byline.classList.add('hidden');
  }

  const link = document.getElementById('wechat-link');
  if (entry.wechatUrl) {
    link.href = entry.wechatUrl;
    link.classList.remove('hidden');
  } else {
    link.classList.add('hidden');
  }

  setupAudio(entry.audio);

  document.getElementById('art-body').innerHTML = entry.body || '';
  autoDetectSubheads();
  bindArticleMedia();
  observeHighlights();
}

/* ---------- 小标题自动识别 ---------- */
/* 纯文本短段若命中序号/分类模式，自动提升为 h3 标签体小标题 */

function looksLikeSubhead(text) {
  if (!text || text.length > 24) return false;
  /* 第X部分 / 第X环节 / 第X篇章 */
  if (/^第[一二三四五六七八九十百0-9]{1,3}[篇章节部分环节]/.test(text)) return true;
  /* NO.1 / No 2 系列 */
  if (/^NO\.?\s?\d/i.test(text)) return true;
  /* 数字或中文序数起头 + 分隔符（01 活动回顾 / 一、自我介绍 / 壹 · 自我介绍） */
  if (/^(\d{1,2}|[一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾]{1,3})[、.．·:：\s]/.test(text)
      && /[一-龥]/.test(text)) return true;
  /* 关于 / 来自 开头的分类短语 */
  if (/^(关于|来自)/.test(text) && text.length <= 16) return true;
  /* 短分类：≤10 字且无任何标点（观影分享 / 活动回顾 之类） */
  if (text.length <= 10 && !/[，。！？；：、“”‘’（）…,.!?;:()]/.test(text)) return true;
  return false;
}

function autoDetectSubheads() {
  const body = document.getElementById('art-body');
  if (!body) return;
  body.querySelectorAll('p').forEach(p => {
    if (p.querySelector('*')) return;                 /* 仅纯文本段落参与识别 */
    if (p.className.includes('first-letter')) return; /* 首字下沉段豁免 */
    if (looksLikeSubhead(p.textContent.trim())) {
      const h = document.createElement('h3');
      h.textContent = p.textContent.trim();
      p.replaceWith(h);
    }
  });
}

function renderMissing(id) {
  document.getElementById('art-tag').textContent = 'Dispatch · Not Yet Archived';
  document.getElementById('art-date').textContent = '';
  document.getElementById('art-season-badge').textContent = 'Dispatch Reader';
  document.getElementById('art-title').textContent = '此卷尚未归档';
  const subhead = document.getElementById('art-subhead');
  subhead.textContent = '档案库中没有找到编号 dispatch/' + id + ' 的图文——也许它仍在冲洗房，也许它从未被推送。';
  subhead.classList.remove('hidden');
  document.getElementById('art-byline').classList.add('hidden');
  document.getElementById('wechat-link').classList.add('hidden');
  setupAudio(null);
  document.getElementById('art-body').innerHTML = '';
}

/* ---------- 视图路由与深链 ---------- */

let pushedByDispatch = false;

function openDispatch(id, push) {
  document.getElementById('view-home').classList.add('hidden');
  document.getElementById('view-article').classList.remove('hidden');
  window.scrollTo(0, 0);

  const entry = getDispatch(id);
  if (entry) renderArticle(entry);
  else renderMissing(id);

  if (push) {
    const target = '#dispatch/' + id;
    if (window.location.hash !== target) {
      pushedByDispatch = true;
      window.location.hash = 'dispatch/' + id;
    }
  }
}

/* 兼容旧式两参调用 */
function loadDispatch(id) {
  openDispatch(id, true);
}

function closeArticleView() {
  pauseAudio();
  document.getElementById('view-article').classList.add('hidden');
  document.getElementById('view-home').classList.remove('hidden');
  window.scrollTo(0, 0);
  setSeason(homeSeason);
}

function backToHome() {
  if (window.location.hash.startsWith('#dispatch/') && pushedByDispatch) {
    history.back();
    return;
  }
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  closeArticleView();
}

window.addEventListener('popstate', () => {
  const m = window.location.hash.match(/^#dispatch\/(.+)$/);
  if (m) openDispatch(decodeURIComponent(m[1]), false);
  else closeArticleView();
});

/* ---------- 正文媒体绑定（放映盒点击委托 + 播放态） ---------- */

function bindArticleMedia() {
  document.querySelectorAll('#art-body video.projector-video').forEach(v => {
    v.addEventListener('play', () => v.closest('.projector-stage').classList.add('is-playing'));
    v.addEventListener('pause', () => v.closest('.projector-stage').classList.remove('is-playing'));
    v.addEventListener('error', () => {
      const fb = v.closest('.projector-stage').querySelector('.projector-fallback');
      if (fb) fb.classList.remove('hidden');
    });
  });
}

/* ---------- 荧光高亮观察器（滚入视口时墨水扫入） ---------- */

let highlightObserver = null;
function observeHighlights() {
  if (!('IntersectionObserver' in window)) return;
  if (highlightObserver) highlightObserver.disconnect();
  highlightObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('highlight-active');
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('#art-body .ink-highlight').forEach(el => highlightObserver.observe(el));
}

/* ---------- 馆长来信卡片 ---------- */

/* 文案池：随机抽取（连抽两次不会重复同一句） */
const CURATOR_NOTES = [
  '不出预料的话，封面就得停留在这个奇怪的新年特辑上面了，谁让俺们在 2022 年 2 月之后就没再更新微信公众号了呢～',
  '猜猜我写了几个信封？也许后续会增加匿名信环节哦。等苯人再研究一下……',
  '英专生的出路在哪里？鲁迅曾经说过，世上本没有路，走的人多了就……诶，可是，光脚的人走的路多了不就磨破脚了吗？',
  '谁让英专生转码的？是时代！是这个操蛋的时代指引我来的！（侍萍退下……）',
  '2019 到 2024 年，被疫情偷走了三年！但好在，我们是五年制的……（开始胡言乱语）',
  '不对劲，不对劲，外语人是不是更加适合出海和内容创意类的？或许考公考编？',
  '事情是这样的，当你看到这封信的时候，你就看到了一封信。真的会有人发现奇怪的信封吗？',
  '是谁～把我送到～你身边～啊，是满脑子胡思乱想的 curator Sally Gong……',
  '祝愿你今天开心，明天也开心。事实上，我想说，如果我不在你身边，祝你早安，午安，和晚安。',
  '关关难过关关过，步步难行步步行，前路漫漫亦灿灿。'
];

let lastNoteIndex = -1;

function openCuratorNote() {
  const card = document.getElementById('curator-note-card');
  const text = document.getElementById('curator-note-text');
  let idx;
  do {
    idx = Math.floor(Math.random() * CURATOR_NOTES.length);
  } while (idx === lastNoteIndex && CURATOR_NOTES.length > 1);
  lastNoteIndex = idx;
  text.textContent = CURATOR_NOTES[idx];
  card.classList.remove('hidden');
  card.classList.add('flex');
  /* 重启动画，反复拆信时信封重新开启 */
  ['curator-flap', 'curator-note-body', 'curator-envelope'].forEach(cls => {
    const el = card.querySelector('.' + cls);
    if (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    }
  });
}

function closeCuratorNote() {
  const card = document.getElementById('curator-note-card');
  if (card) {
    card.classList.add('hidden');
    card.classList.remove('flex');
  }
}

/* ---------- 初始化 ---------- */

function initArchive() {
  document.getElementById('curator-backdrop').addEventListener('click', closeCuratorNote);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') closeCuratorNote();
  });

  updateVolBadge();

  ['featured-dispatch', 'dispatch-grid'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', ev => {
      const card = ev.target.closest('[data-dispatch]');
      if (card) openDispatch(card.dataset.dispatch, true);
    });
    el.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        const card = ev.target.closest('[data-dispatch]');
        if (card) {
          ev.preventDefault();
          openDispatch(card.dataset.dispatch, true);
        }
      }
    });
  });

  /* #art-body 容器常驻：手写边注点击轻颤；放映盒点击切换播放/暂停 */
  document.getElementById('art-body').addEventListener('click', ev => {
    const note = ev.target.closest('.margin-note');
    if (note) {
      note.classList.remove('margin-note-shake');
      void note.offsetWidth; /* 强制重排，连点可重复触发动画 */
      note.classList.add('margin-note-shake');
      note.addEventListener('animationend', () => note.classList.remove('margin-note-shake'), { once: true });
      return;
    }

    const stage = ev.target.closest('.projector-stage');
    if (!stage) return;
    const video = stage.querySelector('video.projector-video');
    const fallback = stage.querySelector('.projector-fallback');
    if (!video) return;
    if (video.paused) video.play().catch(() => { if (fallback) fallback.classList.remove('hidden'); });
    else video.pause();
  });

  renderHomeIndex();
  const m = window.location.hash.match(/^#dispatch\/(.+)$/);
  if (m) openDispatch(decodeURIComponent(m[1]), false);
  else setSeason(homeSeason);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArchive);
} else {
  initArchive();
}

window.addEventListener('scroll', () => {
  const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  document.getElementById('scroll-progress-bar').style.width = (winScroll / h) * 100 + '%';
});
