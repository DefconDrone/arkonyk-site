/* ===========================================================
   Descriptors.com — Dispute Reduction Value Calculator
   Shared by solutions-merchants.html and descriptors-calculator.html.
   No dependencies. Renders into #calc if present, otherwise no-ops.
   =========================================================== */
(function () {
  "use strict";
  if (!document.getElementById("calc")) return;

  /* ---------- config ---------- */
  var MONTHLY_FEE = 20;                       // Descriptors.com subscription
  var CTA_HREF = "https://www.descriptors.com";
  var SCENARIOS = [
    { pct: 1,  stage: "Launch phase",        step: 1 },
    { pct: 5,  stage: "Early traction",      step: 2 },
    { pct: 10, stage: "Established",         step: 3 },
    { pct: 20, stage: "Broad issuer uptake", step: 4 },
    { pct: 30, stage: "Mature",              step: 5 }
  ];
  var FIELDS = {
    vol:    { def: 500, min: 0 },
    aov:    { def: 85,  min: 0 },
    alert:  { def: 30,  min: 0 },
    cbfee:  { def: 40,  min: 0 },
    caught: { def: 60,  min: 0, max: 100 },
    share:  { def: 55,  min: 0, max: 100 },
    fraudc: { def: 45,  min: 0, max: 100 }
  };
  var KEYS = Object.keys(FIELDS);
  var ADV = ["cbfee", "caught", "share", "fraudc"];

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function num(n) { return Math.round(isFinite(n) ? n : 0).toLocaleString("en-US"); }
  function money(n) { return "$" + num(n); }

  function readField(key) {
    var cfg = FIELDS[key], el = $(key);
    if (!el) return cfg.def;
    var raw = el.value, v = parseFloat(raw);
    if (isNaN(v)) v = 0;
    if (v < cfg.min) v = cfg.min;
    if (cfg.max !== undefined && v > cfg.max) v = cfg.max;
    el.setAttribute("aria-invalid", raw !== "" && parseFloat(raw) !== v ? "true" : "false");
    return v;
  }

  function track(event, payload) {
    // Fires into GTM dataLayer and gtag when present. Safe no-op otherwise.
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: "calc_" + event }, payload || {}));
      if (typeof window.gtag === "function") window.gtag("event", "calc_" + event, payload || {});
    } catch (e) {}
  }

  function postHeight() {
    // Only meaningful when this page is iframed. Locked to known origins.
    try {
      if (window.parent && window.parent !== window) {
        ["https://arkonyk.com", "https://www.arkonyk.com",
         "https://descriptors.com", "https://www.descriptors.com"].forEach(function (o) {
          window.parent.postMessage({
            type: "descriptors-calc-height",
            height: document.documentElement.scrollHeight
          }, o);
        });
      }
    } catch (e) {}
  }

  /* ---------- core calculation ----------
     feePerDispute  = (caught/100)*alert + (1-caught/100)*cbfee
     fullPerDispute = feePerDispute + aov
     per scenario:  avoided = vol*pct/100
                    fees    = avoided * feePerDispute
                    full    = avoided * fullPerDispute
                    multiple= fees / MONTHLY_FEE
     Do not change these without re-running the test fixture below.        */
  function model(v) {
    var feePerDispute = (v.caught / 100) * v.alert + (1 - v.caught / 100) * v.cbfee;
    var fullPerDispute = feePerDispute + v.aov;
    return {
      feePerDispute: feePerDispute,
      fullPerDispute: fullPerDispute,
      rows: SCENARIOS.map(function (s) {
        var avoided = v.vol * s.pct / 100;
        var fees = avoided * feePerDispute;
        return {
          pct: s.pct, stage: s.stage, step: s.step,
          avoided: avoided,
          fees: fees,
          full: avoided * fullPerDispute,
          multiple: MONTHLY_FEE > 0 ? fees / MONTHLY_FEE : 0
        };
      })
    };
  }

  /* ---------- render ---------- */
  function render() {
    var v = {};
    KEYS.forEach(function (k) { v[k] = readField(k); });

    var m = model(v), rows = m.rows;
    var max = Math.max.apply(null, rows.map(function (r) { return r.fees; })) || 1;

    $("calc-ladder").innerHTML = rows.map(function (r) {
      var w = Math.max(3, (r.fees / max) * 100);
      return '<div class="calc-row">' +
        '<div class="calc-scen"><span class="calc-pct">' + r.pct + '%</span>' +
          '<span class="calc-stage">' + r.stage + '</span></div>' +
        '<div class="calc-barwrap">' +
          '<div class="calc-track"><div class="calc-bar calc-step-' + r.step +
            '" style="width:' + w.toFixed(1) + '%"></div></div>' +
          '<span class="calc-fees">' + money(r.fees) + '<em>per month</em></span>' +
        '</div>' +
        '<div class="calc-right"><span class="calc-mult">' + num(r.multiple) + '&times;</span>' +
          '<span class="calc-sub">the $20 fee<br>' + money(r.full) + '/mo incl. revenue kept<br>' +
          num(r.avoided) + ' disputes avoided</span></div>' +
      '</div>';
    }).join("");

    /* headline — hard-wired to the 1% row, fees only. Deliberate: see notes. */
    var first = rows[0];
    $("calc-hero").textContent = num(first.multiple) + "× return on the subscription";
    $("calc-hero-copy").innerHTML =
      "A 1% reduction in your dispute volume is <strong>" + num(first.avoided) +
      " disputes a month</strong> &mdash; worth <strong>" + money(first.fees) +
      " in fees you stop paying</strong>, or " + money(first.full) +
      " once retained order value is included. Against a $20 monthly fee.";

    /* break-even */
    var monthlyFees = v.vol * m.feePerDispute;
    var be = $("calc-breakeven");
    if (monthlyFees > 0) {
      var bePct = (MONTHLY_FEE / monthlyFees) * 100;
      var oneIn = Math.round(100 / bePct);
      be.innerHTML = "Break-even is a <strong>" + bePct.toFixed(2) +
        "%</strong> reduction &mdash; about one dispute in " + num(oneIn) + ".";
      be.hidden = false;
    } else { be.hidden = true; }

    /* addressable ceiling — this is what the confusion-share input drives */
    var pool = v.vol * v.share / 100;
    var ceil = $("calc-ceiling");
    if (v.share > 0 && v.vol > 0) {
      ceil.innerHTML = "At a <strong>" + num(v.share) + "%</strong> confusion share, your addressable pool is <strong>" +
        num(pool) + " disputes a month</strong>. The 30% row is " +
        Math.round(Math.min(100, 30 / v.share * 100)) + "% of that pool &mdash; every row above is a share of " +
        "<em>total</em> dispute volume, not of the pool.";
    } else {
      ceil.innerHTML = "Set a confusion share above 0% to see the addressable pool.";
    }

    /* record tiles, at the 10% line */
    var at10 = v.vol * 0.10;
    $("calc-tc15").textContent = num(at10);
    $("calc-tc40").textContent = num(at10 * v.fraudc / 100);

    postHeight();
    return v;
  }

  /* ---------- URL state (shareable results) ---------- */
  function applyURL() {
    try {
      var q = new URLSearchParams(window.location.search), used = false;
      KEYS.forEach(function (k) {
        if (q.has(k) && $(k)) { $(k).value = q.get(k); used = true; }
      });
      if (ADV.some(function (k) { return q.has(k); })) {
        var a = $("calc-advanced"); if (a) a.open = true;
      }
      return used;
    } catch (e) { return false; }
  }

  function shareURL() {
    var q = new URLSearchParams();
    KEYS.forEach(function (k) { q.set(k, String(readField(k))); });
    var base = window.location.origin + window.location.pathname;
    var hash = document.getElementById("calculator") ? "#calculator" : "";
    return base + "?" + q.toString() + hash;
  }

  /* ---------- events ---------- */
  var debounce;
  KEYS.forEach(function (k) {
    var el = $(k); if (!el) return;
    el.addEventListener("input", function () {
      render();
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        track("input_change", { field: k, value: readField(k) });
      }, 900);
    });
  });

  $("calc-reset").addEventListener("click", function () {
    KEYS.forEach(function (k) { if ($(k)) $(k).value = FIELDS[k].def; });
    render();
    track("reset", {});
  });

  $("calc-share").addEventListener("click", function () {
    var url = shareURL();
    var done = function () {
      var t = $("calc-toast");
      t.classList.add("on");
      setTimeout(function () { t.classList.remove("on"); }, 1900);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
    } else {
      window.prompt("Copy this link:", url);
    }
    track("share", { url: url });
  });

  $("calc-cta").addEventListener("click", function () {
    var v = {}; KEYS.forEach(function (k) { v[k] = readField(k); });
    var rows = model(v).rows;
    track("cta_click", {
      monthly_disputes: v.vol,
      fees_at_1pct: Math.round(rows[0].fees),
      fees_at_10pct: Math.round(rows[2].fees)
    });
  });

  var adv = $("calc-advanced");
  if (adv) adv.addEventListener("toggle", function () {
    if (adv.open) track("advanced_open", {});
    postHeight();
  });

  window.addEventListener("resize", postHeight);

  /* ---------- boot ---------- */
  $("calc-cta").setAttribute("href", CTA_HREF);
  var fromURL = applyURL();
  render();
  track("view", { prefilled: fromURL });

  /* A shared results link should land on the calculator, not the top of a long page. */
  if (fromURL) {
    var anchor = document.getElementById("calculator");
    if (anchor && !window.location.hash) {
      setTimeout(function () { anchor.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
    }
  }
})();
