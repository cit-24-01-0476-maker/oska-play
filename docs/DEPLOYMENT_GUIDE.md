# OSKA PLAY — Free-First Deployment Guide

Deploy OSKA PLAY at $0.00 cost using Cloudflare Pages.

---

## 1. Local Testing & Verification

```bash
# 1. Install dependencies
npm install

# 2. Run unit and integration tests
npm test

# 3. Build optimized production bundle
npm run build

# 4. Preview locally
npm run preview
```

---

## 2. Deploying to Cloudflare Pages (Free Tier)

### Method A: Cloudflare Git Integration (Automated CI/CD)
1. Push this repository to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Configure Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

### Method B: Direct Upload via Wrangler CLI
```bash
npx wrangler pages deploy dist --project-name oska-play
```

---

## 3. Required HTTP Security Headers

Cloudflare Pages automatically reads `_headers` or Vite server headers:
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
```
These headers enable high-performance `SharedArrayBuffer` for WebAssembly multithreading where needed.
