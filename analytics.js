/* ===========================================================
   Arkonyk — analytics & visitor-intel loader
   1. Google Analytics 4 with region-based Consent Mode v2
   2. Apollo.io website visitor tracking (company-level)
   3. RB2B person-level visitor identification (US traffic)

   ┌──────────────────────────────────────────────────────────┐
   │  GA4: put your Measurement ID on the next line and push. │
   │  Until it is set, the GA4 half does nothing at all.      │
   │  Apollo and RB2B are configured and live on deploy.      │
   └──────────────────────────────────────────────────────────┘
   =========================================================== */
var ARKONYK_GA4_ID = "";        // e.g. "G-XXXXXXXXXX"
var ARKONYK_APOLLO_APP_ID = "6a0e0019187e52001820a96c";
var ARKONYK_RB2B_KEY = "4N210HXQ7M6Z";

(function () {
  "use strict";

  // Never load anything off a local file or a preview host.
  var host = window.location.hostname;
  if (host !== "arkonyk.com" && host !== "www.arkonyk.com") return;

  /* Shared consent state.
     EEA/UK/CH visitors get nothing stored and no third-party trackers until
     they agree. Detection is timezone-based (Europe/*) — the same regions the
     GA4 consent defaults deny. A future consent banner upgrades them by
     calling Arkonyk.grantConsent(). */
  var stored = null;
  try { stored = localStorage.getItem("ark_consent"); } catch (e) {}
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var isEuropean = tz.indexOf("Europe/") === 0;
  // Global Privacy Control: the privacy policy commits to honouring it as a
  // request to disable non-essential analytics and visitor identification.
  var gpc = false;
  try { gpc = navigator.globalPrivacyControl === true; } catch (e) {}
  var trackingAllowed = stored === "granted" || (!isEuropean && stored !== "denied" && !gpc);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  /* ============================ Apollo ============================
     Company-level website visitor identification. Identifies the
     ORGANIZATION visiting (via IP/firmographic matching), not the person —
     contact-level tracking is disabled in the tracker configuration. */
  var apolloLoaded = false;
  function loadApollo() {
    if (apolloLoaded || !ARKONYK_APOLLO_APP_ID) return;
    apolloLoaded = true;
    var n = Math.random().toString(36).substring(7);
    var o = document.createElement("script");
    o.src = "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" + n;
    o.async = true; o.defer = true;
    o.onload = function () {
      try { window.trackingFunctions.onLoad({ appId: ARKONYK_APOLLO_APP_ID }); } catch (e) {}
    };
    document.head.appendChild(o);
  }

  /* ============================ RB2B ============================
     Person-level visitor identification, US traffic only (RB2B geofences
     internally; we additionally gate it like every other tracker here).
     Loads nothing until ARKONYK_RB2B_KEY is set. */
  /* Loader below mirrors RB2B's own install snippet (Aug 2026: CloudFront
     ddwl4m2hdecbv, window.reb2b sentinel), wrapped in our gating. If RB2B
     reissues their snippet, update the URL/sentinel here to match. */
  var rb2bLoaded = false;
  function loadRB2B() {
    if (rb2bLoaded || !ARKONYK_RB2B_KEY) return;
    rb2bLoaded = true;
    if (window.reb2b) return;
    window.reb2b = { loaded: true };
    var sc = document.createElement("script");
    sc.async = true;
    sc.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + ARKONYK_RB2B_KEY + "/" + ARKONYK_RB2B_KEY + ".js.gz";
    var first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(sc, first);
  }

  /* ============================ GA4 ============================ */
  var ga4Active = ARKONYK_GA4_ID && ARKONYK_GA4_ID.indexOf("G-") === 0;
  if (ga4Active) {
    window.gtag = gtag;

    var EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
              "IS","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO",
              "SK","SI","ES","SE","GB","CH"];

    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted",
      region: EU,
      wait_for_update: 500
    });

    gtag("consent", "default", {
      ad_storage: "denied",            // we do not run ads; keep these off everywhere
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
      functionality_storage: "granted",
      personalization_storage: "denied",
      security_storage: "granted"
    });

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ARKONYK_GA4_ID);
    document.head.appendChild(s);

    if (gpc && stored !== "granted") {
      gtag("consent", "update", { analytics_storage: "denied", functionality_storage: "denied" });
    }

    gtag("js", new Date());
    gtag("config", ARKONYK_GA4_ID, {
      anonymize_ip: true,
      allow_google_signals: false,      // no ad-personalization / cross-device audiences
      allow_ad_personalization_signals: false
    });
  }

  /* --- public hooks for a future consent control ------------------
     Wire the banner's Accept to grantConsent() and Decline to denyConsent().
     grantConsent also enables Apollo for European visitors. */
  window.Arkonyk = window.Arkonyk || {};
  window.Arkonyk.grantConsent = function () {
    if (window.gtag) gtag("consent", "update", {
      analytics_storage: "granted",
      functionality_storage: "granted"
    });
    try { localStorage.setItem("ark_consent", "granted"); } catch (e) {}
    loadApollo();
    loadRB2B();
  };
  window.Arkonyk.denyConsent = function () {
    if (window.gtag) gtag("consent", "update", {
      analytics_storage: "denied",
      functionality_storage: "denied"
    });
    try { localStorage.setItem("ark_consent", "denied"); } catch (e) {}
  };
  if (stored === "granted" && window.gtag) window.Arkonyk.grantConsent();

  /* Tracker boot: everywhere except Europe-without-consent and GPC browsers. */
  if (trackingAllowed) { loadApollo(); loadRB2B(); }

  /* --- conversion events the site already cares about -------------------
     The calculator pushes its own calc_* events into dataLayer and they are
     forwarded automatically by gtag. These cover the rest of the site.     */
  if (ga4Active) document.addEventListener("DOMContentLoaded", function () {
    // Outbound clicks to the products we sell through
    document.querySelectorAll('a[href*="descriptors.com"], a[href*="whobilled.me"]').forEach(function (a) {
      a.addEventListener("click", function () {
        gtag("event", "outbound_click", {
          destination: a.hostname,
          page: window.location.pathname,
          link_text: (a.textContent || "").trim().slice(0, 60)
        });
      });
    });

    // Gated report — the lead moment
    var reportForm = document.querySelector('form[data-gate], #gate-form');
    if (reportForm) {
      reportForm.addEventListener("submit", function () {
        gtag("event", "generate_lead", { source: "confusing_charges_report" });
      });
    }

    // Contact form
    var contact = document.querySelector('form[action*="formsubmit"]');
    if (contact) {
      contact.addEventListener("submit", function () {
        gtag("event", "generate_lead", { source: "contact_form" });
      });
    }

    // Insights read-depth: fires once when a reader passes 75% of an article
    if (document.querySelector(".ins-body")) {
      var fired = false;
      window.addEventListener("scroll", function () {
        if (fired) return;
        var d = document.documentElement;
        var pct = (window.scrollY + window.innerHeight) / d.scrollHeight;
        if (pct > 0.75) {
          fired = true;
          gtag("event", "article_read", { page: window.location.pathname });
        }
      }, { passive: true });
    }
  });
})();
