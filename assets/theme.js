document.addEventListener('DOMContentLoaded', function () {
  // Loading overlay
  var overlay = document.querySelector('[data-loading-overlay]');
  if (overlay) {
    window.setTimeout(function () {
      overlay.classList.add('is-hidden');
    }, 400);
  }

  // Mobile nav toggle
  var navToggle = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
      document.body.classList.toggle('nav-open');
    });
  }

  // Accordions
  document.querySelectorAll('[data-accordion-title]').forEach(function (title) {
    title.addEventListener('click', function () {
      title.closest('[data-accordion-item]').classList.toggle('is-open');
    });
  });

  // Quantity selector
  document.querySelectorAll('[data-qty-selector]').forEach(function (selector) {
    var input = selector.querySelector('input');
    selector.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = parseInt(btn.getAttribute('data-step'), 10);
        var value = Math.max(1, (parseInt(input.value, 10) || 1) + step);
        input.value = value;
      });
    });
  });

  // Product gallery thumbnails
  document.querySelectorAll('[data-gallery-thumb]').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var mainImg = document.querySelector('[data-gallery-main-image]');
      if (mainImg) mainImg.src = thumb.getAttribute('data-full-src');
    });
  });

  // Newsletter form feedback (progressive enhancement)
  document.querySelectorAll('[data-newsletter-form]').forEach(function (form) {
    form.addEventListener('submit', function () {
      form.setAttribute('data-submitting', 'true');
    });
  });
});
