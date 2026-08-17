/* ===========================================================
   Descriptors.com — Portfolio Value Calculators
   One engine, three configurations, selected by [data-calc]:
     acquirer  — portfolio VAMP position (risk-only, no pricing)
     payfac    — MOR/PayFac VAMP position + fee & support savings
     issuer    — cost-of-confusion avoidance
   Shared by the solutions pages and the standalone calculator
   pages. No dependencies. No-ops if no [data-calc] is present.

   The merchant calculator (calculator.js) predates this file and
   stays separate — its test fixture is locked. New calculators
   belong here as configs, not as new files.

   Program facts encoded here (verify before changing):
   - Visa VAMP acquirer portfolio: 0.50% Above Standard,
     0.70% Excessive. Ratio = (TC40 + TC15) / TC05, event counts.
   - Visa VAMP merchant: 1.50% Excessive for US/CA/EU effective
     April 2026 (down from 2.20%).
   =========================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-calc]");
  if (!root) return;
  var TYPE = root.getAttribute("data-calc");

  /* ---------- shared helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function num(n) { return Math.round(isFinite(n) ? n : 0).toLocaleString("en-US"); }
  function money(n) { return "$" + num(n); }
  function bps1(n) { return (isFinite(n) ? n : 0).toFixed(1).replace(/\.0$/, ""); }

  function track(event, payload) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: "calc_" + event, calc: TYPE }, payload || {}));
      if (typeof window.gtag === "function") window.gtag("event", "calc_" + event, Object.assign({ calc: TYPE }, payload || {}));
    } catch (e) {}
  }

  var LADDER = [
    { pct: 1,  stage: "Launch phase",        step: 1 },
    { pct: 5,  stage: "Early traction",      step: 2 },
    { pct: 10, stage: "Established",         step: 3 },
    { pct: 20, stage: "Broad issuer uptake", step: 4 },
    { pct: 30, stage: "Mature",              step: 5 }
  ];

  /* VAMP meter. Renders current ratio against marked thresholds.
     thresholds: [{bps, label, kind:"warn"|"bad"}], scale = right edge in bps. */
  function meterHTML(ratioBps, thresholds, scale) {
    var pos = Math.max(0, Math.min(100, ratioBps / scale * 100));
    var marks = thresholds.map(function (t) {
      var p = Math.max(0, Math.min(100, t.bps / scale * 100));
      return '<div class="vm-mark vm-' + t.kind + '" style="left:' + p.toFixed(2) + '%">' +
             '<span>' + t.label + '</span></div>';
    }).join("");
    return '<div class="vm-track">' +
        '<div class="vm-fill" style="width:' + pos.toFixed(2) + '%"></div>' + marks +
        '<div class="vm-needle" style="left:' + pos.toFixed(2) + '%"></div>' +
      '</div>';
  }

  function statusFor(ratioBps, thresholds) {
    /* thresholds ascending; returns the highest band crossed, or null */
    var hit = null;
    thresholds.forEach(function (t) { if (ratioBps >= t.bps) hit = t; });
    return hit;
  }

  /* ---------- configurations ---------- */
  var CONFIGS = {

    /* ============ Acquirers & ISOs — risk-only ============ */
    acquirer: {
      fields: {
        tc05:  { def: 2500000, min: 0 },   // monthly settled transactions
        tc15:  { def: 10000,   min: 0 },   // monthly disputes
        tc40:  { def: 4000,    min: 0 },   // monthly fraud reports
        share: { def: 55, min: 0, max: 100 }
      },
      adv: ["share"],
      thresholds: [
        { bps: 50, label: "0.5% Above Standard", kind: "warn" },
        { bps: 70, label: "0.7% Excessive",      kind: "bad"  }
      ],
      scale: 100,
      compute: function (v) {
        var events = v.tc15 + v.tc40;
        var ratio = v.tc05 > 0 ? events / v.tc05 * 10000 : 0; // bps
        var rows = LADDER.map(function (s) {
          var avoided = v.tc15 * s.pct / 100;
          var newRatio = v.tc05 > 0 ? (events - avoided) / v.tc05 * 10000 : 0;
          return { pct: s.pct, stage: s.stage, step: s.step,
                   avoided: avoided, newRatio: newRatio, saved: ratio - newRatio };
        });
        /* reduction in TC15 needed to sit at Above Standard */
        var overAS = events - 0.005 * v.tc05;
        var neededPct = (v.tc15 > 0 && overAS > 0) ? overAS / v.tc15 * 100 : 0;
        return { ratio: ratio, events: events, rows: rows, neededPct: neededPct,
                 headroomExcessive: 0.007 * v.tc05 - events,
                 pool: v.tc15 * v.share / 100 };
      },
      render: function (v, m) {
        var thr = this.thresholds;
        $("pc-meter").innerHTML = meterHTML(m.ratio, thr, this.scale);
        var st = statusFor(m.ratio, thr);
        $("pc-hero").textContent = v.tc05 > 0
          ? bps1(m.ratio) + " bps portfolio VAMP ratio"
          : "Enter your monthly settled transactions";
        var copy;
        if (v.tc05 <= 0) {
          copy = "The ratio is <strong>(fraud reports + disputes) &divide; settled transactions</strong>, counted in events. Fill in the three volumes on the left.";
        } else if (st && st.kind === "bad") {
          copy = "This portfolio is <strong>above the 0.7% Excessive line</strong>. " +
            (m.neededPct > 0 && m.neededPct <= 100
              ? "Getting back under 0.5% Above Standard takes a <strong>" + m.neededPct.toFixed(1) + "% reduction in disputes</strong> — " + num(v.tc15 * m.neededPct / 100) + " fewer dispute events a month."
              : "Dispute reduction alone cannot reach 0.5% at these volumes — fraud events dominate the numerator.");
        } else if (st) {
          copy = "This portfolio sits in <strong>Above Standard</strong>, " + num(Math.max(0, m.headroomExcessive)) + " events below the Excessive line. " +
            (m.neededPct > 0 && m.neededPct <= 100
              ? "A <strong>" + m.neededPct.toFixed(1) + "% reduction in disputes</strong> (" + num(v.tc15 * m.neededPct / 100) + " events a month) puts it back under 0.5%."
              : "");
        } else {
          copy = "This portfolio is <strong>under the 0.5% Above Standard line</strong> with " +
            num(0.005 * v.tc05 - m.events) + " events of headroom a month. The ladder below shows how much margin confusion-dispute reduction adds.";
        }
        $("pc-hero-copy").innerHTML = copy;

        var maxSaved = Math.max.apply(null, m.rows.map(function (r) { return r.saved; })) || 1;
        $("pc-ladder").innerHTML = m.rows.map(function (r) {
          var w = Math.max(3, r.saved / maxSaved * 100);
          return '<div class="calc-row">' +
            '<div class="calc-scen"><span class="calc-pct">' + r.pct + '%</span>' +
              '<span class="calc-stage">' + r.stage + '</span></div>' +
            '<div class="calc-barwrap">' +
              '<div class="calc-track"><div class="calc-bar calc-step-' + r.step + '" style="width:' + w.toFixed(1) + '%"></div></div>' +
              '<span class="calc-fees">' + bps1(r.newRatio) + ' bps<em>new ratio</em></span>' +
            '</div>' +
            '<div class="calc-right"><span class="calc-mult">&minus;' + bps1(r.saved) + '</span>' +
              '<span class="calc-sub">bps off the ratio<br>' + num(r.avoided) + ' disputes avoided/mo</span></div>' +
          '</div>';
        }).join("");

        $("pc-note").innerHTML = (v.share > 0 && v.tc15 > 0)
          ? "At a <strong>" + num(v.share) + "%</strong> confusion share, the addressable pool is <strong>" + num(m.pool) +
            " disputes a month</strong> across the book. RDR and CDRN suppress TC15 after the fact — but TC40 still counts, and both fee lines keep running. Preventing the dispute at the descriptor removes the event from the numerator entirely."
          : "Set a confusion share above 0% to see the addressable pool.";
      },
      cta: { href: "contact.html", track: function (v, m) {
        return { monthly_disputes: v.tc15, ratio_bps: Math.round(m.ratio * 10) / 10 };
      } }
    },

    /* ============ PayFacs & MORs — VAMP first, then dollars ============ */
    payfac: {
      fields: {
        tc05:    { def: 600000, min: 0 },
        tc15:    { def: 6000,   min: 0 },
        tc40:    { def: 2400,   min: 0 },
        cbcost:  { def: 35, min: 0 },      // per-dispute cost (network + ops)
        tickets: { def: 15000, min: 0 },   // "what is this charge?" contacts
        tcost:   { def: 5, min: 0 },       // cost per contact
        share:   { def: 55, min: 0, max: 100 }
      },
      adv: ["cbcost", "tickets", "tcost", "share"],
      thresholds: [ { bps: 150, label: "1.5% Excessive (Apr 2026)", kind: "bad" } ],
      scale: 200,
      compute: function (v) {
        var events = v.tc15 + v.tc40;
        var ratio = v.tc05 > 0 ? events / v.tc05 * 10000 : 0;
        var rows = LADDER.map(function (s) {
          var avoided = v.tc15 * s.pct / 100;
          var deflected = v.tickets * s.pct / 100;
          return { pct: s.pct, stage: s.stage, step: s.step,
                   avoided: avoided,
                   newRatio: v.tc05 > 0 ? (events - avoided) / v.tc05 * 10000 : 0,
                   fees: avoided * v.cbcost,
                   support: deflected * v.tcost,
                   total: avoided * v.cbcost + deflected * v.tcost };
        });
        return { ratio: ratio, events: events, rows: rows,
                 headroom: 0.015 * v.tc05 - events,
                 pool: v.tc15 * v.share / 100 };
      },
      render: function (v, m) {
        $("pc-meter").innerHTML = meterHTML(m.ratio, this.thresholds, this.scale);
        var over = m.ratio >= 150;
        $("pc-hero").textContent = v.tc05 > 0
          ? bps1(m.ratio) + " bps VAMP ratio — you are the merchant of record"
          : "Enter your monthly settled transactions";
        var copy;
        if (v.tc05 <= 0) {
          copy = "As the MOR, the disputes are yours: the ratio is <strong>(fraud reports + disputes) &divide; settled transactions</strong>, in events. Fill in the volumes on the left.";
        } else if (over) {
          copy = "This book is <strong>over the 1.5% merchant Excessive line</strong> that took effect April 2026 (down from 2.2%). Every avoided dispute is an event out of the numerator.";
        } else {
          copy = "That is <strong>" + num(Math.max(0, m.headroom)) + " events of headroom</strong> under the 1.5% merchant Excessive line — which dropped from 2.2% in April 2026. The count is event-based: a $9.99 subscription dispute weighs the same as a $5,000 one, which is exactly why low-ticket recurring portfolios feel this program first.";
        }
        $("pc-hero-copy").innerHTML = copy;

        var maxTotal = Math.max.apply(null, m.rows.map(function (r) { return r.total; })) || 1;
        $("pc-ladder").innerHTML = m.rows.map(function (r) {
          var w = Math.max(3, r.total / maxTotal * 100);
          return '<div class="calc-row">' +
            '<div class="calc-scen"><span class="calc-pct">' + r.pct + '%</span>' +
              '<span class="calc-stage">' + r.stage + '</span></div>' +
            '<div class="calc-barwrap">' +
              '<div class="calc-track"><div class="calc-bar calc-step-' + r.step + '" style="width:' + w.toFixed(1) + '%"></div></div>' +
              '<span class="calc-fees">' + money(r.total) + '<em>per month</em></span>' +
            '</div>' +
            '<div class="calc-right"><span class="calc-mult">' + bps1(r.newRatio) + '</span>' +
              '<span class="calc-sub">bps new ratio<br>' + money(r.fees) + ' dispute costs + ' + money(r.support) + ' support</span></div>' +
          '</div>';
        }).join("");

        $("pc-note").innerHTML = (v.share > 0 && v.tc15 > 0)
          ? "At a <strong>" + num(v.share) + "%</strong> confusion share, <strong>" + num(m.pool) +
            " of your monthly disputes</strong> began as a cardholder not recognizing your prefix in front of their sub-brand. Your support team answers the same question for free today — the descriptor can answer it before it is asked."
          : "Set a confusion share above 0% to see the addressable pool.";
      },
      cta: { href: "contact.html", track: function (v, m) {
        return { monthly_disputes: v.tc15, ratio_bps: Math.round(m.ratio * 10) / 10,
                 total_at_10pct: Math.round(m.rows[2].total) };
      } }
    },

    /* ============ Issuers — coverage-first cost of confusion ============
       The issuer sits on the other side of the network: their deflection
       grows with MERCHANT/registry coverage, and dispute volume is
       concentrated — the descriptors issuers flag most are a short head,
       and the registry covers that head today. The ladder is therefore
       resolution-rate scenarios applied to the COVERED share of the
       issuer's confusion volume, not adoption stages. */
    issuer: {
      fields: {
        disp:  { def: 20000, min: 0 },   // monthly disputes processed
        dcost: { def: 85,    min: 0 },   // fully-loaded cost per dispute
        calls: { def: 60000, min: 0 },   // monthly "what is this charge?" contacts
        head:  { def: 50, min: 0, max: 100 }, // share of confusion volume on top-flagged descriptors
        ccost: { def: 7,     min: 0 },   // cost per contact
        share: { def: 55, min: 0, max: 100 }
      },
      adv: ["ccost", "share"],
      thresholds: null,
      ladder: [
        { pct: 5,  stage: "1 covered charge in 20 resolved", step: 1 },
        { pct: 10, stage: "1 in 10",                          step: 2 },
        { pct: 20, stage: "1 in 5",                           step: 3 },
        { pct: 35, stage: "1 in 3",                           step: 4 },
        { pct: 50, stage: "1 in 2",                           step: 5 }
      ],
      compute: function (v) {
        var confDisputes = v.disp * v.share / 100;
        var covDisputes = confDisputes * v.head / 100;
        var covCalls = v.calls * v.head / 100;
        var covMonthly = covDisputes * v.dcost + covCalls * v.ccost;
        var fullMonthly = confDisputes * v.dcost + v.calls * v.ccost;
        var rows = this.ladder.map(function (sc) {
          var dAvoided = covDisputes * sc.pct / 100;
          return { pct: sc.pct, stage: sc.stage, step: sc.step,
                   dAvoided: dAvoided,
                   saved: dAvoided * v.dcost + covCalls * sc.pct / 100 * v.ccost };
        });
        return { confDisputes: confDisputes, covDisputes: covDisputes, covCalls: covCalls,
                 covMonthly: covMonthly, covAnnual: covMonthly * 12,
                 fullAt10: fullMonthly * 0.10, rows: rows };
      },
      render: function (v, m) {
        var meterBox = $("pc-meter"); if (meterBox) meterBox.innerHTML = "";
        $("pc-hero").textContent = m.covAnnual > 0
          ? money(m.covAnnual) + " a year sits on descriptors covered today"
          : (m.fullAt10 > 0 ? "Set your top-flagged share to see the covered volume"
                            : "Enter your dispute and contact volumes");
        $("pc-hero-copy").innerHTML = m.covAnnual > 0
          ? "At a " + num(v.share) + "% confusion share with <strong>" + num(v.head) +
            "% of that volume on your top-flagged descriptors</strong>, <strong>" + num(m.covDisputes) +
            " disputes</strong> and <strong>" + num(m.covCalls) + " &ldquo;what is this charge?&rdquo; contacts a month</strong> trace to descriptors the registry already covers. The ladder below applies a resolution rate to that covered volume only."
          : "The model needs at least one non-zero volume on the left.";

        var maxSaved = Math.max.apply(null, m.rows.map(function (r) { return r.saved; })) || 1;
        $("pc-ladder").innerHTML = m.rows.map(function (r) {
          var w = Math.max(3, r.saved / maxSaved * 100);
          return '<div class="calc-row">' +
            '<div class="calc-scen"><span class="calc-pct">' + r.pct + '%</span>' +
              '<span class="calc-stage">' + r.stage + '</span></div>' +
            '<div class="calc-barwrap">' +
              '<div class="calc-track"><div class="calc-bar calc-step-' + r.step + '" style="width:' + w.toFixed(1) + '%"></div></div>' +
              '<span class="calc-fees">' + money(r.saved) + '<em>per month</em></span>' +
            '</div>' +
            '<div class="calc-right"><span class="calc-mult">' + money(r.saved * 12) + '</span>' +
              '<span class="calc-sub">a year<br>' + num(r.dAvoided) + ' disputes deflected/mo</span></div>' +
          '</div>';
        }).join("");

        $("pc-note").innerHTML = m.covAnnual > 0
          ? "This models your covered head only &mdash; and coverage grows with every merchant that claims its descriptor. At full coverage of your confusion volume, a 1-in-10 resolution rate alone is worth <strong>" + money(m.fullAt10) +
            " a month</strong>. And the comparison underneath it all: a lookup that answers &ldquo;what is this charge?&rdquo; costs you <strong>nothing</strong>; the same question by phone costs <strong>" + money(v.ccost) +
            "</strong>; filed as a dispute it costs <strong>" + money(v.dcost) + "</strong>."
          : "Set your volumes to see the covered head.";
      },
      cta: { href: "contact.html", track: function (v, m) {
        return { covered_annual_cost: Math.round(m.covAnnual), monthly_disputes: v.disp, head_share: v.head };
      } }
    }
  };

  var cfg = CONFIGS[TYPE];
  if (!cfg) return;
  var KEYS = Object.keys(cfg.fields);

  function readField(key) {
    var f = cfg.fields[key], el = $("pc-" + key);
    if (!el) return f.def;
    var raw = el.value, v = parseFloat(raw);
    if (isNaN(v)) v = 0;
    if (v < f.min) v = f.min;
    if (f.max !== undefined && v > f.max) v = f.max;
    el.setAttribute("aria-invalid", raw !== "" && parseFloat(raw) !== v ? "true" : "false");
    return v;
  }

  function render() {
    var v = {};
    KEYS.forEach(function (k) { v[k] = readField(k); });
    var m = cfg.compute(v);
    cfg.render(v, m);
    return { v: v, m: m };
  }

  /* URL state */
  function applyURL() {
    try {
      var q = new URLSearchParams(window.location.search), used = false;
      KEYS.forEach(function (k) {
        if (q.has(k) && $("pc-" + k)) { $("pc-" + k).value = q.get(k); used = true; }
      });
      if (cfg.adv.some(function (k) { return q.has(k); })) {
        var a = $("pc-advanced"); if (a) a.open = true;
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

  /* events */
  var debounce;
  KEYS.forEach(function (k) {
    var el = $("pc-" + k); if (!el) return;
    el.addEventListener("input", function () {
      render();
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        track("input_change", { field: k, value: readField(k) });
      }, 900);
    });
  });

  var resetBtn = $("pc-reset");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    KEYS.forEach(function (k) { if ($("pc-" + k)) $("pc-" + k).value = cfg.fields[k].def; });
    render();
    track("reset", {});
  });

  var shareBtn = $("pc-share");
  if (shareBtn) shareBtn.addEventListener("click", function () {
    var url = shareURL();
    var done = function () {
      var t = $("pc-toast");
      if (t) { t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 1900); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
    } else {
      window.prompt("Copy this link:", url);
    }
    track("share", { url: url });
  });

  var ctaBtn = $("pc-cta");
  if (ctaBtn) {
    ctaBtn.setAttribute("href", cfg.cta.href);
    ctaBtn.addEventListener("click", function () {
      var out = render();
      track("cta_click", cfg.cta.track(out.v, out.m));
    });
  }

  var adv = $("pc-advanced");
  if (adv) adv.addEventListener("toggle", function () {
    if (adv.open) track("advanced_open", {});
  });

  /* boot */
  var fromURL = applyURL();
  render();
  track("view", { prefilled: fromURL });
  if (fromURL) {
    var anchor = document.getElementById("calculator");
    if (anchor && !window.location.hash) {
      setTimeout(function () { anchor.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
    }
  }
})();
