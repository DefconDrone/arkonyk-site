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

  // ---- Seamless FormSubmit handling ----
  // Any form posting to FormSubmit is sent via its AJAX endpoint so the visitor
  // never leaves the page or sees FormSubmit's captcha/confirmation interstitial.
  // On success the form is replaced in place with a thank-you message. If JS is
  // unavailable or the request fails, the native POST still works (and we add
  // _captcha=false so that fallback also skips the confirmation page).
  var fsForms = document.querySelectorAll('form[action*="formsubmit.co"]');
  Array.prototype.forEach.call(fsForms, function (form) {
    if (!form.querySelector('input[name="_captcha"]')) {
      var cap = document.createElement('input');
      cap.type = 'hidden';
      cap.name = '_captcha';
      cap.value = 'false';
      form.appendChild(cap);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Honeypot: if a bot filled the hidden field, show success but send nothing.
      var honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) { showSuccess(form); return; }

      var btn = form.querySelector('button[type="submit"]') || form.querySelector('button');
      var btnHtml = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      var ajaxUrl = form.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/');

      fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (res && (res.success === 'true' || res.success === true)) {
            showSuccess(form);
          } else {
            nativeFallback(form, btn, btnHtml);
          }
        })
        .catch(function () { nativeFallback(form, btn, btnHtml); });
    });
  });

  function nativeFallback(form, btn, btnHtml) {
    if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; }
    // Bypass our listener and let the browser do a normal POST (redirects to _next).
    HTMLFormElement.prototype.submit.call(form);
  }

  function showSuccess(form) {
    var isNotify = form.id === 'notify-form';
    var text = isNotify
      ? "You're on the list. We'll be in touch soon with launch updates — a confirmation is on its way to your inbox."
      : "Message received. We'll be in touch within one business day — a confirmation is on its way to your inbox.";

    var wrap = document.createElement('div');
    wrap.className = 'ark-success';
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-live', 'polite');

    var title = document.createElement('p');
    title.className = 'ark-success-title';
    title.textContent = 'Thank you';

    var body = document.createElement('p');
    body.className = 'ark-success-text';
    body.textContent = text;

    wrap.appendChild(title);
    wrap.appendChild(body);

    // For the gate's notify box, also hide the "Share your email…" prompt above it.
    if (isNotify) {
      var lbl = form.previousElementSibling;
      if (lbl && lbl.classList.contains('gate-notify-label')) lbl.style.display = 'none';
    }

    form.parentNode.replaceChild(wrap, form);
  }

  // Footer year
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
