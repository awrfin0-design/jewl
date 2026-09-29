/* Jewl storefront runtime: theme toggle, loader, language menu, catalog, quick view,
   engraving studio, wishlist and the bag drawer (Shopify AJAX cart). */
(() => {
  const CFG = window.JewlConfig || { i18n: {}, routes: {}, currency: 'USD', locale: 'en' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const t = (k, v = {}) => String(CFG.i18n[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const intlLocale = (() => {
    const l = CFG.locale || 'en';
    return l.startsWith('ar') ? 'ar-u-nu-latn' : l;
  })();
  const money = (cents) => {
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: 'currency', currency: CFG.currency || 'USD',
        minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: cents % 100 ? 2 : 0,
      }).format(cents / 100);
    } catch (e) { return (cents / 100).toFixed(2); }
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced;
  const HEART = (on) => `<span>${on ? '♥' : '♡'}&#xFE0E;</span>`;

  /* ============ Sample pieces (shown until the store has products) ============ */
  const METALS = ['yellow', 'white', 'rose'];
  const SIZES = [[4, 14.9], [4.5, 15.3], [5, 15.7], [5.5, 16.1], [6, 16.5], [6.5, 16.9], [7, 17.3], [7.5, 17.7], [8, 18.1], [8.5, 18.5], [9, 19.0]];
  const DEMO_OPTS = { rings: SIZES.map((s) => String(s[0])), necklaces: ['40 cm', '42 cm', '45 cm'], bracelets: ['16 cm', '17 cm', '18 cm'] };
  const DEMO = [
    ['ondine', 'Ondine Solitaire', 'rings', 'aqua', '1.2 ct', 'yellow', 245000, 't_best'],
    ['maree', 'Marée Pendant', 'necklaces', 'paraiba', '0.8 ct', 'yellow', 198000],
    ['crescent', 'Tide Crescent Hoops', 'earrings', 'topaz', '0.4 ctw', 'rose', 89000],
    ['celeste', 'Céleste Tennis', 'bracelets', 'aqua', '3.1 ctw', 'white', 396000, 't_new'],
    ['signet', 'Heirloom Signet', 'rings', 'turq', '0.9 ct', 'yellow', 74000, 't_engr'],
    ['etoile', 'Petite Étoile Studs', 'earrings', 'paraiba', '0.3 ctw', 'white', 112000],
    ['nocturne', 'Nocturne Band', 'rings', 'aqua', '0.6 ctw', 'yellow', 165000, 't_engr'],
    ['azur', 'Azur Drop Necklace', 'necklaces', 'topaz', '1.5 ctw', 'white', 142000],
  ].map(([key, title, cat, stone, ct, metal, price, badgeKey]) => {
    const options = [{ name: 'metal', values: METALS, demoMetal: true }];
    if (DEMO_OPTS[cat]) options.push({ name: cat === 'rings' ? 'size' : 'length', values: DEMO_OPTS[cat], demoLabel: true });
    const sel = [metal];
    if (DEMO_OPTS[cat]) sel.push(DEMO_OPTS[cat][cat === 'rings' ? 4 : 1]);
    return { key, title, cat, stone, ct, price, badgeKey, options, variants: [], demo: true, available: true, metalIdx: 0, defaultSel: sel };
  });

  /* ============ Product model ============ */
  const METAL_NAME = /metal|métal|metall|metallo|metal|金属|地金|металл|المعدن|gold|or\b/i;
  const METAL_VAL = /yellow|white|rose|gelb|wei(ß|ss)|ros[ée]|jaune|blanc|giallo|bianco|rosa|amarillo|blanco|platin/i;
  const SIZE_NAME = /size|taille|grö(ß|ss)e|misura|talla|尺码|尺寸|サイズ|размер|مقاس/i;
  const metalKind = (v) => {
    const s = String(v).toLowerCase();
    if (/white|wei(ß|ss)|blanc|bianco|blanco|platin|белое|白/.test(s)) return 'white';
    if (/rose|rosé|rosa|розов|玫瑰|ローズ|وردي/.test(s)) return 'rose';
    return 'yellow';
  };
  const stoneOf = (raw, i) => {
    const s = String(raw || '').toLowerCase();
    if (s.includes('aqua')) return 'aqua';
    if (s.includes('para')) return 'paraiba';
    if (s.includes('topa')) return 'topaz';
    if (s.includes('turq')) return 'turq';
    return ['aqua', 'paraiba', 'topaz', 'turq'][i % 4];
  };
  const catOf = (p) => {
    const s = [p.type, ...(p.tags || [])].join(' ').toLowerCase();
    if (/earring|boucle|ohrring|orecchin|pendiente|耳|ピアス|イヤリング|серьг|قرط|أقراط/.test(s)) return 'earrings';
    if (/bracelet|armband|braccial|pulsera|手链|ブレスレット|браслет|أساور|سوار/.test(s)) return 'bracelets';
    if (/necklace|pendant|collier|halskette|anhänger|collana|collar|colgante|项链|ネックレス|колье|قلادة|قلادات/.test(s)) return 'necklaces';
    if (/ring|bague|anell|anillo|戒指|リング|кольц|خاتم|خواتم/.test(s)) return 'rings';
    return 'other';
  };
  function normalize(raw, i) {
    const p = { ...raw, demo: false };
    p.stone = stoneOf(raw.stone || (raw.tags || []).find((x) => /^stone:/i.test(x))?.slice(6), i);
    const badge = (raw.tags || []).find((x) => /^badge:/i.test(x));
    p.badge = raw.badge || (badge ? badge.slice(6).trim() : '');
    const ct = (raw.tags || []).find((x) => /^ct:/i.test(x));
    p.ct = ct ? ct.slice(3).trim() : '';
    p.stoneTagged = !!(raw.stone || (raw.tags || []).some((x) => /^stone:/i.test(x)));
    p.cat = catOf(raw);
    p.metalIdx = p.options.findIndex((o) => METAL_NAME.test(o.name) || o.values.some((v) => METAL_VAL.test(v)));
    const first = p.variants.find((v) => v.available) || p.variants[0];
    p.defaultSel = first ? [...first.options] : p.options.map((o) => o.values[0]);
    return p;
  }
  const REG = new Map();
  $$('script[data-j-products]').forEach((s) => {
    try { JSON.parse(s.textContent).forEach((raw, i) => { if (raw) REG.set(raw.key, normalize(raw, i)); }); } catch (e) {}
  });
  DEMO.forEach((p) => { if (!REG.has(p.key)) REG.set(p.key, p); });
  const byKey = (k) => REG.get(k);

  const variantFor = (p, sel) => p.variants.find((v) => v.options.every((o, i) => o === sel[i]));
  const priceFor = (p, sel) => (p.demo ? p.price : (variantFor(p, sel) || {}).price ?? p.price);
  const imgFor = (p, sel) => (p.demo ? null : (variantFor(p, sel) || {}).img || p.img);
  const availableFor = (p, sel) => (p.demo ? true : !!(variantFor(p, sel) || {}).available);
  const optLabel = (p, oi, v) => {
    if (p.options[oi].demoMetal) return t(v);
    if (oi === p.metalIdx && METAL_VAL.test(v)) return t(metalKind(v));
    return v;
  };
  const optName = (o, oi, p) => {
    if (o.demoMetal || oi === p.metalIdx) return t('metal');
    if (o.demoLabel) return t(o.name);
    if (SIZE_NAME.test(o.name)) return t('size');
    if (/length|länge|longueur|lunghezza|largo|长度|長さ|длина|الطول/i.test(o.name)) return t('length');
    return o.name;
  };
  const metalOfSel = (p, sel) => (p.metalIdx >= 0 ? (p.demo ? sel[p.metalIdx] : metalKind(sel[p.metalIdx])) : 'yellow');
  const specFor = (p, sel) => {
    if (p.demo) return `${t(p.stone)} · ${p.ct} · ${t(sel[0])}`;
    const parts = p.spec ? [p.spec] : [p.stoneTagged ? t(p.stone) : p.type, p.ct];
    if (p.metalIdx >= 0) parts.push(optLabel(p, p.metalIdx, sel[p.metalIdx]));
    return parts.filter(Boolean).join(' · ');
  };
  const BADGES = { new: 't_new', bestseller: 't_best', engravable: 't_engr' };
  const badgeFor = (p) => (p.badgeKey ? t(p.badgeKey) : BADGES[String(p.badge).toLowerCase()] ? t(BADGES[String(p.badge).toLowerCase()]) : p.badge || '');
  const phHTML = (p, sel, extra = '') => {
    const img = imgFor(p, sel);
    return `<div class="j-ph${img ? ' j-has-img' : ''}" data-stone="${p.stone}" data-metal="${metalOfSel(p, sel)}" ${extra}>${
      img ? `<img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy">` : ''
    }<span class="j-ph-initial">${esc(p.title[0])}</span></div>`;
  };

  /* ============ Theme (light / dark) ============ */
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => { const a = root.getAttribute('data-theme'); return a ? a === 'dark' : mq.matches; };
  function syncTheme() {
    const g = $('#j-theme-glyph'), b = $('#j-theme-btn');
    if (g) g.textContent = isDark() ? '☼' : '☾';
    if (b) b.setAttribute('aria-label', t(isDark() ? 'to_light' : 'to_dark'));
  }
  $('#j-theme-btn')?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('jewl-theme', next); } catch (e) {}
    syncTheme();
  });
  mq.addEventListener?.('change', syncTheme);
  syncTheme();

  /* ============ Loader: first page of each visit ============ */
  const loader = $('#j-loader');
  if (loader) {
    const t0 = performance.now(), minMs = reduced ? 400 : 2100;
    const hide = () => setTimeout(() => {
      loader.classList.add('j-done');
      try { sessionStorage.setItem('jewl-seen', '1'); } catch (e) {}
    }, Math.max(0, minMs - (performance.now() - t0)));
    document.readyState === 'complete' ? hide() : addEventListener('load', hide);
    loader.addEventListener('click', () => loader.classList.add('j-done'));
  }

  /* ============ Header: announcement height, language menu, mobile nav ============ */
  const announce = $('.j-announce');
  const setAnnounce = () => root.style.setProperty('--j-announce-h', (announce ? announce.offsetHeight : 0) + 'px');
  setAnnounce(); addEventListener('resize', setAnnounce);

  const langBtn = $('#j-lang-btn'), langMenu = $('#j-lang-menu');
  function showLang(on) {
    if (!langMenu) return;
    langMenu.hidden = !on; langBtn.setAttribute('aria-expanded', on);
    if (on) langMenu.querySelector('[aria-current="true"]')?.focus();
  }
  langBtn?.addEventListener('click', (e) => { e.stopPropagation(); showLang(langMenu.hidden); });
  document.addEventListener('click', (e) => { if (langMenu && !langMenu.hidden && !e.target.closest('.j-lang-wrap')) showLang(false); });

  const menuBtn = $('#j-menu-btn'), mnav = $('#j-mobile-nav');
  menuBtn?.addEventListener('click', () => { mnav.hidden = !mnav.hidden; menuBtn.setAttribute('aria-expanded', !mnav.hidden); });
  mnav?.addEventListener('click', (e) => { if (e.target.closest('a')) { mnav.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); } });

  /* ============ Toast ============ */
  let tId;
  function toast(msg) {
    const el = $('#j-toast'); if (!el) return;
    el.textContent = msg; el.classList.add('j-on');
    clearTimeout(tId); tId = setTimeout(() => el.classList.remove('j-on'), 2800);
  }

  /* ============ Wishlist ============ */
  const wish = new Set(store.get('jewl-wish', []));
  const catalogs = [];
  function renderWishCount() {
    const c = $('#j-wish-count'); if (!c) return;
    c.textContent = wish.size; c.hidden = !wish.size;
  }
  function toggleWish(key) {
    const p = byKey(key); if (!p) return;
    const on = !wish.has(key);
    on ? wish.add(key) : wish.delete(key);
    store.set('jewl-wish', [...wish]);
    renderWishCount(); catalogs.forEach((c) => c.render());
    if (qv.open) renderQV();
    toast(t(on ? 'toast_wish' : 'toast_unwish', { n: p.title }));
  }
  $('#j-wish-btn')?.addEventListener('click', () => {
    const c = catalogs[0];
    if (c) { c.setCat('saved'); c.el.scrollIntoView({ behavior: 'smooth' }); }
    else location.href = (CFG.routes.root || '/') + '#saved';
  });

  /* ============ Cart (Shopify AJAX API) ============ */
  const drawer = $('#j-drawer'), scrim = $('#j-scrim'), bagBtn = $('#j-bag-btn');
  let cart = null;
  async function refreshCart() {
    try {
      const r = await fetch((CFG.routes.cart || '/cart') + '.js', { headers: { Accept: 'application/json' } });
      cart = await r.json();
      renderBag();
    } catch (e) {}
  }
  async function addItems(items, name) {
    try {
      const r = await fetch((CFG.routes.cart_add || '/cart/add') + '.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.description || data.message || t('error'));
      await refreshCart();
      toast(t('toast_add', { n: name }));
      return true;
    } catch (e) { toast(e.message || t('error')); return false; }
  }
  async function changeLine(key, quantity) {
    try {
      const r = await fetch((CFG.routes.cart_change || '/cart/change') + '.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity }),
      });
      cart = await r.json(); renderBag();
    } catch (e) { toast(t('error')); }
  }
  function renderBag() {
    if (!cart) return;
    const count = cart.item_count, badge = $('#j-bag-count');
    if (badge) { badge.textContent = count; badge.hidden = !count; }
    bagBtn?.setAttribute('aria-label', `${t('bag')} (${count})`);
    const foot = $('#j-bag-foot'), body = $('#j-bag-body');
    if (!body) return;
    foot.hidden = !count;
    body.innerHTML = !count
      ? `<div class="j-empty"><span class="j-s">${esc(t('b_empty'))}</span>${esc(t('b_empty_d'))}</div>`
      : cart.items.map((i) => {
          const props = Object.entries(i.properties || {}).filter(([k, v]) => v && !k.startsWith('_')).map(([, v]) => `“${esc(v)}”`);
          const det = [i.variant_title && !/default title/i.test(i.variant_title) ? esc(i.variant_title) : '', ...props].filter(Boolean).join(' · ');
          const img = i.featured_image?.url || i.image;
          return `<div class="j-line">
            <div class="j-ph${img ? ' j-has-img' : ''}" data-stone="aqua" data-metal="yellow">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}<span class="j-ph-initial">${esc(i.product_title[0])}</span></div>
            <div><h3><a href="${esc(i.url)}" style="text-decoration:none">${esc(i.product_title)}</a></h3><small>${det}</small>
              <div class="j-qty"><button type="button" data-j-dec="${esc(i.key)}" data-q="${i.quantity - 1}" aria-label="${esc(t('b_less'))}">−</button><span class="j-num">${i.quantity}</span><button type="button" data-j-dec="${esc(i.key)}" data-q="${i.quantity + 1}" aria-label="${esc(t('b_more'))}">+</button></div></div>
            <span class="j-price j-num">${money(i.final_line_price)}</span></div>`;
        }).join('');
    const sub = $('#j-subtotal'); if (sub) sub.textContent = money(cart.total_price);
  }
  $('#j-bag-body')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-j-dec]');
    if (b) changeLine(b.dataset.jDec, Math.max(0, +b.dataset.q));
  });
  function openBag(on) {
    if (!drawer) { if (on) location.href = CFG.routes.cart || '/cart'; return; }
    if (on) {
      scrim.hidden = false;
      requestAnimationFrame(() => { scrim.classList.add('j-on'); drawer.classList.add('j-on'); });
      root.setAttribute('scroll-lock', '');
      setTimeout(() => $('#j-close-bag')?.focus(), 60);
      refreshCart();
    } else {
      scrim.classList.remove('j-on'); drawer.classList.remove('j-on');
      root.removeAttribute('scroll-lock');
      setTimeout(() => { scrim.hidden = true; }, 350);
      bagBtn?.focus();
    }
    drawer.setAttribute('aria-hidden', !on);
  }
  bagBtn?.addEventListener('click', () => openBag(true));
  $('#j-close-bag')?.addEventListener('click', () => openBag(false));
  scrim?.addEventListener('click', () => openBag(false));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (langMenu && !langMenu.hidden) { showLang(false); langBtn.focus(); }
    if (drawer?.classList.contains('j-on')) openBag(false);
  });
  // Adds made by Horizon's own product pages and quick-add modal
  document.addEventListener('shopify:cart:lines-update', (e) => {
    const done = () => { refreshCart(); if (e.action === 'add') setTimeout(() => openBag(true), 120); };
    e.promise ? e.promise.then(done, () => {}) : setTimeout(done, 600);
  });
  refreshCart();

  /* ============ Quick view ============ */
  const qv = $('#j-qv') || { open: false };
  const qvState = { key: null, sel: [] };
  function openQV(key, sel) {
    const p = byKey(key); if (!p || !qv.showModal) return;
    qvState.key = key; qvState.sel = [...(sel || p.defaultSel)];
    renderQV(); qv.showModal();
  }
  function renderQV() {
    const p = byKey(qvState.key), sel = qvState.sel, w = wish.has(p.key);
    const mediaWrap = $('#j-qv-media');
    mediaWrap.innerHTML = phHTML(p, sel);
    const ok = availableFor(p, sel);
    const catLabel = p.cat !== 'other' ? t(p.cat) : '';
    const sizeIdx = p.options.findIndex((o) => o.name === 'size' || SIZE_NAME.test(o.name));
    const mm = sizeIdx >= 0 ? (SIZES.find((s) => String(s[0]) === String(parseFloat(sel[sizeIdx]))) || [])[1] : null;
    const optionsHTML = p.options.map((o, oi) => {
      if (o.values.length < 2 && !o.demoMetal) return '';
      const isMetal = oi === p.metalIdx;
      const label = esc(optName(o, oi, p));
      const grid = !isMetal && o.values.length > 5 ? 'j-sizes' : 'j-opts';
      return `<div class="j-field"><span class="j-eyebrow" style="color:var(--j-muted)">${label}</span>
        <div class="${grid}">${o.values.map((v) => {
          const probe = [...sel]; probe[oi] = v;
          const dis = !p.demo && !variantFor(p, probe) ? 'disabled' : '';
          return `<label class="j-opt"><input type="radio" name="j-qvo-${oi}" value="${esc(v)}" data-oi="${oi}" ${v === sel[oi] ? 'checked' : ''} ${dis}><span class="j-num">${isMetal ? `<i class="j-dot" style="background:var(--j-g-${p.demo ? v : metalKind(v)})"></i>` : ''}${esc(optLabel(p, oi, v))}</span></label>`;
        }).join('')}</div>
        ${oi === sizeIdx && mm ? `<span class="j-readout j-num">${esc(t('e_mm', { s: parseFloat(sel[sizeIdx]), mm: mm.toFixed(1) }))}</span>` : ''}</div>`;
    }).join('');
    $('#j-qv-info').innerHTML = `
      <button class="j-x" type="button" data-j-close aria-label="${esc(t('close'))}">×</button>
      <div><div class="j-eyebrow">${esc([catLabel, badgeFor(p)].filter(Boolean).join(' · '))}</div>
        <h2 style="margin-top:10px">${esc(p.title)}</h2>
        <p class="j-spec">${esc(specFor(p, sel))}</p></div>
      <div class="j-price j-num">${money(priceFor(p, sel))}</div>
      ${optionsHTML}
      ${p.cat === 'earrings' ? `<div class="j-made" style="color:var(--j-muted)">${esc(t('pair'))}</div>` : ''}
      ${p.cat !== 'other' ? `<p class="j-desc">${esc(t('d_' + p.cat))}</p>` : ''}
      <div class="j-qv-actions"><button class="j-btn j-btn-gold" type="button" data-j-qvadd ${ok ? '' : 'disabled'}>${esc(ok ? t('add') : t('sold_out'))}</button>
        <button class="j-heart" type="button" data-j-wish="${esc(p.key)}" aria-pressed="${w}" aria-label="${esc(t(w ? 'wish_rm' : 'wish_add'))}">${HEART(w)}</button></div>
      <div class="j-made">${esc(t('made'))}</div>
      ${p.url ? `<a class="j-qv-link" href="${esc(p.url)}">${esc(t('view_product'))}</a>` : ''}`;
  }
  if (qv.showModal) {
    $('#j-qv-info').addEventListener('change', (e) => {
      const oi = e.target.dataset.oi; if (oi == null) return;
      qvState.sel[+oi] = e.target.value; renderQV();
    });
    $('#j-qv-info').addEventListener('click', async (e) => {
      if (e.target.closest('[data-j-close]')) qv.close();
      if (e.target.closest('[data-j-qvadd]')) {
        const p = byKey(qvState.key);
        if (p.demo) { toast(t('demo')); return; }
        const v = variantFor(p, qvState.sel);
        if (v && (await addItems([{ id: v.id, quantity: 1 }], p.title))) qv.close();
      }
    });
    qv.addEventListener('click', (e) => { if (e.target === qv) qv.close(); });
  }

  /* ============ Catalog ============ */
  class Catalog {
    constructor(el) {
      this.el = el;
      let list = [];
      try { list = JSON.parse($('script[data-j-products]', el)?.textContent || '[]').filter(Boolean).map((r) => REG.get(r.key)); } catch (e) {}
      this.items = list.length ? list : DEMO;
      this.cat = location.hash === '#saved' ? 'saved' : 'all';
      this.sort = 'feat';
      this.sel = {};
      this.grid = $('.j-grid', el); this.filters = $('.j-filters', el); this.sortEl = $('select', el); this.showing = $('.j-showing', el);
      this.sortEl.innerHTML = ['feat', 'low', 'high'].map((s) => `<option value="${s}">${esc(t('sort_' + s))}</option>`).join('');
      this.sortEl.addEventListener('change', (e) => { this.sort = e.target.value; this.renderGrid(); });
      this.filters.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) this.setCat(b.dataset.cat); });
      el.addEventListener('click', (e) => this.onClick(e));
      if (fine) tilt(this.grid, '.j-tilt', 9);
      this.render();
    }
    selOf(p) { return this.sel[p.key] || p.defaultSel; }
    setCat(c) { this.cat = c; this.render(); }
    render() { this.renderFilters(); this.renderGrid(); }
    renderFilters() {
      const cats = ['all', ...['rings', 'necklaces', 'earrings', 'bracelets'].filter((c) => this.items.some((p) => p.cat === c)), 'saved'];
      this.filters.innerHTML = cats.map((c) => `<button class="j-chip" type="button" data-cat="${c}" aria-pressed="${c === this.cat}">${
        c === 'saved' ? '♡&#xFE0E; ' + esc(t('saved')) : esc(t(c))}${c === 'saved' && wish.size ? `<span class="j-count j-num">${wish.size}</span>` : ''}</button>`).join('');
    }
    renderGrid() {
      let list = this.items.filter((p) => this.cat === 'all' || (this.cat === 'saved' ? wish.has(p.key) : p.cat === this.cat));
      if (this.sort === 'low') list = [...list].sort((a, b) => priceFor(a, this.selOf(a)) - priceFor(b, this.selOf(b)));
      if (this.sort === 'high') list = [...list].sort((a, b) => priceFor(b, this.selOf(b)) - priceFor(a, this.selOf(a)));
      this.showing.textContent = t('showing', { n: list.length });
      if (!list.length) { this.grid.innerHTML = `<div class="j-empty-grid"><span class="j-s">♡&#xFE0E;</span>${esc(t('no_saved'))}</div>`; return; }
      this.grid.innerHTML = list.map((p, i) => this.card(p, i)).join('');
    }
    card(p, i) {
      const sel = this.selOf(p), w = wish.has(p.key), ok = availableFor(p, sel);
      const metals = p.metalIdx >= 0 ? p.options[p.metalIdx].values : [];
      return `<article class="j-card" style="--j-d:${i}" data-key="${esc(p.key)}">
        <div class="j-card-media"><div class="j-tilt">
          ${phHTML(p, sel, `data-j-qv="${esc(p.key)}" aria-hidden="true"`)}
          ${ok ? '' : `<span class="j-sold">${esc(t('sold_out'))}</span>`}
          <div class="j-actions"><button type="button" data-j-qv="${esc(p.key)}">${esc(t('quick'))}</button><button type="button" data-j-add="${esc(p.key)}" ${ok ? '' : 'disabled'}>${esc(t('add'))}</button></div>
        </div></div>
        <div class="j-card-info">
          <div class="j-card-tag">${esc(badgeFor(p))}</div>
          <div class="j-card-row"><h3><button type="button" data-j-qv="${esc(p.key)}">${esc(p.title)}</button></h3>
            <button class="j-heart" type="button" data-j-wish="${esc(p.key)}" aria-pressed="${w}" aria-label="${esc(t(w ? 'wish_rm' : 'wish_add'))}">${HEART(w)}</button></div>
          <div class="j-card-spec">${esc(specFor(p, sel))}</div>
          <div class="j-card-row"><span class="j-price j-num">${money(priceFor(p, sel))}</span>
            ${metals.length > 1 ? `<div class="j-swatches" role="group" aria-label="${esc(t('metal'))}">${metals.map((m) =>
              `<button class="j-sw" type="button" data-j-sw="${esc(m)}" aria-pressed="${m === sel[p.metalIdx]}" aria-label="${esc(optLabel(p, p.metalIdx, m))}" style="--j-sw:var(--j-g-${p.demo ? m : metalKind(m)})"></button>`).join('')}</div>` : ''}</div>
        </div></article>`;
    }
    onClick(e) {
      const card = e.target.closest('.j-card');
      const q = e.target.closest('[data-j-qv]');
      if (q) { const p = byKey(q.dataset.jQv); openQV(p.key, this.selOf(p)); return; }
      const a = e.target.closest('[data-j-add]');
      if (a) {
        const p = byKey(a.dataset.jAdd), sel = this.selOf(p);
        if (p.demo) { toast(t('demo')); return; }
        const needsChoice = p.options.some((o, oi) => oi !== p.metalIdx && o.values.length > 1);
        if (needsChoice) { openQV(p.key, sel); return; }
        const v = variantFor(p, sel); if (v) addItems([{ id: v.id, quantity: 1 }], p.title);
        return;
      }
      const sw = e.target.closest('[data-j-sw]');
      if (sw && card) {
        const p = byKey(card.dataset.key), sel = [...this.selOf(p)];
        sel[p.metalIdx] = sw.dataset.jSw;
        if (!p.demo && !variantFor(p, sel)) {
          const v = p.variants.find((x) => x.options[p.metalIdx] === sw.dataset.jSw);
          if (v) sel.splice(0, sel.length, ...v.options);
        }
        this.sel[p.key] = sel;
        card.outerHTML = this.card(p, 0).replace('--j-d:0', '--j-d:0;animation:none');
      }
    }
  }
  document.addEventListener('click', (e) => {
    const w = e.target.closest('[data-j-wish]'); if (w) { toggleWish(w.dataset.jWish); return; }
    const go = e.target.closest('[data-j-go]');
    if (go && catalogs[0]) {
      e.preventDefault();
      catalogs[0].setCat(go.dataset.jGo);
      catalogs[0].el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const hq = e.target.closest('[data-j-hero-qv]');
    if (hq) openQV(hq.dataset.jHeroQv);
  });

  /* Tilt, plus a highlight that follows the pointer */
  function tilt(rootEl, sel, amt) {
    rootEl.addEventListener('pointermove', (e) => {
      const el = e.target.closest(sel); if (!el) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `rotateY(${(x - 0.5) * amt}deg) rotateX(${(0.5 - y) * amt}deg)`;
      const p = el.querySelector('.j-ph') || el;
      p.style.setProperty('--j-mx', x * 100 + '%'); p.style.setProperty('--j-my', y * 100 + '%');
    });
    rootEl.addEventListener('pointerout', (e) => {
      const el = e.target.closest(sel); if (el && !el.contains(e.relatedTarget)) el.style.transform = '';
    });
  }
  $$('[data-j-catalog]').forEach((el) => catalogs.push(new Catalog(el)));
  $$('.j-hero-piece').forEach((el) => { if (fine) tilt(el, '.j-arch-btn', 7); });
  renderWishCount();

  /* ============ Engraving studio ============ */
  $$('[data-j-studio]').forEach((sec) => {
    let conf = {};
    try { conf = JSON.parse($('script[data-j-studio-config]', sec).textContent); } catch (e) {}
    const band = conf.band ? normalize(conf.band, 0) : null;
    const feePrice = conf.fee ? conf.fee.price : 4500;
    const form = $('form', sec), ins = $('.j-text-input', sec), sizes = $('.j-sizes', sec);
    sizes.innerHTML = SIZES.map(([s]) => `<label class="j-opt"><input type="radio" name="size" id="j-size-${String(s).replace('.', '-')}-${sec.id}" value="${s}" ${s === 6 ? 'checked' : ''}><span>${s}</span></label>`).join('');
    const state = () => { const f = new FormData(form); return { text: ins.value.trim(), font: f.get('font'), metal: f.get('metal'), size: f.get('size') }; };
    const bandVariant = (s) => band && band.variants.find((v) => {
      const hasMetal = band.metalIdx < 0 || metalKind(v.options[band.metalIdx]) === s.metal;
      const hasSize = v.options.some((o) => parseFloat(o) === parseFloat(s.size));
      return hasMetal && hasSize;
    });
    const bandPrice = (s) => (band ? (bandVariant(s) || {}).price ?? band.price : 165000);
    function render() {
      const s = state(), mm = SIZES.find((x) => String(x[0]) === s.size)[1];
      const engr = $('.j-engr', sec);
      engr.textContent = s.text || t('e_ph'); engr.classList.toggle('j-engr-empty', !s.text); engr.dataset.font = s.font;
      $('.j-band', sec).dataset.metal = s.metal; $('.j-stage', sec).dataset.metal = s.metal;
      $('.j-hall-size', sec).textContent = `US ${s.size}`;
      $('.j-counter', sec).textContent = `${ins.value.length} / ${ins.maxLength}`;
      $('.j-readout', sec).textContent = t('e_mm', { s: s.size, mm: mm.toFixed(1) });
      const fee = s.text ? feePrice : 0;
      $('.j-studio-price', sec).textContent = money(bandPrice(s) + fee);
      $('.j-breakdown', sec).textContent = t('e_break', { band: money(bandPrice(s)), eng: money(fee) });
    }
    form.addEventListener('input', render);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = state();
      if (!band) { toast(t('demo')); return; }
      const v = bandVariant(s);
      if (!v || !v.available) { toast(t('sold_out')); return; }
      const items = [{ id: v.id, quantity: 1, properties: s.text ? { Engraving: s.text, Lettering: t('e_' + s.font) } : {} }];
      if (s.text && conf.fee) items.push({ id: conf.fee.id, quantity: 1 });
      addItems(items, band.title);
    });
    render();
    document.fonts?.ready?.then(render);
  });

  /* ============ Horizon hooks ============ */
  window.Jewl = { openBag: () => openBag(true), refreshCart, toast };
  const hookActions = () => {
    const actions = window.Shopify?.actions;
    try { actions?.openCart?.configure({ handler: async () => openBag(true) }); } catch (e) {}
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', hookActions, { once: true }) : hookActions();
  if (location.hash === '#saved' && catalogs[0]) catalogs[0].el.scrollIntoView();
})();
