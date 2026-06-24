# Arkonyk — Marketing Website

A fast, static marketing site for Arkonyk (FinTech SaaS + payment consulting). Plain HTML/CSS/JS — no build step, no dependencies — so it runs on any host.

## Pages
- `index.html` — Landing page (hero, value props, stats, solutions overview, CTA)
- `solutions.html` — SaaS platform + consulting services
- `pricing.html` — Plans, consulting rates, FAQ
- `about.html` — Company story & values
- `contact.html` — Contact form + details
- `assets/styles.css` — Shared design system
- `assets/main.js` — Mobile nav + form handling

## Preview locally
Open `index.html` in a browser, or run a local server:
```bash
cd Arkonyk
python3 -m http.server 8000
# visit http://localhost:8000
```

---

## Recommended hosting: GitHub → Vercel

For a static marketing site, Vercel is the best fit — free, global CDN, instant deploys, and trivial custom-domain setup. (Keep Railway for your actual SaaS product app, where a running backend earns its keep.)

### 1. Push to GitHub
```bash
cd Arkonyk
git init
git add .
git commit -m "Arkonyk marketing site"
git branch -M main
git remote add origin https://github.com/<your-username>/arkonyk-site.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to vercel.com → **Add New → Project** → import your `arkonyk-site` repo.
2. Framework preset: **Other**. Build command: *(leave empty)*. Output directory: `.` (root).
3. Click **Deploy**. You'll get a live `*.vercel.app` URL in seconds.

### 3. Point your GoDaddy domain at Vercel
In Vercel: **Project → Settings → Domains → Add** your domain (e.g. `arkonyk.com`). Vercel shows the exact records. Then in **GoDaddy → My Products → DNS** for the domain, set:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | `76.76.21.21`          |
| CNAME | www  | `cname.vercel-dns.com` |

> Use the exact values Vercel displays for your project — the A record IP and CNAME target can change. DNS can take 5 minutes to a few hours to propagate. Vercel issues the SSL certificate automatically once DNS resolves.

---

## Alternative: Railway (since you have it)
Railway can serve this too. Add a `package.json` with a static server (e.g. `serve`), or use a Caddy/nginx static template, set the start command to serve the root directory, then add your domain under the service's **Settings → Networking → Custom Domain** and point a GoDaddy CNAME at the Railway-provided target. It works, but it's more moving parts and cost than a static marketing site needs.

## Alternative: GitHub Pages (free)
Push the repo, then **Settings → Pages → Deploy from branch → main / root**. Add the custom domain there and point GoDaddy DNS at GitHub's IPs. Good zero-cost option; Vercel is faster and easier for custom domains.

---

## Notes
- The contact form currently shows an inline confirmation only — it does **not** send anywhere yet. To capture submissions, wire it to a form backend (Formspree, Vercel Forms, or your own API endpoint) by adding an `action` URL to the `<form>` in `contact.html`.
- All placeholder content (stats, logos, phone/email) should be replaced with real details before launch.
- Brand palette and type live as CSS variables at the top of `assets/styles.css` — change colors/fonts in one place.
