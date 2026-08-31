(function () {
  'use strict';
  function mount() {
    var main = document.querySelector('main');
    if (!main || document.querySelector('[data-seo-home-content]')) return;
    var section = document.createElement('section');
    section.setAttribute('data-seo-home-content', '1');
    section.className = 'seo-home-content';
    section.innerHTML = '<div class="seo-home-content-inner">' +
      '<p class="seo-home-kicker">Crystal Manufacturing Partner</p>' +
      '<h2>Custom Crystal Products for Awards, Gifts and Interior Presentation</h2>' +
      '<p>Yuzhou Crystal manufactures crystal products for corporate recognition, promotional gifting, home decor, retail presentation and special events. Our product range includes crystal trophies and awards, photo frames, candle holders, vases, tableware, barware and other custom crystal gifts.</p>' +
      '<p>For buyers looking for a <a href="/crystal-manufacturer/">crystal manufacturer in China</a>, we support custom development from product concept and crystal cutting through <a href="/crystal-laser-engraving/">crystal laser engraving</a>, finishing and <a href="/custom-crystal-packaging/">custom packaging</a>. This makes the site useful both for ready-to-source products and OEM/ODM projects.</p>' +
      '<div class="seo-home-links"><a href="/custom-crystal-products/">Custom Crystal Products</a><a href="/crystal-trophies/">Crystal Awards &amp; Trophies</a><a href="/crystal-office-desk-gifts/">Corporate Crystal Gifts</a></div>' +
      '</div>';
    main.appendChild(section);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
