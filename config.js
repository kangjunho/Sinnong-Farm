// Shared farm configuration and navigation bootstrap.
window.FARM_CONFIG = {
  ga4MeasurementId: "",
  phone: "01067880022",
  inquiryWebAppUrl: "https://script.google.com/macros/s/AKfycbwHzzvPrc2EiQ3XG41j0udhskfMVVbGdvf_d8iBN1AC86MnJnvTzUf3xICg1BfT8TPIzQ/exec"
};
(() => {
  function syncNavigation() {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav').forEach(nav => {
      const links = [...nav.querySelectorAll('a')];
      const buy = links.find(a => a.classList.contains('nav-cta') || a.textContent.replace(/\s/g,'') === '구매문의');
      if (!buy) return;
      const existing = links.filter(a => a.getAttribute('href') === 'experience.html' || a.textContent.replace(/\s/g,'') === '농원체험');
      const experience = existing.shift() || document.createElement('a');
      existing.forEach(a => a.remove());
      experience.href = 'experience.html';
      experience.textContent = '농원 체험';
      experience.classList.add('nav-experience');
      buy.before(experience);
      buy.href = 'contact.html';
      nav.querySelectorAll('a').forEach(a => {
        if (a.textContent.replace(/\s/g,'') === '오시는길') a.href = 'location.html';
        if (a.getAttribute('href') === page) a.setAttribute('aria-current','page');
        else a.removeAttribute('aria-current');
      });
    });
    if (!document.querySelector('link[href^="home-experience.css"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = 'home-experience.css?v=20261124-3';
      document.head.appendChild(css);
    }
  }
  if (document.readyState === 'complete') syncNavigation();
  else window.addEventListener('load', syncNavigation, {once:true});
  document.addEventListener('DOMContentLoaded', syncNavigation, {once:true});
})();
// Product reference photographs; actual plant ages are not verified.
(() => {
  const photos = {
    '3~4년근': ['ginseng-seedlings.webp','어린 산양삼 참고 사진'],
    '5~6년근': ['ginseng-young-plants.webp','산양삼 생육 참고 사진'],
    '7~8년근': ['ginseng-raindrops.webp','빗방울 맺힌 산양삼 참고 사진'],
    '9~10년근': ['ginseng-red-berries.webp','붉은 열매가 달린 산양삼 참고 사진'],
    '11년근 이상': ['ginseng-gift-box.webp','수확 및 포장된 산양삼 참고 사진']
  };
  function updatePhotos() {
    document.querySelectorAll('#panel-products .product-card').forEach(card => {
      const key = card.querySelector('[data-product]')?.dataset.product;
      const img = card.querySelector('.product-photo img');
      if (!img || !photos[key]) return;
      img.src = 'assets/' + photos[key][0];
      img.alt = photos[key][1];
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updatePhotos, {once:true});
  else updatePhotos();
})();
