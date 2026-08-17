/* ===========================================================
   Arkonyk — analytics loader
   Google Analytics 4 with region-based Consent Mode v2.

   ┌──────────────────────────────────────────────────────────┐
   │  TO GO LIVE: put your GA4 Measurement ID on the next     │
   │  line and push. That is the only edit required.          │
   │  Until it is set, this file does nothing at all — no     │
   │  network requests, no cookies, no console noise.         │
   └──────────────────────────────────────────────────────────┘
   =========================================================== */
var ARKONYK_GA4_ID = "";        // e.g. "G-XXXXXXXXXX"

(function () {
  "use strict";
  if (!ARKONYK_GA4_ID || ARKONYK_GA4_ID.indexOf("G-") !== 0) return;

  // Never load analytics off a local file or a preview host.
  var host = window.location.hostname;
  if (host !== "arkonyk.com" && host !== "www.arkonyk.com") return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  /* --- Consent Mode v2 -------------------------------------------------
     Defaults are DENIED across the EEA, the UK and Switzerland: GA still
     receives cookieless pings there, so aggregate traffic is measured, but
     nothing is written to the visitor's device and no identifier persists.
     Everywhere else the defaults are granted, which is the ordinary US
     analytics posture.

     Once a privacy policy and a consent control exist, call
     Arkonyk.grantConsent() from the accept handler and the EEA/UK/CH
     visitors upgrade to full measurement. Nothing else needs to change.
     -------------------------------------------------------------------- */
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

  /* --- loader --- */
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ARKONYK_GA4_ID);
  document.head.appendChild(s);

  gtag("js", new Date());
  gtag("config", ARKONYK_GA4_ID, {
    anonymize_ip: true,
    allow_google_signals: false,      // no ad-personalization / cross-device audiences
    allow_ad_personalization_signals: false
  });

  /* --- public hook for a future consent control --- */
  window.Arkonyk = window.Arkonyk || {};
  window.Arkonyk.grantConsent = function () {
    gtag("consent", "update", {
      analytics_storage: "granted",
      functionality_storage: "granted"
    });
    try { localStorage.setItem("ark_consent", "granted"); } catch (e) {}
  };
  window.Arkonyk.denyConsent = function () {
    gtag("consent", "update", {
      analytics_storage: "denied",
      functionality_storage: "denied"
    });
    try { localStorage.setItem("ark_consent", "denied"); } catch (e) {}
  };
  try {
    if (localStorage.getItem("ark_consent") === "granted") window.Arkonyk.grantConsent();
  } catch (e) {}

  /* --- conversion events the site already cares about -------------------
     The calculator pushes its own calc_* events into dataLayer and they are
     forwarded automatically by gtag. These cover the rest of the site.     */
  document.addEventListener("DOMContentLoaded", function () {
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
