# OSKA PLAY — Free-Tier Limits & Capacity Analysis

This document provides transparent, realistic capacity limits for running OSKA PLAY on free-tier infrastructure.

---

## 1. Cloudflare Pages Free Tier
- **Bandwidth:** Unlimited free bandwidth on edge CDN.
- **Requests:** Unlimited requests.
- **Max file size per asset:** 25MB (Freedoom WASM is 4.35MB, perfectly within limit).
- **Concurrent builds:** 1 active build at a time.
- **Estimated Monthly Cost:** **$0.00**

---

## 2. Google Drive API (Owner's 5TB Account)
- **Daily API Request Quota:** 1,000,000,000 queries per day.
- **Per-user Rate Limit:** 10,000 queries per 100 seconds.
- **Bandwidth:** Google enforces undocumented dynamic daily download caps (typically ~10GB - 50GB/day for shared files) if accessed directly.
- **Architecture Safeguard:** Google Drive is accessed strictly by the administrator to stage builds. Public users NEVER download directly from Google Drive.
- **Estimated Monthly Cost:** **$0.00**

---

## 3. Client Hardware Computing
- **Server GPU Cost:** **$0.00** (Zero remote GPUs required).
- Computing is 100% offloaded to player devices (e.g., user's RTX 4050 or integrated Intel Iris Xe).
