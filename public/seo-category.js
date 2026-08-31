(() => {
  const root = document.querySelector('[data-seo-category]');
  if (!root) return;
  const category = root.dataset.category || '';
  const grid = root.querySelector('[data-products]');
  const status = root.querySelector('[data-status]');
  if (!grid) return;

  const esc = (value) => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

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
    })
    .catch(() => {
      if (status) status.textContent = 'Catalogue preview is temporarily unavailable. Please contact us for the latest product list.';
    });
})();