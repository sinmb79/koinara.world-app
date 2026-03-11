# Deployment

This repository supports two static hosting targets for `site/`:

- Vercel
- Cloudflare Pages

Both deployments build from the repo root and publish `site/dist`.

## GitHub Actions

### CI

`CI` runs on every push and pull request:

- `npm ci --ignore-scripts`
- `npm run typecheck`
- `npm run test`
- `npm run build`

`--ignore-scripts` is intentional so CI does not stall on Electron binary download just to typecheck and build.

### Vercel deploy

Workflow file:

- `.github/workflows/deploy-site-vercel.yml`

Required GitHub secrets:

- `VERCEL_TOKEN`

Required GitHub variables:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Behavior:

- runs on push to `main`
- builds `site/`
- deploys the prebuilt static output to Vercel production

### Cloudflare Pages deploy

Workflow file:

- `.github/workflows/deploy-site-cloudflare.yml`

Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required GitHub variables:

- `CF_PAGES_PROJECT_NAME`

Behavior:

- runs on push to `main`
- builds `site/`
- deploys `site/dist` to the configured Cloudflare Pages project

## Manual Vercel Setup

Recommended project settings:

- Framework preset: `Vite`
- Install command: `npm ci --ignore-scripts --no-audit --no-fund`
- Build command: `npm run build:site`
- Output directory: `site/dist`

`vercel.json` already matches this layout.

## Manual Cloudflare Pages Setup

Recommended build settings:

- Build command: `npm run build:site`
- Build output directory: `site/dist`

`wrangler.toml` and `site/public/_redirects` are included for static SPA routing support.

## After Deploy

Verify these before announcing the site:

- `Home`, `Download`, `Docs`, and `Network` routes all load directly
- refresh on `/download`, `/docs`, and `/network` does not 404
- empty state messaging appears if RPC or contract addresses are missing
- release links point to the intended GitHub repositories
