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

  // Contact form: deliver the request to Rick@arkonyk.com via the visitor's mail client.
  // (No backend yet — swap to Formspree later for silent capture.)
  var CONTACT_TO = 'Rick@arkonyk.com';
  var form = document.querySelector('form[data-demo]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      function v(id){ var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
      var name = (v('fname') + ' ' + v('lname')).trim();
      var subject = 'Arkonyk inquiry' + (name ? ' from ' + name : '');
      var body =
        'Name: ' + name + '\n' +
        'Email: ' + v('email') + '\n' +
        'Company: ' + v('company') + '\n' +
        'Interested in: ' + v('interest') + '\n\n' +
        'Message:\n' + v('msg');
      window.location.href = 'mailto:' + CONTACT_TO +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      var msg = form.querySelector('.form-success');
      if (msg) msg.style.display = 'block';
      form.reset();
    });
  }

  // Footer year
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
