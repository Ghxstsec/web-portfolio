(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.75);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // form (preview only)
  const form = document.getElementById('form');
  const msg = form.querySelector('.form-msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    msg.textContent = document.documentElement.lang === 'es'
      ? '¡Gracias! En la versión final el mensaje llegará directamente a hola@exemple.cat.'
      : 'Gràcies! A la versió final el missatge arribarà directament a hola@exemple.cat.';
    form.reset();
  });
  // plan buttons preselect the subject
  document.querySelectorAll('[data-plan]').forEach(a => a.addEventListener('click', () => {
    form.elements.assumpte.value = a.dataset.plan;
  }));

  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: id === '#espai' ? 0 : -70, duration: 1.6 });
    }));
  }

  // hero intro
  gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.15,
    onComplete: () => gsap.set('.hero-title .line', { overflow: 'visible' }) });
  gsap.from(['.eyebrow', '.hero-sub', '.hero-cta', '.hero-facts li'], { y: 24, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, delay: 0.5 });
  gsap.to('.hero-inner', {
    yPercent: -25, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // word-by-word statement reveals
  document.querySelectorAll('[data-split]').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    gsap.fromTo(el.querySelectorAll('.w'), { opacity: 0.12 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  });

  // generic reveals
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // sea parallax
  gsap.to('.sea-break img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.sea-break', start: 'top bottom', end: 'bottom top', scrub: true } });

  // ---- walkthrough: "walking" into each room ----
  document.documentElement.classList.add('js-walk');
  const scenes = gsap.utils.toArray('.scene');
  const imgs = scenes.map(s => s.querySelector('img'));
  const caps = scenes.map(s => s.querySelector('figcaption'));
  const map = gsap.utils.toArray('.walk-map li');
  scenes.forEach(s => s.querySelector('img').loading = 'eager');

  gsap.set(scenes, { zIndex: i => i + 1 });
  gsap.set(scenes.slice(1), { clipPath: 'inset(50% 50% 50% 50% round 28px)', autoAlpha: 0 });
  gsap.set(imgs.slice(1), { scale: 1.5 });
  gsap.set(caps.slice(1), { opacity: 0, y: 40 });
  gsap.set(imgs[0], { scale: 1.12 });

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  // first room: slow dolly-in
  tl.to(imgs[0], { scale: 1, duration: 0.6 });
  for (let i = 1; i < scenes.length; i++) {
    const at = `step${i}`;
    tl.addLabel(at)
      // walk forward into the current room
      .to(imgs[i - 1], { scale: 1.35, duration: 1 }, at)
      .to(caps[i - 1], { opacity: 0, y: -30, duration: 0.3 }, `${at}+=0.1`)
      // next room opens like a doorway and settles
      .set(scenes[i], { autoAlpha: 1 }, at)
      .fromTo(scenes[i], { clipPath: 'inset(36% 30% 36% 30% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut', immediateRender: false }, at)
      .to(imgs[i], { scale: 1, duration: 1.3, ease: 'power1.out' }, at)
      .to(caps[i], { opacity: 1, y: 0, duration: 0.35 }, `${at}+=0.55`);
  }
  tl.to({}, { duration: 0.5 });

  const setActive = p => {
    const idx = Math.min(scenes.length - 1, Math.round(p * (scenes.length - 1) * 1.04));
    map.forEach((li, i) => li.classList.toggle('on', i === idx));
  };
  ScrollTrigger.create({
    trigger: '.walk-pin',
    start: 'top top',
    end: () => '+=' + window.innerHeight * scenes.length * 0.9,
    pin: true,
    scrub: 0.8,
    animation: tl,
    onUpdate: self => {
      gsap.set('.walk-progress span', { scaleX: self.progress });
      setActive(self.progress);
    }
  });
  setActive(0);

  // tell ocean.js where hero scroll is
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top',
    onUpdate: self => { window.__heroProgress = self.progress; }
  });
})();
