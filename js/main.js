/* =========================================================
   TWO26 STUDIO — interactions & animations
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page;
  let vh = innerHeight;

  /* ---------------- year ---------------- */
  $$('.year').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------------- menu ---------------- */
  const menuBtn = $('#menuBtn');
  const menu = $('#menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => { if (e.target === menu) setMenu(false); });
  $$('[data-close]', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------------- soft page transition ---------------- */
  $$('a[href$=".html"], a[href*=".html#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const url = new URL(a.href, location.href);
      if (url.pathname === location.pathname) return;          // same page anchors
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => (location.href = a.href), 380);
    });
  });
  addEventListener('pageshow', () => document.body.classList.remove('leaving'));

  /* ---------------- intro: loader + hero ---------------- */
  const loader = $('#loader');
  const heroTitle = $('.hero__title, .wp-hero__title');
  const heroPills = heroTitle ? $$('.pill', heroTitle) : [];
  const heroArt = $('.hero__art');
  const video = $('#heroVideo');

  const startHero = () => {
    document.body.classList.remove('is-loading');
    heroArt && heroArt.classList.add('on');
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
    setTimeout(() => heroTitle && heroTitle.classList.add('is-in'), 150);
    heroPills.forEach((p, i) => setTimeout(() => p.classList.add('on'), 750 + i * 160));
    $$('.wp-hero__row').forEach(r => setTimeout(() => r.classList.add('is-in'), 200));
  };

  if (video) {
    // first play shows the walkers fading in; afterwards loop only the walk cycle
    video.addEventListener('ended', () => { video.currentTime = 1.0; video.play().catch(() => {}); });
  }

  if (loader && !reduce) {
    setTimeout(() => loader.classList.add('wipe'), 2000);
    setTimeout(startHero, 2600);
    setTimeout(() => loader.classList.add('done'), 3100);
    setTimeout(() => loader.remove(), 3400);
  } else {
    loader && loader.remove();
    startHero();
  }

  /* ---------------- reveal on view ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal-lines, .more, .work, .service').forEach(el => io.observe(el));

  /* ---------------- about: word-by-word highlight ---------------- */
  const aboutText = $('#aboutText');
  const aboutPin = $('#aboutPin');
  const aboutEyebrow = $('.about__eyebrow');
  let words = [];
  if (aboutText) {
    aboutText.innerHTML = aboutText.textContent.trim().split(/\s+/)
      .map(w => `<span class="w">${w}</span>`).join(' ');
    words = $$('.w', aboutText);
  }
  const aboutPills = $$('.about__pill');

  /* ---------------- arc ticker ---------------- */
  const tickerText = $('#tickerText');
  let tickOffset = 0, unit = 0, lastY = scrollY, velocity = 0;
  const measureTicker = () => {
    if (!tickerText) return;
    try { unit = tickerText.getComputedTextLength() / 4; } catch (e) { unit = 400; }
  };

  /* ---------------- services snake ---------------- */
  const sBody = $('#servicesBody');
  const sTrack = $('#snakeTrack');
  const sLine = $('#snakeLine');
  let snakeLen = 0;
  const buildSnake = () => {
    if (!sBody) return;
    const W = sBody.clientWidth;
    const items = $$('.service', sBody);
    const pts = items.map((li, i) => ({
      x: i % 2 === 0 ? W * 0.14 : W * 0.86,
      y: li.offsetTop + li.offsetHeight / 2,
      h: li.offsetHeight
    }));
    if (!pts.length) return;
    const h = pts[0].h;
    const k = h * 0.62;
    let d = `M ${W * 0.95} ${-h * 0.9} C ${W * 0.95} ${-h * 0.2}, ${pts[0].x} ${pts[0].y - k}, ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      d += ` C ${a.x} ${a.y + k}, ${b.x} ${b.y - k}, ${b.x} ${b.y}`;
    }
    const last = pts[pts.length - 1];
    const endX = last.x < W / 2 ? W * 0.9 : W * 0.1;
    d += ` C ${last.x} ${last.y + k}, ${endX} ${last.y + h * 0.4}, ${endX} ${last.y + h * 0.95}`;
    sTrack.setAttribute('d', d);
    sLine.setAttribute('d', d);
    snakeLen = sLine.getTotalLength();
    sLine.style.strokeDasharray = `${snakeLen} ${snakeLen}`;
    const sw = Math.max(18, Math.min(32, W * 0.065));
    sTrack.style.strokeWidth = sw; sLine.style.strokeWidth = sw;
  };

  /* ---------------- testimonials deck ---------------- */
  const tPin = $('#tPin');
  const cards = $$('#deck .card');
  const ticks = $$('#ticks i');
  const rot = [-2.5, 3.5, -4.5, 2.5, -3.5];
  let deckIdx = -1;
  const setDeck = (idx) => {
    if (idx === deckIdx) return;
    deckIdx = idx;
    cards.forEach((c, k) => {
      const r = k - idx;
      c.classList.toggle('flown', r < 0);
      if (r < 0) {
        c.style.transform = `translateY(-135%) rotate(${-12 + k * 3}deg)`;
        c.style.zIndex = 20 + k;
      } else if (r === 0) {
        c.style.transform = 'rotate(0deg)';
        c.style.zIndex = 15;
      } else {
        const rr = Math.min(r, 3);
        c.style.transform = `translate(${rot[k] * 1.2}px, ${-rr * 9}px) rotate(${rot[k] * 1.4}deg) scale(${1 - rr * 0.015})`;
        c.style.zIndex = 15 - r;
      }
    });
    ticks.forEach((t, i) => t.classList.toggle('on', i === idx));
  };
  if (cards.length) setDeck(0);

  // Desktop controls: click a card / tick, arrow keys, or drag — all move the page
  // to the matching scroll position, so wheel scrolling and clicks stay in sync.
  const goToCard = (i) => {
    if (!tPin) return;
    i = Math.max(0, Math.min(cards.length - 1, i));
    const top = tPin.getBoundingClientRect().top + scrollY;
    const span = tPin.offsetHeight - vh;
    window.scrollTo({ top: top + span * (i + 0.5) / cards.length, behavior: reduce ? 'auto' : 'smooth' });
  };
  const deckEl = $('#deck');
  if (deckEl && cards.length) {
    let downX = null, downY = null, moved = false;
    deckEl.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; moved = false; });
    deckEl.addEventListener('pointermove', (e) => {
      if (downX !== null && Math.hypot(e.clientX - downX, e.clientY - downY) > 30) moved = true;
    });
    deckEl.addEventListener('pointerup', (e) => {
      if (downX === null) return;
      const dx = e.clientX - downX, dy = e.clientY - downY;
      downX = null;
      if (e.pointerType === 'touch' && !moved) return;          // on phones normal scrolling does the job
      if (moved && (dx > 40 || dy > 40)) goToCard(deckIdx - 1); // drag right/down → back
      else goToCard(deckIdx + 1);                                // click or drag left/up → next
    });
    ticks.forEach((t, i) => t.addEventListener('click', () => goToCard(i)));
    addEventListener('keydown', (e) => {
      if (!tPin) return;
      const r = tPin.getBoundingClientRect();
      if (r.top > 1 || r.bottom < vh - 1) return;               // only while the deck is pinned
      if (e.key === 'ArrowRight') { e.preventDefault(); goToCard(deckIdx + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goToCard(deckIdx - 1); }
    });
  }

  /* ---------------- FAQ ---------------- */
  const qas = $$('.qa');
  qas.forEach(qa => {
    const p = $('.a p', qa);
    p.innerHTML = `<span class="txt">${p.innerHTML}</span>`;
    $('.q', qa).addEventListener('click', () => {
      const wasOpen = qa.classList.contains('open');
      qas.forEach(o => { o.classList.remove('open', 'typed'); clearTimeout(o._t); });
      if (!wasOpen) openQA(qa);
    });
  });
  function openQA(qa) {
    qa.classList.add('open');
    qa._t = setTimeout(() => qa.classList.add('typed'), 650);   // "typing…" pause, then text de-blurs
  }
  if (qas.length) {
    const first = qas[0];
    const fio = new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { openQA(first); fio.disconnect(); }
    }, { threshold: 0.6 });
    fio.observe(first);
  }

  /* ---------------- header state ---------------- */
  const header = $('#header');
  const headerLabel = $('#headerLabel');
  const updateHeader = () => {
    const els = document.elementsFromPoint(innerWidth / 2, 34);
    const el = els.find(e => !e.closest('#header') && !e.closest('#menu') && !e.closest('#loader'));
    const themed = el && el.closest('[data-header-theme]');
    header.classList.toggle('on-orange', !!themed && themed.dataset.headerTheme === 'orange');
    const lab = el && el.closest('[data-label]');
    if (lab && aboutPin) {
      const r = aboutPin.getBoundingClientRect();
      const active = r.top < 40;
      headerLabel.textContent = lab.dataset.label;
      headerLabel.classList.toggle('on', active);
      aboutEyebrow && aboutEyebrow.classList.toggle('hide', active);
    } else {
      headerLabel.classList.remove('on');
    }
  };

  /* ---------------- scroll-driven frame ---------------- */
  const strip = $('#strip');
  const stripTrack = strip && $('.strip__track', strip);
  const workImgs = $$('.work__media img');

  const frame = () => {
    // about
    if (aboutPin && words.length) {
      const r = aboutPin.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const n = Math.round(p * (words.length + 3)) - 1;
      words.forEach((w, i) => {
        w.classList.toggle('done', i < n - 1);
        w.classList.toggle('now', i >= n - 1 && i <= n);
      });
      aboutPills.forEach(pl => pl.classList.toggle('on', p >= parseFloat(pl.dataset.at)));
    }
    // strip
    if (strip && stripTrack) {
      const r = strip.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height));
      const max = stripTrack.scrollWidth - strip.clientWidth;
      stripTrack.style.transform = `translateX(${(0.08 - p * 0.9) * max}px)`;
    }
    // work image parallax
    workImgs.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = `translateY(${p * -7}%)`;
    });
    // snake
    if (sBody && snakeLen) {
      const r = sBody.getBoundingClientRect();
      const p = clamp((vh * 0.8 - r.top) / r.height);
      sLine.style.strokeDashoffset = snakeLen * (1 - p);
    }
    // testimonials
    if (tPin && cards.length) {
      const r = tPin.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      setDeck(Math.min(cards.length - 1, Math.floor(p * cards.length * 0.999)));
    }
    updateHeader();
  };

  // ticker runs continuously; scroll speed pushes it a little
  const tick = () => {
    if (tickerText && unit) {
      velocity *= 0.9;
      tickOffset -= 0.35 + Math.min(Math.abs(velocity) * 0.25, 6);
      if (tickOffset < -unit) tickOffset += unit;
      tickerText.setAttribute('startOffset', tickOffset);
    }
    requestAnimationFrame(tick);
  };

  let queued = false;
  addEventListener('scroll', () => {
    velocity += scrollY - lastY; lastY = scrollY;
    if (!queued) { queued = true; requestAnimationFrame(() => { frame(); queued = false; }); }
  }, { passive: true });

  const relayout = () => { vh = innerHeight; buildSnake(); measureTicker(); frame(); };
  addEventListener('resize', relayout);
  addEventListener('load', relayout);
  document.fonts && document.fonts.ready.then(relayout);
  relayout();
  if (!reduce) requestAnimationFrame(tick);
})();
