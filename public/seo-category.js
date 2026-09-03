(() => {
  const root = document.querySelector('[data-seo-category]');
  if (!root) return;
  const category = root.dataset.category || '';
  const grid = root.querySelector('[data-products]');
  const status = root.querySelector('[data-status]');

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

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
    section.innerHTML = `<h2>${esc(data.title)}</h2><p>${esc(data.text)}</p><div class="seo-links seo-related-links">${data.links.map(([label, href]) => `<a href="${esc(href)}">${esc(label)} →</a>`).join('')}</div>`;
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
      if (status) status.remove();
      if (!rows.length) {
        grid.innerHTML = '<div class="seo-empty">Products in this collection are being updated. Contact us for the current catalogue and custom options.</div>';
        return;
      }
      grid.innerHTML = rows.map(p => {
        const image = p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="${esc(p.name || 'Crystal product')}" loading="lazy" decoding="async">` : '<div class="seo-product-placeholder" aria-hidden="true"></div>';
        const specs = p.specs && typeof p.specs === 'object' ? Object.entries(p.specs).slice(0,2).map(([k,v]) => `${esc(k)}: ${esc(v)}`).join(' · ') : '';
        return `<article class="seo-product">${image}<div class="seo-product-body"><div class="seo-product-name">${esc(p.name || 'Crystal product')}</div>${specs ? `<div class="seo-product-meta">${specs}</div>` : ''}</div></article>`;
      }).join('');

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
})();
