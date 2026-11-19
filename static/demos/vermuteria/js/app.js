/* La Vermuteria · interacciones. Vanilla JS, sin dependencias, compatible con CSP (script-src 'self'). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const I = JSON.parse($('#i18n').textContent);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

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
    for (const [o, c] of hoursOf(wd)) if (m >= mins(o) && m < mins(c)) return { open: true, text: `${I.open} · ${I.closes} ${c === '24:00' ? '00:00' : c}` };
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
  $$('.now').forEach((el) => { el.dataset.state = st.open ? 'open' : 'closed'; $('span', el).textContent = st.text + ' · ' + I.approx; });
  $$('#hours li').forEach((li) => li.classList.toggle('today', +li.dataset.day === madrid().wd));

  /* ---------- barra y cajón ---------- */
  const top = $('#top');
  const onTop = () => top.classList.toggle('solid', scrollY > 40);
  onTop(); addEventListener('scroll', onTop, { passive: true });
  const burger = $('#burger'), drawer = $('#drawer');
  const setDrawer = (o) => { drawer.classList.toggle('open', o); burger.setAttribute('aria-expanded', String(o)); top.classList.toggle('solid', o || scrollY > 40); };
  burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) { setDrawer(false); burger.focus(); } });

  /* revelado */
  const rev = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach((el) => io.observe(el));
  } else rev.forEach((el) => el.classList.add('in'));

  /* ---------- el día pasa al hacer scroll ---------- */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
  // [p, cielo arriba, cielo abajo, mar arriba, mar abajo]
  const KEYS = [[0, '#3fb8e8', '#dff4f6', '#5cc4d6', '#0e5f78'], [.45, '#4a7fc0', '#ffd9a0', '#5a9fb8', '#12506a'], [.62, '#5a3d8a', '#ff7a45', '#b0607a', '#1b3a5a'], [.82, '#1c2150', '#7a3a6a', '#1a2c52', '#0b2540'], [1, '#060b24', '#1b2a5c', '#0b1a3a', '#050d22']];
  const sample = (p) => {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = clamp((p - a[0]) / (b[0] - a[0]), 0, 1);
    return [1, 2, 3, 4].map((j) => mix(a[j], b[j], k));
  };
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const story = $('#inici'), sun = $('#sun'), refl = $('#refl'), stars = $('#stars'), night = $('#night'), liq = $('#liqr'), ice = $('#ice'), win = $('#win');
  const [sk1, sk2, se1, se2] = ['#sk1', '#sk2', '#se1', '#se2'].map((s) => $(s));
  const phases = $$('.ph'), copy = $('#p0');
  function setScene(p) {
    const [a, b, c, d] = sample(p);
    sk1.setAttribute('stop-color', a); sk2.setAttribute('stop-color', b); se1.setAttribute('stop-color', c); se2.setAttribute('stop-color', d);
    const sx = 880 - 420 * p, sy = 170 + 640 * Math.pow(p, 1.5);
    sun.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
    refl.setAttribute('transform', `translate(${sx.toFixed(1)} 0)`); refl.style.opacity = (clamp(1 - Math.abs(sy - 470) / 260, 0, 1) * .5).toFixed(2);
    stars.style.opacity = smooth(.68, .95, p).toFixed(2); night.style.opacity = (smooth(.66, 1, p) * .34).toFixed(2);
    win.setAttribute('fill', p > .6 ? '#ffd25a' : '#cfe8ee');
    const h = 138 * smooth(0, .2, p); liq.setAttribute('y', (694 - h).toFixed(1)); liq.setAttribute('height', h.toFixed(1)); ice.style.opacity = smooth(.12, .24, p).toFixed(2);
    copy.classList.toggle('off', p > .16);
    phases.forEach((el) => el.classList.toggle('on', p >= +el.dataset.a && p < +el.dataset.b));
  }
  if (reduce) setScene(.02);
  else {
    let tk = 0;
    const upd = () => { tk = 0; const r = story.getBoundingClientRect(), span = r.height - innerHeight; setScene(span > 0 ? clamp(-r.top / span, 0, 1) : 0); };
    addEventListener('scroll', () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
  }

  /* ---------- el vermut perfecto ---------- */
  const mf = $('#mf'), mbar = $('#mbar'), mmsg = $('#mmsg');
  const LIQ = { negre: ['#7e1d2b', '#4a0d17'], blanc: ['#eddc8a', '#cfae48'] };
  const ELS = { gel: '#gel', tar: '#tar', oli: '#oli', sif: '#sif', xips: '#xips' };
  function maker() {
    const vm = mf.elements.vm.value, on = new Set($$('input[name=add]:checked', mf).map((i) => i.value));
    $('#v1').setAttribute('stop-color', LIQ[vm][0]); $('#v2').setAttribute('stop-color', LIQ[vm][1]);
    Object.entries(ELS).forEach(([k, sel]) => { $(sel).style.opacity = on.has(k) ? 1 : 0; });
    $('#fizz').style.opacity = on.has('sif') ? 1 : 0;
    $('#liq').style.opacity = on.has('sif') ? .82 : 1;
    mbar.style.width = (on.size / 5 * 100) + '%'; mmsg.textContent = I.meter[on.size];
  }
  mf.addEventListener('change', maker); maker();

  /* ---------- favoritos y reserva ---------- */
  const favs = new Map(); // id -> name
  const favUl = $('#r-fav'), pill = $('#pill'), pillN = $('#pill-n'), live = $('#live');
  const form = $('#rf'), date = $('#r-date');
  const d0 = new Date(); date.min = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
  const spaceLabel = () => { const v = form.elements.space.value; return I.spaces[v] || I.anySpace; };
  const text = () => {
    const L = I.L, ln = [I.hello], name = $('#r-name').value.trim(), all = $('#r-all').value.trim();
    if (name) ln.push(`- ${L.name}: ${name}`);
    ln.push(`- ${L.people}: ${$('#r-people').value}`);
    if (date.value) ln.push(`- ${L.date}: ${date.value.split('-').reverse().join('/')}`);
    ln.push(`- ${L.time}: ${$('#r-time').value}`, `- ${L.space}: ${spaceLabel()}`);
    if (all) ln.push(`- ${L.allergy}: ${all}`);
    if (favs.size) ln.push(`- ${L.fav}: ${[...favs.values()].join(', ')}`);
    return ln.join('\n');
  };
  const sync = () => {
    favUl.textContent = '';
    if (!favs.size) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = I.noFav; favUl.append(li); }
    favs.forEach((n) => { const li = document.createElement('li'); li.textContent = n; favUl.append(li); });
    pill.hidden = !favs.size; pillN.textContent = favs.size;
    $('#mailto').href = `mailto:${I.email}?subject=${encodeURIComponent(I.subject)}&body=${encodeURIComponent(text()).replace(/%0A/g, '%0D%0A')}`;
  };
  $$('.dish .fav').forEach((b) => b.addEventListener('click', () => {
    const li = b.closest('.dish'), id = li.dataset.id, on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(on)); on ? favs.set(id, li.dataset.name) : favs.delete(id);
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); live.textContent = `${li.dataset.name}: ${on ? '♥' : '–'}`; sync();
  }));
  $$('.pick').forEach((b) => b.addEventListener('click', () => {
    const r = $(`input[name=space][value="${b.dataset.space}"]`, form); if (r) r.checked = true; sync();
    $('#reserva').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  form.addEventListener('input', sync); form.addEventListener('change', sync); sync();
  const copyBtn = $('#copy');
  copyBtn.addEventListener('click', async () => {
    const s = text(); let ok = false;
    try { await navigator.clipboard.writeText(s); ok = true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.className = 'sr'; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (_) {} ta.remove();
    }
    if (ok) { const o = copyBtn.textContent; copyBtn.textContent = I.copied; live.textContent = I.copied; setTimeout(() => (copyBtn.textContent = o), 1800); }
  });
})();
