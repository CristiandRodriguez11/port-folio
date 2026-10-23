/*!
 * Colombianaso — motion layer
 * Adds the "motion reel" animation pass on top of the existing portfolio
 * without changing its HTML. Load it once, right before </body>:
 *   <script src="motion.js" defer><\/script>
 */
(() => {
  if (window.__colMotion) return;
  window.__colMotion = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const io = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const outCubic = t => 1 - Math.pow(1 - t, 3);
  const inExpo = t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
  const AMBER = '#f59e0b', CREAM = '#f0ebe0', MUTED = '#8a8072', INK = '#0d0d0d';

  /* ───────────────────────── styles ───────────────────────── */
  const css = `
  .cm-hud{position:fixed;inset:0;pointer-events:none;z-index:90;font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(240,235,224,.55);mix-blend-mode:difference}
  .cm-hud .cm-c{position:absolute;width:16px;height:16px;border-color:rgba(240,235,224,.45);border-style:solid;border-width:0}
  .cm-hud .tl{top:84px;left:14px;border-top-width:1.5px;border-left-width:1.5px}
  .cm-hud .tr{top:84px;right:14px;border-top-width:1.5px;border-right-width:1.5px}
  .cm-hud .bl{bottom:14px;left:14px;border-bottom-width:1.5px;border-left-width:1.5px}
  .cm-hud .br{bottom:14px;right:14px;border-bottom-width:1.5px;border-right-width:1.5px}
  .cm-hud .cm-sec{position:absolute;top:88px;left:40px}
  .cm-hud .cm-sec b{color:${AMBER};font-weight:700}
  .cm-hud .cm-tc{position:absolute;top:88px;right:40px;font-variant-numeric:tabular-nums}
  .cm-hud .cm-tc i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#ff4d2e;margin-right:8px;vertical-align:1px;animation:cmBlink 1.2s steps(2,end) infinite}
  .cm-hud .cm-meta{position:absolute;bottom:18px;left:40px}
  .cm-hud .cm-bars{position:absolute;bottom:22px;right:40px;display:flex;gap:4px}
  .cm-hud .cm-bars span{width:22px;height:2px;background:rgba(240,235,224,.25)}
  .cm-hud .cm-bars span.on{background:${CREAM}}
  @keyframes cmBlink{50%{opacity:0}}
  @media (max-width:760px){.cm-hud .cm-sec,.cm-hud .cm-meta,.cm-hud .cm-bars{display:none}.cm-hud .tl,.cm-hud .tr{top:78px}.cm-hud .cm-tc{top:82px;right:34px}}

  .cm-intro{position:fixed;inset:0;z-index:10000;background:${INK};transition:transform .7s cubic-bezier(.77,0,.18,1)}
  .cm-intro canvas{position:absolute;inset:0;width:100%;height:100%}
  .cm-intro.out{transform:translateY(-100%)}
  .cm-intro .cm-skip{position:absolute;right:24px;bottom:22px;font:600 10px 'Space Grotesk',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:${MUTED};background:none;border:1px solid rgba(240,235,224,.15);border-radius:100px;padding:.5rem .9rem;cursor:pointer}
  .cm-intro .cm-skip:hover{color:${CREAM};border-color:rgba(240,235,224,.4)}

  .cm-split{display:inline}
  .cm-w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.06em;margin-bottom:-.06em}
  .cm-wi{display:inline-block;transform:translate3d(0,108%,0);transition:transform 1s cubic-bezier(.16,1,.3,1);will-change:transform}
  .cm-in .cm-wi{transform:none}
  .showcase-heading .cm-wi{transition-duration:1.1s}

  .cm-num{display:inline-flex;align-items:center;gap:.55rem;margin-right:.6rem;color:${AMBER}}
  .cm-num::before{content:'';width:7px;height:7px;background:${AMBER};display:inline-block;transform:rotate(0);animation:cmSpin 6s cubic-bezier(.7,0,.3,1) infinite}
  @keyframes cmSpin{0%,20%{transform:rotate(0)}30%,70%{transform:rotate(90deg)}80%,100%{transform:rotate(180deg)}}

  .showcase-banner{overflow:hidden}
  .showcase-img-wrap{will-change:transform;transform-origin:50% 40%}
  .cm-frame{position:absolute;inset:clamp(14px,2.2vw,28px);pointer-events:none;z-index:3;font:600 10px 'Space Grotesk',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:rgba(240,235,224,.7)}
  .cm-frame .cm-c{position:absolute;width:22px;height:22px;border:0 solid rgba(240,235,224,.6)}
  .cm-frame .tl{top:0;left:0;border-top-width:2px;border-left-width:2px}
  .cm-frame .tr{top:0;right:0;border-top-width:2px;border-right-width:2px}
  .cm-frame .bl{bottom:0;left:0;border-bottom-width:2px;border-left-width:2px}
  .cm-frame .br{bottom:0;right:0;border-bottom-width:2px;border-right-width:2px}
  .cm-frame .cm-rec{position:absolute;top:6px;right:34px;font-variant-numeric:tabular-nums}
  .cm-frame .cm-rec i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ff4d2e;margin-right:8px;vertical-align:0;animation:cmBlink 1.2s steps(2,end) infinite}
  .cm-frame .cm-res{position:absolute;bottom:6px;left:34px}
  .cm-frame .cm-ruler{position:absolute;left:34px;right:34px;bottom:30px;height:10px;border-bottom:1px solid rgba(240,235,224,.35);transform-origin:left;transform:scaleX(0);transition:transform 1.4s cubic-bezier(.77,0,.18,1) .3s;background:repeating-linear-gradient(90deg,rgba(240,235,224,.35) 0 1px,transparent 1px 60px) bottom/100% 6px no-repeat}
  .cm-frame.cm-in .cm-ruler{transform:none}
  @media (max-width:760px){.cm-frame .cm-res,.cm-frame .cm-ruler{display:none}}

  .cm-kinetic{position:absolute;inset:auto -10% -4% -10%;transform:rotate(-6deg);pointer-events:none;user-select:none;z-index:0;display:flex;flex-direction:column;gap:.1em}
  .cm-row{white-space:nowrap;font-family:'Archivo',sans-serif;font-weight:900;font-size:clamp(4.5rem,13vw,12rem);line-height:.9;letter-spacing:-.04em;will-change:transform}
  .cm-row.fill{color:rgba(245,240,232,.035)}
  .cm-row.line{color:transparent;-webkit-text-stroke:1.5px rgba(245,240,232,.06)}
  .cm-row .dot{display:inline-block;width:.16em;height:.16em;background:rgba(245,158,11,.18);margin:0 .4em;vertical-align:.3em}
  #about.hero > .container{position:relative;z-index:1}
  .cm-hide-bg{opacity:0!important}

  .cm-stats{display:flex;flex-wrap:wrap;gap:clamp(1.25rem,3vw,2.75rem);margin-top:2.25rem;padding-top:1.5rem;border-top:1px solid rgba(245,240,232,.08)}
  .cm-stat b{display:block;font-family:'Archivo',sans-serif;font-weight:900;font-size:clamp(1.9rem,3.6vw,2.8rem);line-height:1;color:${CREAM};font-variant-numeric:tabular-nums}
  .cm-stat b em{font-style:normal;color:${AMBER}}
  .cm-stat span{display:block;margin-top:.45rem;font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${MUTED}}

  .bento-grid{perspective:1400px}
  .b-item.cm-ready{clip-path:inset(100% 0 0 0 round 12px);transition:clip-path 1s cubic-bezier(.77,0,.18,1),transform .5s cubic-bezier(.16,1,.3,1)}
  .b-item.cm-ready.cm-in{clip-path:inset(0 0 0 0 round 12px)}
  .b-item.cm-ready img{scale:1.28;transition:scale 1.5s cubic-bezier(.16,1,.3,1),transform .5s ease}
  .b-item.cm-ready.cm-in img{scale:1}
  .cm-bbox{position:absolute;inset:10px;pointer-events:none;opacity:0;transform:scale(1.04);transition:opacity .25s ease,transform .35s cubic-bezier(.16,1,.3,1);z-index:2;border:1px solid rgba(245,158,11,.85)}
  .cm-bbox i{position:absolute;width:8px;height:8px;background:${INK};border:1.5px solid ${AMBER}}
  .cm-bbox i:nth-child(1){top:-5px;left:-5px}.cm-bbox i:nth-child(2){top:-5px;right:-5px}.cm-bbox i:nth-child(3){bottom:-5px;left:-5px}.cm-bbox i:nth-child(4){bottom:-5px;right:-5px}
  .cm-bbox i:nth-child(5){top:-5px;left:calc(50% - 4px)}.cm-bbox i:nth-child(6){bottom:-5px;left:calc(50% - 4px)}
  .cm-bbox span{position:absolute;top:10px;left:10px;font:700 10px 'Space Grotesk',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${INK};background:${AMBER};padding:.3rem .5rem;border-radius:3px}
  .cm-bbox em{position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);font:600 10px 'Space Grotesk',sans-serif;font-style:normal;letter-spacing:.12em;color:${AMBER};white-space:nowrap}
  .b-item:hover .cm-bbox{opacity:1;transform:none}

  .cm-marquee{overflow:hidden;width:100%;margin-top:2.5rem;margin-bottom:3rem;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
  .cm-track{display:flex;gap:1.25rem;width:max-content;animation:cmMarq 32s linear infinite}
  .cm-marquee:hover .cm-track{animation-play-state:paused}
  .cm-track .collab-item{opacity:1!important;transform:none!important;flex:0 0 auto}
  @keyframes cmMarq{to{transform:translateX(-50%)}}

  footer#contact{position:relative;overflow:hidden}
  footer#contact > .container{position:relative;z-index:1}
  .cm-particles{position:absolute;top:0;right:0;bottom:0;width:min(560px,50%);z-index:0;pointer-events:none;opacity:.95}
  .cm-cta{padding:clamp(3rem,7vw,5.5rem) 0 clamp(2.5rem,5vw,4rem);max-width:min(680px,60%)}
  .cm-cta small{display:block;font-size:.75rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${AMBER};margin-bottom:1rem}
  .cm-cta h2{font-family:'Archivo',sans-serif;font-weight:900;font-size:clamp(2.6rem,6.5vw,5.5rem);line-height:.95;letter-spacing:-.03em;color:${CREAM}}
  .cm-cta h2 em{font-style:normal;color:${AMBER}}
  .cm-breath{display:inline-block;position:relative;width:.2em;height:.2em;margin-left:.08em;background:${AMBER};border-radius:50%;vertical-align:.05em}
  .cm-breath::after{content:'';position:absolute;inset:-.25em;border:2px solid rgba(245,158,11,.6);border-radius:50%;animation:cmBreath 2.6s cubic-bezier(.16,1,.3,1) infinite}
  @keyframes cmBreath{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.7);opacity:0}}
  .cm-cta a{display:inline-flex;align-items:center;gap:.6rem;margin-top:1.75rem;font-weight:700;color:${INK};background:${AMBER};padding:.9rem 1.5rem;border-radius:8px;transition:transform .3s cubic-bezier(.16,1,.3,1),background .3s}
  .cm-cta a:hover{transform:translateY(-3px);background:#d97706}
  @media (max-width:760px){.cm-particles{width:100%;opacity:.35}.cm-cta{max-width:100%}}

  header nav li{opacity:0;transform:translateY(-10px);transition:opacity .6s ease,transform .6s cubic-bezier(.16,1,.3,1)}
  .cm-nav-in header nav li{opacity:1;transform:none}
  ${[1,2,3,4,5].map(i => `.cm-nav-in header nav li:nth-child(${i}){transition-delay:${(i - 1) * 70}ms}`).join('')}

  @media (prefers-reduced-motion: reduce){
    .cm-wi{transform:none!important;transition:none!important}
    .b-item.cm-ready{clip-path:none!important}.b-item.cm-ready img{scale:1!important}
    .cm-track{animation:none}.cm-num::before,.cm-breath::after{animation:none}
    header nav li{opacity:1;transform:none}
  }`;
  const style = document.createElement('style');
  style.id = 'cm-motion-css';
  style.textContent = css;
  document.head.appendChild(style);

  /* ───────────────────────── helpers ───────────────────────── */
  const inView = (el, cb, opts = { threshold: .18 }) => {
    const ob = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { cb(e.target); ob.unobserve(e.target); }
    }), opts);
    ob.observe(el);
  };
  const tc = frames => {
    const f = Math.floor(frames) % 60, s = Math.floor(frames / 60);
    const p = n => String(n).padStart(2, '0');
    return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(f)}`;
  };

  // Wraps every word of an element in a masked span, keeping <em>, <br> and colours intact.
  function split(el) {
    if (!el || el.dataset.cmSplit) return;
    el.dataset.cmSplit = '1';
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'cm-w';
            const wi = document.createElement('span'); wi.className = 'cm-wi'; wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    $$('.cm-wi', el).forEach((s, i) => (s.style.transitionDelay = `${i * 70}ms`));
  }

  /* ───────────────────────── fixed HUD ───────────────────────── */
  const SECTIONS = [
    ['showcaseBanner', 'Featured'], ['about', 'About'], ['projects', 'Projects'],
    ['collaborations', 'Collabs'], ['hytale-portfolio', 'Hytale'], ['contact', 'Contact']
  ].filter(([id]) => document.getElementById(id));

  const hud = document.createElement('div');
  hud.className = 'cm-hud';
  hud.setAttribute('aria-hidden', 'true');
  hud.innerHTML = `<span class="cm-c tl"></span><span class="cm-c tr"></span><span class="cm-c bl"></span><span class="cm-c br"></span>
    <div class="cm-sec"><b>00</b> — Featured</div><div class="cm-tc"><i></i><span>00:00:00:00</span></div>
    <div class="cm-meta">Colombianaso Builds / Minecraft · Hytale / Colombia</div>
    <div class="cm-bars">${SECTIONS.map(() => '<span></span>').join('')}</div>`;
  document.body.appendChild(hud);
  const hudSec = $('.cm-sec', hud), hudTc = $('.cm-tc span', hud), hudBars = $$('.cm-bars span', hud);

  /* ───────────────────────── section numbers ───────────────────────── */
  const numFor = id => String(SECTIONS.findIndex(s => s[0] === id)).padStart(2, '0');
  [['about', '.hero-tag'], ['projects', '.section-label'], ['collaborations', '.section-label'], ['hytale-portfolio', '.section-label']]
    .forEach(([id, sel]) => {
      const el = $(`#${id} ${sel}`);
      if (el && !$('.cm-num', el)) el.insertAdjacentHTML('afterbegin', `<span class="cm-num">${numFor(id)} —</span>`);
    });

  /* ───────────────────────── hero banner ───────────────────────── */
  const banner = $('#showcaseBanner');
  const bannerWrap = $('.showcase-img-wrap');
  const heroHeading = $('.showcase-heading');
  let frame;
  if (banner) {
    frame = document.createElement('div');
    frame.className = 'cm-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.innerHTML = `<span class="cm-c tl"></span><span class="cm-c tr"></span><span class="cm-c bl"></span><span class="cm-c br"></span>
      <div class="cm-rec"><i></i><span>REC 00:00:00:00</span></div><div class="cm-ruler"></div><div class="cm-res">Render / 3840×2160 / Shaders on</div>`;
    banner.appendChild(frame);
  }
  if (heroHeading) split(heroHeading);
  let heroStart = 0;
  const startHero = () => {
    if (heroStart) return;
    heroStart = performance.now();
    document.documentElement.classList.add('cm-nav-in');
    heroHeading && heroHeading.classList.add('cm-in');
    frame && frame.classList.add('cm-in');
  };

  /* ───────────────────────── titles ───────────────────────── */
  const TITLE_SEL = '.hero-title, .section-title, .collab-card-title, .hytale-hero-name, .hytale-hero-sub, h3.heading';
  const prepTitles = () => $$(TITLE_SEL).forEach(el => {
    if (el.dataset.cmSplit) return;
    split(el);
    inView(el, t => t.classList.add('cm-in'), { threshold: .3 });
  });
  prepTitles();

  /* ───────────────────────── kinetic BUILDS rows ───────────────────────── */
  const about = $('#about'), bgText = $('.hero-bg-text');
  let rows = [];
  if (about && bgText) {
    bgText.classList.add('cm-hide-bg');
    const word = (bgText.textContent || 'BUILDS').trim();
    const unit = `${word}<span class="dot"></span>`;
    const k = document.createElement('div');
    k.className = 'cm-kinetic';
    k.setAttribute('aria-hidden', 'true');
    k.innerHTML = ['line', 'fill', 'line'].map(c => `<div class="cm-row ${c}">${unit.repeat(10)}</div>`).join('');
    about.insertBefore(k, about.firstChild);
    rows = $$('.cm-row', k);
  }

  /* ───────────────────────── real stats ───────────────────────── */
  const heroLinks = $('#about .hero-links');
  if (heroLinks && !$('.cm-stats')) {
    const shown = sel => $$(sel).filter(e => e.offsetParent !== null).length;
    const projects = shown('#projects-bento .b-item') || shown('#projects .b-item');
    const collabs = $$('#collabLogos .collab-item').length;
    const hytale = shown('#hytale-bento .b-item') || shown('#hytale-portfolio .b-item');
    const stats = [[projects, 'Builds'], [collabs, 'Collaborations'], [hytale, 'Hytale builds']].filter(s => s[0] > 0);
    if (stats.length) {
      const wrap = document.createElement('div');
      wrap.className = 'cm-stats';
      wrap.innerHTML = stats.map(([n, l]) => `<div class="cm-stat"><b data-to="${n}">0<em>+</em></b><span>${l}</span></div>`).join('')
        + `<div class="cm-stat"><b>1<em>×</em></b><span>MrBeast Gaming</span></div>`;
      heroLinks.after(wrap);
      inView(wrap, () => $$('b[data-to]', wrap).forEach(b => {
        const to = +b.dataset.to, t0 = performance.now();
        const tick = now => {
          const u = reduce ? 1 : clamp((now - t0) / 1400, 0, 1);
          b.firstChild.textContent = Math.round(to * outCubic(u));
          if (u < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }), { threshold: .5 });
    }
  }

  /* ───────────────────────── gallery cards ───────────────────────── */
  const prepCards = () => $$('.bento-grid .b-item').forEach(card => {
    if (card.dataset.cmCard) return;
    card.dataset.cmCard = '1';
    const n = [...card.parentElement.children].filter(c => c.classList.contains('b-item')).indexOf(card) + 1;
    const img = $('img', card);
    const box = document.createElement('div');
    box.className = 'cm-bbox';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = `<i></i><i></i><i></i><i></i><i></i><i></i><span>${card.closest('#hytale-portfolio') ? 'Hytale' : 'Build'} ${String(n).padStart(2, '0')}</span><em></em>`;
    card.appendChild(box);
    const setDims = () => { if (img && img.naturalWidth) $('em', box).textContent = `${img.naturalWidth} × ${img.naturalHeight}`; };
    img && (img.complete ? setDims() : img.addEventListener('load', setDims, { once: true }));
    if (!reduce) {
      card.classList.add('cm-ready');
      inView(card, c => {
        const peers = $$('.b-item.cm-ready:not(.cm-in)', c.parentElement)
          .filter(p => p.getBoundingClientRect().top < innerHeight);
        const d = Math.max(0, peers.indexOf(c)) * 90;
        setTimeout(() => c.classList.add('cm-in'), d);
      }, { threshold: .12 });
      if (!isTouch) {
        card.addEventListener('mousemove', e => {
          if (!card.classList.contains('cm-in')) return;
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          card.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
        });
        card.addEventListener('mouseleave', () => (card.style.transform = ''));
      }
    }
  });
  prepCards();

  /* ───────────────────────── collab logo marquee ───────────────────────── */
  const logos = $('#collabLogos');
  if (logos && !reduce && logos.children.length >= 3 && !logos.dataset.cmMarq) {
    logos.dataset.cmMarq = '1';
    const items = [...logos.children];
    const mq = document.createElement('div');
    mq.className = 'cm-marquee';
    const track = document.createElement('div');
    track.className = 'cm-track';
    const copies = Math.max(2, Math.ceil(12 / items.length));
    for (let c = 0; c < copies * 2; c++) items.forEach(it => {
      const cl = it.cloneNode(true);
      if (c) cl.setAttribute('aria-hidden', 'true');
      track.appendChild(cl);
    });
    mq.appendChild(track);
    logos.style.display = 'none';
    logos.after(mq);
  }

  /* ───────────────────────── contact CTA + particles ───────────────────────── */
  const footer = $('footer#contact');
  let particles = null;
  if (footer && !$('.cm-cta')) {
    const cont = $('.container', footer);
    const mail = $('.footer-email a', footer);
    const cta = document.createElement('div');
    cta.className = 'cm-cta';
    cta.innerHTML = `<small><span class="cm-num">${numFor('contact')} —</span>Contact</small>
      <h2 class="cm-cta-title">Let's build <em>something</em><span class="cm-breath"></span></h2>
      ${mail ? `<a href="${mail.getAttribute('href') || 'mailto:' + mail.textContent.trim()}">${mail.textContent.trim()} <span aria-hidden="true">→</span></a>` : ''}`;
    cont && cont.insertBefore(cta, cont.firstChild);
    split($('.cm-cta-title', cta));
    inView(cta, c => $('.cm-cta-title', c).classList.add('cm-in'), { threshold: .4 });

    const cv = document.createElement('canvas');
    cv.className = 'cm-particles';
    cv.setAttribute('aria-hidden', 'true');
    footer.insertBefore(cv, footer.firstChild);
    particles = makeParticles(cv, footer);
  }

  // A cloud of little blocks that morphs between a sphere and a cube (a Minecraft block).
  function makeParticles(cv, host) {
    const ctx = cv.getContext('2d');
    const N = 520, sph = [], cub = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      sph.push([Math.cos(th) * r, y, Math.sin(th) * r]);
      const f = i % 6, a = Math.random() * 2 - 1, b = Math.random() * 2 - 1, s = .78;
      const p = [[1, a, b], [-1, a, b], [a, 1, b], [a, -1, b], [a, b, 1], [a, b, -1]][f];
      cub.push(p.map(v => v * s));
    }
    const amber = new Set(); while (amber.size < 46) amber.add((Math.random() * N) | 0);
    let w = 0, h = 0, dpr = 1, on = false, rot = 0, mx = 0, my = 0, last = 0, t = 0;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
    };
    size(); addEventListener('resize', size);
    host.addEventListener('mousemove', e => {
      const r = cv.getBoundingClientRect();
      mx = clamp((e.clientX - r.left) / r.width - .5, -1, 1);
      my = clamp((e.clientY - r.top) / r.height - .5, -1, 1);
    });
    new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) requestAnimationFrame(draw); }).observe(host);
    function draw(now) {
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      if (!reduce) { t += dt; rot += dt * .35; }
      const m = io(.5 - .5 * Math.cos(t * Math.PI * 2 / 9));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w * .42, h * .36), cx = w * .55, cy = h * .42;
      const ry = rot + mx * .6, rx = -.35 + my * .4;
      const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = sph[i], b = cub[i];
        let x = lerp(a[0], b[0], m), y = lerp(a[1], b[1], m), z = lerp(a[2], b[2], m);
        const x1 = x * cY + z * sY, z1 = -x * sY + z * cY;
        const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
        const p = 2.6 / (2.6 + z2);
        pts.push([cx + x1 * R * p, cy + y2 * R * p, z2, i]);
      }
      pts.sort((a, b) => b[2] - a[2]);
      for (const [x, y, z, i] of pts) {
        const d = clamp((1 - z) / 2, 0, 1), s = 1.2 + d * 2.6;
        ctx.globalAlpha = .18 + d * .75;
        ctx.fillStyle = amber.has(i) ? AMBER : CREAM;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      // the amber core, like the light inside the sphere in the reel
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * .45);
      g.addColorStop(0, 'rgba(245,158,11,.55)'); g.addColorStop(1, 'rgba(245,158,11,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      if (on && !reduce) requestAnimationFrame(draw);
    }
    return { size };
  }

  /* ───────────────────────── scroll loop ───────────────────────── */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      hudTc.textContent = tc(y / 4);
      let cur = 0;
      SECTIONS.forEach(([id], i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < innerHeight * .45) cur = i;
      });
      hudSec.innerHTML = `<b>${String(cur).padStart(2, '0')}</b> — ${SECTIONS[cur] ? SECTIONS[cur][1] : ''}`;
      hudBars.forEach((b, i) => b.classList.toggle('on', i <= cur));
      if (!reduce && rows.length && about) {
        const r = about.getBoundingClientRect();
        const p = (innerHeight - r.top) / (innerHeight + r.height);
        rows.forEach((row, i) => (row.style.transform = `translate3d(${(i % 2 ? -1 : 1) * (p * 22 - 18)}%,0,0)`));
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* ───────────────────────── per-frame: hero image + timecodes ───────────────────────── */
  const rec = frame && $('.cm-rec span', frame);
  const loop = now => {
    if (bannerWrap) {
      const intro = heroStart ? outCubic(clamp((now - heroStart) / 2400, 0, 1)) : 0;
      const s = reduce ? 1.06 : lerp(1.18, 1.06, intro);
      const bh = banner.offsetHeight || innerHeight;
      const yOff = reduce ? 0 : clamp(scrollY * .22, 0, bh * (s - 1) / 2);
      bannerWrap.style.transform = `translate3d(0,${yOff}px,0) scale(${s})`;
    }
    if (rec && heroStart) rec.textContent = 'REC ' + tc((now - heroStart) / 1000 * 60);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ───────────────────────── dynamic content (admin manager re-renders) ───────────────────────── */
  let mt;
  new MutationObserver(() => {
    clearTimeout(mt);
    mt = setTimeout(() => { prepCards(); prepTitles(); }, 120);
  }).observe(document.body, { childList: true, subtree: true });

  /* ───────────────────────── intro ───────────────────────── */
  let seen = false;
  try { seen = sessionStorage.getItem('cm-intro') === '1'; } catch (e) {}
  if (reduce || seen || scrollY > 40) { onScroll(); setTimeout(startHero, 120); return; }
  try { sessionStorage.setItem('cm-intro', '1'); } catch (e) {}
  runIntro();

  function runIntro() {
    const el = document.createElement('div');
    el.className = 'cm-intro';
    el.innerHTML = '<canvas></canvas><button class="cm-skip" type="button">Skip intro</button>';
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    const cv = $('canvas', el), ctx = cv.getContext('2d');
    let W, H, dpr;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; };
    size(); addEventListener('resize', size);
    const t0 = performance.now(), END = 2.75;
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      el.classList.add('out');
      document.documentElement.style.overflow = '';
      setTimeout(startHero, 180);
      setTimeout(() => el.remove(), 800);
    };
    $('.cm-skip', el).addEventListener('click', finish);
    addEventListener('keydown', function k(e) { if (e.key === 'Escape') { finish(); removeEventListener('keydown', k); } });

    const DROP = [.18, .5], B = [[.5, .82, 1], [.82, 1.1, .62], [1.1, 1.34, .34]];
    const contacts = [.5, .82, 1.1, 1.34];
    const trail = [];
    const pos = t => {
      const gy = H * .58, x0 = W * .3, x1 = W * .5, s = clamp(W * .017, 16, 28), hh = Math.min(170, H * .2);
      if (t < DROP[0]) return { x: x0, y: -s * 2, s, sq: 0 };
      if (t < DROP[1]) { const u = (t - DROP[0]) / (DROP[1] - DROP[0]); return { x: x0, y: lerp(-s * 2, gy, u * u), s, sq: -.18 * u }; }
      for (let i = 0; i < B.length; i++) {
        const [a, b, k] = B[i];
        if (t < b) { const u = (t - a) / (b - a); return { x: lerp(x0 + (x1 - x0) * i / 3, x0 + (x1 - x0) * (i + 1) / 3, u), y: gy - hh * k * 4 * u * (1 - u), s, sq: 0 }; }
      }
      return { x: x1, y: gy, s, sq: 0 };
    };
    const squash = t => {
      let v = 0;
      contacts.forEach((c, i) => { const u = (t - c) / .22; if (u > 0 && u < 1) v += Math.sin(u * Math.PI * 2) * (1 - u) * (.34 - i * .06); });
      return v;
    };
    const step = now => {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
      const fade = clamp(t / .3, 0, 1);
      const gy = H * .58, pad = clamp(W * .03, 16, 32);
      ctx.globalAlpha = fade;
      // camera frame corners + labels
      ctx.strokeStyle = 'rgba(240,235,224,.45)'; ctx.lineWidth = 1.5;
      [[pad, pad, 1, 1], [W - pad, pad, -1, 1], [pad, H - pad, 1, -1], [W - pad, H - pad, -1, -1]].forEach(([x, y, a, b]) => {
        ctx.beginPath(); ctx.moveTo(x, y + 18 * b); ctx.lineTo(x, y); ctx.lineTo(x + 18 * a, y); ctx.stroke();
      });
      ctx.font = "600 10px 'Space Grotesk', sans-serif"; ctx.fillStyle = 'rgba(240,235,224,.6)';
      ctx.textBaseline = 'middle';
      ctx.fillText('00 — INTRO  ·  TIMING', pad + 26, pad + 6);
      ctx.fillText('COLOMBIANASO BUILDS  /  1920×1080  /  60 FPS', pad + 26, H - pad - 6);
      ctx.textAlign = 'right';
      ctx.fillText(tc(t * 60), W - pad - 26, pad + 6);
      ctx.fillStyle = (t % 1.2) < .6 ? '#ff4d2e' : 'rgba(0,0,0,0)';
      ctx.beginPath(); ctx.arc(W - pad - 26 - ctx.measureText(tc(t * 60)).width - 12, pad + 6, 3, 0, 7); ctx.fill();
      ctx.textAlign = 'left';
      // timeline ruler that draws itself in
      const rx0 = W * .22, rx1 = W * .78, ry = gy + 30, ru = io(clamp((t - .05) / .5, 0, 1));
      ctx.strokeStyle = 'rgba(240,235,224,.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rx0, ry); ctx.lineTo(lerp(rx0, rx1, ru), ry); ctx.stroke();
      ctx.font = "500 10px 'Space Grotesk', sans-serif"; ctx.textAlign = 'center';
      contacts.forEach((c, i) => {
        if (t < c) return;
        const p = pos(c + .0001), a = clamp((t - c) / .2, 0, 1) * clamp((2.05 - t) / .25, 0, 1);
        ctx.globalAlpha = fade * a;
        ctx.beginPath(); ctx.moveTo(p.x, ry - 4); ctx.lineTo(p.x, ry + 4); ctx.stroke();
        ctx.fillStyle = 'rgba(240,235,224,.6)'; ctx.fillText(c.toFixed(2) + 's', p.x, ry + 16);
      });
      ctx.textAlign = 'left'; ctx.globalAlpha = fade;
      // dotted trajectory, like the bouncing ball in the reel
      const p = pos(t);
      if (t > DROP[0] && t < 1.36) trail.push([p.x, p.y - p.s / 2, t]);
      trail.forEach(([x, y, tt], i) => {
        if (i % 2) return;
        const a = clamp(1 - (t - tt) / 1.2, 0, 1) * clamp((2.05 - t) / .3, 0, 1);
        if (a <= 0) return;
        ctx.globalAlpha = a * .8; ctx.fillStyle = i % 6 === 0 ? AMBER : 'rgba(240,235,224,.8)';
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      });
      ctx.globalAlpha = fade;
      // annotation
      const an = clamp((t - .85) / .2, 0, 1) * clamp((1.75 - t) / .2, 0, 1);
      if (an > 0) {
        ctx.globalAlpha = an; ctx.fillStyle = 'rgba(240,235,224,.7)'; ctx.font = "500 10px 'Space Grotesk', sans-serif";
        const ax = pos(1.0).x + 40, ay = gy - 90;
        ctx.fillText('SQUASH  0.72', ax, ay); ctx.fillText('STRETCH 1.28', ax, ay + 14);
        ctx.strokeStyle = 'rgba(240,235,224,.4)'; ctx.beginPath(); ctx.moveTo(ax - 6, ay + 20); ctx.lineTo(ax - 30, ay + 52); ctx.stroke();
        ctx.globalAlpha = fade;
      }
      // the block: a little Minecraft-ish cube that squashes on every hit, then fills the screen
      const sq = squash(t) + p.sq;
      const grow = inExpo(clamp((t - 1.95) / .6, 0, 1));
      const bw = p.s * (1 + sq * .7), bh = p.s * (1 - sq);
      const big = Math.hypot(W, H) * 2.2 * grow;
      const sz = Math.max(bw, bh) + big;
      const bx = p.x, by = lerp(p.y - bh / 2, H / 2, grow);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(grow * Math.PI / 4);
      ctx.fillStyle = AMBER; ctx.fillRect(-(bw + big) / 2, -(bh + big) / 2, bw + big, bh + big);
      if (grow < .05) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-bw / 2, bh / 2 - bh * .28, bw, bh * .28); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-bw / 2, -bh / 2, bw, bh * .22); }
      ctx.restore();
      // shadow on the floor
      if (grow < .02 && t > DROP[0]) {
        const lift = clamp((gy - p.y) / 200, 0, 1);
        ctx.globalAlpha = fade * (.35 - lift * .25); ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(p.x, gy + 3, p.s * (.9 - lift * .4), 3, 0, 0, 7); ctx.fill(); ctx.globalAlpha = fade;
      }
      // wordmark rises under the timeline
      const wm = clamp((t - 1.38) / .5, 0, 1);
      if (wm > 0 && grow < 1) {
        const fs = clamp(W * .05, 30, 72);
        ctx.font = `900 ${fs}px 'Archivo', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.save(); ctx.beginPath(); ctx.rect(0, ry + 34, W, fs * 1.1); ctx.clip();
        ctx.fillStyle = CREAM; ctx.fillText('COLOMBIANASO', W / 2, ry + 34 + fs * .92 + (1 - outCubic(wm)) * fs);
        ctx.restore();
        ctx.globalAlpha = clamp((t - 1.6) / .3, 0, 1);
        ctx.font = "700 11px 'Space Grotesk', sans-serif"; ctx.fillStyle = AMBER;
        ctx.fillText('MINECRAFT BUILDER  ·  COLOMBIA', W / 2, ry + 34 + fs * 1.1 + 22);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      }
      if (t >= END) { finish(); return; }
      if (!done) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
})();
