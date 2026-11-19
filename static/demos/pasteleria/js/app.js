/* Pastisseria Artesana · interacciones. Vanilla JS, sin dependencias, compatible con CSP (script-src 'self'). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const I = JSON.parse($('#i18n').textContent);
  const ART = JSON.parse($('#art').textContent).labels;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---------- hora y estado (Madrid) ---------- */
  const DAYMAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function madrid() {
    try {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short', month: 'numeric' }).formatToParts(new Date());
      const g = (t) => p.find((x) => x.type === t).value;
      return { m: (+g('hour') % 24) * 60 + +g('minute'), wd: DAYMAP[g('weekday')], mo: +g('month') - 1 };
    } catch (e) { const d = new Date(); return { m: d.getHours() * 60 + d.getMinutes(), wd: d.getDay(), mo: d.getMonth() }; }
  }
  const mins = (s) => +s.slice(0, 2) * 60 + +s.slice(3);
  const hoursOf = (d) => (I.hours.find((h) => h[0] === d) || [d, []])[1];
  function status() {
    const { m, wd } = madrid();
    for (const [o, c] of hoursOf(wd)) if (m >= mins(o) && m < mins(c)) return { open: true, text: `${I.open} · ${I.closes} ${c}` };
    for (let i = 0; i < 8; i++) {
      const d = (wd + i) % 7;
      for (const [o] of hoursOf(d)) {
        if (i === 0 && mins(o) <= m) continue;
        const day = i === 0 ? I.today : i === 1 ? I.tomorrow : I.days[d].toLowerCase();
        return { open: false, text: `${I.closed} · ${I.opens} ${day} ${I.at} ${o}` };
      }
    }
    return { open: false, text: I.closed };
  }
  const now = madrid(), st = status();
  $$('.now').forEach((el) => { el.dataset.state = st.open ? 'open' : 'closed'; $('span', el).textContent = st.text; });
  $$('#hours li').forEach((li) => li.classList.toggle('today', +li.dataset.day === now.wd));

  /* ---------- barra superior, progreso y dock ---------- */
  const top = $('.top'), prog = $('#prog'), dock = $('#dock');
  const onScroll = () => {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    top.classList.toggle('solid', y > 40);
    prog.style.width = (max > 0 ? y / max * 100 : 0) + '%';
    dock.classList.toggle('show', y > innerHeight * .45);
  };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) {
    const links = $$('a', dock), secs = links.map((a) => document.getElementById(a.dataset.s));
    const so = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => { const on = a.dataset.s === e.target.id; a.setAttribute('aria-current', String(on)); if (on) dock.scrollTo({ left: a.offsetLeft - dock.clientWidth / 2 + a.clientWidth / 2, behavior: 'auto' }); });
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((el) => el && so.observe(el));
    const rev = $$('.reveal');
    if (!reduce) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
      rev.forEach((el) => io.observe(el));
    } else rev.forEach((el) => el.classList.add('in'));
  } else $$('.reveal').forEach((el) => el.classList.add('in'));

  /* ---------- hero: sprinkles con parallax ---------- */
  const hero = $('.hero'), spr = $('#spr');
  const COLORS = ['#ff7f9c', '#ffc83d', '#4d9be0', '#8fd19e', '#e3335f', '#b48be0'];
  const sp = [];
  if (spr) {
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('i'); s.className = 'spr';
      const d = .2 + Math.random();
      s.style.left = (Math.random() * 100).toFixed(1) + '%'; s.style.top = (Math.random() * 100).toFixed(1) + '%';
      s.style.background = COLORS[i % COLORS.length]; s.style.rotate = Math.floor(Math.random() * 180) + 'deg';
      spr.append(s); sp.push([s, d]);
    }
    if (!reduce && fine) hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      sp.forEach(([s, d]) => { s.style.transform = `translate(${(-x * 60 * d).toFixed(1)}px,${(-y * 60 * d).toFixed(1)}px)`; });
    }, { passive: true });
  }

  /* ---------- velas + confeti ---------- */
  const cv = $('#confetti'), blow = $('#blow'), wish = $('#wish'), hint = $('#hint'), cake = $('#hcake');
  const hintHTML = hint.innerHTML;
  let parts = [], raf = 0;
  function burst() {
    if (reduce || !cv) return;
    const ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2), hr = hero.getBoundingClientRect(), br = cake.getBoundingClientRect();
    cv.width = hr.width * dpr; cv.height = hr.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ox = br.left - hr.left + br.width / 2, oy = br.top - hr.top + br.height * .35;
    for (let i = 0; i < 110; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = 5 + Math.random() * 9; parts.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], l: 0 }); }
    if (!raf) raf = requestAnimationFrame(function f() {
      ctx.clearRect(0, 0, hr.width, hr.height);
      parts = parts.filter((p) => p.y < hr.height + 20 && p.l < 240);
      for (const p of parts) { p.l++; p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, (240 - p.l) / 40); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
      raf = parts.length ? requestAnimationFrame(f) : 0; if (!raf) ctx.clearRect(0, 0, hr.width, hr.height);
    });
  }
  blow.addEventListener('click', () => {
    const out = !cake.classList.contains('out');
    cake.classList.toggle('out', out); blow.setAttribute('aria-pressed', String(out)); blow.setAttribute('aria-label', out ? I.light : I.blow);
    wish.textContent = out ? I.blown : ''; wish.classList.toggle('on', out);
    if (out) { hint.textContent = I.light; burst(); } else hint.innerHTML = hintHTML;
  });

  /* ---------- vitrina: filtros e inclinación 3D ---------- */
  const cards = $$('.card');
  $$('.chip').forEach((c) => c.addEventListener('click', () => {
    $$('.chip').forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
    cards.forEach((k) => { k.hidden = !(c.dataset.f === 'tots' || k.dataset.cat === c.dataset.f); });
  }));
  if (!reduce && fine) cards.forEach((k) => {
    k.addEventListener('pointermove', (e) => { const r = k.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; k.style.transform = `perspective(800px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-4px)`; });
    k.addEventListener('pointerleave', () => { k.style.transform = ''; });
  });

  /* ---------- diseñador de pastel ---------- */
  const BASE = { pessic: '#f1c27a', bescuit: '#f6e0a8', full: '#e2b266' };
  const FILL = { crema: '#fff0c2', xocolata: '#5a2f22', gerds: '#c2264f', llimona: '#ffe14d', maduixa: '#ff8aa1', nata: '#ffffff' };
  const GLAZE = { nata: '#fffaf3', maduixa: '#ff7f9c', llimona: '#ffe46b', xocolata: '#6b3a2a', pistatxo: '#b6dca0' };
  const SCALE = { 6: .8, 10: .9, 16: 1, 25: 1.08 };
  const PALETTE = ['#ff7f9c', '#ffc83d', '#4d9be0', '#8fd19e', '#e3335f', '#b48be0'];
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
  const dark = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) < 110; };
  const berry = (x, y, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#e3335f"/><circle cx="${(x - r / 3).toFixed(1)}" cy="${(y - r / 3).toFixed(1)}" r="${r / 3.5}" fill="#fff" opacity=".6"/><path d="M${x.toFixed(1)} ${(y - r).toFixed(1)}l-3-5m3 5l3-5" stroke="#5d9c4a" stroke-width="2.5" stroke-linecap="round"/>`;
  const form = $('#bf'), stage = $('#stage'), cap = $('#cap'), txt = $('#txt'), when = $('#when'), who = $('#who');
  const val = (n) => form.elements[n].value;
  const labelOf = (n) => { const i = $$(`input[name=${n}]`, form).findIndex((x) => x.checked); return ART[n][i]; };
  const conf = (c) => Array.from({ length: 16 }, (_, i) => { const a = i * 2.4, rr = .25 + (i % 5) * .15; return `<rect x="${(200 + Math.cos(a) * 110 * rr).toFixed(1)}" y="${(150 + Math.sin(a) * 28 * rr).toFixed(1)}" width="10" height="4" rx="2" fill="${PALETTE[i % 6]}" transform="rotate(${i * 37} ${(200 + Math.cos(a) * 110 * rr).toFixed(1)} ${(150 + Math.sin(a) * 28 * rr).toFixed(1)})"/>`; }).join('');
  function svgCake() {
    const base = BASE[val('base')], fill = FILL[val('fill')], gl = GLAZE[val('glaze')], deco = val('deco'), shape = val('shape'), s = SCALE[val('size')] || 1;
    const msg = txt.value.trim() || I.msgDefault, ink = dark(gl) ? '#fff' : '#5a2f40', fs = Math.min(38, 250 / (msg.length * .46));
    let g = '';
    if (shape === 'rodo') {
      const layer = (y1, y2, c) => `<path d="M70 ${y1}V${y2}a130 34 0 0 0 260 0V${y1}z" fill="${c}"/>`;
      let drip = 'M70 150V176'; for (let i = 0; i < 8; i++) drip += `q16.25 ${i % 2 ? 16 : 28} 32.5 0`; drip += 'V150z';
      g += `<ellipse cx="200" cy="300" rx="175" ry="34" fill="#fff" opacity=".9"/><ellipse cx="200" cy="292" rx="175" ry="32" fill="#ffe3e8"/>`;
      g += layer(215, 285, shade(base, .9)) + layer(196, 217, fill) + layer(150, 198, base);
      g += `<path d="${drip}" fill="${gl}"/><ellipse cx="200" cy="150" rx="130" ry="34" fill="${gl}"/><ellipse cx="200" cy="146" rx="100" ry="22" fill="#fff" opacity=".28"/>`;
      if (deco === 'fruita') for (let k = 0; k < 7; k++) { const a = Math.PI * (1.08 + k * .14); g += berry(200 + Math.cos(a) * 104, 150 + Math.sin(a) * 27, 11); }
      if (deco === 'confeti') g += conf();
      g += `<text transform="translate(200 164) scale(1 .55)" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-style="italic" font-size="${fs.toFixed(0)}" fill="${ink}">${msg.replace(/[&<>]/g, '')}</text>`;
    } else {
      const H = 'M200 300C60 210 60 90 140 90C175 90 195 110 200 125C205 110 225 90 260 90C340 90 340 210 200 300Z';
      g += `<ellipse cx="200" cy="338" rx="150" ry="14" fill="#c2264f" opacity=".18"/>`;
      for (let dy = 36; dy > 0; dy -= 2) g += `<path d="${H}" transform="translate(0 ${dy})" fill="${dy > 24 ? shade(base, .88) : dy > 14 ? fill : base}"/>`;
      g += `<path d="${H}" fill="${gl}"/><path d="${H}" transform="translate(200 188) scale(.84) translate(-200 -188)" fill="#fff" opacity=".22"/>`;
      if (deco === 'fruita') [[138, 128], [262, 128], [106, 178], [294, 178], [146, 246], [254, 246], [200, 286]].forEach(([x, y]) => (g += berry(x, y, 12)));
      if (deco === 'confeti') g += Array.from({ length: 18 }, (_, i) => { const a = i * 2.4, rr = .3 + (i % 6) * .13, x = 200 + Math.cos(a) * 110 * rr, y = 190 + Math.sin(a) * 85 * rr; return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="10" height="4" rx="2" fill="${PALETTE[i % 6]}" transform="rotate(${i * 37} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join('');
      g += `<text x="200" y="200" text-anchor="middle" font-family="Instrument Serif,Georgia,serif" font-style="italic" font-size="${Math.min(34, 190 / (msg.length * .46)).toFixed(0)}" fill="${ink}">${msg.replace(/[&<>]/g, '')}</text>`;
    }
    return `<svg viewBox="0 0 400 360" aria-hidden="true" focusable="false"><g transform="translate(200 300) scale(${s}) translate(-200 -300)"><g class="cake">${g}</g></g></svg>`;
  }
  let t0 = 0;
  function update(bump) {
    stage.innerHTML = svgCake();
    cap.textContent = `${labelOf('shape')} · ${labelOf('base').toLowerCase()} · ${labelOf('fill').toLowerCase()} · ${labelOf('glaze').toLowerCase()} · ${labelOf('size')}`;
    if (bump) { stage.classList.remove('bump'); void stage.offsetWidth; stage.classList.add('bump'); }
  }
  form.addEventListener('change', () => update(true));
  txt.addEventListener('input', () => { clearTimeout(t0); t0 = setTimeout(() => update(false), 60); });
  const d0 = new Date(); when.min = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
  update(false);
  const PRESETS = {
    aniversari: { shape: 'rodo', size: '10', base: 'pessic', fill: 'crema', glaze: 'nata', deco: 'confeti' },
    pessic: { shape: 'rodo', base: 'pessic', fill: 'gerds', glaze: 'xocolata', deco: 'cap' },
    cor: { shape: 'cor', base: 'bescuit', fill: 'maduixa', glaze: 'maduixa', deco: 'fruita' },
    bescuit: { shape: 'rodo', base: 'bescuit', fill: 'crema', glaze: 'nata', deco: 'fruita' },
    llimona: { shape: 'rodo', base: 'bescuit', fill: 'llimona', glaze: 'llimona', deco: 'cap' },
    maduixa: { shape: 'rodo', base: 'bescuit', fill: 'maduixa', glaze: 'maduixa', deco: 'fruita' },
  };
  $$('.more[data-preset]').forEach((b) => b.addEventListener('click', () => {
    const p = PRESETS[b.dataset.preset]; if (!p) return;
    Object.entries(p).forEach(([n, v]) => { const r = $(`input[name=${n}][value="${v}"]`, form); if (r) r.checked = true; });
    update(true); $('#disseny').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  const live = $('#live'), copyBtn = $('#copy');
  const orderText = () => {
    const L = I.lines, ln = [I.hello, `- ${L.shape}: ${labelOf('shape')}`, `- ${L.size}: ${labelOf('size').replace(/\D*(\d+\+?).*/, '$1')} ${I.persons}`, `- ${L.base}: ${labelOf('base')}`, `- ${L.fill}: ${labelOf('fill')}`, `- ${L.glaze}: ${labelOf('glaze')}`, `- ${L.deco}: ${labelOf('deco')}`];
    if (txt.value.trim()) ln.push(`- ${L.text}: «${txt.value.trim()}»`);
    if (when.value) ln.push(`- ${L.date}: ${when.value.split('-').reverse().join('/')}`);
    if (who.value.trim()) ln.push(`- ${L.who}: ${who.value.trim()}`);
    return ln.join('\n');
  };
  copyBtn.addEventListener('click', async () => {
    const s = orderText(); let ok = false;
    try { await navigator.clipboard.writeText(s); ok = true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.className = 'sr'; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (_) {} ta.remove();
    }
    if (ok) { const o = copyBtn.textContent; copyBtn.textContent = I.copied; live.textContent = I.copied; setTimeout(() => (copyBtn.textContent = o), 1800); }
  });

  /* ---------- calendario dulce ---------- */
  const mos = $$('.mo'), mcard = $('#mcard');
  const showMonth = (i, focus) => {
    mos.forEach((m, k) => { m.setAttribute('aria-selected', String(k === i)); m.tabIndex = k === i ? 0 : -1; });
    const c = I.cal[i]; $('#m-n').textContent = (i === now.mo ? I.calNow + ' · ' : '') + c.n; $('#m-t').textContent = c.t; $('#m-d').textContent = c.d;
    mcard.setAttribute('aria-labelledby', 'mo-' + i); mcard.classList.remove('swap'); void mcard.offsetWidth; mcard.classList.add('swap');
    const m = mos[i], box = m.parentElement; box.scrollLeft = m.offsetLeft - box.clientWidth / 2 + m.clientWidth / 2;
    if (focus) m.focus();
  };
  mos.forEach((m, i) => {
    m.addEventListener('click', () => showMonth(i));
    m.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); showMonth((i + k + 12) % 12, true); } });
  });
  showMonth(now.mo);
})();
