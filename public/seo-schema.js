(function () {
  'use strict';
  var graph = [
    {
      '@type': 'Organization',
      '@id': 'https://www.crystalwto.com/#organization',
      'name': 'Yuzhou Crystal Co., Ltd.',
      'url': 'https://www.crystalwto.com/'
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.crystalwto.com/#website',
      'url': 'https://www.crystalwto.com/',
      'name': 'Yuzhou Crystal',
      'publisher': { '@id': 'https://www.crystalwto.com/#organization' }
    }
  ];
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
})();
