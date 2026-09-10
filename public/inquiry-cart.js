/* Yuzhou Crystal — shared inquiry basket for category landing pages.
 * Uses the SAME localStorage key as the homepage ('cc_inquiry_v1'),
 * so items added here also show up in the homepage drawer and vice versa.
 * Requires: nothing. Exposes window.YZInquiry.
 */
(function () {
  'use strict';

  var KEY = 'cc_inquiry_v1';
  var cart = load();
  var catalog = {};        // id -> { name, imageUrl, moq }
  var catalogTried = false;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function count() {
    return Object.keys(cart).reduce(function (n, k) { return n + (parseInt(cart[k], 10) || 0); }, 0);
  }
  function has(id) { return (parseInt(cart[id], 10) || 0) > 0; }

  function register(rows) {
    (rows || []).forEach(function (p) {
      if (!p || !p.id) return;
      catalog[p.id] = {
        name: p.name || p.id,
        imageUrl: p.imageUrl || null,
        moq: (p.specs && (p.specs.MOQ || p.specs.Moq)) ? String(p.specs.MOQ || p.specs.Moq) : ''
      };
    });
  }

  /* Pull the full catalogue once so items added on other pages still show a name. */
  function ensureCatalog(cb) {
    if (catalogTried) { cb(); return; }
    catalogTried = true;
    fetch('/api/products?page=1&pageSize=200', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && Array.isArray(d.rows)) register(d.rows); })
      .catch(function () { })
      .then(function () { cb(); });
  }

  function items() {
    return Object.keys(cart).map(function (id) {
      var c = catalog[id] || {};
      return { id: id, name: c.name || id, qty: parseInt(cart[id], 10) || 1, moq: c.moq || '' };
    });
  }

  /* ------------------------------- UI ------------------------------- */

  var drawer, panel, listEl, formEl, statusEl, countEl;

  function buildUI() {
    if (document.getElementById('yz-cart-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'yz-cart-btn';
    btn.type = 'button';
    btn.className = 'yz-cart-btn';
    btn.setAttribute('aria-label', 'Open inquiry list');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="yz-count" id="yz-count">0</span>';
    btn.addEventListener('click', openDrawer);
    document.body.appendChild(btn);

    drawer = document.createElement('div');
    drawer.id = 'yz-drawer';
    drawer.className = 'yz-drawer';
    drawer.innerHTML =
      '<div class="yz-mask" data-yz="close"></div>' +
      '<aside class="yz-panel" role="dialog" aria-label="Inquiry list">' +
      '<div class="yz-head"><h2>Your inquiry list</h2><button type="button" class="yz-close" data-yz="close" aria-label="Close">&times;</button></div>' +
      '<div class="yz-list" id="yz-list"></div>' +
      '<form class="yz-form" id="yz-form" novalidate>' +
      '<div class="yz-row"><label>Name *<input name="name" required autocomplete="name"></label>' +
      '<label>Company *<input name="company" required autocomplete="organization"></label></div>' +
      '<div class="yz-row"><label>Email *<input name="email" type="email" required autocomplete="email"></label>' +
      '<label>Country<input name="country" autocomplete="country-name"></label></div>' +
      '<label class="yz-full">Message<textarea name="message" rows="3" placeholder="Sizes, quantities, engraving, packaging, target date…"></textarea></label>' +
      '<button type="submit" class="yz-submit">Send inquiry</button>' +
      '<p class="yz-status" id="yz-status" role="status"></p>' +
      '</form></aside>';

    document.body.appendChild(drawer);

    panel = drawer.querySelector('.yz-panel');
    listEl = drawer.querySelector('#yz-list');
    formEl = drawer.querySelector('#yz-form');
    statusEl = drawer.querySelector('#yz-status');
    countEl = document.getElementById('yz-count');

    drawer.addEventListener('click', function (e) {
      var t = e.target.closest('[data-yz]');
      if (t && t.getAttribute('data-yz') === 'close') { closeDrawer(); return; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
    listEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var id = b.getAttribute('data-id');
      var act = b.getAttribute('data-act');
      if (act === 'inc') cart[id] = (parseInt(cart[id], 10) || 0) + 1;
      if (act === 'dec') { var n = (parseInt(cart[id], 10) || 0) - 1; if (n <= 0) delete cart[id]; else cart[id] = n; }
      if (act === 'del') delete cart[id];
      save(); sync(); renderList();
    });
    formEl.addEventListener('submit', submit);

    sync();
  }

  function openDrawer() {
    ensureCatalog(function () { renderList(); });
    renderList();
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderList() {
    var list = items();
    if (!list.length) {
      listEl.innerHTML = '<p class="yz-empty">No products selected yet. Tap <strong>Inquire</strong> on any product to add it here.</p>';
      return;
    }
    listEl.innerHTML = list.map(function (it) {
      var c = catalog[it.id] || {};
      var img = c.imageUrl ? '<img src="' + esc(c.imageUrl) + '" alt="" loading="lazy">' : '<span class="yz-noimg"></span>';
      return '<div class="yz-item">' + img +
        '<div class="yz-item-body"><div class="yz-item-name">' + esc(it.name) + '</div>' +
        (it.moq ? '<div class="yz-item-moq">MOQ ' + esc(it.moq) + '</div>' : '') +
        '<div class="yz-qty"><button type="button" data-act="dec" data-id="' + esc(it.id) + '">&minus;</button>' +
        '<span>' + it.qty + '</span>' +
        '<button type="button" data-act="inc" data-id="' + esc(it.id) + '">+</button>' +
        '<button type="button" class="yz-del" data-act="del" data-id="' + esc(it.id) + '">Remove</button></div></div></div>';
    }).join('');
  }

  function submit(e) {
    e.preventDefault();
    var list = items();
    if (!list.length) { statusEl.textContent = 'Please add at least one product first.'; return; }
    var f = new FormData(formEl);
    var name = (f.get('name') || '').trim();
    var company = (f.get('company') || '').trim();
    var email = (f.get('email') || '').trim();
    if (!name) { statusEl.textContent = 'Please enter your name.'; return; }
    if (!company) { statusEl.textContent = 'Please enter your company.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { statusEl.textContent = 'Please enter a valid email address.'; return; }

    var btn = formEl.querySelector('.yz-submit');
    btn.disabled = true; btn.textContent = 'Sending…';
    statusEl.textContent = '';

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name, company: company, email: email,
        country: (f.get('country') || '').trim(),
        message: (f.get('message') || '').trim(),
        items: list
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d || !res.d.ok) throw new Error((res.d && res.d.error) || 'Send failed');
        cart = {}; save(); sync(); renderList(); formEl.reset();
        statusEl.className = 'yz-status ok';
        statusEl.textContent = res.d.message || 'Inquiry received. We will get back to you shortly.';
      })
      .catch(function (err) {
        statusEl.className = 'yz-status err';
        statusEl.textContent = err.message || 'Something went wrong. Please try again or email us.';
      })
      .then(function () { btn.disabled = false; btn.textContent = 'Send inquiry'; });
  }

  function sync() {
    if (countEl) { var n = count(); countEl.textContent = n; countEl.style.display = n ? '' : 'none'; }
    var btn = document.getElementById('yz-cart-btn');
    if (btn) btn.classList.toggle('has-items', count() > 0);
    // keep any "Inquire" buttons on the page in the right state
    var nodes = document.querySelectorAll('[data-yz-add]');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].getAttribute('data-yz-add');
      if (has(id)) { nodes[i].classList.add('added'); nodes[i].textContent = 'Added ✓'; }
      else { nodes[i].classList.remove('added'); nodes[i].textContent = 'Inquire'; }
    }
  }

  function add(id) {
    if (!id) return;
    cart[id] = (parseInt(cart[id], 10) || 0) + 1;
    save(); sync();
    toast();
  }

  var toastEl;
  function toast() {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'yz-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = 'Added to your inquiry list';
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  /* Cards rendered by seo-category.js register themselves here. */
  window.YZInquiry = {
    add: add, has: has, count: count, items: items, register: register, sync: sync
  };

  /* Click delegation so dynamically rendered cards work too. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-yz-add]') : null;
    if (!b) return;
    e.preventDefault();
    add(b.getAttribute('data-yz-add'));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();
})();
