/* Estudi de perruqueria · interacciones. Vanilla JS, sin dependencias, compatible con CSP (script-src 'self'). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const I = JSON.parse($('#i18n').textContent);
  const lang = root.lang;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  /* ---------- hora y estado (Madrid) ---------- */
  const DAYMAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function madrid() {
    try {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' }).formatToParts(new Date());
      const g = (t) => p.find((x) => x.type === t).value;
      return { m: (+g('hour') % 24) * 60 + +g('minute'), wd: DAYMAP[g('weekday')] };
    } catch (e) { const d = new Date(); return { m: d.getHours() * 60 + d.getMinutes(), wd: d.getDay() }; }
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
  const st = status();
  $$('.now').forEach((el) => { el.dataset.state = st.open ? 'open' : 'closed'; $('span', el).textContent = st.text; });
  $$('#hours li').forEach((li) => li.classList.toggle('today', +li.dataset.day === madrid().wd));

  /* ---------- barra, raíl, menú ---------- */
  const top = $('.top'), rail = $('#rail');
  const onScroll = () => { const y = scrollY, max = root.scrollHeight - innerHeight; top.classList.toggle('solid', y > 40); rail.style.height = (max > 0 ? y / max * 100 : 0) + '%'; };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = (o) => { menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', String(o)); root.classList.toggle('menu-open', o); };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });

  /* cursor-anillo */
  const cur = $('#cur');
  if (cur && fine && !reduce) {
    addEventListener('pointermove', (e) => { cur.classList.add('on'); cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; cur.classList.toggle('big', !!e.target.closest('a,button,label,.svc,.pack')); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
  }

  /* revelado */
  const rev = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add('in'));

  /* ---------- hero: hilos de pelo que se peinan ---------- */
  const cv = $('#strands'), hero = $('.hero');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, N = 0, step = 16, raf = 0, vis = true, t = 0;
    const m = { x: -999, y: -999, vx: 0 };
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 1.5); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); N = W < 700 ? 34 : 64; step = W < 700 ? 26 : 16; };
    hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', () => { m.x = m.y = -999; });
    const frame = () => {
      t += .006; ctx.clearRect(0, 0, W, H); ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        const by = (i + .5) / N * H, ph = i * .21;
        ctx.beginPath();
        for (let x = -10; x <= W + step; x += step) {
          let y = by + Math.sin(x * .0042 + t * 2 + ph) * 34 + Math.sin(x * .011 - t * 3 + ph * 2) * 9;
          const dx = x - m.x, dy = y - m.y, d2 = dx * dx + dy * dy;
          if (d2 < 52000) { const f = Math.exp(-d2 / 18000); y += (m.y - y) * f * .55; }
          x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i % 9 === 0 ? 'rgba(32,226,124,.55)' : `rgba(241,238,230,${(.07 + (i % 5) * .03).toFixed(2)})`;
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    const run = () => { if (!raf && vis && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    size(); addEventListener('resize', () => { stop(); size(); run(); });
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; vis ? run() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
    run();
  }

  /* ---------- pestañas de servicios ---------- */
  const tabs = $$('[role=tab]');
  const pick = (tb, focus) => {
    tabs.forEach((b) => { const on = b === tb; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $('#' + b.getAttribute('aria-controls')).hidden = !on; });
    if (focus) tb.focus();
  };
  tabs.forEach((tb, i) => {
    tb.addEventListener('click', () => pick(tb));
    tb.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); pick(tabs[(i + k + tabs.length) % tabs.length], true); } });
  });

  /* ---------- tiquet ---------- */
  const items = new Map(); // id -> {name, price, mins, q}
  const meta = {};
  $$('[data-id]').forEach((el) => { meta[el.dataset.id] = { name: el.dataset.name, price: el.dataset.price === '' ? null : +el.dataset.price, mins: el.dataset.mins === '' ? null : +el.dataset.mins }; });
  const eur = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')) + ' €';
  const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} ${I.h}${m % 60 ? ' ' + (m % 60) + ' ' + I.min : ''}` : `${m} ${I.min}`);
  const tkl = $('#tk-l'), copyBtn = $('#copy'), pill = $('#pill'), pillN = $('#pill-n'), live = $('#live');
  $('#tk-d').textContent = new Intl.DateTimeFormat(lang === 'ca' ? 'ca-ES' : 'es-ES', { dateStyle: 'long' }).format(new Date());
  const render = (addedId) => {
    tkl.textContent = '';
    if (!items.size) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = I.empty; tkl.append(li); }
    let tp = 0, tm = 0, n = 0, consult = false;
    items.forEach((v, id) => {
      n += v.q; if (v.price == null) consult = true; else tp += v.price * v.q; if (v.mins) tm += v.mins * v.q;
      const li = document.createElement('li'); li.dataset.id = id; if (id !== addedId) li.style.animation = 'none';
      const nm = document.createElement('span'); nm.className = 'nm'; const s = document.createElement('span'); s.textContent = (v.q > 1 ? v.q + '× ' : '') + v.name; nm.append(s);
      const pq = document.createElement('span'); pq.className = 'pq';
      const mk = (sym, d, label) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = sym; b.dataset.d = d; b.setAttribute('aria-label', `${label} ${v.name}`); return b; };
      const pr = document.createElement('em'); pr.textContent = v.price == null ? I.consult : eur(v.price * v.q);
      pq.append(mk('−', -1, I.remove), pr, mk('+', 1, I.add)); li.append(nm, pq); tkl.append(li);
    });
    $('#tk-p').textContent = eur(tp) + (consult ? ' +' : '');
    $('#tk-m').textContent = tm ? '≈ ' + dur(tm) : '—';
    $$('.svc,.pack').forEach((el) => { const v = items.get(el.dataset.id); el.classList.toggle('has', !!v); const b = $('.add', el); if (v) b.dataset.q = v.q; else delete b.dataset.q; });
    copyBtn.disabled = !n; pill.hidden = !n; pillN.textContent = n;
  };
  const change = (id, d) => { const m0 = meta[id]; if (!m0) return; const v = items.get(id) || { ...m0, q: 0 }; v.q += d; v.q > 0 ? items.set(id, v) : items.delete(id); render(d > 0 ? id : null); live.textContent = `${m0.name}: ${Math.max(0, v.q)}`; };
  $$('.svc .add, .pack .add').forEach((b) => b.addEventListener('click', () => { change(b.closest('[data-id]').dataset.id, 1); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }));
  tkl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) change(b.closest('li').dataset.id, +b.dataset.d); });
  copyBtn.addEventListener('click', async () => {
    const lines = [I.hello]; items.forEach((v) => lines.push(`- ${v.q} × ${v.name}${v.price != null ? ' (' + eur(v.price * v.q) + ')' : ''}`)); lines.push(`${I.total}: ${$('#tk-p').textContent}`);
    const s = lines.join('\n'); let ok = false;
    try { await navigator.clipboard.writeText(s); ok = true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.className = 'sr'; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (_) {} ta.remove();
    }
    if (ok) { const o = copyBtn.textContent; copyBtn.textContent = I.copied; live.textContent = I.copied; setTimeout(() => (copyBtn.textContent = o), 1800); }
  });
  render();

  /* ---------- color lab ---------- */
  const COL = { negre: '#1a1a1f', castany: '#5a3a26', cobre: '#b5532a', ros: '#e6c27a', platino: '#e8e6df' };
  const SHAPES = {
    curt: { f: ['M124 178C118 108 150 84 200 84C250 84 282 108 276 178C268 150 252 128 200 124C148 128 132 150 124 178Z'] },
    tupe: { f: ['M120 182C104 100 146 50 214 50C270 50 292 104 280 182C268 150 248 126 208 122C170 122 134 140 120 182Z'] },
    mitja: { f: ['M118 214C96 100 140 64 200 64C262 64 306 100 282 214C276 180 268 160 258 146C226 150 200 132 188 108C176 134 150 152 142 146C132 160 124 190 118 214Z'] },
    llarg: { b: ['M100 160C90 60 150 40 200 40C250 40 310 60 300 160L322 376C270 396 130 396 78 376Z'], f: ['M118 190C112 96 160 70 206 74C260 78 290 120 282 190C262 150 232 128 196 106C180 138 150 164 118 190Z'] },
    bob: { b: ['M104 160C94 62 154 44 200 44C246 44 306 62 296 160L302 272C262 296 138 296 98 272Z'], f: ['M118 190C112 96 160 70 206 74C260 78 290 120 282 190C262 150 232 128 196 106C180 138 150 164 118 190Z'] },
    recollit: { b: ['M168 58a32 32 0 1 0 64 0a32 32 0 1 0-64 0Z'], f: ['M122 176C116 104 150 82 200 82C250 82 284 104 278 176C266 146 246 126 200 122C154 126 134 146 122 176Z'] },
  };
  const LABSVC = { cut: { curt: 'cut-home', tupe: 'cut-home', mitja: 'cut-dona', llarg: 'cut-dona', bob: 'cut-dona', recollit: 'recollit' }, col: { negre: 'color-arrel', castany: 'color-arrel', cobre: 'bany-color', ros: 'reflexos', platino: 'reflexos', balayage: 'balayage', reflexos: 'reflexos' } };
  const stage = $('#hstage'), hcap = $('#hcap'), lf = $('#lf');
  const val = (n) => lf.elements[n].value;
  const STREAKS = (id) => `<g clip-path="url(#${id})" stroke="#ecce94" stroke-width="5" stroke-linecap="round" opacity=".95"><path d="M146 40L124 330M172 40L158 330M200 40L196 330M228 40L240 330M254 40L284 330M182 40L170 330M216 40L222 330"/></g>`;
  function hair() {
    const sh = SHAPES[val('style')], c = val('color');
    const fill = c === 'balayage' ? 'url(#bal)' : c === 'reflexos' ? COL.castany : COL[c];
    const dk = ['negre', 'castany', 'cobre', 'reflexos', 'balayage'].includes(c);
    return `<svg viewBox="0 0 400 440" aria-hidden="true" focusable="false"><defs><linearGradient id="bal" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="360"><stop offset=".3" stop-color="#4a2f1f"/><stop offset="1" stop-color="#ecce94"/></linearGradient><clipPath id="hcb">${(sh.b || []).map((d) => `<path d="${d}"/>`).join('')}</clipPath><clipPath id="hcf">${sh.f.map((d) => `<path d="${d}"/>`).join('')}</clipPath></defs>
