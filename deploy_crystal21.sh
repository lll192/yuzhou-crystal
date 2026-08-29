#!/usr/bin/env bash
# 宇洲水晶询盘站：一键应用 21 分类补丁（自动定位项目目录并重建容器）
set -u
echo "== [1/5] 写入补丁文件 =="
cat > /tmp/crystal21.patch <<'PATCH_EOF'
--- a/public/admin.html
+++ b/public/admin.html
@@ -141,9 +141,26 @@
         <select id="p-cat">
           <option value="">全部分类</option>
           <option value="trophies">水晶奖杯</option>
-          <option value="candles">烛台</option>
-          <option value="frames">相框</option>
-          <option value="ornaments">摆件</option>
+          <option value="office">办公用品</option>
+          <option value="watch-stones">水晶表钻</option>
+          <option value="tableware">水晶餐具</option>
+          <option value="lighting">灯饰配件</option>
+          <option value="vases">水晶花瓶</option>
+          <option value="wine-stoppers">酒瓶塞</option>
+          <option value="wood-medals">木奖牌</option>
+          <option value="inner-carving">水晶内雕</option>
+          <option value="jewelry-boxes">首饰盒</option>
+          <option value="perfume">水晶香水瓶</option>
+          <option value="figurines">小动物花</option>
+          <option value="smoking">水晶烟具</option>
+          <option value="candles">水晶烛台</option>
+          <option value="ornaments">装饰品</option>
+          <option value="bracelets">水晶手链</option>
+          <option value="paperweights">水晶镇纸</option>
+          <option value="frames">水晶相框</option>
+          <option value="medals">水晶奖牌</option>
+          <option value="glass-medals">玻璃奖牌</option>
+          <option value="lamps">水晶台灯</option>
         </select>
         <input type="search" id="p-q" placeholder="搜索产品名称…">
         <button class="btn primary" id="p-new">+ 新增产品</button>
@@ -175,7 +192,7 @@
           <form id="prod-form">
             <div class="field" style="margin-bottom:12px"><label>产品名称 *</label><input name="name" style="width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;font:inherit"></div>
             <div class="field" style="margin-bottom:12px"><label>分类</label><select name="category" style="width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;font:inherit">
-              <option value="trophies">水晶奖杯</option><option value="candles">烛台</option><option value="frames">相框</option><option value="ornaments">摆件</option>
+              <option value="trophies">水晶奖杯</option><option value="office">办公用品</option><option value="watch-stones">水晶表钻</option><option value="tableware">水晶餐具</option><option value="lighting">灯饰配件</option><option value="vases">水晶花瓶</option><option value="wine-stoppers">酒瓶塞</option><option value="wood-medals">木奖牌</option><option value="inner-carving">水晶内雕</option><option value="jewelry-boxes">首饰盒</option><option value="perfume">水晶香水瓶</option><option value="figurines">小动物花</option><option value="smoking">水晶烟具</option><option value="candles">水晶烛台</option><option value="ornaments">装饰品</option><option value="bracelets">水晶手链</option><option value="paperweights">水晶镇纸</option><option value="frames">水晶相框</option><option value="medals">水晶奖牌</option><option value="glass-medals">玻璃奖牌</option><option value="lamps">水晶台灯</option>
             </select></div>
             <div class="field" style="margin-bottom:12px"><label>描述</label><textarea name="description" rows="3" style="width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;font:inherit"></textarea></div>
             <div class="field" style="margin-bottom:12px"><label>规格参数（每行 Key: Value）</label><textarea name="specs" rows="4" placeholder="Material: K9 optical crystal&#10;Size: H 20 cm&#10;MOQ: 100 pcs" style="width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;font:inherit"></textarea></div>
@@ -400,7 +417,7 @@
   function debounce(fn,ms){ var t; return function(){ clearTimeout(t); t=setTimeout(fn,ms); }; }
 
   /* ---------- 产品管理 ---------- */
-  var CAT_ZH = { trophies:'水晶奖杯', candles:'烛台', frames:'相框', ornaments:'摆件' };
+  var CAT_ZH = { trophies:'水晶奖杯', office:'办公用品', 'watch-stones':'水晶表钻', tableware:'水晶餐具', lighting:'灯饰配件', vases:'水晶花瓶', 'wine-stoppers':'酒瓶塞', 'wood-medals':'木奖牌', 'inner-carving':'水晶内雕', 'jewelry-boxes':'首饰盒', perfume:'水晶香水瓶', figurines:'小动物花', smoking:'水晶烟具', candles:'水晶烛台', ornaments:'装饰品', bracelets:'水晶手链', paperweights:'水晶镇纸', frames:'水晶相框', medals:'水晶奖牌', 'glass-medals':'玻璃奖牌', lamps:'水晶台灯' };
   function switchTab(name){
     document.querySelectorAll('.tab').forEach(function(t){ t.classList.toggle('active', t.dataset.tab===name); });
     show(document.getElementById('inquiries-section'), name==='inquiries');
--- a/public/index.html
+++ b/public/index.html
@@ -149,30 +149,40 @@
 /* =========================================================
    Categories — editorial tiles
    ========================================================= */
-.cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
+.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: 22px; }
 .cat { position: relative; display: flex; flex-direction: column; }
 .cat-media { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--r-card);
   background: linear-gradient(180deg, var(--studio-1), var(--studio-2)); display: grid; place-items: center; border: 1px solid var(--line-2); }
-.cat-media .art { width: 74%; height: 74%; transition: transform .5s var(--ease); }
+.cat-media .art { width: 70%; height: 70%; transition: transform .5s var(--ease); }
 .cat:hover .cat-media .art { transform: translateY(-6px) scale(1.04); }
