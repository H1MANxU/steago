# BirdStreak — Security & Deployment Checklist

> Generated: 2026-10-17  
> Stack: Next.js 16 (static export) · React 19 · Tailwind v4 · HeroUI v3 · Dexie/IndexedDB · ONNX Runtime Web (WASM) · PWA

---

## ✅ Pre-Deploy Security Review

### Application Security
- [ ] **Content Security Policy (CSP)** — Define strict CSP headers for production
  - `script-src 'self'` + hashes for inline scripts
  - `worker-src 'self' blob:` (ONNX Runtime Web workers)
  - `connect-src 'self' https://en.wikipedia.org https://*.wikimedia.org` (species images)
  - `img-src 'self' data: https://*.wikimedia.org https://en.wikipedia.org`
  - `font-src 'self' data:`
  - `frame-ancestors 'none'`
- [ ] **HTTPS Only** — Enforce HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`)
- [ ] **Referrer Policy** — `strict-origin-when-cross-origin`
- [ ] **Permissions Policy** — Restrict to only needed: `microphone=(self)`, `geolocation=()`
- [ ] **X-Frame-Options** — `DENY`
- [ ] **X-Content-Type-Options** — `nosniff`

### PWA / Service Worker
- [ ] **Service Worker Scope** — Limited to app origin only
- [ ] **Cache Strategy** — `cache-first` for static assets, `network-first` for API (Wikipedia images)
- [ ] **Offline Fallback** — `/offline.html` or cached app shell
- [ ] **SW Registration** — Only on HTTPS, with `navigator.serviceWorker.register('/sw.js')`
- [ ] **Manifest** — `manifest.webmanifest` served with `application/manifest+json`, valid icons, `display: standalone`

### Data & Privacy
- [ ] **No PII Collected** — App stores only: recordings (audio blobs), species IDs, timestamps, optional coarse location (1km radius)
- [ ] **Local-First** — All data in IndexedDB (Dexie), never sent to backend
- [ ] **Location Opt-In** — `attachLocation` setting defaults `false`, user must enable
- [ ] **Model Download** — 409 MB ONNX model fetched from Hugging Face (pinned SHA-256), cached in IndexedDB
- [ ] **Export** — User-initiated JSON export only, no auto-sync
- [ ] **Delete Controls** — "Delete model" and "Delete all data" buttons in Settings

### Dependencies
- [ ] **Supply Chain** — Lockfile committed (`bun.lock` / `pnpm-lock.yaml`)
- [ ] **Audit** — `bun pm audit` / `pnpm audit` — no critical/high vulns
- [ ] **Pinned Versions** — ONNX model pinned by SHA-256 in `lib/ai/config.ts`
- [ ] **CDN Integrity** — Subresource integrity for any external CDN assets (currently none)

---

## 🚀 Deployment Checklist

### Build Verification
- [ ] `bun run build` passes (TypeScript, lint, static export)
- [ ] `out/` contains: `index.html`, `sw.js`, `manifest.webmanifest`, `/_next/`, `/ort/`, `/models/`, `/icons/`, `/worklets/`
- [ ] No server-side code paths (all pages prerendered static)
- [ ] Service worker builds via `scripts/build-sw.mjs`
- [ ] ONNX Runtime WASM files copied to `out/ort/`

### Hosting Configuration
| Platform | Config Needed |
|----------|---------------|
| **Vercel** | `vercel.json` with `cleanUrls: true`, `trailingSlash: false`, headers for CSP |
| **Netlify** | `_headers` file, `_redirects` for SPA fallback (hash routing) |
| **Cloudflare Pages** | `_headers` for CSP, `Functions` not needed (static) |
| **GitHub Pages** | `404.html` = `index.html` for hash routing, custom domain + HTTPS |
| **Any Static Host** | Serve `out/` root, gzip/brotli compression, cache headers |

### Required HTTP Headers (all platforms)
```http
# Security
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' https://en.wikipedia.org https://*.wikimedia.org; img-src 'self' data: https://*.wikimedia.org https://en.wikipedia.org; font-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(self), geolocation=(), camera=(), payment=()

