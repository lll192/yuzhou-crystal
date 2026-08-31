(function () {
  'use strict';
  var links = [
    ['/crystal-trophies/', 'Crystal Trophies & Awards'],
    ['/crystal-home-decor/', 'Crystal Home Decor'],
    ['/crystal-office-desk-gifts/', 'Crystal Office & Desk Gifts'],
    ['/crystal-photo-frames/', 'Crystal Photo Frames'],
    ['/crystal-candle-holders/', 'Crystal Candle Holders'],
    ['/crystal-tableware-barware/', 'Crystal Tableware & Barware'],
    ['/crystal-perfume-fashion/', 'Crystal Perfume & Fashion'],
    ['/crystal-vases/', 'Crystal Vases']
  ];

  function addNavLinks() {
    var nav = document.querySelector('[data-seo-collections]');
    if (!nav) return;
    if (nav.getAttribute('data-seo-ready') === '1') return;
    nav.setAttribute('data-seo-ready', '1');
    var fragment = document.createDocumentFragment();
    links.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item[0];
      a.textContent = item[1];
      a.className = 'seo-home-category-link';
      fragment.appendChild(a);
    });
    nav.appendChild(fragment);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addNavLinks);
  } else {
    addNavLinks();
  }
})();
