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

  // ---- Contact form ----
  // Posts to Arkonyk's own endpoint, which validates the submission and emails
  // it to info@arkonyk.com via Resend from our infrastructure. On success the
  // form is replaced in place with a thank-you message.
  var leadForm = document.getElementById('contact-form');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (typeof leadForm.checkValidity === 'function' && !leadForm.checkValidity()) {
        leadForm.reportValidity();
        return;
      }

      // Honeypot: if a bot filled the hidden field, show success but send nothing.
      var honey = leadForm.querySelector('input[name="_honey"]');
      if (honey && honey.value) { showSuccess(leadForm); return; }

      var btn = leadForm.querySelector('button[type="submit"]') || leadForm.querySelector('button');
      var btnHtml = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }

      var data = {};
      new FormData(leadForm).forEach(function (v, k) { data[k] = v; });

      function restore() {
        if (btn) { btn.disabled = false; btn.innerHTML = btnHtml; }
      }

      fetch('https://arkonyk-gate.vercel.app/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) {
          if (r.ok) { showSuccess(leadForm); return; }
          return r.json().catch(function () { return {}; }).then(function (d) {
            restore();
            window.alert((d && d.message) ||
              'Something went wrong sending your message. Please try again in a moment, or email us directly at info@arkonyk.com.');
          });
        })
        .catch(function () {
          restore();
          window.alert('Something went wrong sending your message. Please try again in a moment, or email us directly at info@arkonyk.com.');
        });
    });
  }

  function showSuccess(form) {
    var text = "Message received. We'll be in touch within one business day.";

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

    form.parentNode.replaceChild(wrap, form);
  }

  // Footer year
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
