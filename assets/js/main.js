// ghxstsec — interacciones del sitio. Única dependencia: Lenis, copiada en vendor/.
// Todo es progresivo: sin JS el contenido se ve igual, solo sin animaciones.

import Lenis from './vendor/lenis.mjs';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ------------------------------------------------------------------ header */
function initHeader() {
  const header = $('[data-header]');
  if (!header) return;

  // borde al hacer scroll + se esconde al bajar, vuelve al subir
  const progress = $('[data-progress]');
  const isArticle = document.body.classList.contains('page--article');
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    const menuOpen = header.querySelector('[data-mobile-nav].is-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 240 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;

    if (isArticle && progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // indicador que sigue al enlace activo / en hover
  const nav = $('[data-nav]');
  const indicator = $('[data-nav-indicator]');
  if (nav && indicator) {
    const active = $('.nav__link.is-active', nav);
    const moveTo = (el) => {
      if (!el) { indicator.style.setProperty('--o', 0); return; }
      const navBox = nav.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      indicator.style.setProperty('--x', `${box.left - navBox.left + 12}px`);
      indicator.style.setProperty('--w', `${box.width - 24}px`);
      indicator.style.setProperty('--o', 1);
    };
    // posición inicial sin transición
    indicator.style.transition = 'none';
    moveTo(active);
    requestAnimationFrame(() => { indicator.style.transition = ''; });

    $$('.nav__link', nav).forEach((link) => {
      link.addEventListener('mouseenter', () => moveTo(link));
      link.addEventListener('focus', () => moveTo(link));
    });
    nav.addEventListener('mouseleave', () => moveTo(active));
    window.addEventListener('resize', () => moveTo(active));
    document.fonts?.ready.then(() => moveTo(active));
  }

  // menú móvil
  const btn = $('[data-menu-btn]');
  const mobile = $('[data-mobile-nav]');
  if (btn && mobile) {
    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      mobile.classList.toggle('is-open', open);
    };
    btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) setOpen(false);
    });
  }
}

/* --------------------------------------------------------------- scramble */
const GLYPHS = '!<>-_\\/[]{}=+*^?#$%&01ABCDEFX';

function scramble(el, { duration = 900 } = {}) {
  if (el.dataset.scrambled) return;
  el.dataset.scrambled = '1';
  const target = el.textContent;
  if (reduceMotion || !target.trim()) return;

  // cada carácter se "resuelve" en un momento aleatorio, de izquierda a derecha
  const chars = [...target].map((ch, i) => ({
    ch,
    at: (i / target.length) * duration * 0.6 + Math.random() * duration * 0.4,
  }));
  const start = performance.now();
  el.setAttribute('aria-label', target);

  // los símbolos son más anchos que las letras: sin esto la línea se parte y salta
  const lines = el.getClientRects().length;
  el.style.display = 'block';
  el.style.height = `${el.getBoundingClientRect().height}px`;
  if (lines === 1) el.style.whiteSpace = 'nowrap';

  const frame = (now) => {
    const t = now - start;
    let done = true;
    let out = '';
    for (const c of chars) {
      if (c.ch === ' ' || t >= c.at) out += c.ch;
      else { done = false; out += GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
    }
    el.textContent = out;
    if (!done) requestAnimationFrame(frame);
    else { el.textContent = target; el.removeAttribute('aria-label'); el.removeAttribute('style'); }
  };
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------- counters */
function countUp(el) {
  const end = parseInt(el.dataset.count, 10);
  if (!Number.isFinite(end) || reduceMotion) return;
  const dur = 1100 + Math.min(end, 40) * 15;
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - k, 4);
    el.textContent = String(Math.round(end * eased)).padStart(String(end).length, '0');
    if (k < 1) requestAnimationFrame(step);
    else el.textContent = end;
  };
  el.textContent = '0';
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------------- terminal */
function initTyper(term) {
  const lines = $$('.t-line', term);
  const outs = $$('.t-out', term);
  if (reduceMotion) return () => {};

  const cmds = lines.map((l) => l.textContent);
  lines.forEach((l) => { l.textContent = ''; });
  outs.forEach((o) => o.setAttribute('data-hidden', ''));

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  return async () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cmd = cmds[i];
      if (line.classList.contains('t-line--idle')) break;
      line.classList.add('is-typing');
      await wait(i === 0 ? 250 : 380);
      for (const ch of cmd) {
        line.textContent += ch;
        await wait(28 + Math.random() * 55);
      }
      await wait(160);
      line.classList.remove('is-typing');
      // la salida es el siguiente .t-out en el DOM
      let next = line.nextElementSibling;
      while (next && !next.classList.contains('t-out')) next = next.nextElementSibling;
      next?.removeAttribute('data-hidden');
    }
  };
}

