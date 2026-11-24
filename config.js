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
