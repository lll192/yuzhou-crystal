(() => {
  const root = document.querySelector('[data-seo-category]');
  if (!root) return;
  const category = root.dataset.category || '';
  const grid = root.querySelector('[data-products]');
  const status = root.querySelector('[data-status]');

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  const productById = {}; // 供详情弹窗按 id 取产品

  // Always-visible "← Home" link in the header so visitors can return from any landing page
  const headerWrap = document.querySelector('.seo-header .seo-wrap');
  if (headerWrap && !headerWrap.querySelector('.seo-home')) {
    const home = document.createElement('a');
    home.className = 'seo-home';
    home.href = '/';
    home.innerHTML = '&#8592; Home';
    headerWrap.appendChild(home);
  }

  const categoryContent = {
    trophies: {
      title: 'Choosing Custom Crystal Trophies for Corporate and Sports Recognition',
      text: 'Crystal trophies and crystal awards work well when the design needs to communicate achievement, prestige and brand identity. For a custom award, buyers can specify the silhouette, crystal or glass material, dimensions, logo treatment, engraving, base and packaging. Yuzhou Crystal supports OEM and ODM manufacturing for recognition programs, ceremonies, competitions and wholesale orders.',
      links: [['Crystal laser engraving','/crystal-laser-engraving/'],['Custom crystal products','/custom-crystal-products/'],['Crystal office & desk gifts','/crystal-office-desk-gifts/']]
    },
    figurines: {
      title: 'Custom Crystal Home Decor for Retail, Gifting and Interior Display',
      text: 'Decorative crystal products can be developed as figurines, ornaments, paperweights and other sculptural pieces for retail collections or premium gifts. Buyers can combine a reference design with custom dimensions, polishing, color effects, engraving and packaging to create a collection that fits a specific market or brand.',
      links: [['Crystal vases','/crystal-vases/'],['Crystal photo frames','/crystal-photo-frames/'],['Custom crystal products','/custom-crystal-products/']]
    },
    office: {
      title: 'Crystal Office and Desk Gifts for Corporate Programs',
      text: 'Crystal desk gifts are suited to employee recognition, executive gifts, partner programs and branded office collections. Practical formats such as paperweights, desk ornaments and commemorative pieces can be customized with logos, names, dates and presentation packaging for wholesale or corporate orders.',
      links: [['Crystal trophies & awards','/crystal-trophies/'],['Crystal home decor','/crystal-home-decor/'],['Custom crystal packaging','/custom-crystal-packaging/']]
    },
    frames: {
      title: 'Custom Crystal Photo Frames for Commemorative and Premium Gifts',
      text: 'Crystal photo frames combine a functional display format with a premium crystal presentation. Custom projects can cover frame shape, dimensions, optical clarity, logo placement, engraving and gift packaging, making them suitable for commemorative gifts, events, hospitality and retail programs.',
      links: [['Crystal office & desk gifts','/crystal-office-desk-gifts/'],['Crystal trophies & awards','/crystal-trophies/'],['Custom crystal products','/custom-crystal-products/']]
    },
    candles: {
      title: 'Crystal Candle Holders for Hospitality, Retail and Gifting',
      text: 'Crystal candle holders can be designed as decorative table accents or premium gift items. For wholesale and OEM projects, buyers can discuss dimensions, faceting, polishing, packaging and branding requirements to create a consistent collection for hospitality, retail or event use.',
      links: [['Crystal tableware & barware','/crystal-tableware-barware/'],['Crystal home decor','/crystal-home-decor/'],['Custom crystal packaging','/custom-crystal-packaging/']]
    },
    tableware: {
      title: 'Custom Crystal Tableware and Barware for Premium Presentation',
      text: 'Crystal tableware and barware can support hospitality, gifting and branded presentation with a polished, premium appearance. Custom manufacturing may include shape development, dimensions, finishing, logo treatment and packaging for restaurants, hotels, retailers and corporate programs.',
      links: [['Crystal candle holders','/crystal-candle-holders/'],['Crystal vases','/crystal-vases/'],['Custom crystal products','/custom-crystal-products/']]
    },
    perfume: {
      title: 'Crystal Perfume and Fashion Components for Luxury Packaging',
      text: 'Crystal components can add weight, optical detail and a distinctive finish to perfume packaging and fashion accessories. Custom projects can cover caps, decorative components, faceted elements, dimensions, polishing and branding for luxury product development and OEM programs.',
      links: [['Custom crystal packaging','/custom-crystal-packaging/'],['Crystal laser engraving','/crystal-laser-engraving/'],['Crystal home decor','/crystal-home-decor/']]
    },
    vases: {
      title: 'Custom Crystal Vases for Home Decor, Events and Hospitality',
      text: 'Crystal vases are suitable for premium interiors, event styling, hospitality spaces, gifting and retail collections. Custom buyers can develop the silhouette, dimensions, polishing, decorative details and packaging around a target collection or reference design, with wholesale and OEM manufacturing available.',
      links: [['Crystal home decor','/crystal-home-decor/'],['Crystal tableware & barware','/crystal-tableware-barware/'],['Custom crystal products','/custom-crystal-products/']]
    }
  };

  const addEditorialSection = () => {
    const data = categoryContent[category];
    const hero = root.querySelector('.seo-hero, .hero');
    if (!data || !hero || root.querySelector('[data-seo-editorial]')) return;
    const section = document.createElement('section');
    section.className = 'seo-section seo-editorial';
    section.dataset.seoEditorial = '';
    section.innerHTML = `<div class="wrap"><h2>${esc(data.title)}</h2><p>${esc(data.text)}</p><div class="seo-links seo-related-links">${data.links.map(([label, href]) => `<a href="${esc(href)}">${esc(label)} →</a>`).join('')}</div></div>`;
    hero.insertAdjacentElement('afterend', section);
  };

  function addStructuredData() {
    const h1 = root.querySelector('h1');
    const canonical = document.querySelector('link[rel="canonical"]');
    const name = h1 ? h1.textContent.trim() : document.title;
    const url = canonical ? canonical.href : location.href.split('#')[0];
    const descriptionNode = document.querySelector('meta[name="description"]');
    const description = descriptionNode ? descriptionNode.content : '';
    const crumbLinks = Array.from(root.querySelectorAll('.seo-crumbs a, .breadcrumbs a'));
    const breadcrumbItems = crumbLinks.map((a, i) => ({
      '@type': 'ListItem', position: i + 1, name: a.textContent.trim(), item: new URL(a.getAttribute('href'), location.origin).href
    }));
    breadcrumbItems.push({ '@type': 'ListItem', position: breadcrumbItems.length + 1, name, item: url });
    const graph = [
      { '@type': 'CollectionPage', '@id': `${url}#page`, name, url, description },
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: breadcrumbItems }
    ];
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(script);
  }

  addEditorialSection();
  addStructuredData();
  if (!grid) return;

  fetch(`/api/products?category=${encodeURIComponent(category)}&page=1&pageSize=24`, { headers: { Accept: 'application/json' } })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      rows.forEach(p => { productById[String(p.id)] = p; });
      if (status) status.remove();
      if (!rows.length) {
        grid.innerHTML = '<div class="seo-empty">Products in this collection are being updated. Contact us for the current catalogue and custom options.</div>';
        return;
      }
      if (window.YZInquiry) window.YZInquiry.register(rows);
      grid.innerHTML = rows.map(p => {
        const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name || 'Crystal product')}" loading="lazy" decoding="async">` : '<div class="seo-product-placeholder" aria-hidden="true"></div>';
        const specs = p.specs && typeof p.specs === 'object' ? Object.entries(p.specs).slice(0,2).map(([k,v]) => `${esc(k)}: ${esc(v)}`).join(' · ') : '';
        const inCart = !!(window.YZInquiry && window.YZInquiry.has(p.id));
        return `<article class="seo-product" data-yz-id="${esc(p.id)}">${image}<div class="seo-product-body"><div class="seo-product-name">${esc(p.name || 'Crystal product')}</div>${specs ? `<div class="seo-product-meta">${specs}</div>` : ''}<div class="seo-product-actions"><button type="button" class="seo-details" data-yz-view="${esc(p.id)}">Details</button><button type="button" class="seo-inquire${inCart ? ' added' : ''}" data-yz-add="${esc(p.id)}">${inCart ? 'Added ✓' : 'Inquire'}</button></div></div></article>`;
      }).join('');
      if (window.YZInquiry) window.YZInquiry.sync();

      if (!grid.dataset.yzBound) {
        grid.dataset.yzBound = '1';
        grid.addEventListener('click', (e) => {
          if (e.target.closest('[data-yz-add]')) return; // Inquire 由 YZInquiry 全局委托处理，不弹窗
          const card = e.target.closest('.seo-product');
          if (card) openYzModal(card.dataset.yzId);
        });
      }

      const canonical = document.querySelector('link[rel="canonical"]');
      const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
      const itemList = rows.map((p, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'Product', name: p.name || 'Crystal product', image: p.imageUrl || undefined, url: pageUrl }
      }));
      const productScript = document.createElement('script');
      productScript.type = 'application/ld+json';
      productScript.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name, itemListElement: itemList });
      document.head.appendChild(productScript);
    })
    .catch(() => {
      if (status) status.textContent = 'Catalogue preview is temporarily unavailable. Please contact us for the latest product list.';
    });

  /* ---------- Quick view modal（与首页 #modal 视觉一致，覆盖全部分类页） ---------- */
  const prettyCat = (c) => String(c || '').replace(/^crystal-/, '').replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  function ensureYzModal() {
    let modal = document.getElementById('yz-quickview');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'yz-modal';
    modal.id = 'yz-quickview';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '<div class="yz-modal-card"><button type="button" class="yz-modal-close" aria-label="Close">&times;</button><div class="yz-modal-body" id="yz-qv-body"></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.yz-modal-close').addEventListener('click', closeYzModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeYzModal(); });
    return modal;
  }

  function closeYzModal() {
    const modal = document.getElementById('yz-quickview');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    const drawerOpen = !!(window.YZInquiry && document.querySelector('.yz-drawer.open'));
    if (!drawerOpen) document.body.style.overflow = '';
  }

  function openYzModal(id) {
    const p = productById[String(id)] || productById[id];
    if (!p) return;
    const modal = ensureYzModal();
    const desc = p.description || p.desc || '';
    const specRows = (p.specs && typeof p.specs === 'object')
      ? Object.entries(p.specs).map(([k, v]) => `<div class="sr"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')
      : '';
    const img = p.imageUrl
      ? `<img class="yz-modal-photo" src="${esc(p.imageUrl)}" alt="${esc(p.name || 'Crystal product')}">`
      : '<div class="yz-modal-ph-placeholder" aria-hidden="true"></div>';
    const inCart = !!(window.YZInquiry && window.YZInquiry.has(p.id));
    modal.querySelector('#yz-qv-body').innerHTML = `
      <div class="yz-modal-media">${img}</div>
      <div class="yz-modal-info">
        <span class="tag">${esc(prettyCat(p.category))}</span>
        <h3>${esc(p.name || 'Crystal product')}</h3>
        ${desc ? `<p class="mdesc">${esc(desc)}</p>` : ''}
        ${specRows ? `<div class="spec-table">${specRows}</div>` : ''}
        <button type="button" class="seo-inquire yz-qv-add${inCart ? ' added' : ''}" data-yz-add="${esc(p.id)}">${inCart ? 'Added ✓' : 'Add to inquiry'}</button>
      </div>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { const m = document.getElementById('yz-quickview'); if (m && m.classList.contains('open')) closeYzModal(); }
  });
})();