/* ------------------------------------------------------------------ reveal */
function initReveal() {
  const typers = new Map($$('[data-typer]').map((t) => [t, initTyper(t)]));
  const items = $$('[data-reveal]');

  const activate = (el) => {
    el.classList.add('is-in');
    $$('[data-scramble]', el).forEach((s) => scramble(s));
    if (el.matches('[data-scramble]')) scramble(el);
    $$('[data-count]', el).forEach(countUp);
    const typer = typers.get(el);
    if (typer) { typers.delete(el); setTimeout(typer, 300); }
  };

  if (!('IntersectionObserver' in window)) { items.forEach(activate); return; }

  const io = new IntersectionObserver((entries) => {
    // escalonado: los que entran en el mismo frame salen uno tras otro
    const visible = entries.filter((e) => e.isIntersecting);
    visible.forEach((entry, i) => {
      entry.target.style.setProperty('--d', `${Math.min(i, 8) * 70}ms`);
      activate(entry.target);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  items.forEach((el) => io.observe(el));
  // cabeceras de sección: dibujan su línea al entrar
  $$('.section__head').forEach((h) => { if (!h.hasAttribute('data-reveal')) io.observe(h); });
}

/* ------------------------------------------------------------ scroll suave */
function initSmoothScroll() {
  // los artículos se quedan con el scroll nativo: lectura larga, código y Ctrl+F
  if (reduceMotion || document.body.classList.contains('page--article')) return;
  new Lenis({ lerp: 0.06, autoRaf: true, anchors: true });
}

/* ------------------------------------------------- escenas ligadas al scroll */
function initScenes() {
  const scenes = $$('[data-scene]');
  if (!scenes.length || reduceMotion) return;

  // mismo corte que el @media de las escenas en main.css
  const stage = window.matchMedia('(min-width: 1024px) and (min-height: 700px)');
  const clamp = (n) => Math.min(1, Math.max(0, n));
  const progress = {
    pin: (r, vh) => clamp(-r.top / Math.max(1, r.height - vh)),
    enter: (r, vh) => clamp((vh - r.top) / (vh * 0.6)),
    exit: (r) => clamp(-r.top / r.height),
  };

  let ticking = false;
  const last = new Map();
  const update = () => {
    ticking = false;
    if (!stage.matches) return;
    const vh = window.innerHeight;
    for (const el of scenes) {
      const p = progress[el.dataset.scene](el.getBoundingClientRect(), vh).toFixed(4);
      if (last.get(el) !== p) { last.set(el, p); el.style.setProperty('--p', p); }
    }
  };
  const request = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}

/* -------------------------------------------------------- hero dot field */
function initField() {
  const canvas = $('[data-field]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const GAP = 26;
  let w = 0, h = 0, dpr = 1, cols = 0, rows = 0;
  let mx = -9999, my = -9999, tx = -9999, ty = -9999;
  let running = false, raf = 0, visible = true;
  const t0 = performance.now();

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / GAP) + 1;
    rows = Math.ceil(h / GAP) + 1;
    if (!running) draw(performance.now());
  };

  const draw = (now) => {
    const t = (now - t0) / 1000;
    mx += (tx - mx) * 0.12;
    my += (ty - my) * 0.12;
    ctx.clearRect(0, 0, w, h);

    // una onda diagonal lenta recorre la rejilla
    const sweep = ((t * 0.12) % 1.6) - 0.3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let x = c * GAP + (r % 2 ? GAP / 2 : 0);
        let y = r * GAP;
        const dx = x - mx, dy = y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - dist / 170);

        const diag = (x / w + y / h) / 2;
        const wave = Math.max(0, 1 - Math.abs(diag - sweep) * 9);

        if (near > 0) { x += (dx / (dist || 1)) * near * 8; y += (dy / (dist || 1)) * near * 8; }

        const a = 0.09 + near * 0.75 + wave * 0.22;
        const s = 1.1 + near * 1.6;
        ctx.fillStyle = near > 0.05
          ? `rgba(88,166,255,${a})`
          : `rgba(141,153,168,${a})`;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    if (running) raf = requestAnimationFrame(draw);
  };

  const start = () => {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true; raf = requestAnimationFrame(draw);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  window.addEventListener('resize', resize);

  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    tx = e.clientX - r.left; ty = e.clientY - r.top;
    if (mx < -1000) { mx = tx; my = ty; }
  });
  hero.addEventListener('pointerleave', () => { tx = ty = -9999; });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

/* ------------------------------------------------------ tilt / spotlight */
function initPointerFx() {
  if (!finePointer || reduceMotion) return;

  $$('[data-spot]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-py * 7).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ------------------------------------------------------------------- clock */
function initClock() {
  const el = $('[data-clock]');
  if (!el) return;
  const fmt = () => { el.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false }); };
  fmt();
  setInterval(fmt, 1000);
}

/* ----------------------------------------------------------------- filters */
function initFilters() {
  const bar = $('[data-filters]');
  const list = $('[data-filter-list]');
  if (!bar || !list) return;
  const state = { platform: '', level: '' };
  const entries = $$('.entry', list);
  const count = $('[data-filter-count]');
  const empty = $('[data-filter-empty]');

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const key = btn.dataset.filter;
    state[key] = btn.dataset.value;
    $$(`[data-filter="${key}"]`, bar).forEach((b) => b.classList.toggle('is-on', b === btn));

    let shown = 0;
    entries.forEach((entry) => {
      const ok = (!state.platform || entry.dataset.platform === state.platform)
        && (!state.level || entry.dataset.level === state.level);
      entry.classList.toggle('is-filtered', !ok);
      if (ok) {
        // re-dispara la animación de entrada para lo que se queda
        entry.style.setProperty('--d', `${Math.min(shown, 10) * 35}ms`);
        entry.classList.remove('is-in');
        void entry.offsetWidth;
        entry.classList.add('is-in');
        shown++;
      }
    });
    if (count) count.textContent = `${shown} resultado${shown === 1 ? '' : 's'}`;
    if (empty) empty.hidden = shown > 0;
  });
}

