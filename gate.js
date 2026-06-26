// Arkonyk — stealth-mode access gate (soft gate; not real security)
(function () {
  var USER = "Arkonyk26";
  var PASS = "truth26";
  var KEY = "ark_auth";

  // already authenticated this session?
  try { if (sessionStorage.getItem(KEY) === "ok") { document.documentElement.classList.add("ark-ok"); return; } } catch (e) {}

  function initGate() {
    var form = document.getElementById("gate-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = document.getElementById("gate-user").value.trim();
      var p = document.getElementById("gate-pass").value;
      var err = document.querySelector(".gate-error");
      if (u === USER && p === PASS) {
        try { sessionStorage.setItem(KEY, "ok"); } catch (e) {}
        var ov = document.querySelector(".gate-overlay");
        if (ov) ov.remove();
        document.documentElement.classList.add("ark-ok");
      } else {
        if (err) err.textContent = "Incorrect username or password.";
      }
    });
  }

  // The "Inquiries" email form posts natively to FormSubmit, which records the
  // address, emails it to Rick@arkonyk.com, sends the visitor an auto-confirmation,
  // and redirects to thanks.html. No JS interception needed.

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGate);
  else initGate();

  // Footer year
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