-.cat-body { padding: 20px 2px 0; }
-.cat-body h3 { font-size: 21px; color: var(--ink); line-height: 1.15; }
-.cat-body p { margin: 8px 0 0; font-size: 13px; color: var(--muted); line-height: 1.55; }
-.cat .go { display: inline-flex; align-items: center; gap: 7px; margin-top: 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink); }
+.cat-body { padding: 16px 2px 0; }
+.cat-body h3 { font-size: 19px; color: var(--ink); line-height: 1.15; }
+.cat-zh { display: inline-block; margin-top: 3px; font-size: 13px; color: var(--brand); font-weight: 600; letter-spacing: .02em; }
+.cat-body p { margin: 7px 0 0; font-size: 12.5px; color: var(--muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
+.cat .go { display: inline-flex; align-items: center; gap: 7px; margin-top: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink); }
 .cat .go svg { width: 14px; height: 14px; transition: transform .25s var(--ease); }
 .cat:hover .go svg { transform: translateX(4px); }
-@media (max-width: 940px) { .cat-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
-@media (max-width: 520px) { .cat-grid { grid-template-columns: 1fr 1fr; gap: 14px; } .cat-body h3 { font-size: 17px; } }
+@media (max-width: 940px) { .cat-grid { gap: 18px; } }
+@media (max-width: 520px) { .cat-grid { gap: 14px; } .cat-body h3 { font-size: 17px; } }
 
 /* =========================================================
    Products
    ========================================================= */
 .products { background: var(--bg-warm); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
-.filters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 44px; }
-.filter { border: 1px solid var(--line); background: #fff; color: var(--ink-2); padding: 10px 20px; border-radius: var(--r-pill);
-  font-size: 11.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; transition: all .2s var(--ease); }
+.filters { display: flex; gap: 8px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 8px; margin-bottom: 36px;
+  scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
+.filters::-webkit-scrollbar { height: 6px; }
+.filters::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
+.filter { flex: 0 0 auto; scroll-snap-align: start; white-space: nowrap; border: 1px solid var(--line); background: #fff; color: var(--ink-2); padding: 10px 18px; border-radius: var(--r-pill);
+  font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; transition: all .2s var(--ease); }
 .filter:hover { border-color: var(--ink); color: var(--ink); }
 .filter.active { background: var(--ink); color: #fff; border-color: var(--ink); }
+.prod-tools { margin-bottom: 8px; }
+.p-search { display: block; width: 100%; max-width: 440px; margin: 0 auto 18px; padding: 12px 18px; border: 1px solid var(--line); border-radius: var(--r-pill);
+  background: #fff; font: inherit; font-size: 14px; color: var(--ink); transition: border-color .2s var(--ease), box-shadow .2s var(--ease); }
+.p-search::placeholder { color: var(--faint); }
+.p-search:focus { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgba(31,42,212,.12); }
+.empty-cat { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--muted); font-size: 15px; }
 .prod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
 @media (max-width: 940px) { .prod-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
 @media (max-width: 520px) { .prod-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
@@ -527,7 +537,7 @@
       <div class="hero-copy">
         <span class="eyebrow">Crystal &amp; glass atelier · since the Canton Fair years</span>
         <h1>Crystal gifts,<br>cut to <em>win the order</em>.</h1>
-        <p class="lead">Awards, candle holders, frames and ornaments — made in our own Pujiang workshop for gift importers worldwide. Low MOQ, custom engraving, export-ready packaging.</p>
+        <p class="lead">From crystal awards to home décor — made in our own Pujiang workshop for gift importers worldwide. Low MOQ, custom engraving, export-ready packaging.</p>
         <div class="hero-cta">
           <a class="btn btn-ghost" href="#products">Explore the catalogue
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
@@ -576,8 +586,8 @@
     <div class="wrap">
       <div class="sec-head reveal">
         <span class="eyebrow">Collections</span>
-        <h2 class="h-sec">Four crystal lines, one reliable maker.</h2>
-        <p>Each line is produced in-house and built for re-orders. Choose a collection to open the full catalogue.</p>
+        <h2 class="h-sec">21 crystal collections, one reliable maker.</h2>
+        <p>Every collection is produced in-house and built for re-orders. Pick one to open its full catalogue.</p>
       </div>
       <div class="cat-grid" id="cat-grid"></div>
     </div>
@@ -591,7 +601,10 @@
         <h2 class="h-sec">Browse our most reordered crystal pieces.</h2>
         <p>Studio renders below. Select the models you like, then send a single inquiry for a complete quotation.</p>
       </div>
-      <div class="filters" id="filters"></div>
+      <div class="prod-tools">
+        <input type="search" id="p-search" class="p-search" placeholder="Search products, materials, MOQ…" aria-label="Search products">
+        <div class="filters" id="filters"></div>
+      </div>
       <div class="prod-grid" id="prod-grid"></div>
     </div>
   </section>
@@ -636,7 +649,7 @@
           </div>
           <div class="row-2">
             <div class="field"><label>Product type</label>
-              <select name="ptype"><option value="">No preference</option><option>Awards &amp; Trophies</option><option>Candle Holders</option><option>Photo Frames</option><option>Ornaments &amp; Paperweights</option><option>Other</option></select>
+              <select name="ptype"><option value="">No preference</option><option>Crystal Awards &amp; Trophies</option><option>Office &amp; Desk Supplies</option><option>Crystal Watch Stones</option><option>Crystal Tableware</option><option>Lighting Accessories</option><option>Crystal Vases</option><option>Wine Stoppers</option><option>Wooden Medals</option><option>Crystal Inner Carving</option><option>Jewelry Boxes</option><option>Crystal Perfume Bottles</option><option>Animal &amp; Flower Figurines</option><option>Crystal Smoking Sets</option><option>Crystal Candle Holders</option><option>Ornaments &amp; Paperweights</option><option>Crystal Bracelets</option><option>Crystal Paperweights</option><option>Crystal Photo Frames</option><option>Crystal Medals</option><option>Glass Medals</option><option>Crystal Table Lamps</option><option>Other</option></select>
             </div>
             <div class="field"><label>Preferred size</label><input name="size" placeholder="e.g. H 18 cm / 5×7 in"></div>
           </div>
@@ -721,7 +734,7 @@
       <div class="about-copy reveal">
         <span class="eyebrow">About us</span>
         <h2>Made in Pujiang,<br>China's crystal town.</h2>
-        <p>Yuzhou Crystal Co., Ltd. is a crystal and glass craft manufacturer based in Pujiang, Zhejiang — a region known across China for optical-crystal craftsmanship. We supply gift importers, promotional-product companies and event organisers with awards, candle holders, frames and ornaments.</p>
+        <p>Yuzhou Crystal Co., Ltd. is a crystal and glass craft manufacturer based in Pujiang, Zhejiang — a region known across China for optical-crystal craftsmanship. We supply gift importers, promotional-product companies and event organisers with crystal gifts, awards and home décor across more than 20 collections.</p>
         <p>Our team has grown alongside the Canton Fair. We know what overseas buyers need: clear quotations, honest lead times, dependable packaging, and pieces that arrive exactly as sampled.</p>
         <div class="about-points">
           <div class="ap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> Factory-direct pricing</div>
@@ -757,7 +770,7 @@
             </svg>
             <span class="bname"><b>YUZHOU CRYSTAL</b><span>Crystal Manufacturer</span></span>
           </a>
-          <p>Crystal &amp; glass craft manufacturer in Pujiang, China. Awards, candle holders, frames and ornaments for importers worldwide.</p>
+          <p>Crystal &amp; glass craft manufacturer in Pujiang, China. 20+ crystal collections for importers worldwide.</p>
         </div>
         <div class="foot-col">
           <h4>Collections</h4>
@@ -777,7 +790,7 @@
       </div>
       <div class="foot-bottom">
         <span>© <span id="year">2026</span> Yuzhou Crystal Co., Ltd. All rights reserved.</span>
-        <span>Awards · Candle holders · Frames · Ornaments</span>
+        <span>21 crystal collections · one reliable maker</span>
       </div>
     </div>
   </footer>
@@ -957,17 +970,79 @@
     <path d="M158 96 L138 232 M158 96 L182 232 M116 150 L160 176 L214 138" stroke="#fff" stroke-opacity=".3" stroke-width="1.3" fill="none"/>
     <polygon points="132,150 142,150 138,196 130,190" fill="#fff" opacity=".4"/>`
 };
-const CAT_ART = { trophies: 'tr-faceted-peak', candles: 'cd-prism-taper', frames: 'fr-bevel-57', ornaments: 'or-iceberg' };
+const CAT_PALETTE = [
+  ['#8fd0ec', '#3f8fb5'], ['#9fe0d2', '#3aa593'], ['#c4a6e8', '#7b54b0'],
+  ['#f0b3c8', '#c96a8e'], ['#f3d59a', '#cf9a3e'], ['#a8d8a0', '#5aa15a'],
+  ['#aebfd6', '#5f7596'], ['#f1b48a', '#cf7a3e']
+];
+function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
+// 参数化生成水晶图标：21 个类别共用一套画法，按 id 取色与造型，保证视觉统一且零手绘成本
+let catArtSeq = 0;
+function catArtSvg(id){
+  const pal = CAT_PALETTE[hashStr(id) % CAT_PALETTE.length];
+  const v = hashStr(id + 'shape') % 5;
+  const uid = 'cg' + (++catArtSeq);
+  const gems = [
+    'M160 64 L208 150 L160 256 L112 150 Z',
+    'M160 58 L206 138 L188 256 L132 256 L114 138 Z',
+    'M116 150 L160 64 L204 150 L204 200 L160 256 L116 200 Z',
+    'M160 60 L200 128 L182 256 L138 256 L120 128 Z',
+    'M160 60 L198 110 L198 200 L160 256 L122 200 L122 110 Z'
+  ];
+  const gem = gems[v];
+  return `<svg class="art" viewBox="0 0 320 320" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
+    <defs><linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient></defs>
+    <ellipse cx="160" cy="268" rx="72" ry="12" fill="#1c2740" opacity=".12"/>
+    <path d="${gem}" fill="url(#${uid})" opacity=".94"/>
+    <path d="M160 60 L160 256 M112 150 L208 150" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="1.4"/>
+    <path d="${gem}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="1"/>
+  </svg>`;
+}
 
+// 21 个产品类别（单一事实来源；id 与后台 products.category 字段一致，向后兼容旧 4 类）
 const CATEGORIES = [
-  { id: 'trophies', name: 'Crystal Awards & Trophies', short: 'Awards',
-    blurb: 'Faceted optical-crystal awards for corporate recognition, sport and events, with deep 3D or 2D sub-surface engraving.' },
-  { id: 'candles', name: 'Crystal Candle Holders', short: 'Candle Holders',
-    blurb: 'Tealight and taper holders with hand-polished bevels that scatter warm light — a steady line for home and hospitality.' },
-  { id: 'frames', name: 'Crystal Photo Frames', short: 'Photo Frames',
-    blurb: 'Bevelled glass and crystal frames for weddings, anniversaries and promotional gifts, in multiple aperture sizes.' },
-  { id: 'ornaments', name: 'Crystal Ornaments & Paperweights', short: 'Ornaments',
-    blurb: 'Desk pieces, paperweights and figurines in high-clarity crystal — ideal for branded corporate and tourism gifts.' }
+  { id: 'trophies', name: 'Crystal Awards & Trophies', zh: '水晶奖杯', short: 'Awards',
+    blurb: 'Faceted optical-crystal awards for corporate, sport and event recognition, with deep 2D/3D engraving.' },
+  { id: 'office', name: 'Office & Desk Supplies', zh: '办公用品', short: 'Office',
+    blurb: 'Crystal pens, name blocks and desktop gifts that turn everyday office items into keepsakes.' },
+  { id: 'watch-stones', name: 'Crystal Watch Stones', zh: '水晶表钻', short: 'Watch Stones',
+    blurb: 'Precision-cut crystal chatons and watch stones for jewellery and accessory assembly.' },
+  { id: 'tableware', name: 'Crystal Tableware', zh: '水晶餐具', short: 'Tableware',
+    blurb: 'Crystal bowls, plates and serving pieces for hospitality and premium gifting.' },
+  { id: 'lighting', name: 'Lighting Accessories', zh: '灯饰配件', short: 'Lighting',
+    blurb: 'Crystal prisms, pendants and components for chandeliers and light fixtures.' },
+  { id: 'vases', name: 'Crystal Vases', zh: '水晶花瓶', short: 'Vases',
+    blurb: 'Hand-cut crystal vases from bud vases to statement centrepieces.' },
+  { id: 'wine-stoppers', name: 'Wine Stoppers', zh: '酒瓶塞', short: 'Wine Stoppers',
+    blurb: 'Crystal-topped wine stoppers and pourers for the drinks and gift trade.' },
+  { id: 'wood-medals', name: 'Wooden Medals', zh: '木奖牌', short: 'Wood Medals',
+    blurb: 'Wood-and-crystal hybrid medals combining warm timber with engraved crystal plates.' },
+  { id: 'inner-carving', name: 'Crystal Inner Carving', zh: '水晶内雕', short: 'Inner Carving',
+    blurb: 'Sub-surface 3D laser engraving inside solid crystal — logos, skylines and portraits.' },
+  { id: 'jewelry-boxes', name: 'Jewelry Boxes', zh: '首饰盒', short: 'Jewelry Boxes',
+    blurb: 'Crystal and crystal-lidded jewellery boxes for retail and personal gifting.' },
+  { id: 'perfume', name: 'Crystal Perfume Bottles', zh: '水晶香水瓶', short: 'Perfume',
+    blurb: 'Faceted crystal perfume and scent bottles for fragrance and cosmetics brands.' },
+  { id: 'figurines', name: 'Animal & Flower Figurines', zh: '小动物花', short: 'Figurines',
+    blurb: 'Crystal animals, blooms and miniature figurines — best-selling tourism and desk gifts.' },
+  { id: 'smoking', name: 'Crystal Smoking Sets', zh: '水晶烟具', short: 'Smoking',
+    blurb: 'Crystal ashtrays and smoking accessories with polished, gift-grade finishes.' },
+  { id: 'candles', name: 'Crystal Candle Holders', zh: '水晶烛台', short: 'Candle Holders',
+    blurb: 'Tealight and taper holders with hand-polished bevels that scatter warm light.' },
+  { id: 'ornaments', name: 'Ornaments & Paperweights', zh: '装饰品', short: 'Ornaments',
+    blurb: 'Desk pieces and decorative crystals for branded corporate and tourism gifts.' },
+  { id: 'bracelets', name: 'Crystal Bracelets', zh: '水晶手链', short: 'Bracelets',
+    blurb: 'Crystal bead and bangle bracelets for fashion, wellness and gift collections.' },
+  { id: 'paperweights', name: 'Crystal Paperweights', zh: '水晶镇纸', short: 'Paperweights',
+    blurb: 'Faceted crystal paperweights and desk stones, ready for logo engraving.' },
+  { id: 'frames', name: 'Crystal Photo Frames', zh: '水晶相框', short: 'Photo Frames',
+    blurb: 'Bevelled crystal frames for weddings, anniversaries and promotional gifts.' },
+  { id: 'medals', name: 'Crystal Medals', zh: '水晶奖牌', short: 'Medals',
+    blurb: 'Recognition medals with clear crystal discs on metal or crystal stands.' },
+  { id: 'glass-medals', name: 'Glass Medals', zh: '玻璃奖牌', short: 'Glass Medals',
+    blurb: 'Glass alternative medals for high-volume recognition and event programmes.' },
+  { id: 'lamps', name: 'Crystal Table Lamps', zh: '水晶台灯', short: 'Lamps',
+    blurb: 'Crystal table and night lamps that double as décor and ambient lighting.' }
 ];
 // 默认展示一份静态产品样本（首屏秒开 + 后端不可用时兜底）。
 // 页面加载后会通过 loadProducts() 用后台真实产品数据替换它。
@@ -1022,19 +1097,22 @@
   function renderCategories() {
     $('#cat-grid').innerHTML = CATEGORIES.map(c => `
       <a class="cat reveal" href="#products" data-cat="${c.id}">
-        <div class="cat-media">${artSvg(CAT_ART[c.id])}</div>
-        <div class="cat-body"><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p>
+        <div class="cat-media">${catArtSvg(c.id)}</div>
+        <div class="cat-body"><h3>${esc(c.name)}</h3><span class="cat-zh">${esc(c.zh)}</span><p>${esc(c.blurb)}</p>
           <span class="go">View collection <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
         </div></a>`).join('');
-    $$('#cat-grid .cat').forEach(a => a.addEventListener('click', () => setFilter(a.dataset.cat)));
+    $$('#cat-grid .cat').forEach(a => a.addEventListener('click', () => { setFilter(a.dataset.cat); document.getElementById('products').scrollIntoView({ behavior: 'smooth' }); }));
   }
   function renderFilters() {
     const all = [{ id: 'all', short: 'All products' }].concat(CATEGORIES);
     $('#filters').innerHTML = all.map(c => `<button class="filter${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}">${esc(c.short)}</button>`).join('');
     $$('#filters .filter').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.cat)));
+    const active = $('#filters .filter.active');
+    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
   }
-  let current = 'all';
+  let current = 'all', searchQ = '';
   function setFilter(cat) { current = cat; $$('#filters .filter').forEach(b => b.classList.toggle('active', b.dataset.cat === cat)); renderProducts(); }
+  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
 
   function mediaInner(p, big) {
     const photo = p.imageUrl
@@ -1048,8 +1126,15 @@
   function arrowSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }
 
   function renderProducts() {
-    const list = current === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === current);
-    $('#prod-grid').innerHTML = list.map(p => {
+    const q = (searchQ || '').trim().toLowerCase();
+    let list = current === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === current);
+    if (q) list = list.filter(p => (p.name + ' ' + p.desc + ' ' + Object.values(p.specs).join(' ')).toLowerCase().includes(q));
+    const grid = $('#prod-grid');
+    if (!list.length) {
+      grid.innerHTML = `<div class="empty-cat">${q ? 'No products match “' + esc(searchQ) + '”.' : 'This collection is being photographed — new pieces arrive every week.'}</div>`;
+      observeReveals(); return;
+    }
+    grid.innerHTML = list.map(p => {
       const chips = Object.entries(p.specs).slice(0, 3).map(([k, v]) => `<span>${esc(k === 'Material' ? v : (k === 'MOQ' ? 'MOQ ' + v : v))}</span>`).join('');
       const inCart = cart[p.id] > 0;
       return `<article class="card reveal">
@@ -1358,6 +1443,8 @@
   }
   function init() {
     renderCategories(); renderFilters(); renderProducts(); syncBadge(); observeReveals(); initNav(); initCustomForm(); initDatePicker('dp-deadline');
+    const pSearch = $('#p-search');
+    if (pSearch) pSearch.addEventListener('input', debounce(() => { searchQ = pSearch.value; renderProducts(); }, 180));
     loadProducts();
     $$('.inquiry-btn').forEach(b => b.addEventListener('click', openDrawer));
     $('#drawer-close').addEventListener('click', closeDrawer);
--- a/public/yuzhoucrystal.html
+++ b/public/yuzhoucrystal.html
@@ -138,30 +138,40 @@
 /* =========================================================
    Categories — editorial tiles
    ========================================================= */
-.cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
+.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); gap: 22px; }
 .cat { position: relative; display: flex; flex-direction: column; }
 .cat-media { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--r-card);
   background: linear-gradient(180deg, var(--studio-1), var(--studio-2)); display: grid; place-items: center; border: 1px solid var(--line-2); }
-.cat-media .art { width: 74%; height: 74%; transition: transform .5s var(--ease); }
+.cat-media .art { width: 70%; height: 70%; transition: transform .5s var(--ease); }
 .cat:hover .cat-media .art { transform: translateY(-6px) scale(1.04); }
-.cat-body { padding: 20px 2px 0; }
-.cat-body h3 { font-size: 21px; color: var(--ink); line-height: 1.15; }
-.cat-body p { margin: 8px 0 0; font-size: 13px; color: var(--muted); line-height: 1.55; }
-.cat .go { display: inline-flex; align-items: center; gap: 7px; margin-top: 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink); }
+.cat-body { padding: 16px 2px 0; }
+.cat-body h3 { font-size: 19px; color: var(--ink); line-height: 1.15; }
+.cat-zh { display: inline-block; margin-top: 3px; font-size: 13px; color: var(--brand); font-weight: 600; letter-spacing: .02em; }
+.cat-body p { margin: 7px 0 0; font-size: 12.5px; color: var(--muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
+.cat .go { display: inline-flex; align-items: center; gap: 7px; margin-top: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink); }
 .cat .go svg { width: 14px; height: 14px; transition: transform .25s var(--ease); }
 .cat:hover .go svg { transform: translateX(4px); }
-@media (max-width: 940px) { .cat-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
-@media (max-width: 520px) { .cat-grid { grid-template-columns: 1fr 1fr; gap: 14px; } .cat-body h3 { font-size: 17px; } }
+@media (max-width: 940px) { .cat-grid { gap: 18px; } }
+@media (max-width: 520px) { .cat-grid { gap: 14px; } .cat-body h3 { font-size: 17px; } }
 
 /* =========================================================
    Products
    ========================================================= */
 .products { background: var(--bg-warm); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
-.filters { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 44px; }
-.filter { border: 1px solid var(--line); background: #fff; color: var(--ink-2); padding: 10px 20px; border-radius: var(--r-pill);
-  font-size: 11.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; transition: all .2s var(--ease); }
+.filters { display: flex; gap: 8px; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 8px; margin-bottom: 36px;
+  scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
+.filters::-webkit-scrollbar { height: 6px; }
+.filters::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
+.filter { flex: 0 0 auto; scroll-snap-align: start; white-space: nowrap; border: 1px solid var(--line); background: #fff; color: var(--ink-2); padding: 10px 18px; border-radius: var(--r-pill);
+  font-size: 11.5px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; transition: all .2s var(--ease); }
 .filter:hover { border-color: var(--ink); color: var(--ink); }
 .filter.active { background: var(--ink); color: #fff; border-color: var(--ink); }
+.prod-tools { margin-bottom: 8px; }
+.p-search { display: block; width: 100%; max-width: 440px; margin: 0 auto 18px; padding: 12px 18px; border: 1px solid var(--line); border-radius: var(--r-pill);
+  background: #fff; font: inherit; font-size: 14px; color: var(--ink); transition: border-color .2s var(--ease), box-shadow .2s var(--ease); }
+.p-search::placeholder { color: var(--faint); }
+.p-search:focus { outline: none; border-color: var(--ink); box-shadow: 0 0 0 3px rgba(31,42,212,.12); }
+.empty-cat { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--muted); font-size: 15px; }
 .prod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
 @media (max-width: 940px) { .prod-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
 @media (max-width: 520px) { .prod-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
@@ -516,7 +526,7 @@
       <div class="hero-copy">
         <span class="eyebrow">Crystal &amp; glass atelier · since the Canton Fair years</span>
         <h1>Crystal gifts,<br>cut to <em>win the order</em>.</h1>
-        <p class="lead">Awards, candle holders, frames and ornaments — made in our own Pujiang workshop for gift importers worldwide. Low MOQ, custom engraving, export-ready packaging.</p>
+        <p class="lead">From crystal awards to home décor — made in our own Pujiang workshop for gift importers worldwide. Low MOQ, custom engraving, export-ready packaging.</p>
         <div class="hero-cta">
           <a class="btn btn-ghost" href="#products">Explore the catalogue
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
@@ -565,8 +575,8 @@
     <div class="wrap">
       <div class="sec-head reveal">
         <span class="eyebrow">Collections</span>
-        <h2 class="h-sec">Four crystal lines, one reliable maker.</h2>
-        <p>Each line is produced in-house and built for re-orders. Choose a collection to open the full catalogue.</p>
+        <h2 class="h-sec">21 crystal collections, one reliable maker.</h2>
+        <p>Every collection is produced in-house and built for re-orders. Pick one to open its full catalogue.</p>
       </div>
       <div class="cat-grid" id="cat-grid"></div>
     </div>
@@ -580,7 +590,10 @@
         <h2 class="h-sec">Browse our most reordered crystal pieces.</h2>
         <p>Studio renders below. Select the models you like, then send a single inquiry for a complete quotation.</p>
       </div>
-      <div class="filters" id="filters"></div>
+      <div class="prod-tools">
+        <input type="search" id="p-search" class="p-search" placeholder="Search products, materials, MOQ…" aria-label="Search products">
+        <div class="filters" id="filters"></div>
+      </div>
       <div class="prod-grid" id="prod-grid"></div>
     </div>
   </section>
@@ -625,7 +638,7 @@
           </div>
           <div class="row-2">
             <div class="field"><label>Product type</label>
-              <select name="ptype"><option value="">No preference</option><option>Awards &amp; Trophies</option><option>Candle Holders</option><option>Photo Frames</option><option>Ornaments &amp; Paperweights</option><option>Other</option></select>
+              <select name="ptype"><option value="">No preference</option><option>Crystal Awards &amp; Trophies</option><option>Office &amp; Desk Supplies</option><option>Crystal Watch Stones</option><option>Crystal Tableware</option><option>Lighting Accessories</option><option>Crystal Vases</option><option>Wine Stoppers</option><option>Wooden Medals</option><option>Crystal Inner Carving</option><option>Jewelry Boxes</option><option>Crystal Perfume Bottles</option><option>Animal &amp; Flower Figurines</option><option>Crystal Smoking Sets</option><option>Crystal Candle Holders</option><option>Ornaments &amp; Paperweights</option><option>Crystal Bracelets</option><option>Crystal Paperweights</option><option>Crystal Photo Frames</option><option>Crystal Medals</option><option>Glass Medals</option><option>Crystal Table Lamps</option><option>Other</option></select>
             </div>
             <div class="field"><label>Preferred size</label><input name="size" placeholder="e.g. H 18 cm / 5×7 in"></div>
           </div>
@@ -710,7 +723,7 @@
       <div class="about-copy reveal">
         <span class="eyebrow">About us</span>
         <h2>Made in Pujiang,<br>China's crystal town.</h2>
-        <p>Yuzhou Crystal Co., Ltd. is a crystal and glass craft manufacturer based in Pujiang, Zhejiang — a region known across China for optical-crystal craftsmanship. We supply gift importers, promotional-product companies and event organisers with awards, candle holders, frames and ornaments.</p>
+        <p>Yuzhou Crystal Co., Ltd. is a crystal and glass craft manufacturer based in Pujiang, Zhejiang — a region known across China for optical-crystal craftsmanship. We supply gift importers, promotional-product companies and event organisers with crystal gifts, awards and home décor across more than 20 collections.</p>
         <p>Our team has grown alongside the Canton Fair. We know what overseas buyers need: clear quotations, honest lead times, dependable packaging, and pieces that arrive exactly as sampled.</p>
         <div class="about-points">
           <div class="ap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg> Factory-direct pricing</div>
@@ -746,7 +759,7 @@
             </svg>
             <span class="bname"><b>YUZHOU CRYSTAL</b><span>Crystal Manufacturer</span></span>
           </a>
-          <p>Crystal &amp; glass craft manufacturer in Pujiang, China. Awards, candle holders, frames and ornaments for importers worldwide.</p>
+          <p>Crystal &amp; glass craft manufacturer in Pujiang, China. 20+ crystal collections for importers worldwide.</p>
         </div>
         <div class="foot-col">
           <h4>Collections</h4>
@@ -766,7 +779,7 @@
       </div>
       <div class="foot-bottom">
         <span>© <span id="year">2026</span> Yuzhou Crystal Co., Ltd. All rights reserved.</span>
-        <span>Awards · Candle holders · Frames · Ornaments</span>
+        <span>21 crystal collections · one reliable maker</span>
       </div>
     </div>
   </footer>
@@ -946,17 +959,79 @@
     <path d="M158 96 L138 232 M158 96 L182 232 M116 150 L160 176 L214 138" stroke="#fff" stroke-opacity=".3" stroke-width="1.3" fill="none"/>
     <polygon points="132,150 142,150 138,196 130,190" fill="#fff" opacity=".4"/>`
 };
-const CAT_ART = { trophies: 'tr-faceted-peak', candles: 'cd-prism-taper', frames: 'fr-bevel-57', ornaments: 'or-iceberg' };
+const CAT_PALETTE = [
+  ['#8fd0ec', '#3f8fb5'], ['#9fe0d2', '#3aa593'], ['#c4a6e8', '#7b54b0'],
+  ['#f0b3c8', '#c96a8e'], ['#f3d59a', '#cf9a3e'], ['#a8d8a0', '#5aa15a'],
+  ['#aebfd6', '#5f7596'], ['#f1b48a', '#cf7a3e']
+];
+function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
+// 参数化生成水晶图标：21 个类别共用一套画法，按 id 取色与造型，保证视觉统一且零手绘成本
+let catArtSeq = 0;
+function catArtSvg(id){
+  const pal = CAT_PALETTE[hashStr(id) % CAT_PALETTE.length];
+  const v = hashStr(id + 'shape') % 5;
+  const uid = 'cg' + (++catArtSeq);
+  const gems = [
+    'M160 64 L208 150 L160 256 L112 150 Z',
+    'M160 58 L206 138 L188 256 L132 256 L114 138 Z',
+    'M116 150 L160 64 L204 150 L204 200 L160 256 L116 200 Z',
+    'M160 60 L200 128 L182 256 L138 256 L120 128 Z',
+    'M160 60 L198 110 L198 200 L160 256 L122 200 L122 110 Z'
+  ];
+  const gem = gems[v];
+  return `<svg class="art" viewBox="0 0 320 320" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
+    <defs><linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient></defs>
+    <ellipse cx="160" cy="268" rx="72" ry="12" fill="#1c2740" opacity=".12"/>
+    <path d="${gem}" fill="url(#${uid})" opacity=".94"/>
+    <path d="M160 60 L160 256 M112 150 L208 150" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="1.4"/>
+    <path d="${gem}" fill="none" stroke="#ffffff" stroke-opacity=".55" stroke-width="1"/>
+  </svg>`;
+}
 
+// 21 个产品类别（单一事实来源；id 与后台 products.category 字段一致，向后兼容旧 4 类）
 const CATEGORIES = [
-  { id: 'trophies', name: 'Crystal Awards & Trophies', short: 'Awards',
-    blurb: 'Faceted optical-crystal awards for corporate recognition, sport and events, with deep 3D or 2D sub-surface engraving.' },
-  { id: 'candles', name: 'Crystal Candle Holders', short: 'Candle Holders',
-    blurb: 'Tealight and taper holders with hand-polished bevels that scatter warm light — a steady line for home and hospitality.' },
-  { id: 'frames', name: 'Crystal Photo Frames', short: 'Photo Frames',
-    blurb: 'Bevelled glass and crystal frames for weddings, anniversaries and promotional gifts, in multiple aperture sizes.' },
-  { id: 'ornaments', name: 'Crystal Ornaments & Paperweights', short: 'Ornaments',
-    blurb: 'Desk pieces, paperweights and figurines in high-clarity crystal — ideal for branded corporate and tourism gifts.' }
+  { id: 'trophies', name: 'Crystal Awards & Trophies', zh: '水晶奖杯', short: 'Awards',
+    blurb: 'Faceted optical-crystal awards for corporate, sport and event recognition, with deep 2D/3D engraving.' },
+  { id: 'office', name: 'Office & Desk Supplies', zh: '办公用品', short: 'Office',
+    blurb: 'Crystal pens, name blocks and desktop gifts that turn everyday office items into keepsakes.' },
+  { id: 'watch-stones', name: 'Crystal Watch Stones', zh: '水晶表钻', short: 'Watch Stones',
+    blurb: 'Precision-cut crystal chatons and watch stones for jewellery and accessory assembly.' },
+  { id: 'tableware', name: 'Crystal Tableware', zh: '水晶餐具', short: 'Tableware',
+    blurb: 'Crystal bowls, plates and serving pieces for hospitality and premium gifting.' },
+  { id: 'lighting', name: 'Lighting Accessories', zh: '灯饰配件', short: 'Lighting',
+    blurb: 'Crystal prisms, pendants and components for chandeliers and light fixtures.' },
+  { id: 'vases', name: 'Crystal Vases', zh: '水晶花瓶', short: 'Vases',
+    blurb: 'Hand-cut crystal vases from bud vases to statement centrepieces.' },
+  { id: 'wine-stoppers', name: 'Wine Stoppers', zh: '酒瓶塞', short: 'Wine Stoppers',
+    blurb: 'Crystal-topped wine stoppers and pourers for the drinks and gift trade.' },
+  { id: 'wood-medals', name: 'Wooden Medals', zh: '木奖牌', short: 'Wood Medals',
+    blurb: 'Wood-and-crystal hybrid medals combining warm timber with engraved crystal plates.' },
+  { id: 'inner-carving', name: 'Crystal Inner Carving', zh: '水晶内雕', short: 'Inner Carving',
+    blurb: 'Sub-surface 3D laser engraving inside solid crystal — logos, skylines and portraits.' },
+  { id: 'jewelry-boxes', name: 'Jewelry Boxes', zh: '首饰盒', short: 'Jewelry Boxes',
+    blurb: 'Crystal and crystal-lidded jewellery boxes for retail and personal gifting.' },
+  { id: 'perfume', name: 'Crystal Perfume Bottles', zh: '水晶香水瓶', short: 'Perfume',
+    blurb: 'Faceted crystal perfume and scent bottles for fragrance and cosmetics brands.' },
+  { id: 'figurines', name: 'Animal & Flower Figurines', zh: '小动物花', short: 'Figurines',
+    blurb: 'Crystal animals, blooms and miniature figurines — best-selling tourism and desk gifts.' },
+  { id: 'smoking', name: 'Crystal Smoking Sets', zh: '水晶烟具', short: 'Smoking',
+    blurb: 'Crystal ashtrays and smoking accessories with polished, gift-grade finishes.' },
+  { id: 'candles', name: 'Crystal Candle Holders', zh: '水晶烛台', short: 'Candle Holders',
+    blurb: 'Tealight and taper holders with hand-polished bevels that scatter warm light.' },
+  { id: 'ornaments', name: 'Ornaments & Paperweights', zh: '装饰品', short: 'Ornaments',
+    blurb: 'Desk pieces and decorative crystals for branded corporate and tourism gifts.' },
+  { id: 'bracelets', name: 'Crystal Bracelets', zh: '水晶手链', short: 'Bracelets',
+    blurb: 'Crystal bead and bangle bracelets for fashion, wellness and gift collections.' },
+  { id: 'paperweights', name: 'Crystal Paperweights', zh: '水晶镇纸', short: 'Paperweights',
+    blurb: 'Faceted crystal paperweights and desk stones, ready for logo engraving.' },
+  { id: 'frames', name: 'Crystal Photo Frames', zh: '水晶相框', short: 'Photo Frames',
+    blurb: 'Bevelled crystal frames for weddings, anniversaries and promotional gifts.' },
+  { id: 'medals', name: 'Crystal Medals', zh: '水晶奖牌', short: 'Medals',
+    blurb: 'Recognition medals with clear crystal discs on metal or crystal stands.' },
+  { id: 'glass-medals', name: 'Glass Medals', zh: '玻璃奖牌', short: 'Glass Medals',
+    blurb: 'Glass alternative medals for high-volume recognition and event programmes.' },
+  { id: 'lamps', name: 'Crystal Table Lamps', zh: '水晶台灯', short: 'Lamps',
+    blurb: 'Crystal table and night lamps that double as décor and ambient lighting.' }
 ];
 // 默认展示一份静态产品样本（首屏秒开 + 后端不可用时兜底）。
 // 页面加载后会通过 loadProducts() 用后台真实产品数据替换它。
@@ -1011,19 +1086,22 @@
   function renderCategories() {
     $('#cat-grid').innerHTML = CATEGORIES.map(c => `
       <a class="cat reveal" href="#products" data-cat="${c.id}">
-        <div class="cat-media">${artSvg(CAT_ART[c.id])}</div>
-        <div class="cat-body"><h3>${esc(c.name)}</h3><p>${esc(c.blurb)}</p>
+        <div class="cat-media">${catArtSvg(c.id)}</div>
+        <div class="cat-body"><h3>${esc(c.name)}</h3><span class="cat-zh">${esc(c.zh)}</span><p>${esc(c.blurb)}</p>
           <span class="go">View collection <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
         </div></a>`).join('');
-    $$('#cat-grid .cat').forEach(a => a.addEventListener('click', () => setFilter(a.dataset.cat)));
+    $$('#cat-grid .cat').forEach(a => a.addEventListener('click', () => { setFilter(a.dataset.cat); document.getElementById('products').scrollIntoView({ behavior: 'smooth' }); }));
   }
   function renderFilters() {
     const all = [{ id: 'all', short: 'All products' }].concat(CATEGORIES);
     $('#filters').innerHTML = all.map(c => `<button class="filter${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}">${esc(c.short)}</button>`).join('');
     $$('#filters .filter').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.cat)));
+    const active = $('#filters .filter.active');
+    if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
   }
-  let current = 'all';
+  let current = 'all', searchQ = '';
   function setFilter(cat) { current = cat; $$('#filters .filter').forEach(b => b.classList.toggle('active', b.dataset.cat === cat)); renderProducts(); }
+  function debounce(fn, ms) { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
 
   function mediaInner(p, big) {
     const photo = p.imageUrl
@@ -1037,8 +1115,15 @@
   function arrowSvg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; }
 
   function renderProducts() {
-    const list = current === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === current);
-    $('#prod-grid').innerHTML = list.map(p => {
+    const q = (searchQ || '').trim().toLowerCase();
+    let list = current === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === current);
+    if (q) list = list.filter(p => (p.name + ' ' + p.desc + ' ' + Object.values(p.specs).join(' ')).toLowerCase().includes(q));
+    const grid = $('#prod-grid');
+    if (!list.length) {
+      grid.innerHTML = `<div class="empty-cat">${q ? 'No products match “' + esc(searchQ) + '”.' : 'This collection is being photographed — new pieces arrive every week.'}</div>`;
+      observeReveals(); return;
+    }
+    grid.innerHTML = list.map(p => {
       const chips = Object.entries(p.specs).slice(0, 3).map(([k, v]) => `<span>${esc(k === 'Material' ? v : (k === 'MOQ' ? 'MOQ ' + v : v))}</span>`).join('');
       const inCart = cart[p.id] > 0;
       return `<article class="card reveal">
@@ -1301,6 +1386,8 @@
 
   function init() {
     renderCategories(); renderFilters(); renderProducts(); syncBadge(); observeReveals(); initNav(); initCustomForm(); initDatePicker('dp-deadline');
+    const pSearch = $('#p-search');
+    if (pSearch) pSearch.addEventListener('input', debounce(() => { searchQ = pSearch.value; renderProducts(); }, 180));
     loadProducts();
     $$('.inquiry-btn').forEach(b => b.addEventListener('click', openDrawer));
     $('#drawer-close').addEventListener('click', closeDrawer);
--- a/server.js
+++ b/server.js
@@ -289,9 +289,10 @@
 
 /* ---------------------- Public product catalogue --------------------- */
 app.get('/api/products', (req, res) => {
-  const { category, page, pageSize } = req.query;
+  const { category, q, page, pageSize } = req.query;
   const result = store.listProducts({
     category: category || undefined,
+    q: q || undefined,
     page: page || 1,
     pageSize: pageSize || 200,
   });
@@ -384,7 +385,7 @@
 
 /* ------------------------- Admin: products -------------------------- */
 admin.get('/products', (req, res) => {
-  const result = store.listProducts({ page: req.query.page || 1, pageSize: req.query.pageSize || 200 });
+  const result = store.listProducts({ category: req.query.category || undefined, q: req.query.q || undefined, page: req.query.page || 1, pageSize: req.query.pageSize || 200 });
   const rows = result.rows.map(p => ({ ...p, imageUrl: p.image ? `/api/products/${p.id}/image` : null }));
   res.json({ ok: true, rows, total: result.total, page: result.page, pageSize: result.pageSize });
 });
--- a/src/store.js
+++ b/src/store.js
@@ -271,13 +271,14 @@
   return row;
 }
 
-function listProducts({ category, page = 1, pageSize = 200 } = {}) {
+function listProducts({ category, q, page = 1, pageSize = 200 } = {}) {
   page = Math.max(1, parseInt(page, 10) || 1);
   pageSize = Math.min(500, Math.max(1, parseInt(pageSize, 10) || 200));
   if (engine === 'sqlite') {
     const where = [];
     const params = {};
     if (category) { where.push('category = @category'); params.category = category; }
+    if (q) { where.push('(name LIKE @q OR description LIKE @q OR specs LIKE @q)'); params.q = '%' + q + '%'; }
     const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
     const total = db.prepare(`SELECT COUNT(*) c FROM products ${clause}`).get(params).c;
     const rows = db.prepare(
@@ -287,6 +288,7 @@
   } else {
     let rows = readProductsJsonl();
     if (category) rows = rows.filter(r => r.category === category);
+    if (q) { const t = String(q).toLowerCase(); rows = rows.filter(r => ((r.name || '') + ' ' + (r.description || '') + ' ' + (r.specs || '')).toLowerCase().includes(t)); }
     rows.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (b.created_at || '').localeCompare(a.created_at || ''));
     const total = rows.length;
     const start = (page - 1) * pageSize;
PATCH_EOF

echo "== [2/5] 定位项目目录 =="
APP=$(sudo find / -name server.js -not -path "*/node_modules/*" 2>/dev/null | head -1 | xargs -r dirname)
COMPOSE_DIR=$(sudo find / -name docker-compose.yml 2>/dev/null | head -1 | xargs -r dirname)
[ -z "$APP" ] && { echo "ERROR: 找不到 server.js，脚本无法继续。"; exit 1; }
[ -z "$COMPOSE_DIR" ] && { echo "ERROR: 找不到 docker-compose.yml。"; exit 1; }
echo "项目目录: $APP"
echo "Compose目录: $COMPOSE_DIR"
read -r -p "确认无误后按 Enter 应用补丁（Ctrl+C 取消）: "

echo "== [3/5] 备份当前代码 =="
BAK="/tmp/yuzhou_bak_$(date +%Y%m%d_%H%M%S)"
sudo cp -a "$APP" "$BAK" && echo "已备份到 $BAK"

echo "== [4/5] 应用补丁（先 dry-run 校验）=="
cd "$APP" || exit 1
if sudo patch -p1 --dry-run < /tmp/crystal21.patch; then
  sudo patch -p1 < /tmp/crystal21.patch
  echo "补丁已应用。"
else
  echo "DRY-RUN 失败：未改动任何文件，也未重建容器。请把上面的报错发给我。"
  exit 1
fi

echo "== [5/5] 重建并重启容器 =="
cd "$COMPOSE_DIR" || exit 1
sudo docker compose up -d --build
echo "== 健康检查 =="
sleep 3
curl -s http://localhost:3000/api/health || echo "(健康检查未返回，可稍后手动 curl localhost:3000/api/health)"
echo
echo "完成。请刷新 https://inquiry.crystalwto.com 确认已显示 21 个分类。"
