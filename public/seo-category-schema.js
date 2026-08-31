(function () {
  'use strict';
  function slug() {
    var path = location.pathname.replace(/^\/+|\/+$/g, '');
    return path || 'home';
  }
  function addCategorySchema(category) {
    if (!category || !category.h1) return;
    var data = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': category.h1,
      'url': location.href.split('#')[0],
      'description': category.description,
      'isPartOf': { '@id': 'https://www.crystalwto.com/#website' }
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }
  var map = window.YUZHOU_SEO_CATEGORIES || {};
  var key = slug();
  if (key.indexOf('crystal-') === 0) addCategorySchema(map[key]);
})();
