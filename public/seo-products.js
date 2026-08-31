(function(){
  const root=document.querySelector('[data-product-category]'); if(!root)return;
  const category=root.dataset.productCategory;
  const grid=document.getElementById('seo-product-grid');
  const status=document.getElementById('seo-product-status');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function load(){
    try{
      const r=await fetch('/api/products?category='+encodeURIComponent(category)+'&page=1&pageSize=24',{headers:{Accept:'application/json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json(); const rows=Array.isArray(data.rows)?data.rows:[];
      status.textContent=rows.length?rows.length+' products currently shown from the catalogue.':'Products are being added to this collection. Contact us for current availability.';
      grid.innerHTML=rows.map(p=>{
        const image=p.imageUrl?'<img loading="lazy" src="'+esc(p.imageUrl)+'" alt="'+esc(p.name)+'">':'';
        return '<article class="seo-product">'+image+'<div class="seo-product-body"><div class="seo-product-name">'+esc(p.name)+'</div>'+(p.description?'<div class="seo-product-meta">'+esc(p.description).slice(0,180)+'</div>':'')+'</div></article>';
      }).join('');
    }catch(e){status.textContent='Catalogue preview is temporarily unavailable. Please contact us for the latest product selection.';}
  }
  load();
})();