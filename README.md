# koinara-app

`koinara-app` is the user-facing client application and official website for the Koinara network.

This repository is intentionally split into a desktop submission client and a fully static website.
There is no hosted backend in this repo.

## Packages

- `shared`: protocol-compatible types, hashing, proof helpers, and config utilities
- `app`: Electron + React desktop client for job submission and tracking
- `site`: static Vite + React website for downloads, docs, and read-only network status
- `config`: chain profiles consumed by both app and site

## MVP Scope

- Electron-only job submission
- Writable discovery root for `jobs/<requestHash>.json`
- `WLC` payment flow active, `WL/KOIN` adapters disabled behind config
- WalletConnect v2 and built-in encrypted local wallet
- On-chain proof viewer and refund CTA
- Static site with live read-only network dashboard

## Local Setup

Use `npm.cmd` on restricted PowerShell setups:

```powershell
npm.cmd install
npm.cmd run verify
```

If you are on a normal machine and want the Electron runtime downloaded as well:

```bash
npm install
npm run verify
```

## Common Commands

```bash
npm run typecheck
npm run test
npm run build
npm run build:site
```

## Runtime Notes

- Fill real RPC URLs, explorer URLs, and contract addresses in `config/chain.*.json`
- Do not commit secrets, wallet keys, or private endpoints
- The built-in wallet stores an encrypted vault only; plaintext private keys are not written to disk
- WalletConnect requires `VITE_WALLETCONNECT_PROJECT_ID`

## CI and Deploy

GitHub Actions included in this repo:

- `CI`: typecheck, test, build on push and pull request
- `Deploy Site to Vercel`: deploys `site/` on push to `main` if Vercel secrets are configured
- `Deploy Site to Cloudflare Pages`: deploys `site/` on push to `main` if Cloudflare secrets are configured

Deployment setup details live in [docs/deployment.md](./docs/deployment.md).

## Static Hosting

The site is built from the repo root and outputs static files under `site/dist`.

- Vercel config: [`vercel.json`](./vercel.json)
- Cloudflare Pages config: [`wrangler.toml`](./wrangler.toml)
- SPA fallback for Cloudflare Pages: [`site/public/_redirects`](./site/public/_redirects)