<g class="hr">${(sh.b || []).map((d) => `<path class="hair" d="${d}" fill="${fill}"/>`).join('')}${c === 'reflexos' && sh.b ? STREAKS('hcb') : ''}</g>
<path d="M30 440C44 372 112 342 180 332L220 332C288 342 356 372 370 440Z" fill="#0c0e0d" stroke="#20e27c" stroke-width="2"/><path d="M168 332C184 368 216 368 232 332" fill="none" stroke="#20e27c" stroke-width="3"/>
<rect x="178" y="262" width="44" height="76" rx="14" fill="#cf9f7d"/><ellipse cx="200" cy="190" rx="78" ry="98" fill="#e2b996"/><ellipse cx="122" cy="196" rx="9" ry="17" fill="#d6a987"/><ellipse cx="278" cy="196" rx="9" ry="17" fill="#d6a987"/>
<g>${sh.f.map((d) => `<path class="hair" d="${d}" fill="${fill}"/>`).join('')}</g>
${c === 'reflexos' ? STREAKS('hcf') : ''}
<path clip-path="url(#hcf)" d="M148 100C170 80 226 76 252 100" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${dk ? .16 : .5}"/></svg>`;
  }
  function labUpdate() { stage.innerHTML = hair(); hcap.textContent = `${I.styles[val('style')]} · ${I.colors[val('color')]}`; }
  lf.addEventListener('change', labUpdate); labUpdate();
  $('#labadd').addEventListener('click', () => { [LABSVC.cut[val('style')], LABSVC.col[val('color')]].forEach((id) => change(id, 1)); live.textContent = I.labAdded; $('#serveis').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
})();