/* ---------------------------------------------------------------- article */
function initCodeBlocks(prose) {
  $$('pre', prose).forEach((pre) => {
    const host = pre.parentElement.classList.contains('highlight') ? pre.parentElement : pre;
    if (host.parentElement.classList.contains('codeblock')) return;
    const code = $('code', pre);
    const lang = code?.dataset.lang || '';

    const wrap = document.createElement('div');
    wrap.className = 'codeblock';
    const bar = document.createElement('div');
    bar.className = 'codeblock__bar';
    bar.innerHTML = `<span>${lang && lang !== 'fallback' ? lang : 'shell'}</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'copiar';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText((code || pre).innerText.replace(/\n$/, ''));
        btn.textContent = 'copiado';
        btn.classList.add('is-done');
      } catch {
        btn.textContent = 'error';
      }
      setTimeout(() => { btn.textContent = 'copiar'; btn.classList.remove('is-done'); }, 1600);
    });
    bar.appendChild(btn);

    host.replaceWith(wrap);
    wrap.append(bar, host);
  });
}

function initLightbox(prose) {
  const imgs = $$('img', prose);
  if (!imgs.length) return;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Imagen ampliada');
  box.innerHTML = '<img alt="">';
  document.body.appendChild(box);
  const big = $('img', box);

  const close = () => box.classList.remove('is-open');
  imgs.forEach((img) => {
    img.addEventListener('click', () => {
      big.src = img.currentSrc || img.src;
      big.alt = img.alt;
      box.classList.add('is-open');
    });
  });
  box.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function initToc() {
  const toc = $('[data-toc]');
  if (!toc) return;
  if (window.matchMedia('(max-width: 980px)').matches) toc.open = false;

  const links = $$('a[href^="#"]', toc);
  const map = new Map();
  links.forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const h = document.getElementById(id);
    if (h) map.set(h, a);
  });
  if (!map.size) return;

  let current = null;
  const setActive = (a) => {
    if (a === current) return;
    current?.classList.remove('is-active');
    a?.classList.add('is-active');
    current = a;
    // mantiene el enlace activo visible dentro del índice
    if (a && toc.open) {
      const aside = toc.closest('.toc');
      const top = a.offsetTop - aside.clientHeight / 2;
      aside.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const headings = [...map.keys()];
  const onScroll = () => {
    const line = window.innerHeight * 0.25;
    let active = headings[0];
    for (const h of headings) {
      if (h.getBoundingClientRect().top - line <= 0) active = h; else break;
    }
    setActive(map.get(active));
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  onScroll();
}

function initArticle() {
  const prose = $('[data-prose]');
  if (!prose) return;
  initCodeBlocks(prose);
  initLightbox(prose);
  initToc();
}

/* -------------------------------------------------------------------- boot */
window.__ghx = true;
try {
  initSmoothScroll();
  initScenes();
  initHeader();
  initArticle();
  initFilters();
  initPointerFx();
  initClock();
  initField();
  initReveal();
} catch (err) {
  // si algo falla, que el contenido nunca se quede invisible
  document.documentElement.classList.remove('js');
  console.error(err);
}
