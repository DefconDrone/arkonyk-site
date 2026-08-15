# Arkonyk — Marketing Website

A fast, static marketing site for Arkonyk (payments intelligence — Descriptors.com, FeeSuite, and ARKITEKT). Plain HTML/CSS/JS — no build step, no dependencies — so it runs on any static host.

## Pages
- `index.html` — Landing page (hero, why-Arkonyk, solutions overview, CTA)
- `products.html` — Products overview, plus one page per product:
  - `product-descriptors.html` — Descriptors.com
  - `product-feesuite.html` — FeeSuite
  - `product-arkitekt.html` — ARKITEKT
- `solutions.html` — Solutions overview, plus one page per audience:
  - `solutions-issuers.html`, `solutions-acquirers.html`, `solutions-payfacs.html`, `solutions-providers.html`, `solutions-merchants.html`
- `about.html` — Company story & values
- `contact.html` — Contact form + details
- `thanks.html` — Post-submit confirmation page
- `404.html` — Not-found page
- `styles.css` — Shared design system (all pages)
- `main.js` — Mobile nav + form handling + small UI helpers
- `sitemap.xml` — Search-engine sitemap (update if pages are added/removed)
- `og-image.png` — Social-share preview image (Open Graph / Twitter cards)

> Note: all files live at the repo root — there is no `assets/` subfolder, and there is no `pricing.html` page.

## Preview locally
Open `index.html` in a browser, or run a local server:
```bash
cd arkonyk-site
python3 -m http.server 8000
# visit http://localhost:8000
```

---

## Hosting & deployment: GitHub Pages (this is the live setup)

This site is deployed to **GitHub Pages** via GitHub Actions. **You do not deploy manually — pushing to `main` deploys the site.**

- The workflow at `.github/workflows/deploy.yml` runs on every push to `main` (and can also be run manually via *Actions → Deploy static site to Pages → Run workflow*).
- It packages the repo root (the site is served as-is) and publishes it to GitHub Pages.
- Deploy status is visible under the repo's **Actions** tab; a deploy typically completes in 1–2 minutes.

### Typical workflow
1. Edit files locally.
2. Commit and push to `main` (e.g. in GitHub Desktop).
3. GitHub Actions builds and deploys automatically — no other steps.

### Custom domain
- The `CNAME` file (`arkonyk.com`) tells GitHub Pages to serve the site on the custom domain.
- DNS for `arkonyk.com` points at GitHub Pages, and GitHub issues/renews the SSL certificate automatically.
- Keep the `CNAME` file in the repo — deleting it will drop the custom-domain mapping on the next deploy.

> Historical note: earlier drafts of this README recommended Vercel (and mentioned Railway as an alternative). The site is **not** hosted on either — the live deployment is GitHub Pages, configured by `deploy.yml` and `CNAME`. Railway hosts the separate Descriptors app, not this marketing site.

---

## Launch state (public)
The stealth gate was removed at launch (2026-08): no `gate.js`, no gate overlay, no `noindex,nofollow` tags (except `thanks.html`, which stays noindexed), and `robots.txt` allows crawling with a `sitemap.xml` reference. Every page carries a canonical URL plus Open Graph/Twitter tags pointing at `og-image.png`.

- To re-gate the site (e.g., for a future private preview), restore `gate.js`, the gate overlay markup, and the `noindex` tags from git history (pre-launch commits).

## Forms
The contact form (on `contact.html`) posts to **FormSubmit** (`https://formsubmit.co/Rick@arkonyk.com`). On submit, FormSubmit emails the details to Rick@arkonyk.com, sends the visitor an auto-confirmation, and redirects to `thanks.html`. No backend or JavaScript interception is required.

## Editing notes
- **Brand palette and type** live as CSS variables at the top of `styles.css` — change colors/fonts in one place.
- Product names shown publicly are **Descriptors.com**, **FeeSuite**, and **ARKITEKT**.
- Before launch, replace any remaining placeholder content (stats, phone/email, etc.) with real details.
