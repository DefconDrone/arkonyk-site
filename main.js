// Arkonyk — lightweight interactions (no dependencies)
(function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var open = links.classList.contains('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Contact form posts natively to FormSubmit (records the inquiry, emails
  // Rick@arkonyk.com, auto-confirms to the sender, redirects to thanks.html).
  // No JS interception needed.

  // Footer year
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
