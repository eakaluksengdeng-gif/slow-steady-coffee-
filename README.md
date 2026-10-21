# Slow & Steady Coffee

Live web app (Vercel): https://coffee-psi-plum.vercel.app

Alternative host (Render): https://coffee-gf3d.onrender.com

Supabase project: `coffee` (`bczywekmsohnymjbadfi`), Singapore. Deployment identifiers are in `deployments.json`.

The current app is a shared cookbook: no signup, login or email confirmation is needed. Anyone with a link can read, add, export and use recipes. Adjusting a published recipe creates a new recipe and keeps the original. Public clients cannot overwrite or delete published recipes. Never put passwords or service-role keys into this repository.

Mobile coffee recipe app with recipe versions, costing, brewing timer, photos and backup/import. Vercel and Render share the same public recipe table.

## Run locally

Use Node.js 22 or newer. Run `npm ci`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then run `npm run build`. Serve `dist/` with any static server. The public publishable key is intended for browser use; never configure a service-role key.

## Shared database

Run `database/shared-recipes.sql` once in a new project's SQL Editor. It creates `coffee_shared_recipes` with public SELECT and column-scoped INSERT permissions and RLS. UPDATE and DELETE are not granted. The public-access policies are intentional. Recipe photos are compressed data URLs in the recipe payload. New rows use UUIDs for retry-safe publishing.

The previous private `coffee_books` table, auth settings and private caches remain separate and protected. No private recipes are automatically copied into the shared table. To deliberately publish an old local or APK recipe, export a JSON backup and import it using the shared app's backup dialog.

Offline additions are stored in a separate outbox and retried when online. A duplicate UUID after an uncertain network response is checked against the existing recipe before treating it as success. Public content is normalized before rendering. Visible tabs poll every 15 seconds; “ซิงก์สูตร” refreshes immediately. Old `cloud.js` is retained as the previous private-account implementation and is not loaded by the shared web app.

## Vercel

Import this GitHub repository. Framework: Other. Build command: `npm run build`. Output directory: `dist`. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as environment variables for the intended environments. `vercel.json` provides the build configuration.

## Render

Create a Static Site from this repository in the selected workspace. Build command: `npm ci && npm run build`. Publish directory: `dist`. Add the same two Supabase environment variables. The app has no server runtime or Render database requirement.

## Tests

Install Playwright in a separate test environment and set `COFFEE_PLAYWRIGHT` to its package path. Run `node tests/shared-browser.cjs <origin>` for no-login publishing, cross-browser reads, immutable originals, private-cache isolation and offline retry. It prints test UUIDs; remove only those fixtures via an administrative connection after the test. Run `node tests/fullscreen-layout.cjs <origin>` for responsive layout checks. `tests/cloud-flows.cjs` covers the previous private mode only.

## Android

The existing Capacitor Android project is maintained separately from this web deployment source. The APK does not update automatically when this repository deploys.
