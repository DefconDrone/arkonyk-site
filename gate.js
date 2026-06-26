// Arkonyk — stealth-mode access gate (soft gate; not real security)
(function () {
  var USER = "Arkonyk26";
  var PASS = "truth26";
  var KEY = "ark_auth";

  // Set to a Formspree (or similar) endpoint to collect launch-update emails silently.
  // While empty, the form falls back to a pre-addressed email to hello@arkonyk.com.
  var NOTIFY_ENDPOINT = "";
  var NOTIFY_TO = "Rick@arkonyk.com";

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

  function initNotify() {
    var nform = document.getElementById("notify-form");
    if (!nform) return;
    nform.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("notify-email");
      var email = (input.value || "").trim();
      var msg = nform.querySelector(".gate-notify-msg");
      if (!email || email.indexOf("@") === -1) {
        if (msg) { msg.style.color = "#ff6b6b"; msg.textContent = "Please enter a valid email."; }
        return;
      }
      function done() {
        if (msg) { msg.style.color = ""; msg.textContent = "Thanks — we'll be in touch as we approach launch."; }
        nform.reset();
      }
      if (NOTIFY_ENDPOINT) {
        fetch(NOTIFY_ENDPOINT, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, source: "stealth-gate" })
        }).then(done).catch(done);
      } else {
        // No backend configured yet — deliver the lead via the visitor's mail client.
        window.location.href = "mailto:" + NOTIFY_TO +
          "?subject=" + encodeURIComponent("Arkonyk launch updates") +
          "&body=" + encodeURIComponent("Please add me to launch updates: " + email);
        done();
      }
    });
  }

  function init() { initGate(); initNotify(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Footer year
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
