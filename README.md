# Slow & Steady Coffee

Live web app (Vercel): https://coffee-psi-plum.vercel.app

Alternative host (Render): https://coffee-gf3d.onrender.com

Supabase project: `coffee` (`bczywekmsohnymjbadfi`), Singapore. The database schema is installed and tested for saves, version conflicts, account isolation and anonymous access denial. Deployment identifiers are in `deployments.json`.

First-time account setup: in Supabase Authentication > URL Configuration, set Site URL to `https://coffee-psi-plum.vercel.app` (or the Render URL) and allow both hosted URLs as redirects. Email confirmation stays enabled. Never put passwords or service-role keys into this repository.

Mobile coffee recipe app with editable recipes, costing, brewing timer, photos, backup/import and private online cookbooks. Vercel and Render use the same Supabase project; log in with the same account on each host.

## Run locally

Use Node.js 22 or newer. Run `npm ci`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then run `npm run build`. Serve `dist/` with any static server. The public publishable key is intended for browser use; never configure a service-role key.

## Database and login

Run `database/coffee-schema.sql` once in the chosen Supabase project's SQL Editor. It creates an account-owned cookbook with Row Level Security and a revision-checked save function. Each cookbook includes recipe photos as compressed data URLs. No real recipes or account passwords are included in this repository.

Email/password registration uses Supabase Auth. Keep email confirmation enabled. Add your Vercel and Render URLs to Supabase Auth's allowed redirect URLs, set the primary Site URL, and configure your email provider for production use. Users create their own password inside the app.

On sign-in, the app loads only that account's cookbook. Existing local recipes remain separate until the user chooses “นำสูตรเดิมในเครื่องขึ้นบัญชีนี้”. Offline changes are queued under that account and retried when the connection returns. A stale revision is rejected instead of overwriting another device. “โหลดจากออนไลน์” saves a local recovery copy and downloads a backup before replacing conflicting edits. The app polls every 20 seconds while visible and syncs when brought to the foreground.

## Vercel

Import this GitHub repository. Framework: Other. Build command: `npm run build`. Output directory: `dist`. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as environment variables for the intended environments. `vercel.json` provides the build configuration.

## Render

Create a Static Site from this repository in the selected workspace. Build command: `npm ci && npm run build`. Publish directory: `dist`. Add the same two Supabase environment variables. The app has no server runtime or Render database requirement.

## Tests

Install `jsdom` in a separate test environment and set `COFFEE_TEST_JSDOM` to its package path. Run `node tests/store-flows.cjs` for recipe edit/cost/backup flows and `node tests/cloud-flows.cjs` for cloud save/conflict/account isolation using a controlled mock. Database RLS and live signup/login need integration checks against the provisioned Supabase project before calling online storage verified.

## Android

The existing Capacitor Android project is maintained separately from this web deployment source. The APK does not update automatically when this repository deploys.
