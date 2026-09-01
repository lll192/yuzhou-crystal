(() => {
  const root = document.querySelector('[data-seo-category]');
  if (!root) return;
  const category = root.dataset.category || '';
  const grid = root.querySelector('[data-products]');
  const status = root.querySelector('[data-status]');

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  // Add machine-readable context while leaving the visual design untouched.
  function addStructuredData() {
    const h1 = root.querySelector('h1');
    const canonical = document.querySelector('link[rel="canonical"]');
    const name = h1 ? h1.textContent.trim() : document.title;
    const url = canonical ? canonical.href : location.href.split('#')[0];
    const descriptionNode = document.querySelector('meta[name="description"]');
    const description = descriptionNode ? descriptionNode.content : '';
    const crumbLinks = Array.from(root.querySelectorAll('.seo-crumbs a'));
    const breadcrumbItems = crumbLinks.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.textContent.trim(),
      item: new URL(a.getAttribute('href'), location.origin).href
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

      // Expose the visible product list as an ItemList for crawlers that execute JS.
      const canonical = document.querySelector('link[rel="canonical"]');
      const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
      const itemList = rows.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name || 'Crystal product',
          image: p.imageUrl || undefined,
          url: pageUrl
        }
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
