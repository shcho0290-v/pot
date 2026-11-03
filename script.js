/* seonghae — portfolio. Vanilla JS, written from scratch. */
(() => {
  'use strict';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- 1. live Seoul clock (updates on each minute boundary) ---------- */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', minute: '2-digit', hour12: true });
  const tick = () => {
    clock.textContent = fmt.format(new Date());
    clock.setAttribute('datetime', new Date().toISOString());
    setTimeout(tick, 60000 - (Date.now() % 60000) + 20);
  };
  tick();

  /* ---------- 2. star ratings (from file: ★ filled / ☆ empty) ---------- */
  $$('.stars').forEach(el => {
    const r = +el.dataset.r;
    el.innerHTML = '★'.repeat(r) + '<i>' + '☆'.repeat(5 - r) + '</i>';
  });

  /* ---------- 3. per-letter flicker on hover (links + tile captions) ---------- */
  const split = el => {
    if (el.dataset.split) return;
    el.dataset.split = 1;
    const txt = el.textContent;
    el.setAttribute('aria-label', txt.trim());
    el.innerHTML = [...txt].map((ch, i) =>
      `<span class="ch" aria-hidden="true" style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  };
  const replay = el => { el.classList.remove('flick'); void el.offsetWidth; el.classList.add('flick'); };

  $$('.hdr__nav a, .ftr__links a').forEach(a => {
    split(a);
    a.addEventListener('mouseenter', () => replay(a));
    a.addEventListener('animationend', e => { if (e.target === a.lastElementChild) a.classList.remove('flick'); });
  });
  $$('.tile').forEach(t => {
    const parts = $$('.tile__title, .tile__client, .tile__year', t);
    parts.forEach(split);
    t.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; t.classList.add('is-hover'); parts.forEach(replay); });
    t.addEventListener('pointerleave', e => { if (!t.classList.contains('is-hover')) return; t.classList.remove('is-hover'); parts.forEach(replay); });
  });

  /* ---------- 4. marquee (left → right, constant speed) ---------- */
  const mq = $('.marquee'), mqSet = $('.marquee__set'), mqTrack = $('.marquee__track');
  const arrow = '<svg class="mq-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M1.5 8h2M5.5 8h2M9.5 8h3.5" /><path d="M10 4.5 13.5 8 10 11.5"/></svg>';
  const env = '<svg class="mq-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.6"/><rect x="4.4" y="5.6" width="7.2" height="4.8" rx=".6"/><path d="m4.6 6 3.4 2.4L11.4 6" stroke-linejoin="round"/></svg>';
  const unit = `<span class="mq-item">Let’s get in touch ${arrow} seonghae.cho@example.com ${env}</span>`;
  const buildMarquee = () => {
    mqTrack.innerHTML = '<div class="marquee__set"></div>';
    const set = $('.marquee__set', mqTrack);
    set.innerHTML = unit;
    const uw = set.firstElementChild.getBoundingClientRect().width || 300;
    const n = Math.max(2, Math.ceil(window.innerWidth / uw) + 1);
    set.innerHTML = unit.repeat(n);
    mqTrack.appendChild(set.cloneNode(true));           // 2nd copy for seamless loop
    const PX_PER_S = 34;                                 // observed ~25-40 px/s
    mqTrack.style.setProperty('--mq-dur', (set.getBoundingClientRect().width / PX_PER_S).toFixed(2) + 's');
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(buildMarquee);
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(buildMarquee, 200); });

  /* ---------- 5. footer wordmark: first letter grain-morph on scroll-in (one shot) ---------- */
  const mark = $('.ftr__mark .wordmark');
  const word = mark.textContent;
  mark.setAttribute('aria-label', word);
  const chars = [...word];
  mark.innerHTML = `<span class="mark-first" aria-hidden="true">${chars[0]}</span><span aria-hidden="true">${chars.slice(1).join('')}</span>`;
  const first = $('.mark-first', mark);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="morph" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feTurbulence id="mWarp" type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="3" result="warp"/>
      <feDisplacementMap id="mD1" in="SourceGraphic" in2="warp" scale="0" xChannelSelector="R" yChannelSelector="G" result="d1"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="7" result="grain"/>
      <feDisplacementMap id="mD2" in="d1" in2="grain" scale="0" xChannelSelector="R" yChannelSelector="B"/>
    </filter>`;
  document.body.appendChild(svg);
  const warp = $('#mWarp', svg), d1 = $('#mD1', svg), d2 = $('#mD2', svg);
  const runMorph = () => {
    const DUR = 1700, t0 = performance.now();
    let lastSeed = 0;
    first.classList.add('is-morph');
    const ease = t => 1 - Math.pow(1 - t, 3);           // easeOutCubic
    const frame = now => {
      const t = Math.min(1, (now - t0) / DUR), k = 1 - ease(t);
      d1.setAttribute('scale', (k * 150).toFixed(1));
      d2.setAttribute('scale', (k * 34 + (t < 1 ? 2 : 0)).toFixed(1));
      warp.setAttribute('baseFrequency', (0.008 + 0.01 * Math.sin(t * Math.PI * 2.2) ** 2).toFixed(4));
      if (now - lastSeed > 70) { warp.setAttribute('seed', (Math.random() * 999) | 0); lastSeed = now; }
      if (t < 1) requestAnimationFrame(frame);
      else first.classList.remove('is-morph');
    };
    requestAnimationFrame(frame);
  };
  if (!RM.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { io.disconnect(); runMorph(); }
    }), { threshold: 0.35 });
    io.observe(mark);
  }

  /* ---------- 5b. header legibility: transparent at top, tinted when content/footer is underneath ---------- */
  const hdr = $('.hdr'), darkZone = $('.marquee');
  let hq = false;
  const hdrUpdate = () => {
    hq = false;
    const h = hdr.offsetHeight;
    const dark = darkZone.getBoundingClientRect().top < h;
    hdr.classList.toggle('is-dark', dark);
    hdr.classList.toggle('is-solid', !dark && window.scrollY > 8);
  };
  window.addEventListener('scroll', () => { if (!hq) { hq = true; requestAnimationFrame(hdrUpdate); } }, { passive: true });
  window.addEventListener('resize', hdrUpdate);

  /* ---------- 6. detail "pages" (in-page router, no transition – like the reference) ---------- */
  const NOTE_WORK = '아래 경력은 포트폴리오 구성을 위한 가상 예시입니다.';
  const NOTE_EDU = '학력은 수정 가능한 가상 예시입니다.';
  const DATA = {
    'work/nextrealty': {
      title: '프롭테크 사업전략 총괄', org: '넥스트리얼티테크 (가상 기업)', orgShort: '넥스트리얼티테크',
      period: '2024/01/01 – 현재', role: '프롭테크 사업전략 총괄', cat: 'Work Experience',
      img: 'tile-1.jpg', ph: null,
      overview: '부동산 데이터 기반 플랫폼의 사업 전략과 신규 서비스 기획을 총괄합니다. AI 부동산 가치평가 모델 도입, 상업용 부동산 투자 분석 서비스 개발, 디지털 자산관리 솔루션 구축을 주도하였으며, 데이터 분석을 통해 고객의 투자 의사결정 효율성을 높이는 업무를 수행합니다.',
      cards: ['AI 부동산 가치평가 모델 도입', '상업용 부동산 투자 분석 서비스 개발', '디지털 자산관리 솔루션 구축', '데이터 분석을 통해 고객의 투자 의사결정 효율성을 높이는 업무'],
      note: NOTE_WORK
    },
    'work/urbandata': {
      title: '부동산 데이터 분석 및 사업개발 매니저', org: '어반데이터솔루션 (가상 기업)', orgShort: '어반데이터솔루션',
      period: '2021/03/01 – 2023/12/31', role: '부동산 데이터 분석 및 사업개발 매니저', cat: 'Work Experience',
      img: null, ph: 'green',
      overview: '부동산 실거래 데이터, 상권 정보, 인구 이동 데이터 및 공간정보를 통합 분석하여 투자 유망 지역 발굴과 신규 사업 기획을 담당했습니다. GIS 기반 입지 분석과 시장 예측 모델을 활용하여 부동산 개발 및 투자 전략 수립을 지원했습니다.',
      cards: ['부동산 실거래 데이터, 상권 정보, 인구 이동 데이터 및 공간정보 통합 분석', '투자 유망 지역 발굴과 신규 사업 기획', 'GIS 기반 입지 분석과 시장 예측 모델 활용', '부동산 개발 및 투자 전략 수립 지원'],
      note: NOTE_WORK
    },
    'work/kpp': {
      title: '부동산 투자 및 자산관리 컨설턴트', org: '코리아프로퍼티파트너스 (가상 기업)', orgShort: '코리아프로퍼티파트너스',
      period: '2018/01/01 – 2021/02/28', role: '부동산 투자 및 자산관리 컨설턴트', cat: 'Work Experience',
      img: null, ph: 'orange',
      overview: '주거용 및 상업용 부동산의 투자 타당성 검토, 수익성 분석, 자산관리 전략 수립 업무를 수행했습니다. 부동산 시장 동향과 임대수익 구조를 분석하여 고객 맞춤형 투자 포트폴리오를 제안하고, 데이터 중심의 자산관리 프로세스 개선에 참여했습니다.',
      cards: ['주거용 및 상업용 부동산의 투자 타당성 검토', '수익성 분석과 자산관리 전략 수립', '부동산 시장 동향과 임대수익 구조 분석 · 고객 맞춤형 투자 포트폴리오 제안', '데이터 중심의 자산관리 프로세스 개선'],
      note: NOTE_WORK
    },
    'education': {
      title: 'Master of Real Estate', org: '건국대학교 부동산대학원', orgShort: '건국대학교 부동산대학원',
      period: '2022/03/01 – 2024/02/29', role: '부동산학 석사 과정', cat: 'Educations', roleLabel: 'Degree', orgLabel: 'School',
      img: null, ph: 'teal',
      overview: '부동산 금융, 투자 분석, 도시개발, 부동산 빅데이터 및 프롭테크 비즈니스 모델 연구',
      cards: ['부동산 금융', '투자 분석', '도시개발', '부동산 빅데이터 및 프롭테크 비즈니스 모델 연구'],
      extra: { label: 'Bachelor', t: 'Bachelor of Business Administration', m: '한양대학교 경영학부 · 경영학 학사 · 2014/03/01 – 2018/02/28',
               d: '경영전략, 재무관리, 마케팅, 데이터 분석 및 부동산 투자 관련 기초 역량 습득' },
      note: NOTE_EDU
    }
  };
  const ORDER = Object.keys(DATA);
  const CHIPS = ['lime', 'pink', 'orange', 'peri'];
  const detail = $('#view-detail'), home = $('#view-home');

  const renderDetail = key => {
    const d = DATA[key];
    const tImg = document.querySelector(`.tile[href="#/${key}"] .tile__media img`);   // detail hero follows the tile photo
    const src = tImg ? tImg.getAttribute('src') : null;
    const person = tImg && tImg.classList.contains('is-person');
    const hero = src
      ? (person
        ? `<div class="d-hero d-hero--person"><img class="d-hero__bg" src="${src}" alt="" aria-hidden="true"><img class="d-hero__fg" src="${src}" alt="${esc(tImg.alt)}"></div>`
        : `<div class="d-hero"><img src="${src}" alt="${esc(tImg.alt)}" width="600" height="339"></div>`)
      : `<div class="d-hero ph ph--${d.ph}" role="img" aria-label="이미지 자리 (플레이스홀더)"><span class="ph__label mono">Image placeholder</span></div>`;
    const others = ORDER.filter(k => k !== key).map((k, i) => {
      const o = DATA[k];
      return `<a class="wcard" href="#/${k}"><span class="wcard__n">0${i + 1}</span><span class="wcard__t">${esc(o.title)}</span><span class="wcard__m">${esc(o.orgShort)} · ${esc(o.period)}</span></a>`;
    }).join('');
    detail.innerHTML = `
      <h1 class="d-h1">${esc(d.title)}</h1>
      <dl class="d-meta">
        <div><dt>${d.orgLabel || 'Company'}</dt><dd>${esc(d.org)}</dd></div>
        <div><dt>Period</dt><dd>${esc(d.period)}</dd></div>
        <div><dt>${d.roleLabel || 'Role'}</dt><dd>${esc(d.role)}</dd></div>
        <div><dt>Category</dt><dd>${esc(d.cat)}</dd></div>
      </dl>
      ${hero}
      <div class="d-rows">
        <div class="row"><h2 class="row__label">Overview</h2><div class="row__body"><p>${esc(d.overview)}</p><p class="small">${esc(d.note)}</p></div></div>
        <div class="row"><h2 class="row__label">Highlights</h2>
          <div class="cards-row"><div class="cards">${d.cards.map((c, i) =>
            `<div class="card"><span class="chip chip--${CHIPS[i]}">0${i + 1}</span><p>${esc(c)}</p></div>`).join('')}</div></div>
        </div>
        ${d.extra ? `<div class="row"><h2 class="row__label">${esc(d.extra.label)}</h2><div class="row__body"><div class="d-sub"><b>${esc(d.extra.t)}</b><span>${esc(d.extra.m)}</span><p>${esc(d.extra.d)}</p></div></div></div>` : ''}
        <div class="row"><h2 class="row__label">More</h2><div class="panel">${others}</div></div>
      </div>`;
  };

  const route = () => {
    const h = location.hash;
    if (h.startsWith('#/') && DATA[h.slice(2)]) {
      renderDetail(h.slice(2));
      home.hidden = true; detail.hidden = false;
      window.scrollTo(0, 0); hdrUpdate();
      return;
    }
    if (h === '#contact') { $('#contact').scrollIntoView({ block: 'end' }); return; }
    const wasDetail = !detail.hidden;
    home.hidden = false; detail.hidden = true;
    const target = h && h !== '#top' ? document.getElementById(h.slice(1)) : null;
    if (target && target !== home) window.scrollTo(0, target.id === 'work' ? 0 : target.getBoundingClientRect().top + window.scrollY - 40);
    else if (wasDetail || h === '#top') window.scrollTo(0, 0);
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    if (href !== location.hash) history.pushState(null, '', href);
    route();
  });
  window.addEventListener('popstate', route);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  route();
  hdrUpdate();
})();