# Caching
Cache-Control: public, max-age=31536000, immutable  # for /_next/static/*, /ort/*, /models/*
Cache-Control: public, max-age=86400, must-revalidate  # for index.html, sw.js, manifest
Cache-Control: no-cache, no-store, must-revalidate  # for API-like (none in static export)
```

### DNS / Domain
- [ ] Custom domain configured
- [ ] DNS: `A`/`AAAA` or `CNAME` to host
- [ ] TLS certificate auto-provisioned (Let's Encrypt / host managed)
- [ ] `www` → apex redirect (or vice versa)
- [ ] CAA records for certificate transparency

### PWA Requirements
- [ ] HTTPS (required for SW, microphone, install prompt)
- [ ] `manifest.webmanifest` accessible at `/manifest.webmanifest`
- [ ] Icons: 192×192, 512×512, maskable 512×512, apple-touch-icon
- [ ] `sw.js` registers without errors (check DevTools Application tab)
- [ ] Install prompt appears on mobile after engagement heuristics

---

## 🔧 Post-Deploy Verification

### Smoke Tests (manual or automated)
- [ ] Load homepage → onboarding → "Start exploring" → Home screen
- [ ] Navigate all tabs: Home, Journal, Listen, Settings (hash routing works)
- [ ] Settings → "Download (409 MB)" → model downloads, progress shows, completes
- [ ] Listen screen → microphone permission → record 3–10s → results screen shows candidates with images & probabilities (< 100%)
- [ ] Confirm a match → DiscoveryCard shows bird image, XP, species name
- [ ] Journal → species list shows images → tap species → Species screen with header image & recordings
- [ ] Settings → "Attach approximate location" toggle works (Switch component)
- [ ] Settings → "Licenses" modal opens, loads `ATTRIBUTION.md`
- [ ] Settings → "Export journal" → downloads JSON file
- [ ] Offline: open app, disable network → app shell loads, cached recordings play, pending identifications queue
- [ ] Re-enable network → pending queue processes automatically

### Lighthouse / Web Vitals (target)
| Metric | Target |
|--------|--------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |
| PWA | ✅ Installable, offline-capable |

### Browser Compatibility
- [ ] Chrome/Edge (desktop + Android) — full support
- [ ] Safari (iOS 16.4+ / macOS) — microphone, SW, install
- [ ] Firefox (desktop + Android) — full support
- [ ] Samsung Internet — full support

---

## 🛡️ Ongoing Security Operations

### Monthly
- [ ] `bun pm audit` / `pnpm audit` — update deps, re-lock
- [ ] Check Hugging Face model repo for security advisories
- [ ] Review Wikipedia/Wikimedia API usage (rate limits, ToS)

### Quarterly
- [ ] Rotate any API keys (currently none)
- [ ] Penetration test / security scan (OWASP ZAP, etc.)
- [ ] Review CSP violations in browser console / reporting endpoint
- [ ] Update ONNX Runtime Web to latest patch

### Incident Response
- [ ] Document: "If model CDN compromised" → pin new SHA-256, rebuild, redeploy
- [ ] Document: "If Wikipedia API abused" → add rate limiting / cache layer
- [ ] Document: "If SW caches malicious content" → version bump SW, force update

---

## 📋 Git / CI/CD

### Repository
- [ ] `main` branch protected (require PR, status checks)
- [ ] `bun.lock` / `pnpm-lock.yaml` committed
- [ ] `.gitignore` excludes `node_modules/`, `.next/`, `out/`, `*.log`, `.env*`
- [ ] `SECURITY.md` with vulnerability reporting email

### CI Pipeline (GitHub Actions / GitLab CI / etc.)
```yaml
# Required checks
- install deps (frozen lockfile)
- lint (eslint, prettier)
- typecheck (tsc --noEmit)
- build (next build)
- test (if unit/integration tests added)
- audit (bun pm audit --level=high)
- deploy (on main, to staging/prod)
```

### Release Process
- [ ] Version bump in `package.json` (semver)
- [ ] Changelog entry
- [ ] Git tag `vX.Y.Z`
- [ ] Deploy tag to production
- [ ] Verify production smoke tests

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `next.config.mjs` | Static export config |
| `scripts/copy-ort.mjs` | Copies ONNX WASM to public |
| `scripts/build-sw.mjs` | Generates service worker |
| `lib/ai/config.ts` | Pinned model SHA-256, URLs |
| `lib/data/species-image.ts` | Wikipedia image fetch + cache |
| `sw.js` | Runtime service worker |
| `manifest.webmanifest` | PWA manifest |
| `public/ort/` | ONNX Runtime WASM files |
| `public/models/` | Labels CSV + common names JSON |

---

## ⚠️ Known Risks / Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ONNX model CDN compromised | Low | High | SHA-256 pin, rebuild on change |
| Wikipedia API rate limit / outage | Medium | Medium | Local cache (IndexedDB), graceful fallback |
| Microphone permission denied | High (user) | Medium | Clear UI guidance per platform (MicDenied component) |
| Large model download fails (mobile) | Medium | High | Progress UI, resume via SW cache, "skip" option |
| IndexedDB quota exceeded | Low | Medium | Monitor usage, auto-cleanup old pending recordings |
| CSP breaks HeroUI inline styles | Medium | Low | Use nonces or `'unsafe-inline'` for style only |

---

## ✅ Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Security Review | | | |
| Release Manager | | | |

---

*Checklist version 1.0 — update on major dependency changes or architecture shifts.*